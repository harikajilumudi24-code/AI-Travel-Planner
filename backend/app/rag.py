"""GenAI + RAG pipeline for VoyageAI travel planning and AI assistant.
Implements:
1. Intent Extraction (Llama 3.3)
2. RAG Retrieval (Geoapify, OpenWeather, Tavily)
3. Relevance Filtering
4. Context Compression
5. Grounded Llama 3.3 Generation
6. Output Validation against retrieved facts
"""

import json
from fastapi import HTTPException, status
try:
    from app import config, services, diagnostics
except ImportError:
    import config
    import services
    import diagnostics


async def extract_travel_intent(user_prompt: str) -> dict:
    """Extract structured intent from natural language using Groq Llama 3.3."""
    if not config.GROQ_API_KEY:
        diagnostics.log_event("GROQ", "Intent extraction failed: Missing GROQ_API_KEY")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY is missing. Please configure GROQ_API_KEY in backend/.env.",
        )

    system_prompt = (
        "You are an intent extraction AI for a travel application. Extract structured intent from the user's travel request.\n"
        "Return ONLY a single valid JSON object matching this schema:\n"
        "{\n"
        '  "destination": "string or null",\n'
        '  "duration_days": number or null,\n'
        '  "travelers": number or null,\n'
        '  "interests": ["list", "of", "interests"],\n'
        '  "budget": number or null,\n'
        '  "travel_style": "string or null",\n'
        '  "query_type": "itinerary | places | restaurants | weather | general"\n'
        "}\n"
        "Do NOT include markdown markers or conversational text, output JSON only."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        raw_text = await services.groq_chat_completion(messages, temperature=0.1)
        cleaned = raw_text.strip()
        if "```" in cleaned:
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        
        # Locate first { and last }
        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            cleaned = cleaned[start_idx : end_idx + 1]

        intent = json.loads(cleaned)
        diagnostics.log_event("GROQ", "Intent extraction success", {
            "destination": intent.get("destination"),
            "query_type": intent.get("query_type"),
            "duration": intent.get("duration_days"),
        })
        return intent
    except Exception as e:
        diagnostics.log_event("GROQ", f"Intent extraction failure: {e}")
        return {
            "destination": None,
            "duration_days": 5,
            "travelers": 1,
            "interests": [],
            "budget": None,
            "travel_style": None,
            "query_type": "general",
        }


async def retrieve_real_travel_data(destination: str) -> dict:
    """Retrieve real places, restaurants, geocoding, and weather data from external APIs."""
    if not destination or not destination.strip():
        raise HTTPException(status_code=400, detail="Destination cannot be empty.")

    # 1. Geocode
    geo = await services.geoapify_geocode(destination)
    if geo:
        diagnostics.log_event("GEOCODING", "Success", {"lat": geo.get("lat"), "lng": geo.get("lng")})
    else:
        diagnostics.log_event("GEOCODING", "Failure - Could not geocode destination")

    # Check API keys before proceeding
    if not config.GEOAPIFY_API_KEY:
        diagnostics.log_event("GEOAPIFY", "Places request failed: Missing GEOAPIFY_API_KEY")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEOAPIFY_API_KEY is missing. Please configure GEOAPIFY_API_KEY in backend/.env to retrieve real travel data.",
        )

    # 2. Retrieve places & restaurants
    places = await services.geoapify_search_places(destination, limit=35)
    restaurants = await services.geoapify_search_restaurants(destination, limit=25)

    diagnostics.log_event("GEOAPIFY", "Retrieved places & restaurants", {
        "places_count": len(places),
        "restaurants_count": len(restaurants),
    })

    if not places and not restaurants:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to retrieve real travel data for '{destination}' from Geoapify API. Please verify destination name or API key.",
        )

    # 3. Retrieve weather forecast
    weather = {"current": None, "forecast": []}
    if config.OPENWEATHER_API_KEY:
        weather = await services.openweather_get_weather(destination)
        diagnostics.log_event("WEATHER", "OpenWeather retrieval success", {
            "has_current": weather.get("current") is not None,
            "forecast_days": len(weather.get("forecast", [])),
        })
    else:
        diagnostics.log_event("WEATHER", "OpenWeather skipped: Missing OPENWEATHER_API_KEY")

    return {
        "geocode": geo,
        "places": places,
        "restaurants": restaurants,
        "weather": weather,
    }


