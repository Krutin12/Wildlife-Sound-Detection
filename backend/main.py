"""
FastAPI Backend
===============
REST API for the Animal Sound Identification System.

Endpoints:
    - POST /predict: Upload audio file and get species prediction.
    - GET /health: Health check and model status.

Usage:
    cd backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
import sys

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.schemas import (
    PredictionResponse, PredictionItem, HealthResponse,
    UserRegisterRequest, UserLoginRequest, AuthResponse, UserProfileResponse, UserProfileUpdateRequest,
    LoginResponse, OtpVerifyRequest, OtpResendRequest,
    TwoFactorEnableRequest, TwoFactorDisableRequest, TwoFactorMethodRequest,
    TwoFactorStatusResponse, RecoveryCodesResponse,
)
from backend.inference_service import InferenceService
from backend.mysql_database import db_manager
from backend.jwt_service import create_token, get_user_id_from_token
from backend.otp_service import (
    generate_otp, hash_otp, verify_otp, generate_challenge_id,
    generate_recovery_codes, hash_recovery_code, verify_recovery_code,
    mask_email,
)
from backend.email_service import send_otp_email
import config

# ============================================================
# FastAPI Application
# ============================================================
app = FastAPI(
    title="Animal Sound Identification API",
    description="Identify animal species from audio recordings using EfficientNet-B3 with MySQL database persistence",
    version="2.0.0",
)

# CORS middleware (allow React & Streamlit frontends)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global inference service
service = InferenceService()

# ============================================================
# Auth Helper: extract user_id from Authorization header
# ============================================================
from fastapi import Header

def _get_current_user_id(authorization: str = Header(default="")) -> int:
    """Extract and verify user_id from 'Bearer <token>' header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.split(" ", 1)[1]
    user_id = get_user_id_from_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id

