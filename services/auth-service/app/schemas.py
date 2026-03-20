from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

class RegisterRequest(BaseModel):
    display_name:    str
    email:           EmailStr
    password:        str
    country:         Optional[str] = "South Africa"
    currency_code:   Optional[str] = "ZAR"
    currency_symbol: Optional[str] = "R"

class UpdateProfileRequest(BaseModel):
    display_name:    Optional[str] = None
    country:         Optional[str] = None
    currency_code:   Optional[str] = None
    currency_symbol: Optional[str] = None

class UserOut(BaseModel):
    id:              str
    display_name:    Optional[str]
    email:           str
    country:         Optional[str]
    currency_code:   Optional[str]
    currency_symbol: Optional[str]

    class Config:
        from_attributes = True