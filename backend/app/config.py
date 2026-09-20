"""Application configuration loaded from environment variables."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly resolve path to backend/.env
CONFIG_DIR = Path(__file__).resolve().parent          # backend/app
BACKEND_DIR = CONFIG_DIR.parent                        # backend
PROJECT_DIR = BACKEND_DIR.parent                       # project

ENV_SEARCH_PATHS = [
    BACKEND_DIR / ".env",
    Path(os.getcwd()) / ".env",
    Path(os.getcwd()) / "backend" / ".env",
    PROJECT_DIR / ".env",
]

LOADED_ENV_PATH = None
for p in ENV_SEARCH_PATHS:
    if p.exists():
        load_dotenv(dotenv_path=p, override=True)
        LOADED_ENV_PATH = str(p)
        break

if not LOADED_ENV_PATH:
    load_dotenv(override=True)

# Helper function to dynamically retrieve env values
def _get_env(key: str, default: str = "") -> str:
    val = os.getenv(key, default)
    return val.strip() if isinstance(val, str) else default

# --- External API keys ---
GROQ_API_KEY = _get_env("GROQ_API_KEY")
TAVILY_API_KEY = _get_env("TAVILY_API_KEY")
GEOAPIFY_API_KEY = _get_env("GEOAPIFY_API_KEY")
OPENWEATHER_API_KEY = _get_env("OPENWEATHER_API_KEY")
GOOGLE_MAPS_API_KEY = _get_env("GOOGLE_MAPS_API_KEY")

# --- MySQL ---
MYSQL_HOST = _get_env("MYSQL_HOST", "localhost")
MYSQL_PORT = int(_get_env("MYSQL_PORT", "3306"))
MYSQL_DATABASE = _get_env("MYSQL_DATABASE", "voyageai")
MYSQL_USER = _get_env("MYSQL_USER", "voyage")
MYSQL_PASSWORD = _get_env("MYSQL_PASSWORD", "voyagepass")
MYSQL_SSL_CA = _get_env("MYSQL_SSL_CA")
MYSQL_SSL = _get_env("MYSQL_SSL")

# --- JWT ---
JWT_SECRET = _get_env("JWT_SECRET", "change-this-to-a-long-random-string")
JWT_ALGORITHM = _get_env("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = int(_get_env("JWT_EXPIRE_HOURS", "72"))

# --- Frontend CORS ---
FRONTEND_URL = _get_env("FRONTEND_URL", "http://localhost:5173")

# --- API endpoints ---
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = _get_env("GROQ_MODEL", "groq/compound")
GEOAPIFY_URL = "https://api.geoapify.com/v2"
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5"
TAVILY_URL = "https://api.tavily.com"

# --- HTTP ---
HTTP_TIMEOUT = 15  # seconds


def refresh_config():
    """Reload environment variables from .env file."""
    global GROQ_API_KEY, TAVILY_API_KEY, GEOAPIFY_API_KEY, OPENWEATHER_API_KEY, GOOGLE_MAPS_API_KEY
    global MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, MYSQL_SSL_CA, MYSQL_SSL
    global JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS, FRONTEND_URL, LOADED_ENV_PATH

    for p in ENV_SEARCH_PATHS:
        if p.exists():
            load_dotenv(dotenv_path=p, override=True)
            LOADED_ENV_PATH = str(p)
            break

    GROQ_API_KEY = _get_env("GROQ_API_KEY")
    TAVILY_API_KEY = _get_env("TAVILY_API_KEY")
    GEOAPIFY_API_KEY = _get_env("GEOAPIFY_API_KEY")
    OPENWEATHER_API_KEY = _get_env("OPENWEATHER_API_KEY")
    GOOGLE_MAPS_API_KEY = _get_env("GOOGLE_MAPS_API_KEY")

    MYSQL_HOST = _get_env("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(_get_env("MYSQL_PORT", "3306"))
    MYSQL_DATABASE = _get_env("MYSQL_DATABASE", "voyageai")
    MYSQL_USER = _get_env("MYSQL_USER", "voyage")
    MYSQL_PASSWORD = _get_env("MYSQL_PASSWORD", "voyagepass")
    MYSQL_SSL_CA = _get_env("MYSQL_SSL_CA")
    MYSQL_SSL = _get_env("MYSQL_SSL")

    JWT_SECRET = _get_env("JWT_SECRET", "change-this-to-a-long-random-string")
    JWT_ALGORITHM = _get_env("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_HOURS = int(_get_env("JWT_EXPIRE_HOURS", "72"))
    FRONTEND_URL = _get_env("FRONTEND_URL", "http://localhost:5173")
