# Backend (main.py)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date
from enum import Enum
from typing import Optional

class TimingType(str, Enum):
    FIXED_DATE = "fixed_date"
    DAYS_FROM_MUTUAL = "days_from_mutual"
    DAYS_BEFORE_CLOSING = "days_before_closing"

class Contingency(BaseModel):
    name: str
    timing_type: TimingType
    days: Optional[int] = None
    fixed_date: Optional[date] = None
    description: Optional[str] = None
    is_possession_date: bool = False

app = FastAPI()

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/calculate-timeline")
async def calculate_timeline(data: dict):
    # Will implement calculation logic here
    return {"message": "Timeline calculation endpoint"}