import asyncio
import httpx

BASE_URL = "http://127.0.0.1:8000"

async def run_tests():
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("=== TEST 1: Restaurants -> Araku ===")
        r1 = await client.get(f"{BASE_URL}/api/restaurants?q=Araku")
        d1 = r1.json() if r1.status_code == 200 else {}
        print(f"Status: {r1.status_code}, Results: {len(d1.get('results', []))}")
        if d1.get('results'):
            print(f"Sample: {d1['results'][0]['name']} ({d1['results'][0].get('cuisine')})")

        print("\n=== TEST 2: Restaurants -> Goa ===")
        r2 = await client.get(f"{BASE_URL}/api/restaurants?q=Goa")
        d2 = r2.json() if r2.status_code == 200 else {}
        print(f"Status: {r2.status_code}, Results: {len(d2.get('results', []))}")
        if d2.get('results'):
            print(f"Sample: {d2['results'][0]['name']} ({d2['results'][0].get('cuisine')})")

        print("\n=== TEST 3: Explore -> Tokyo -> All ===")
        r3 = await client.get(f"{BASE_URL}/api/places?q=Tokyo")
        d3 = r3.json() if r3.status_code == 200 else {}
        print(f"Status: {r3.status_code}, Results: {len(d3.get('results', []))}")
        if d3.get('results'):
            print(f"Sample: {d3['results'][0]['name']} ({d3['results'][0].get('category')})")

        print("\n=== TEST 4: Explore -> Bali -> All ===")
        r4 = await client.get(f"{BASE_URL}/api/places?q=Bali")
        d4 = r4.json() if r4.status_code == 200 else {}
        print(f"Status: {r4.status_code}, Results: {len(d4.get('results', []))}")
        if d4.get('results'):
            print(f"Sample: {d4['results'][0]['name']} ({d4['results'][0].get('category')})")

        print("\n=== TEST 5: Explore -> Bali -> Historical ===")
        r5 = await client.get(f"{BASE_URL}/api/places?q=Bali&category=Historical")
        d5 = r5.json() if r5.status_code == 200 else {}
        print(f"Status: {r5.status_code}, Results: {len(d5.get('results', []))}")
        if d5.get('results'):
            print(f"Sample: {d5['results'][0]['name']} ({d5['results'][0].get('category')})")

        print("\n--- Register / Login test user ---")
        user_reg = {"name": "Test User", "email": "tester@voyageai.com", "password": "Password123!"}
        token_resp = await client.post(f"{BASE_URL}/api/auth/login", json={"email": user_reg["email"], "password": user_reg["password"]})
        if token_resp.status_code != 200:
            token_resp = await client.post(f"{BASE_URL}/api/auth/register", json=user_reg)
        token = token_resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print(f"Auth token obtained: {bool(token)}")

        print("\n=== TEST 6: AI Assistant -> 'Plan a 5 day trip to Goa for 2 people interested in food and beaches.' ===")
        r6 = await client.post(
            f"{BASE_URL}/api/ai/chat",
            json={"message": "Plan a 5 day trip to Goa for 2 people interested in food and beaches."},
            headers=headers
        )
        d6 = r6.json() if r6.status_code == 200 else {}
        print(f"Status: {r6.status_code}, Sources: {d6.get('sources')}")
        print(f"Response snippet:\n{d6.get('response', '')[:300]}...\n")

        print("\n=== TEST 7: Plan Trip -> Goa, 3 days, 2 travelers, Food + Culture ===")
        r7 = await client.post(
            f"{BASE_URL}/api/ai/plan-trip",
            json={
                "destination": "Goa",
                "start_date": "2026-10-01",
                "end_date": "2026-10-04",
                "duration": 3,
                "travelers": 2,
                "budget": 2000,
                "currency": "USD",
                "travel_style": "Comfort",
                "interests": ["Food", "Culture"],
            },
            headers=headers
        )
        d7 = r7.json() if r7.status_code == 200 else {}
        print(f"Status: {r7.status_code}, Days returned: {len(d7.get('days', []))}")
        total_items = sum(len(d.get("items", [])) for d in d7.get("days", []))
        print(f"Total itinerary items saved: {total_items}")
        for day in d7.get("days", []):
            print(f"  Day {day.get('day_number')} ({day.get('day_date')}): {len(day.get('items', []))} items")
            for item in day.get("items", [])[:2]:
                print(f"    - {item.get('name')} | {item.get('category')} | {item.get('address')}")

if __name__ == "__main__":
    asyncio.run(run_tests())
