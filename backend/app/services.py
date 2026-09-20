"""External API integrations using httpx."""

import json
import httpx
try:
    from app import config
except ImportError:
    import config

TIMEOUT = httpx.Timeout(config.HTTP_TIMEOUT)


# --- Geoapify Geocoding ---
async def geoapify_geocode(query: str) -> dict | None:
    if not config.GEOAPIFY_API_KEY or not query or (isinstance(query, str) and not query.strip()):
        return None
    url = "https://api.geoapify.com/v1/geocode/search"
    params = {"text": query, "limit": 1, "apiKey": config.GEOAPIFY_API_KEY}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                if features:
                    props = features[0].get("properties", {})
                    geometry = features[0].get("geometry", {})
                    coords = geometry.get("coordinates", [None, None])
                    return {
                        "lat": coords[1] if len(coords) > 1 else None,
                        "lng": coords[0] if len(coords) > 0 else None,
                        "formatted": props.get("formatted") or props.get("name"),
                        "city": props.get("city") or props.get("county") or props.get("state"),
                        "country": props.get("country"),
                    }
    except Exception as e:
        print(f"[Services] Geoapify geocode error: {e}")
    return None


# --- Geoapify Places ---
async def geoapify_search_places(query: str, category: str = None, limit: int = 30) -> list:
    if not config.GEOAPIFY_API_KEY or not query:
        return []

    # Clean category
    if category in [None, "All", "undefined", "null", "None", ""]:
        category = None

    geo = await geoapify_geocode(query)
    lat, lng = (geo.get("lat"), geo.get("lng")) if geo else (None, None)

    category_map = {
        "Tourist Attraction": "tourism.attraction,tourism.sights,tourism,leisure",
        "Museum": "entertainment.museum,building.historic,heritage,tourism.sights",
        "Park": "leisure.park,natural,leisure",
        "Beach": "beach,beach.beach_resort,natural.sand,tourism.sights,natural",
        "Historical": "building.historic,heritage,tourism.sights,entertainment.museum,building.place_of_worship",
        "Entertainment": "entertainment,leisure,activity",
        "Shopping": "commercial,commercial.supermarket,commercial.marketplace",
        "Nature": "natural,leisure.park,natural.forest,natural.mountain,natural.water",
    }
    cat_param = category_map.get(category, "tourism,entertainment,leisure,natural,building.historic") if category else "tourism,entertainment,leisure,natural,building.historic"

    url = f"{config.GEOAPIFY_URL}/places"
    results = []
    raw_count = 0
    last_status = 200

    # Progressive search strategy: 25km circle -> 50km circle -> 100km circle -> text search with bias
    search_strategies = []
    if lat is not None and lng is not None:
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "filter": f"circle:{lng},{lat},25000", "bias": f"proximity:{lng},{lat}"})
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "filter": f"circle:{lng},{lat},50000", "bias": f"proximity:{lng},{lat}"})
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "filter": f"circle:{lng},{lat},100000", "bias": f"proximity:{lng},{lat}"})
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "text": query, "bias": f"proximity:{lng},{lat}"})
    else:
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "text": query})

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            for params in search_strategies:
                # Remove None valued params if any
                clean_params = {k: v for k, v in params.items() if v is not None}
                resp = await client.get(url, params=clean_params)
                last_status = resp.status_code
                if resp.status_code == 200:
                    data = resp.json()
                    feats = data.get("features", [])
                    raw_count = max(raw_count, len(feats))
                    if feats:
                        for feat in feats:
                            props = feat.get("properties", {})
                            geom = feat.get("geometry", {})
                            coords = geom.get("coordinates", [None, None])
                            name = props.get("name") or props.get("formatted") or props.get("address_line1")
                            if not name:
                                continue
                            cat_list = props.get("categories", [])
                            primary_cat = category or (cat_list[-1].split(".")[-1].replace("_", " ").title() if cat_list else "Attraction")
                            results.append({
                                "id": props.get("place_id") or f"geo_{props.get('lat')}_{props.get('lon')}",
                                "name": name,
                                "category": primary_cat,
                                "address": props.get("formatted") or props.get("address_line2") or props.get("address_line1"),
                                "lat": coords[1] if len(coords) > 1 else props.get("lat"),
                                "lng": coords[0] if len(coords) > 0 else props.get("lon"),
                                "rating": props.get("rank", {}).get("confidence") or 4.2,
                                "website": props.get("website"),
                                "source": "Geoapify",
                            })
                        if results:
                            break
    except Exception as e:
        print(f"[Services] Geoapify search places error: {e}")

    # Required diagnostic logs
    print(f"[PLACES]\nquery={query}\ngeocode_success={geo is not None}\ncoordinates=({lat}, {lng})\napi_status={last_status}\nraw_results_count={raw_count}\nmapped_results_count={len(results)}")
    if category:
        print(f"[FILTER]\nui_category={category}\nbackend_category={cat_param}\nresults_before={raw_count}\nresults_after={len(results)}")

    return results