def _sync_logo_assets():
    import base64, shutil
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_logo = os.path.join(project_root, "Listenleaf-removebg-preview.png")
    if not os.path.exists(src_logo):
        src_logo = r"C:\Users\krutin_12\Desktop\clg project(Internship)\wildlife\Listenleaf-removebg-preview.png"
    if not os.path.exists(src_logo):
        src_logo = os.path.join(project_root, "1d8382a3-71cb-42f2-8893-3bdf27f9cfc0.png")
    if os.path.exists(src_logo):
        try:
            pub_dir = os.path.join(project_root, "frontend", "public")
            assets_dir = os.path.join(project_root, "frontend", "src", "assets")
            os.makedirs(pub_dir, exist_ok=True)
            os.makedirs(assets_dir, exist_ok=True)
            shutil.copy(src_logo, os.path.join(pub_dir, "logo.png"))
            shutil.copy(src_logo, os.path.join(assets_dir, "logo.png"))
            with open(src_logo, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
            ts_path = os.path.join(assets_dir, "logoData.ts")
            with open(ts_path, "w", encoding="utf-8") as f:
                f.write(f'export const LISTENLEAF_LOGO_URL = "data:image/png;base64,{b64}";\n')
        except Exception as e:
            print(f"Logo sync warning: {e}")

_sync_logo_assets()

# ============================================================
# Startup Event
# ============================================================
@app.on_event("startup")
async def startup_event():
    """Load the model on startup."""
    _sync_logo_assets()
    try:
        config.create_output_dirs()
        service.load()
    except Exception as e:
        print(f"WARNING: Could not load model: {e}")
        print("The /predict endpoint will fallback or require trained weights.")


# ============================================================
# Endpoints
# ============================================================
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API health and model status."""
    info = service.get_model_info()
    return HealthResponse(
        status="healthy",
        model_loaded=info.get("loaded", False),
        num_classes=info.get("num_classes", 0),
        device=info.get("device", "unknown"),
    )


@app.get("/api/db-status")
async def get_db_status():
    """Check MySQL database connection and record stats."""
    return db_manager.get_db_status()


@app.get("/api/history")
async def get_history(limit: int = Query(default=50, ge=1, le=500)):
    """Retrieve saved audio prediction history from MySQL/SQLite."""
    return db_manager.get_prediction_history(limit=limit)


@app.delete("/api/history/{prediction_id}")
async def delete_history_item(prediction_id: int):
    """Delete a single prediction history record."""
    success = db_manager.delete_prediction(prediction_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete record.")
    return {"message": "Record deleted successfully"}


@app.delete("/api/history")
async def clear_history():
    """Clear all prediction history records."""
    success = db_manager.clear_all_history()
    if not success:
        raise HTTPException(status_code=400, detail="Failed to clear history.")
    return {"message": "History cleared successfully"}


@app.get("/api/species")
async def get_species():
    """Get all species information stored in MySQL/SQLite database."""
    return db_manager.get_all_species()


# ============================================================
# Authentication Endpoints
# ============================================================
@app.get("/api/check-username/{username}")
async def check_username(username: str):
    """Check if a username is available or already taken."""
    exists = db_manager.check_username_exists(username)
    return {
        "username": username,
        "exists": exists,
        "available": not exists,
        "message": "Username already taken" if exists else "Username available"
    }


@app.get("/api/check-email/{email}")
async def check_email(email: str):
    """Check if an email address is available or already registered."""
    exists = db_manager.check_email_exists(email)
    return {
        "email": email,
        "exists": exists,
        "available": not exists,
        "message": "Email address already registered" if exists else "Email available"
    }


@app.post("/api/auth/register", response_model=AuthResponse)
async def register(req: UserRegisterRequest):
    """Register a new user with encrypted password hashing."""
    import re

    # Validate Phone Number (must be exactly 10 digits)
    phone_clean = req.phone_number.strip()
    if not re.match(r'^\d{10}$', phone_clean):
        raise HTTPException(
            status_code=400,
            detail="Phone number must be exactly 10 digits"
        )

    # Validate Password Complexity (>= 8 chars, uppercase, lowercase, digit, symbol)
    pwd = req.password
    if len(pwd) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter (A-Z)")
    if not re.search(r'[a-z]', pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter (a-z)")
    if not re.search(r'[0-9]', pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit (0-9)")
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>/?]', pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one special symbol (e.g. @, #, _)")

    if db_manager.check_email_exists(req.email):
        raise HTTPException(
            status_code=400,
            detail="Email address already registered. Please use a different email or log in."
        )

    if db_manager.check_username_exists(req.username):
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    try:
        user_dict = db_manager.register_user(req.dict())
        user_profile = UserProfileResponse(**user_dict)
        token = create_token(user_profile.id, user_profile.username)
        return AuthResponse(
            message="User registered successfully",
            token=token,
            user=user_profile
        )
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.put("/api/auth/profile", response_model=UserProfileResponse)
async def update_profile(
    req: UserProfileUpdateRequest,
    user_id: int = Query(..., alias="user_id")
):
    """Update user personal profile details."""
    import re

    if not req.first_name.strip() or not req.last_name.strip():
        raise HTTPException(status_code=400, detail="First name and last name cannot be empty.")

    clean_email = req.email.strip().lower()
    if not clean_email or "@" not in clean_email or "." not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    clean_phone = req.phone_number.strip()
    if not re.match(r'^\d{10}$', clean_phone):
        raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")

    try:
        updated_user = db_manager.update_user_profile(
            user_id=user_id,
            first_name=req.first_name,
            last_name=req.last_name,
            email=clean_email,
            phone_number=clean_phone
        )
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserProfileResponse(**updated_user)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile.")


@app.post("/api/auth/login")
async def login(req: UserLoginRequest):
    """Log in user. If 2FA is enabled, return a challenge instead of a token."""
    from datetime import datetime, timedelta

    try:
        user_dict = db_manager.verify_user_login(req.username, req.password)
    except Exception as e:
        print(f"Login error during verification: {e}")
        raise HTTPException(status_code=500, detail="Database error during login verification")

    if not user_dict:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    user_id = user_dict["id"]
    try:
        tfa_status = db_manager.get_user_2fa_status(user_id)
    except Exception as e:
        print(f"Error fetching 2FA status: {e}")
        tfa_status = {"enabled": False}

    if tfa_status.get("enabled"):
        try:
            # 2FA is enabled — generate OTP and return challenge
            method = tfa_status.get("method", "email")
            otp = generate_otp()
            otp_hashed = hash_otp(otp)
            challenge_id = generate_challenge_id()
            expires_at = (datetime.utcnow() + timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")

            # Store challenge
            db_manager.create_2fa_challenge(user_id, challenge_id, otp_hashed, method, expires_at)

            # Send OTP via Email
            send_otp_email(tfa_status.get("email", ""), otp)
            masked_dest = mask_email(tfa_status.get("email", ""))

            return {
                "requires_2fa": True,
                "challenge_id": challenge_id,
                "method": method,
                "masked_destination": masked_dest,
            }
        except Exception as e:
            print(f"Error generating 2FA challenge: {e}")
            raise HTTPException(status_code=500, detail=f"2FA challenge generation failed: {str(e)}")

    # 2FA disabled — issue JWT directly
    try:
        user_profile = UserProfileResponse(**user_dict)
        token = create_token(user_profile.id, user_profile.username)
        return AuthResponse(
            message="Login successful",
            token=token,
            user=user_profile
        )
    except Exception as e:
        print(f"Error generating auth token: {e}")
        raise HTTPException(status_code=500, detail=f"Token generation failed: {str(e)}")


# ============================================================
# Two-Factor Authentication Endpoints
# ============================================================

@app.post("/api/auth/2fa/verify", response_model=AuthResponse)
async def verify_2fa(req: OtpVerifyRequest):
    """Verify OTP and issue JWT on success."""
    from datetime import datetime

    challenge = db_manager.get_2fa_challenge(req.challenge_id)
    if not challenge:
        raise HTTPException(status_code=400, detail="Invalid or expired 2FA challenge")

    # Check max attempts (5)
    if challenge.get("otp_attempts", 0) >= 5:
        db_manager.invalidate_challenge(req.challenge_id)
        raise HTTPException(status_code=429, detail="Maximum verification attempts exceeded. Please request a new OTP.")

    # Increment attempt counter
    db_manager.increment_challenge_attempts(req.challenge_id)

    # Check expiry
    expires_str = challenge.get("otp_expires_at", "")
    try:
        expires_at = datetime.strptime(str(expires_str), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        db_manager.invalidate_challenge(req.challenge_id)
        raise HTTPException(status_code=400, detail="Invalid challenge data")

    if datetime.utcnow() > expires_at:
        db_manager.invalidate_challenge(req.challenge_id)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # Verify OTP
    if not verify_otp(req.otp_code.strip(), challenge["otp_hash"]):
        remaining = 5 - (challenge.get("otp_attempts", 0) + 1)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining} attempt(s) remaining."
        )

    # OTP verified — invalidate challenge and issue JWT
    db_manager.invalidate_challenge(req.challenge_id)

    user_id = challenge["user_id"]
    user = db_manager.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=500, detail="User not found")

    user_profile = UserProfileResponse(**user)
    token = create_token(user_id, user["username"])
    return AuthResponse(
        message="Login successful",
        token=token,
        user=user_profile
    )


@app.post("/api/auth/2fa/resend")
async def resend_2fa(req: OtpResendRequest):
    """Resend OTP with cooldown enforcement (30 seconds)."""
    from datetime import datetime, timedelta

    challenge = db_manager.get_2fa_challenge(req.challenge_id)
    if not challenge:
        raise HTTPException(status_code=400, detail="Invalid or expired 2FA challenge")

    # Enforce 30-second cooldown
    last_sent_str = challenge.get("otp_last_sent_at", "")
    if last_sent_str:
        try:
            last_sent = datetime.strptime(str(last_sent_str), "%Y-%m-%d %H:%M:%S")
            if (datetime.utcnow() - last_sent).total_seconds() < 30:
                raise HTTPException(
                    status_code=429,
                    detail="Please wait before requesting another OTP."
                )
        except ValueError:
            pass

    # Generate new OTP
    otp = generate_otp()
    otp_hashed = hash_otp(otp)
    new_expires = (datetime.utcnow() + timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")

    db_manager.update_challenge_otp(req.challenge_id, otp_hashed, new_expires)

    # Send OTP via Email
    user = db_manager.get_user_by_id(challenge["user_id"])
    if user:
        send_otp_email(user.get("email", ""), otp)
        masked_dest = mask_email(user.get("email", ""))
    else:
        masked_dest = "***"

    return {
        "message": "OTP resent successfully",
        "masked_destination": masked_dest,
    }


@app.get("/api/auth/2fa/status", response_model=TwoFactorStatusResponse)
async def get_2fa_status(user_id: int = Query(..., alias="user_id")):
    """Get the 2FA status for the authenticated user."""
    tfa = db_manager.get_user_2fa_status(user_id)
    return TwoFactorStatusResponse(
        enabled=tfa.get("enabled", False),
        method="email",
        masked_email=mask_email(tfa.get("email", "")) if tfa.get("email") else None,
        masked_phone=None,
    )



@app.post("/api/auth/2fa/enable", response_model=RecoveryCodesResponse)
async def enable_2fa_with_user(
    req: TwoFactorEnableRequest,
    user_id: int = Query(..., alias="user_id")
):
    """Enable 2FA for a user (requires password re-authentication)."""
    if req.method not in ("email", "mobile"):
        raise HTTPException(status_code=400, detail="Method must be 'email' or 'mobile'")

    # Verify password for re-authentication
    user = db_manager.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    full_user = db_manager.get_full_user_by_username(user["username"])
    if not full_user:
        raise HTTPException(status_code=404, detail="User not found")

    from backend.mysql_database import DatabaseManager
    calc_hash, _ = db_manager._hash_password(req.password, salt=full_user["salt"])
    import secrets as _secrets
    if not _secrets.compare_digest(calc_hash, full_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    # Enable 2FA
    db_manager.enable_2fa(user_id, req.method)

    # Generate recovery codes
    codes = generate_recovery_codes(8)
    code_hashes = [hash_recovery_code(c) for c in codes]
    db_manager.store_recovery_codes(user_id, code_hashes)

    return RecoveryCodesResponse(
        codes=codes,
        message="Two-Factor Authentication enabled successfully. Save your recovery codes — they will not be shown again."
    )


@app.post("/api/auth/2fa/disable")
async def disable_2fa(
    req: TwoFactorDisableRequest,
    user_id: int = Query(..., alias="user_id")
):
    """Disable 2FA for a user (requires password re-authentication)."""
    user = db_manager.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    full_user = db_manager.get_full_user_by_username(user["username"])
    if not full_user:
        raise HTTPException(status_code=404, detail="User not found")

    calc_hash, _ = db_manager._hash_password(req.password, salt=full_user["salt"])
    import secrets as _secrets
    if not _secrets.compare_digest(calc_hash, full_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    db_manager.disable_2fa(user_id)
    db_manager.delete_recovery_codes(user_id)

    return {"message": "Two-Factor Authentication disabled successfully."}




@app.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(..., description="Audio file (.ogg, .wav, .mp3)"),
    top_k: int = Query(default=5, ge=1, le=20, description="Number of top predictions"),
):
    """
    Predict animal species from uploaded audio and PERSIST result to MySQL database.
    """
    if not service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train the model first.",
        )

    # Validate file format
    allowed_extensions = {".ogg", ".wav", ".mp3", ".flac", ".m4a"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {ext}. Allowed: {allowed_extensions}",
        )

    try:
        # Read file
        audio_bytes = await file.read()

        # Run prediction
        result = service.predict_from_bytes(audio_bytes, filename=file.filename, top_k=top_k)

        # Build response items
        top_k_items = [
            PredictionItem(label=p["label"], confidence=p["confidence"])
            for p in result["top_k_predictions"]
        ]

        response_payload = {
            "predicted_label": result["predicted_label"],
            "common_name": result.get("common_name", result["predicted_label"]),
            "scientific_name": result.get("scientific_name", "N/A"),
            "animal_class": result.get("animal_class", "N/A"),
            "confidence": result["confidence"],
            "habitat": result.get("habitat", "N/A"),
            "diet": result.get("diet", "N/A"),
            "distribution": result.get("geographic_distribution", result.get("distribution", "N/A")),
            "conservation_status": result.get("conservation_status", "N/A"),
            "interesting_facts": result.get("interesting_facts", "N/A"),
            "top_k_predictions": [item.dict() for item in top_k_items],
        }

        # PERSIST TO MYSQL / SQLITE DATABASE
        try:
            db_manager.save_prediction(response_payload, filename=file.filename)
        except Exception as db_err:
            print(f"Warning: Failed to persist prediction to DB: {db_err}")

        return PredictionResponse(
            predicted_label=response_payload["predicted_label"],
            common_name=response_payload["common_name"],
            scientific_name=response_payload["scientific_name"],
            animal_class=response_payload["animal_class"],
            confidence=response_payload["confidence"],
            habitat=response_payload["habitat"],
            diet=response_payload["diet"],
            distribution=response_payload["distribution"],
            conservation_status=response_payload["conservation_status"],
            interesting_facts=response_payload["interesting_facts"],
            top_k_predictions=top_k_items,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ============================================================
# Run with: uvicorn backend.main:app --reload
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

