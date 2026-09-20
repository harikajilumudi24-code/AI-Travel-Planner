"""Server-side diagnostic logging for VoyageAI GenAI + RAG pipeline.
Ensures strict confidentiality - never logs API keys, JWT secrets, or sensitive user data.
"""

import sys

SENSITIVE_KEYS = {"password", "secret", "token", "authorization", "api_key", "groq_api_key", "geoapify_api_key", "openweather_api_key", "tavily_api_key", "google_maps_api_key", "mysql_password"}


def _sanitize_value(k: str, v: str) -> str:
    if any(sk in str(k).lower() for sk in SENSITIVE_KEYS):
        return "[REDACTED]"
    return str(v)


def log_event(category: str, message: str, details: dict = None):
    """Format and print structured diagnostic logs."""
    detail_str = ""
    if details:
        parts = [f"{k}={_sanitize_value(k, v)}" for k, v in details.items()]
        detail_str = " | " + " | ".join(parts)
    print(f"[{category.upper()}] {message}{detail_str}", flush=True)


def check_api_key_status(key_val: str) -> str:
    """Return status of an API key without exposing secret."""
    if not key_val or not key_val.strip():
        return "missing"
    if len(key_val.strip()) < 10:
        return "invalid"
    return "configured"