def filter_retrieved_data(retrieved_data: dict, user_interests: list) -> dict:
    """Filter retrieved API data by relevance to user interests and rating quality."""
    all_places = retrieved_data.get("places", [])
    all_restaurants = retrieved_data.get("restaurants", [])
    weather = retrieved_data.get("weather", {})
    geocode = retrieved_data.get("geocode", {})

    retrieved_count = len(all_places) + len(all_restaurants)

    # Filter places
    filtered_places = []
    interest_keywords = [i.lower() for i in user_interests] if user_interests else []

    for p in all_places:
        # Keep if coordinates exist
        if p.get("lat") is None or p.get("lng") is None:
            continue
        category = (p.get("category") or "").lower()
        name = (p.get("name") or "").lower()
        # High relevance if interest keyword matches category or name
        is_relevant = any(kw in category or kw in name for kw in interest_keywords) if interest_keywords else True
        if is_relevant or len(filtered_places) < 15:
            filtered_places.append(p)

    # Filter restaurants
    filtered_restaurants = [r for r in all_restaurants if r.get("lat") is not None and r.get("lng") is not None]

    filtered_count = len(filtered_places) + len(filtered_restaurants)

    diagnostics.log_event("RAG", "Relevance filtering complete", {
        "retrieved_count": retrieved_count,
        "filtered_count": filtered_count,
    })

    return {
        "geocode": geocode,
        "places": filtered_places,
        "restaurants": filtered_restaurants,
        "weather": weather,
        "retrieved_count": retrieved_count,
        "filtered_count": filtered_count,
    }


def compress_context(filtered_data: dict) -> tuple[str, dict]:
    """Compress filtered travel facts into token-efficient context lines."""
    places = filtered_data.get("places", [])
    restaurants = filtered_data.get("restaurants", [])
    weather = filtered_data.get("weather", {})
    forecast = weather.get("forecast", [])

    compressed_lines = []

    # Map of place name -> full fact dict for grounding validation
    fact_registry = {}

    compressed_lines.append("=== VERIFIED REAL ATTRACTIONS / PLACES ===")
    for p in places:
        name = p.get("name")
        if not name:
            continue
        fact_registry[name.lower()] = p
        line = f"PLACE: {name} | Category: {p.get('category')} | Address: {p.get('address')} | Coords: ({p.get('lat')}, {p.get('lng')}) | Rating: {p.get('rating')} | Source: Geoapify"
        compressed_lines.append(line)

    compressed_lines.append("\n=== VERIFIED REAL RESTAURANTS ===")
    for r in restaurants:
        name = r.get("name")
        if not name:
            continue
        fact_registry[name.lower()] = r
        line = f"RESTAURANT: {name} | Cuisine: {r.get('cuisine')} | Address: {r.get('address')} | Coords: ({r.get('lat')}, {r.get('lng')}) | Rating: {r.get('rating')} | Source: Geoapify"
        compressed_lines.append(line)

    compressed_lines.append("\n=== VERIFIED WEATHER FORECAST ===")
    for w in forecast:
        line = f"WEATHER: Date: {w.get('date')} | Temp: {w.get('temp_min')}°C - {w.get('temp_max')}°C | Condition: {w.get('condition')} | Rain Prob: {w.get('rain_prob')}%"
        compressed_lines.append(line)

    compressed_text = "\n".join(compressed_lines)

    diagnostics.log_event("RAG", "Context compression complete", {
        "compressed_context_size": len(compressed_text),
        "fact_registry_count": len(fact_registry),
    })

    return compressed_text, fact_registry