# --- Geoapify Restaurants ---
async def geoapify_search_restaurants(query: str, limit: int = 30) -> list:
    if not config.GEOAPIFY_API_KEY or not query:
        return []

    geo = await geoapify_geocode(query)
    lat, lng = (geo.get("lat"), geo.get("lng")) if geo else (None, None)

    url = f"{config.GEOAPIFY_URL}/places"
    results = []
    last_status = 200

    cat_param = "catering.restaurant,catering.cafe,catering.fast_food,catering.bar,catering.pub"
    search_strategies = []
    if lat is not None and lng is not None:
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "filter": f"circle:{lng},{lat},25000", "bias": f"proximity:{lng},{lat}"})
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "filter": f"circle:{lng},{lat},50000", "bias": f"proximity:{lng},{lat}"})
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "filter": f"circle:{lng},{lat},100000", "bias": f"proximity:{lng},{lat}"})
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "text": query, "bias": f"proximity:{lng},{lat}"})
    else:
        search_strategies.append({"categories": cat_param, "limit": limit, "apiKey": config.GEOAPIFY_API_KEY, "text": query})

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            for params in search_strategies:
                clean_params = {k: v for k, v in params.items() if v is not None}
                resp = await client.get(url, params=clean_params)
                last_status = resp.status_code
                if resp.status_code == 200:
                    data = resp.json()
                    feats = data.get("features", [])
                    if feats:
                        for feat in feats:
                            props = feat.get("properties", {})
                            geom = feat.get("geometry", {})
                            coords = geom.get("coordinates", [None, None])
                            name = props.get("name") or props.get("formatted") or props.get("address_line1")
                            if not name:
                                continue
                            catering = props.get("datasource", {}).get("raw", {}).get("cuisine") or props.get("categories", ["Restaurant"])[-1].split(".")[-1].replace("_", " ").title()
                            results.append({
                                "id": props.get("place_id") or f"rest_{props.get('lat')}_{props.get('lon')}",
                                "name": name,
                                "cuisine": catering,
                                "address": props.get("formatted") or props.get("address_line2") or props.get("address_line1"),
                                "lat": coords[1] if len(coords) > 1 else props.get("lat"),
                                "lng": coords[0] if len(coords) > 0 else props.get("lon"),
                                "rating": props.get("rank", {}).get("confidence") or 4.5,
                                "price_level": 2,
                                "open_now": props.get("open_now", True),
                                "source": "Geoapify",
                            })
                        if results:
                            break
    except Exception as e:
        print(f"[Services] Geoapify search restaurants error: {e}")

    # Required diagnostic log
    print(f"[RESTAURANTS]\nquery={query}\ngeocode_success={geo is not None}\nlatitude={lat}\nlongitude={lng}\napi_status={last_status}\nresults_count={len(results)}")
    return results


