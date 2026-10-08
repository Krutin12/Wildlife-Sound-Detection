"""
Pydantic Schemas
================
Request and response models for the FastAPI backend.
"""

from typing import List, Optional
from pydantic import BaseModel, EmailStr


class PredictionItem(BaseModel):
    """A single prediction with label and confidence."""
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    """Response model for the /predict endpoint."""
    predicted_label: str
    common_name: str
    scientific_name: str
    animal_class: str
    confidence: float
    habitat: str
    diet: str
    distribution: str
    conservation_status: str
    interesting_facts: str
    top_k_predictions: List[PredictionItem]


class HealthResponse(BaseModel):
    """Response model for the /health endpoint."""
    status: str
    model_loaded: bool
    num_classes: int
    device: str


# ============================================================
# User Authentication Schemas
# ============================================================
class UserRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    username: str
    password: str
    phone_number: str


class UserLoginRequest(BaseModel):
    username: str
    password: str


class UserProfileResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    username: str
    phone_number: str
    created_at: Optional[str] = None


class UserProfileUpdateRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone_number: str


class AuthResponse(BaseModel):
    message: str
    token: str
    user: UserProfileResponse


# ============================================================
# Two-Factor Authentication Schemas
# ============================================================
class LoginResponse(BaseModel):
    """Returned when 2FA is enabled — no token issued yet."""
    requires_2fa: bool = True
    challenge_id: str
    method: str
    masked_destination: str


class OtpVerifyRequest(BaseModel):
    challenge_id: str
    otp_code: str


class OtpResendRequest(BaseModel):
    challenge_id: str


class TwoFactorEnableRequest(BaseModel):
    method: str        # 'email' or 'mobile'
    password: str      # re-auth required


class TwoFactorDisableRequest(BaseModel):
    password: str      # re-auth required


class TwoFactorMethodRequest(BaseModel):
    method: str        # 'email' or 'mobile'
    password: str      # re-auth required


class TwoFactorStatusResponse(BaseModel):
    enabled: bool
    method: Optional[str] = None
    masked_email: Optional[str] = None
    masked_phone: Optional[str] = None


class RecoveryCodesResponse(BaseModel):
    codes: List[str]
    message: str