async def generate_grounded_itinerary(form_data: dict, compressed_context: str) -> dict:
    """Use Groq Llama 3.3 to generate structured itinerary strictly from compressed context."""
    destination = form_data.get("destination", "")
    duration = form_data.get("duration", 5)
    travelers = form_data.get("travelers", 1)
    budget = form_data.get("budget", 2000)
    currency = form_data.get("currency", "USD")
    style = form_data.get("travel_style", "Comfort")

    system_prompt = (
        f"You are an expert AI Travel Planner constructing a grounded {duration}-day itinerary for {travelers} traveler(s) visiting {destination}.\n"
        f"Travel style: {style}. Budget: {budget} {currency}.\n\n"
        "STRICT GROUNDING RULES:\n"
        "1. You MUST use ONLY the verified place and restaurant names present in the supplied VERIFIED CONTEXT.\n"
        "2. Do NOT invent fake places, fake restaurants, fake addresses, fake ratings, or fake coordinates.\n"
        "3. If there are not enough places in the context, return fewer items per day rather than inventing unverified items.\n"
        "4. Return ONLY a single valid JSON object matching this schema:\n"
        "{\n"
        '  "days": [\n'
        "    {\n"
        '      "day_number": 1,\n'
        '      "day_date": "YYYY-MM-DD or null",\n'
        '      "weather": {"temp_max": number, "temp_min": number, "condition": "string", "rain_prob": number},\n'
        '      "items": [\n'
        "        {\n"
        '          "name": "Exact Name from Context",\n'
        '          "category": "Category",\n'
        '          "time_slot": "09:00 AM - 12:00 PM",\n'
        '          "duration": "2 hours",\n'
        '          "opening_hours": "09:00 AM - 05:00 PM"\n'
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ],\n"
        '  "budget_breakdown": {\n'
        '    "accommodation": 800,\n'
        '    "food": 500,\n'
        '    "attractions": 400,\n'
        '    "transportation": 200,\n'
        '    "other": 100\n'
        "  }\n"
        "}\n"
        "Output ONLY the JSON object. Do not add markdown code blocks or text."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": compressed_context},
    ]

    try:
        raw_output = await services.groq_chat_completion(messages, temperature=0.2)
        cleaned = raw_output.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        parsed_json = json.loads(cleaned)
        diagnostics.log_event("GROQ", "Grounded itinerary generation success")
        return parsed_json
    except Exception as e:
        diagnostics.log_event("GROQ", f"Grounded itinerary generation failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq LLM itinerary generation failed: {str(e)}",
        )


def validate_and_ground_output(llm_output: dict, fact_registry: dict, weather_forecast: list) -> dict:
    """Validate every LLM-generated place/restaurant against retrieved facts before saving to MySQL."""
    raw_days = llm_output.get("days", [])
    validated_days = []

    generated_items_count = 0
    verified_items_count = 0
    rejected_unverified_items_count = 0

    for d_idx, day in enumerate(raw_days):
        day_num = day.get("day_number", d_idx + 1)
        day_date = day.get("day_date")
        w_info = day.get("weather") or (weather_forecast[d_idx % len(weather_forecast)] if weather_forecast else None)

        validated_items = []
        raw_items = day.get("items", [])

        for item in raw_items:
            generated_items_count += 1
            item_name = item.get("name", "").strip()
            item_name_lower = item_name.lower()

            # Exact or partial match in retrieved fact registry
            matched_fact = None
            if item_name_lower in fact_registry:
                matched_fact = fact_registry[item_name_lower]
            else:
                # Try fuzzy substring matching against registry
                for key, fact in fact_registry.items():
                    if key in item_name_lower or item_name_lower in key:
                        matched_fact = fact
                        break

            if matched_fact:
                verified_items_count += 1
                # Copy verified data from real API
                validated_items.append({
                    "name": matched_fact.get("name"),
                    "category": matched_fact.get("category") or item.get("category"),
                    "address": matched_fact.get("address"),
                    "lat": matched_fact.get("lat"),
                    "lng": matched_fact.get("lng"),
                    "rating": matched_fact.get("rating"),
                    "time_slot": item.get("time_slot") or "Morning",
                    "duration": item.get("duration") or "2 hours",
                    "opening_hours": matched_fact.get("opening_hours") or item.get("opening_hours") or "09:00 AM - 05:00 PM",
                    "website": matched_fact.get("website"),
                    "source": matched_fact.get("source", "Geoapify"),
                })
            else:
                # LLM attempted to invent an unverified place -> REJECT
                rejected_unverified_items_count += 1
                diagnostics.log_event("VALIDATION", f"Rejected unverified hallucinated place: '{item_name}'")

        validated_days.append({
            "day_number": day_num,
            "day_date": day_date,
            "weather": w_info,
            "items": validated_items,
        })

    diagnostics.log_event("VALIDATION", "Output validation complete", {
        "generated_items": generated_items_count,
        "verified_items": verified_items_count,
        "rejected_unverified_items": rejected_unverified_items_count,
    })

    return {
        "days": validated_days,
        "budget_breakdown": llm_output.get("budget_breakdown", {}),
    }
