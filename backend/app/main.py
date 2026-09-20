"""FastAPI main application entry point with GenAI + RAG pipeline and diagnostic logging."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware

try:
    from app import config, database, auth, schemas, services, diagnostics, rag
except ImportError:
    import config
    import database
    import auth
    import schemas
    import services
    import diagnostics
    import rag


import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Refresh environment variables from backend/.env
    config.refresh_config()

    # Safe startup logging without revealing secrets
    cwd = os.getcwd()
    env_file = config.LOADED_ENV_PATH or "Not found"
    geo_configured = bool(config.GEOAPIFY_API_KEY)
    groq_configured = bool(config.GROQ_API_KEY)
    weather_configured = bool(config.OPENWEATHER_API_KEY)
    tavily_configured = bool(config.TAVILY_API_KEY)
    gmaps_configured = bool(config.GOOGLE_MAPS_API_KEY)

    diagnostics.log_event("CONFIG", "Startup environment diagnostics", {
        "CWD": cwd,
        "Loaded .env file": env_file,
        "GEOAPIFY_API_KEY configured": geo_configured,
        "GROQ_API_KEY configured": groq_configured,
        "OPENWEATHER_API_KEY configured": weather_configured,
        "TAVILY_API_KEY configured": tavily_configured,
        "GOOGLE_MAPS_API_KEY configured": gmaps_configured,
    })

    # Initialize MySQL database on startup
    database.init_db()
    yield


app = FastAPI(
    title="VoyageAI API",
    description="Backend API for VoyageAI - GenAI + RAG Travel Planner",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration allowing Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok", "app": "VoyageAI API", "version": "1.0.0"}


# ==========================================
# AUTH ENDPOINTS
# ==========================================

@app.post("/api/auth/register", response_model=schemas.AuthResponse)
def register(req: schemas.RegisterRequest):
    existing = database.get_user_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    pw_hash = auth.hash_password(req.password)
    user = database.create_user(req.name, req.email, pw_hash)
    token = auth.create_token(user["id"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
    }


@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(req: schemas.LoginRequest):
    user = database.get_user_by_email(req.email)
    if not user or not auth.verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = auth.create_token(user["id"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
    }


@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: dict = Depends(auth.get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
    }


# ==========================================
# TRIPS ENDPOINTS
# ==========================================

@app.get("/api/trips")
def list_trips(current_user: dict = Depends(auth.get_current_user)):
    return database.get_user_trips(current_user["id"])


@app.post("/api/trips")
def create_trip(req: schemas.TripCreate, current_user: dict = Depends(auth.get_current_user)):
    data = req.model_dump()
    trip_id = database.create_trip(current_user["id"], data)
    return database.get_trip_by_id(trip_id, current_user["id"])


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: int, current_user: dict = Depends(auth.get_current_user)):
    trip = database.get_trip_by_id(trip_id, current_user["id"])
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    days_count = len(trip.get("days", []))
    items_count = sum(len(d.get("items", [])) for d in trip.get("days", []))
    diagnostics.log_event("GET TRIP", f"Retrieved trip id={trip_id}", {
        "days_returned": days_count,
        "itinerary_items_returned": items_count,
    })

    return trip


@app.put("/api/trips/{trip_id}")
def update_trip(trip_id: int, req: schemas.TripUpdate, current_user: dict = Depends(auth.get_current_user)):
    data = req.model_dump(exclude_unset=True)
    trip = database.update_trip(trip_id, current_user["id"], data)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int, current_user: dict = Depends(auth.get_current_user)):
    success = database.delete_trip(trip_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Trip deleted"}


@app.post("/api/trips/{trip_id}/regenerate")
async def regenerate_itinerary(trip_id: int, current_user: dict = Depends(auth.get_current_user)):
    trip = database.get_trip_by_id(trip_id, current_user["id"])
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    dest = trip["destination"]
    diagnostics.log_event("REGENERATE", f"Regenerating itinerary for trip id={trip_id}", {"destination": dest})

    retrieved = await rag.retrieve_real_travel_data(dest)
    filtered = rag.filter_retrieved_data(retrieved, trip.get("interests", []))
    compressed_ctx, fact_registry = rag.compress_context(filtered)

    llm_output = await rag.generate_grounded_itinerary(trip, compressed_ctx)
    weather_forecast = retrieved.get("weather", {}).get("forecast", [])
    validated = rag.validate_and_ground_output(llm_output, fact_registry, weather_forecast)

    days_inserted, items_inserted = database.save_trip_itinerary(trip_id, validated.get("days", []))
    diagnostics.log_event("DATABASE", "Trip regenerated itinerary saved", {
        "trip_days_inserted": days_inserted,
        "itinerary_items_inserted": items_inserted,
    })

    database.update_trip(trip_id, current_user["id"], {
        "budget_breakdown": validated.get("budget_breakdown"),
    })

    return database.get_trip_by_id(trip_id, current_user["id"])


# ==========================================
# AI ENDPOINTS
# ==========================================

@app.post("/api/ai/plan-trip")
async def plan_trip_ai(req: schemas.PlanTripRequest, current_user: dict = Depends(auth.get_current_user)):
    data = req.model_dump()
    dest = data["destination"]

    diagnostics.log_event("PLAN-TRIP", "Request received", {
        "destination": dest,
        "duration": data.get("duration"),
        "travelers": data.get("travelers"),
        "interests": data.get("interests"),
    })

    # 1. RAG Retrieval
    retrieved_data = await rag.retrieve_real_travel_data(dest)
    geo = retrieved_data.get("geocode")
    if geo:
        data["destination_lat"] = geo.get("lat")
        data["destination_lng"] = geo.get("lng")

    # 2. Relevance Filtering
    filtered_data = rag.filter_retrieved_data(retrieved_data, data.get("interests"))

    # 3. Context Compression
    compressed_context, fact_registry = rag.compress_context(filtered_data)

    # 4. Create trip record
    trip_id = database.create_trip(current_user["id"], data)

    # 5. Grounded Llama 3.3 Generation
    llm_output = await rag.generate_grounded_itinerary(data, compressed_context)

    # 6. Output Validation against Fact Registry
    weather_forecast = retrieved_data.get("weather", {}).get("forecast", [])
    validated = rag.validate_and_ground_output(llm_output, fact_registry, weather_forecast)

    validated_days = validated.get("days", [])
    total_items = sum(len(d.get("items", [])) for d in validated_days)

    # Fallback to verified retrieved items directly if LLM failed matching
    if total_items == 0 and (filtered_data.get("places") or filtered_data.get("restaurants")):
        places = filtered_data.get("places", [])
        restaurants = filtered_data.get("restaurants", [])
        duration = data.get("duration", 5)
        fallback_days = []
        for d in range(1, duration + 1):
            w = weather_forecast[(d - 1) % len(weather_forecast)] if weather_forecast else None
            p_slice = places[(d - 1) * 2 : d * 2]
            r_slice = restaurants[(d - 1) : d * 1]
            day_items = []
            for p in p_slice:
                day_items.append({
                    "name": p.get("name"),
                    "category": p.get("category"),
                    "address": p.get("address"),
                    "lat": p.get("lat"),
                    "lng": p.get("lng"),
                    "rating": p.get("rating"),
                    "time_slot": "Morning",
                    "duration": "2 hours",
                    "opening_hours": "09:00 AM - 05:00 PM",
                    "website": p.get("website"),
                    "source": "Geoapify",
                })
            for r in r_slice:
                day_items.append({
                    "name": r.get("name"),
                    "category": f"Restaurant - {r.get('cuisine', 'Local')}",
                    "address": r.get("address"),
                    "lat": r.get("lat"),
                    "lng": r.get("lng"),
                    "rating": r.get("rating"),
                    "time_slot": "Lunch",
                    "duration": "1.5 hours",
                    "opening_hours": "12:00 PM - 10:00 PM",
                    "website": None,
                    "source": "Geoapify",
                })
            fallback_days.append({"day_number": d, "day_date": None, "weather": w, "items": day_items})
        validated_days = fallback_days

    # 7. Save itinerary days & items to MySQL
    days_inserted, items_inserted = database.save_trip_itinerary(trip_id, validated_days)

    diagnostics.log_event("DATABASE", "Trip itinerary saved to MySQL", {
        "trip_days_inserted": days_inserted,
        "itinerary_items_inserted": items_inserted,
    })

    database.update_trip(trip_id, current_user["id"], {
        "destination_lat": data.get("destination_lat"),
        "destination_lng": data.get("destination_lng"),
        "budget_breakdown": validated.get("budget_breakdown"),
    })

    final_trip = database.get_trip_by_id(trip_id, current_user["id"])
    ret_days = len(final_trip.get("days", []))
    ret_items = sum(len(d.get("items", [])) for d in final_trip.get("days", []))

    diagnostics.log_event("GET TRIP", "Plan-trip pipeline completed", {
        "number_of_days_returned": ret_days,
        "number_of_itinerary_items_returned": ret_items,
    })

    return final_trip


@app.post("/api/ai/chat")
async def ai_chat(req: schemas.ChatRequest, current_user: dict = Depends(auth.get_current_user)):
    conv_id = req.conversation_id
    if not conv_id:
        title = req.message[:30] + ("…" if len(req.message) > 30 else "")
        conv_id = database.create_conversation(current_user["id"], title)

    conv = database.get_conversation(conv_id, current_user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    database.add_chat_message(conv_id, "user", req.message)
    diagnostics.log_event("AI-CHAT", "Message received", {"message_received": req.message})
    print(f"[AI-CHAT]\nmessage_received={req.message}")

    # 1. Extract Intent using Llama 3.3
    intent = await rag.extract_travel_intent(req.message)
    dest = intent.get("destination") or ""

    # Enhanced Fallback destination extraction if intent missing destination
    if not dest:
        import re
        # Match "to Goa", "in Tokyo", "around Bali", "visit Araku", "trip to Goa"
        match = re.search(r'\b(?:to|in|around|visiting|visit|trip to|for)\s+([A-Z][a-zA-Z\s]{1,15})\b', req.message)
        if match:
            candidate = match.group(1).strip()
            # Exclude non-location words
            if candidate.lower() not in ["a", "the", "me", "us", "people", "days", "food", "comfort", "luxury", "budget"]:
                dest = candidate.split()[0] if candidate.split() else candidate
        if not dest:
            # Check for known destinations in text
            for known in ["Goa", "Tokyo", "Bali", "Araku", "Paris", "London", "Rome", "Bangkok", "New York"]:
                if known.lower() in req.message.lower():
                    dest = known
                    break

    print(f"[AI-INTENT]\ndestination={dest}\nquery_type={intent.get('query_type')}\ninterests={intent.get('interests')}")
    diagnostics.log_event("AI-INTENT", "Intent extracted", {
        "destination": dest,
        "query_type": intent.get("query_type"),
        "interests": intent.get("interests"),
    })

    sources = []
    retrieved_facts = []
    places = []
    rests = []
    weather_data = {}
    tav = {}

    if dest:
        places = await services.geoapify_search_places(dest, limit=10)
        if places:
            sources.append("Geoapify Places")
            retrieved_facts.append(f"Real Places/Attractions in {dest}:\n" + "\n".join([f"- {p['name']} ({p.get('category')}, Address: {p.get('address')})" for p in places]))

        rests = await services.geoapify_search_restaurants(dest, limit=10)
        if rests:
            sources.append("Geoapify Restaurants")
            retrieved_facts.append(f"Real Restaurants in {dest}:\n" + "\n".join([f"- {r['name']} (Cuisine: {r.get('cuisine')}, Address: {r.get('address')})" for r in rests]))

        weather_data = await services.openweather_get_weather(dest)
        if weather_data.get("current"):
            sources.append("OpenWeather")
            curr = weather_data["current"]
            retrieved_facts.append(f"Current Weather in {dest}: {curr['temp']}°C, {curr['condition']} (Feels like {curr.get('feels_like')}°C)")

    # Tavily Web Search RAG
    if any(k in req.message.lower() for k in ["recommend", "what", "how", "best", "find", "plan", "trip", "beaches", "places", "food", "things"]):
        tav = await services.tavily_search(req.message)
        if tav.get("answer"):
            sources.append("Tavily Web Search")
            retrieved_facts.append(f"Web Search Fact: {tav['answer']}")

    compressed_length = sum(len(f) for f in retrieved_facts)
    print(f"[RAG]\nplaces_retrieved={len(places)}\nrestaurants_retrieved={len(rests)}\nweather_available={weather_data.get('current') is not None}\ntavily_results={len(tav.get('results', []))}\nfiltered_results={len(retrieved_facts)}\ncompressed_context_length={compressed_length}")
    diagnostics.log_event("RAG", "Context retrieval complete", {
        "places_retrieved": len(places),
        "restaurants_retrieved": len(rests),
        "weather_available": weather_data.get("current") is not None,
        "tavily_results": len(tav.get("results", [])),
        "filtered_results": len(retrieved_facts),
        "compressed_context_length": compressed_length,
    })

    # 2. Conversational Memory window (last 6 messages)
    history = conv.get("messages", [])[-6:]
    groq_messages = [
        {
            "role": "system",
            "content": (
                "You are VoyageAI, an expert AI Travel Assistant. "
                "Use the provided VERIFIED RETRIEVED CONTEXT below to give accurate, detailed travel recommendations. "
                "Cite real place and restaurant names directly from the context. "
                "Do NOT state that no factual context was provided if context is supplied below."
            ),
        }
    ]
    if retrieved_facts:
        groq_messages.append({"role": "system", "content": "VERIFIED RETRIEVED CONTEXT:\n" + "\n\n".join(retrieved_facts)})
    for m in history:
        groq_messages.append({"role": m["role"], "content": m["content"]})
    groq_messages.append({"role": "user", "content": req.message})

    try:
        reply = await services.groq_chat_completion(groq_messages, temperature=0.3)
        gen_success = True
    except Exception as e:
        reply = f"I encountered an error generating recommendations: {str(e)}"
        gen_success = False

    print(f"[GROQ]\ncontext_sent={bool(retrieved_facts)}\ngeneration_success={gen_success}")
    diagnostics.log_event("GROQ", "Chat completion status", {
        "context_sent": bool(retrieved_facts),
        "generation_success": gen_success,
    })

    database.add_chat_message(conv_id, "assistant", reply, intent=intent, sources=sources)

    return {
        "response": reply,
        "conversation_id": conv_id,
        "intent": intent,
        "sources": list(set(sources)),
    }


@app.post("/api/ai/extract-intent")
async def extract_intent(req: schemas.IntentRequest):
    return await rag.extract_travel_intent(req.message)


@app.get("/api/ai/conversations")
def list_conversations(current_user: dict = Depends(auth.get_current_user)):
    return database.get_user_conversations(current_user["id"])


@app.get("/api/ai/conversations/{conv_id}")
def get_conversation(conv_id: int, current_user: dict = Depends(auth.get_current_user)):
    conv = database.get_conversation(conv_id, current_user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@app.put("/api/ai/conversations/{conv_id}")
def rename_conversation(conv_id: int, req: schemas.RenameConversationRequest, current_user: dict = Depends(auth.get_current_user)):
    success = database.rename_conversation(conv_id, current_user["id"], req.title)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation renamed"}


@app.delete("/api/ai/conversations/{conv_id}")
def delete_conversation(conv_id: int, current_user: dict = Depends(auth.get_current_user)):
    success = database.delete_conversation(conv_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted"}


# ==========================================
# PLACES ENDPOINTS
# ==========================================

@app.get("/api/places")
async def search_places(q: str = Query("", min_length=1), category: str = Query(None), limit: int = Query(30)):
    results = await services.geoapify_search_places(q, category=category, limit=limit)
    return {"results": results}


@app.get("/api/places/{place_id}")
async def get_place(place_id: str):
    return {"id": place_id, "name": "Place Detail", "source": "Geoapify"}


# ==========================================
# RESTAURANTS ENDPOINTS
# ==========================================

@app.get("/api/restaurants")
async def search_restaurants(q: str = Query("", min_length=1), limit: int = Query(30)):
    results = await services.geoapify_search_restaurants(q, limit=limit)
    return {"results": results}


# ==========================================
# WEATHER ENDPOINTS
# ==========================================

@app.get("/api/weather")
async def get_weather(q: str = Query("", min_length=1)):
    return await services.openweather_get_weather(q)


# ==========================================
# SEARCH (GEOCODING) ENDPOINTS
# ==========================================

@app.get("/api/search")
async def search_geocoding(q: str = Query("", min_length=1)):
    result = await services.geoapify_geocode(q)
    return {"results": [result] if result else []}


# ==========================================
# SAVED PLACES ENDPOINTS
# ==========================================

@app.get("/api/saved-places")
def list_saved_places(current_user: dict = Depends(auth.get_current_user)):
    return database.get_saved_places(current_user["id"])


@app.post("/api/saved-places")
def save_place(req: schemas.SavePlaceRequest, current_user: dict = Depends(auth.get_current_user)):
    return database.save_place(current_user["id"], req.model_dump())


@app.delete("/api/saved-places/{place_id}")
def delete_saved_place(place_id: int, current_user: dict = Depends(auth.get_current_user)):
    success = database.delete_saved_place(place_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Saved place not found")
    return {"message": "Saved place removed"}


# ==========================================
# SAVED RESTAURANTS ENDPOINTS
# ==========================================

@app.get("/api/saved-restaurants")
def list_saved_restaurants(current_user: dict = Depends(auth.get_current_user)):
    return database.get_saved_restaurants(current_user["id"])


@app.post("/api/saved-restaurants")
def save_restaurant(req: schemas.SaveRestaurantRequest, current_user: dict = Depends(auth.get_current_user)):
    return database.save_restaurant(current_user["id"], req.model_dump())


@app.delete("/api/saved-restaurants/{restaurant_id}")
def delete_saved_restaurant(restaurant_id: int, current_user: dict = Depends(auth.get_current_user)):
    success = database.delete_saved_restaurant(restaurant_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Saved restaurant not found")
    return {"message": "Saved restaurant removed"}
