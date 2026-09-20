"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import date


# --- Auth ---
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Trips ---
class TripCreate(BaseModel):
    destination: str
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration: int = 5
    travelers: int = 1
    budget: float = 2000
    currency: str = "USD"
    travel_style: str = "Comfort"
    interests: list[str] = []
    dietary: str = "None"
    accommodation: str = "Hotel"
    transportation: str = "Public transit"
    notes: Optional[str] = None


class TripUpdate(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration: Optional[int] = None
    travelers: Optional[int] = None
    budget: Optional[float] = None
    currency: Optional[str] = None
    travel_style: Optional[str] = None
    interests: Optional[list[str]] = None
    notes: Optional[str] = None


# --- AI ---
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None


class IntentRequest(BaseModel):
    message: str


class PlanTripRequest(BaseModel):
    destination: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration: int = 5
    travelers: int = 1
    budget: float = 2000
    currency: str = "USD"
    travel_style: str = "Comfort"
    interests: list[str] = []
    dietary: str = "None"
    accommodation: str = "Hotel"
    transportation: str = "Public transit"
    notes: Optional[str] = None


# --- Saved places ---
class SavePlaceRequest(BaseModel):
    place_id: Optional[str] = None
    name: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    category: Optional[str] = None
    rating: Optional[float] = None
    image: Optional[str] = None
    website: Optional[str] = None
    source: Optional[str] = None


class SaveRestaurantRequest(BaseModel):
    place_id: Optional[str] = None
    name: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    cuisine: Optional[str] = None
    rating: Optional[float] = None
    price_level: Optional[int] = None
    source: Optional[str] = None


class RenameConversationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