# --- OpenWeather Weather ---
async def openweather_get_weather(city: str) -> dict:
    if not config.OPENWEATHER_API_KEY or not city:
        return {"current": None, "forecast": []}

    url_curr = f"{config.OPENWEATHER_URL}/weather"
    url_fore = f"{config.OPENWEATHER_URL}/forecast"

    current = None
    forecast = []

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp_c = await client.get(url_curr, params={"q": city, "units": "metric", "appid": config.OPENWEATHER_API_KEY})
            if resp_c.status_code == 200:
                c_data = resp_c.json()
                current = {
                    "city": c_data.get("name"),
                    "temp": round(c_data.get("main", {}).get("temp", 0)),
                    "temp_min": round(c_data.get("main", {}).get("temp_min", 0)),
                    "temp_max": round(c_data.get("main", {}).get("temp_max", 0)),
                    "feels_like": round(c_data.get("main", {}).get("feels_like", 0)),
                    "condition": c_data.get("weather", [{}])[0].get("main", "Clear"),
                    "description": c_data.get("weather", [{}])[0].get("description", ""),
                    "humidity": c_data.get("main", {}).get("humidity"),
                    "wind_speed": c_data.get("wind", {}).get("speed"),
                    "icon": c_data.get("weather", [{}])[0].get("icon"),
                }

            resp_f = await client.get(url_fore, params={"q": city, "units": "metric", "appid": config.OPENWEATHER_API_KEY})
            if resp_f.status_code == 200:
                f_data = resp_f.json()
                # Group by day date
                daily = {}
                for item in f_data.get("list", []):
                    dt_txt = item.get("dt_txt", "")
                    day_key = dt_txt.split(" ")[0] if dt_txt else "date"
                    if day_key not in daily:
                        daily[day_key] = {
                            "date": day_key,
                            "temp_min": item["main"]["temp_min"],
                            "temp_max": item["main"]["temp_max"],
                            "condition": item["weather"][0]["main"],
                            "rain_prob": int(item.get("pop", 0) * 100),
                        }
                    else:
                        daily[day_key]["temp_min"] = min(daily[day_key]["temp_min"], item["main"]["temp_min"])
                        daily[day_key]["temp_max"] = max(daily[day_key]["temp_max"], item["main"]["temp_max"])
                forecast = list(daily.values())[:7]
    except Exception as e:
        print(f"[Services] OpenWeather error: {e}")

    return {"current": current, "forecast": forecast}


# --- Tavily Search ---
async def tavily_search(query: str) -> dict:
    if not config.TAVILY_API_KEY or not query:
        return {"answer": "", "results": []}

    url = f"{config.TAVILY_URL}/search"
    payload = {
        "api_key": config.TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": True,
        "max_results": 5,
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "answer": data.get("answer", ""),
                    "results": [r.get("title", "") for r in data.get("results", [])],
                }
    except Exception as e:
        print(f"[Services] Tavily search error: {e}")

    return {"answer": "", "results": []}


