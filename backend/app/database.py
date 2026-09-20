"""MySQL database connection pool and helpers."""

import json
import mysql.connector
from mysql.connector import pooling
from contextlib import contextmanager

try:
    from app import config
except ImportError:
    import config

_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="voyageai_pool",
            pool_size=5,
            host=config.MYSQL_HOST,
            port=config.MYSQL_PORT,
            database=config.MYSQL_DATABASE,
            user=config.MYSQL_USER,
            password=config.MYSQL_PASSWORD,
            autocommit=True,
        )
    return _pool


@contextmanager
def get_cursor(dictionary=True):
    conn = get_pool().get_connection()
    cursor = conn.cursor(dictionary=dictionary)
    try:
        yield cursor
    finally:
        cursor.close()
        conn.close()


def execute(sql, params=None, fetch="none"):
    """Execute a parameterized query and optionally fetch results."""
    with get_cursor() as cursor:
        cursor.execute(sql, params or ())
        if fetch == "all":
            return cursor.fetchall()
        if fetch == "one":
            return cursor.fetchone()
        if fetch == "lastid":
            cursor.execute("SELECT LAST_INSERT_ID() AS id")
            res = cursor.fetchone()
            return res["id"] if res else cursor.lastrowid
        return None


def init_db():
    """Create tables if they don't exist."""
    statements = [
        """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        """
        CREATE TABLE IF NOT EXISTS trips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            destination VARCHAR(255) NOT NULL,
            destination_lat DOUBLE NULL,
            destination_lng DOUBLE NULL,
            start_date DATE NULL,
            end_date DATE NULL,
            duration INT DEFAULT 5,
            travelers INT DEFAULT 1,
            budget DECIMAL(10,2) DEFAULT 0,
            currency VARCHAR(8) DEFAULT 'USD',
            travel_style VARCHAR(60) DEFAULT 'Comfort',
            interests JSON NULL,
            dietary VARCHAR(60) DEFAULT 'None',
            accommodation VARCHAR(60) DEFAULT 'Hotel',
            transportation VARCHAR(60) DEFAULT 'Public transit',
            notes TEXT NULL,
            budget_breakdown JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_trips_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        """
        CREATE TABLE IF NOT EXISTS trip_days (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trip_id INT NOT NULL,
            day_number INT NOT NULL,
            day_date DATE NULL,
            weather JSON NULL,
            FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
            INDEX idx_days_trip (trip_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        """
        CREATE TABLE IF NOT EXISTS itinerary_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trip_day_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(120) NULL,
            address TEXT NULL,
            lat DOUBLE NULL,
            lng DOUBLE NULL,
            rating DECIMAL(3,1) NULL,
            time_slot VARCHAR(60) NULL,
            duration VARCHAR(60) NULL,
            opening_hours VARCHAR(255) NULL,
            website TEXT NULL,
            source VARCHAR(60) NULL,
            sort_order INT DEFAULT 0,
            FOREIGN KEY (trip_day_id) REFERENCES trip_days(id) ON DELETE CASCADE,
            INDEX idx_items_day (trip_day_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        """
        CREATE TABLE IF NOT EXISTS saved_places (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            place_id VARCHAR(255) NULL,
            name VARCHAR(255) NOT NULL,
            address TEXT NULL,
            lat DOUBLE NULL,
            lng DOUBLE NULL,
            category VARCHAR(120) NULL,
            rating DECIMAL(3,1) NULL,
            image TEXT NULL,
            website TEXT NULL,
            source VARCHAR(60) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_saved_places_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        """
        CREATE TABLE IF NOT EXISTS saved_restaurants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            place_id VARCHAR(255) NULL,
            name VARCHAR(255) NOT NULL,
            address TEXT NULL,
            lat DOUBLE NULL,
            lng DOUBLE NULL,
            cuisine VARCHAR(120) NULL,
            rating DECIMAL(3,1) NULL,
            price_level INT NULL,
            source VARCHAR(60) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_saved_rest_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        """
        CREATE TABLE IF NOT EXISTS chat_conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) DEFAULT 'New conversation',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_conv_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        """
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            role ENUM('user','assistant') NOT NULL,
            content TEXT NOT NULL,
            intent JSON NULL,
            sources JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
            INDEX idx_msg_conv (conversation_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
    ]
    try:
        for stmt in statements:
            execute(stmt)
    except Exception as e:
        print(f"[Warning] Database initialization warning (MySQL connection may be unconfigured): {e}")


def parse_json(val):
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return val


# --- User CRUD ---
def create_user(name: str, email: str, password_hash: str):
    sql = "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)"
    user_id = execute(sql, (name, email.lower(), password_hash), fetch="lastid")
    return get_user_by_id(user_id)


def get_user_by_email(email: str):
    sql = "SELECT id, name, email, password_hash, created_at FROM users WHERE email = %s"
    return execute(sql, (email.lower(),), fetch="one")


def get_user_by_id(user_id: int):
    sql = "SELECT id, name, email, created_at FROM users WHERE id = %s"
    return execute(sql, (user_id,), fetch="one")


# --- Trip CRUD ---
def create_trip(user_id: int, data: dict):
    sql = """
        INSERT INTO trips (
            user_id, destination, destination_lat, destination_lng, start_date, end_date,
            duration, travelers, budget, currency, travel_style, interests, dietary,
            accommodation, transportation, notes, budget_breakdown
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        user_id,
        data.get("destination"),
        data.get("destination_lat"),
        data.get("destination_lng"),
        data.get("start_date"),
        data.get("end_date"),
        data.get("duration", 5),
        data.get("travelers", 1),
        data.get("budget", 2000),
        data.get("currency", "USD"),
        data.get("travel_style", "Comfort"),
        json.dumps(data.get("interests") or []),
        data.get("dietary", "None"),
        data.get("accommodation", "Hotel"),
        data.get("transportation", "Public transit"),
        data.get("notes"),
        json.dumps(data.get("budget_breakdown") or {}),
    )
    trip_id = execute(sql, params, fetch="lastid")
    return trip_id


def get_user_trips(user_id: int):
    sql = "SELECT * FROM trips WHERE user_id = %s ORDER BY created_at DESC"
    trips = execute(sql, (user_id,), fetch="all") or []
    for t in trips:
        t["interests"] = parse_json(t.get("interests")) or []
        t["budget_breakdown"] = parse_json(t.get("budget_breakdown")) or {}
        if t.get("start_date"):
            t["start_date"] = str(t["start_date"])
        if t.get("end_date"):
            t["end_date"] = str(t["end_date"])
    return trips


def get_trip_by_id(trip_id: int, user_id: int = None):
    sql = "SELECT * FROM trips WHERE id = %s"
    params = [trip_id]
    if user_id is not None:
        sql += " AND user_id = %s"
        params.append(user_id)
    trip = execute(sql, tuple(params), fetch="one")
    if not trip:
        return None

    trip["interests"] = parse_json(trip.get("interests")) or []
    trip["budget_breakdown"] = parse_json(trip.get("budget_breakdown")) or {}
    if trip.get("start_date"):
        trip["start_date"] = str(trip["start_date"])
    if trip.get("end_date"):
        trip["end_date"] = str(trip["end_date"])

    # Fetch trip days & items
    days_sql = "SELECT * FROM trip_days WHERE trip_id = %s ORDER BY day_number ASC"
    days = execute(days_sql, (trip_id,), fetch="all") or []
    for d in days:
        d["weather"] = parse_json(d.get("weather"))
        if d.get("day_date"):
            d["day_date"] = str(d["day_date"])
        items_sql = "SELECT * FROM itinerary_items WHERE trip_day_id = %s ORDER BY sort_order ASC, id ASC"
        d["items"] = execute(items_sql, (d["id"],), fetch="all") or []

    trip["days"] = days
    return trip


def update_trip(trip_id: int, user_id: int, data: dict):
    trip = get_trip_by_id(trip_id, user_id)
    if not trip:
        return None

    fields = []
    params = []
    allowed = ["destination", "start_date", "end_date", "duration", "travelers", "budget", "currency", "travel_style", "notes"]
    for k in allowed:
        if k in data and data[k] is not None:
            fields.append(f"{k} = %s")
            params.append(data[k])

    if "interests" in data and data["interests"] is not None:
        fields.append("interests = %s")
        params.append(json.dumps(data["interests"]))

    if "budget_breakdown" in data and data["budget_breakdown"] is not None:
        fields.append("budget_breakdown = %s")
        params.append(json.dumps(data["budget_breakdown"]))

    if not fields:
        return trip

    params.extend([trip_id, user_id])
    sql = f"UPDATE trips SET {', '.join(fields)} WHERE id = %s AND user_id = %s"
    execute(sql, tuple(params))
    return get_trip_by_id(trip_id, user_id)


def delete_trip(trip_id: int, user_id: int):
    sql = "DELETE FROM trips WHERE id = %s AND user_id = %s"
    with get_cursor() as cursor:
        cursor.execute(sql, (trip_id, user_id))
        return cursor.rowcount > 0


def clear_trip_itinerary(trip_id: int):
    sql = "DELETE FROM trip_days WHERE trip_id = %s"
    execute(sql, (trip_id,))


def save_trip_itinerary(trip_id: int, days_data: list) -> tuple[int, int]:
    clear_trip_itinerary(trip_id)
    days_inserted = 0
    items_inserted = 0
    for day_index, day in enumerate(days_data):
        day_num = day.get("day_number", day_index + 1)
        day_date = day.get("day_date") or day.get("date")
        weather = day.get("weather")
        day_sql = "INSERT INTO trip_days (trip_id, day_number, day_date, weather) VALUES (%s, %s, %s, %s)"
        day_id = execute(day_sql, (trip_id, day_num, day_date, json.dumps(weather) if weather else None), fetch="lastid")
        days_inserted += 1

        items = day.get("items", [])
        for sort_order, item in enumerate(items):
            item_sql = """
                INSERT INTO itinerary_items (
                    trip_day_id, name, category, address, lat, lng, rating,
                    time_slot, duration, opening_hours, website, source, sort_order
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute(item_sql, (
                day_id,
                item.get("name"),
                item.get("category"),
                item.get("address"),
                item.get("lat"),
                item.get("lng"),
                item.get("rating"),
                item.get("time_slot"),
                item.get("duration"),
                item.get("opening_hours"),
                item.get("website"),
                item.get("source", "Geoapify"),
                sort_order,
            ))
            items_inserted += 1
    return days_inserted, items_inserted


# --- Saved Places CRUD ---
def get_saved_places(user_id: int):
    sql = "SELECT * FROM saved_places WHERE user_id = %s ORDER BY created_at DESC"
    return execute(sql, (user_id,), fetch="all") or []


def save_place(user_id: int, data: dict):
    sql = """
        INSERT INTO saved_places (user_id, place_id, name, address, lat, lng, category, rating, image, website, source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    place_id = execute(sql, (
        user_id,
        data.get("place_id"),
        data.get("name"),
        data.get("address"),
        data.get("lat"),
        data.get("lng"),
        data.get("category"),
        data.get("rating"),
        data.get("image"),
        data.get("website"),
        data.get("source", "Geoapify"),
    ), fetch="lastid")
    return execute("SELECT * FROM saved_places WHERE id = %s", (place_id,), fetch="one")


def delete_saved_place(place_id: int, user_id: int):
    sql = "DELETE FROM saved_places WHERE id = %s AND user_id = %s"
    with get_cursor() as cursor:
        cursor.execute(sql, (place_id, user_id))
        return cursor.rowcount > 0


# --- Saved Restaurants CRUD ---
def get_saved_restaurants(user_id: int):
    sql = "SELECT * FROM saved_restaurants WHERE user_id = %s ORDER BY created_at DESC"
    return execute(sql, (user_id,), fetch="all") or []


def save_restaurant(user_id: int, data: dict):
    sql = """
        INSERT INTO saved_restaurants (user_id, place_id, name, address, lat, lng, cuisine, rating, price_level, source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    rest_id = execute(sql, (
        user_id,
        data.get("place_id"),
        data.get("name"),
        data.get("address"),
        data.get("lat"),
        data.get("lng"),
        data.get("cuisine"),
        data.get("rating"),
        data.get("price_level"),
        data.get("source", "Geoapify"),
    ), fetch="lastid")
    return execute("SELECT * FROM saved_restaurants WHERE id = %s", (rest_id,), fetch="one")


def delete_saved_restaurant(restaurant_id: int, user_id: int):
    sql = "DELETE FROM saved_restaurants WHERE id = %s AND user_id = %s"
    with get_cursor() as cursor:
        cursor.execute(sql, (restaurant_id, user_id))
        return cursor.rowcount > 0


# --- Chat Conversations & Messages ---
def get_user_conversations(user_id: int):
    sql = "SELECT id, user_id, title, created_at, updated_at FROM chat_conversations WHERE user_id = %s ORDER BY updated_at DESC"
    convs = execute(sql, (user_id,), fetch="all") or []
    for c in convs:
        if c.get("created_at"):
            c["created_at"] = str(c["created_at"])
        if c.get("updated_at"):
            c["updated_at"] = str(c["updated_at"])
    return convs


def create_conversation(user_id: int, title: str = "New conversation"):
    sql = "INSERT INTO chat_conversations (user_id, title) VALUES (%s, %s)"
    return execute(sql, (user_id, title), fetch="lastid")


def get_conversation(conversation_id: int, user_id: int):
    sql = "SELECT * FROM chat_conversations WHERE id = %s AND user_id = %s"
    conv = execute(sql, (conversation_id, user_id), fetch="one")
    if not conv:
        return None
    msgs_sql = "SELECT * FROM chat_messages WHERE conversation_id = %s ORDER BY created_at ASC"
    msgs = execute(msgs_sql, (conversation_id,), fetch="all") or []
    for m in msgs:
        m["intent"] = parse_json(m.get("intent"))
        m["sources"] = parse_json(m.get("sources")) or []
        if m.get("created_at"):
            m["created_at"] = str(m["created_at"])
    conv["messages"] = msgs
    return conv


def rename_conversation(conversation_id: int, user_id: int, title: str):
    sql = "UPDATE chat_conversations SET title = %s WHERE id = %s AND user_id = %s"
    with get_cursor() as cursor:
        cursor.execute(sql, (title, conversation_id, user_id))
        return cursor.rowcount > 0


def delete_conversation(conversation_id: int, user_id: int):
    sql = "DELETE FROM chat_conversations WHERE id = %s AND user_id = %s"
    with get_cursor() as cursor:
        cursor.execute(sql, (conversation_id, user_id))
        return cursor.rowcount > 0


def add_chat_message(conversation_id: int, role: str, content: str, intent: dict = None, sources: list = None):
    sql = "INSERT INTO chat_messages (conversation_id, role, content, intent, sources) VALUES (%s, %s, %s, %s, %s)"
    msg_id = execute(sql, (
        conversation_id,
        role,
        content,
        json.dumps(intent) if intent else None,
        json.dumps(sources) if sources else None,
    ), fetch="lastid")
    # Touch updated_at timestamp on conversation
    execute("UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = %s", (conversation_id,))
    return execute("SELECT * FROM chat_messages WHERE id = %s", (msg_id,), fetch="one")
