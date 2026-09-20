"""Server-side diagnostic logging for VoyageAI GenAI + RAG pipeline.
Ensures strict confidentiality - never logs API keys, JWT secrets, or sensitive user data.
"""

import sys

def log_event(category: str, message: str, details: dict = None):
    """Format and print structured diagnostic logs."""
    detail_str = ""
    if details:
        parts = [f"{k}={v}" for k, v in details.items()]
        detail_str = " | " + " | ".join(parts)
    print(f"[{category.upper()}] {message}{detail_str}", flush=True)


def check_api_key_status(key_val: str) -> str:
    """Return status of an API key without exposing secret."""
    if not key_val or not key_val.strip():
        return "missing"
    if len(key_val.strip()) < 10:
        return "invalid"
    return "configured"