# --- Groq Llama 3.3 LLM Client ---
async def groq_chat_completion(messages: list, temperature: float = 0.5) -> str:
    if not config.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable is missing. Please configure it in backend/.env.")

    headers = {
        "Authorization": f"Bearer {config.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    candidate_models = [config.GROQ_MODEL, "groq/compound", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"]
    # Remove duplicates while preserving order
    seen = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    last_err = None
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 2048,
            }
            try:
                resp = await client.post(config.GROQ_URL, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        msg = choices[0].get("message", {})
                        content = msg.get("content", "")
                        if content:
                            return content
                else:
                    last_err = f"Model '{model}' error ({resp.status_code}): {resp.text}"
            except Exception as e:
                last_err = f"Model '{model}' exception: {str(e)}"

    raise Exception(last_err or "Groq API completion failed across all candidate models.")


async def groq_extract_intent(user_message: str) -> dict:
    system_prompt = (
        "You are an intent extraction AI for a travel application. Analyze the user's message and return ONLY a valid JSON object matching this schema:\n"
        "{\n"
        '  "destination": "string or null",\n'
        '  "query_type": "itinerary | places | restaurants | weather | general",\n'
        '  "duration": number or null,\n'
        '  "budget": number or null\n'
        "}\n"
        "Do NOT include markdown block markers or conversational text, output JSON only."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]
    try:
        text = await groq_chat_completion(messages, temperature=0.1)
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        return json.loads(cleaned)
    except Exception as e:
        print(f"[Services] Groq extract intent error: {e}")
        return {"destination": None, "query_type": "general", "duration": None, "budget": None}


async def groq_plan_trip(form_data: dict, real_places: list, real_restaurants: list, weather_forecast: list) -> dict:
    destination = form_data.get("destination", "")
    duration = form_data.get("duration", 5)
    travelers = form_data.get("travelers", 1)
    budget = form_data.get("budget", 2000)
    currency = form_data.get("currency", "USD")
    style = form_data.get("travel_style", "Comfort")
    interests = form_data.get("interests", [])

    system_prompt = (
        f"You are an expert AI Travel Planner. Generate a detailed, realistic {duration}-day itinerary for {travelers} traveler(s) visiting {destination}.\n"
        f"Travel style: {style}. Budget: {budget} {currency}. Interests: {', '.join(interests)}.\n\n"
        "CRITICAL FACTUAL CONSTRAINTS:\n"
        "- Use ONLY the real places, attractions, and restaurants provided in the REAL DATA below for itinerary items.\n"
        "- Do NOT invent non-existent places or fake coordinates.\n"
        "- Return ONLY a single valid JSON object matching this exact structure:\n"
        "{\n"
        '  "destination_lat": 15.555,\n'
        '  "destination_lng": 73.751,\n'
        '  "days": [\n'
        "    {\n"
        '      "day_number": 1,\n'
        '      "day_date": "2026-10-01",\n'
        '      "weather": {"temp_max": 30, "temp_min": 24, "condition": "Sunny", "rain_prob": 10},\n'
        '      "items": [\n'
        "        {\n"
        '          "name": "Place Name",\n'
        '          "category": "Category",\n'
        '          "address": "Address",\n'
        '          "lat": 15.55,\n'
        '          "lng": 73.75,\n'
        '          "rating": 4.5,\n'
        '          "time_slot": "09:00 AM - 12:00 PM",\n'
        '          "duration": "3 hours",\n'
        '          "opening_hours": "09:00 AM - 06:00 PM",\n'
        '          "website": "url or null",\n'
        '          "source": "Geoapify"\n'
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
        "Do NOT include code fencing, explanation, or extra text."
    )

    context = (
        f"REAL PLACES RETRIEVED:\n{json.dumps(real_places[:20], indent=2)}\n\n"
        f"REAL RESTAURANTS RETRIEVED:\n{json.dumps(real_restaurants[:15], indent=2)}\n\n"
        f"WEATHER FORECAST:\n{json.dumps(weather_forecast, indent=2)}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": context},
    ]

    try:
        raw = await groq_chat_completion(messages, temperature=0.3)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        return json.loads(cleaned)
    except Exception as e:
        print(f"[Services] Groq plan trip error: {e}")
        # Fallback using provided real places directly without crashing
        days = []
        for d in range(1, duration + 1):
            w = weather_forecast[(d - 1) % len(weather_forecast)] if weather_forecast else {"temp_max": 28, "temp_min": 20, "condition": "Sunny", "rain_prob": 10}
            places_slice = real_places[(d - 1) * 2 : d * 2] if real_places else []
            rest_slice = real_restaurants[(d - 1) : d * 1] if real_restaurants else []
            items = []
            for p in places_slice:
                items.append({
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
            for r in rest_slice:
                items.append({
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
            days.append({"day_number": d, "day_date": None, "weather": w, "items": items})
        
        first_lat = real_places[0].get("lat") if real_places else None
        first_lng = real_places[0].get("lng") if real_places else None
        return {
            "destination_lat": first_lat,
            "destination_lng": first_lng,
            "days": days,
            "budget_breakdown": {
                "accommodation": round(budget * 0.4),
                "food": round(budget * 0.25),
                "attractions": round(budget * 0.20),
                "transportation": round(budget * 0.10),
                "other": round(budget * 0.05),
            },
        }
