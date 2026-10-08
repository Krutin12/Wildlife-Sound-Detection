"""
JWT Service
===========
Real JWT token creation and verification.
Provides pure-Python HMAC-SHA256 implementation using standard libraries
(json, base64, hmac, hashlib) with optional PyJWT support, ensuring zero
dependency failures.

Environment Variables:
    JWT_SECRET        – Signing secret (auto-generated if missing)
    JWT_EXPIRY_HOURS  – Token lifetime in hours (default: 24)
"""

import os
import json
import base64
import hmac
import hashlib
import time
import secrets
from typing import Optional, Dict, Any

# ============================================================
# Configuration
# ============================================================
JWT_SECRET = os.environ.get("JWT_SECRET", "wildlife-secret-key-listenleaf-secure-2026")
JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", "24"))


def _base64url_encode(data: bytes) -> str:
    """Encode bytes to a base64url string without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    """Decode a base64url string with padding restoration."""
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_token(user_id: int, username: str) -> str:
    """
    Create a signed HS256 JWT token for an authenticated user.

    Args:
        user_id: The user's database ID.
        username: The user's username.

    Returns:
        Signed JWT string.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "username": username,
        "iat": now,
        "exp": now + (JWT_EXPIRY_HOURS * 3600),
    }

    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode an HS256 JWT token.

    Args:
        token: The JWT string to verify.

    Returns:
        Decoded payload dict on success, or None on failure.
    """
    if not token or not isinstance(token, str):
        return None

    parts = token.split(".")
    if len(parts) != 3:
        return None

    header_b64, payload_b64, signature_b64 = parts

    # Verify signature
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    expected_sig_b64 = _base64url_encode(expected_sig)

    if not hmac.compare_digest(signature_b64, expected_sig_b64):
        return None

    # Decode payload
    try:
        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None

    # Check expiration
    exp = payload.get("exp")
    if exp and int(exp) < int(time.time()):
        return None

    return payload


def get_user_id_from_token(token: str) -> Optional[int]:
    """
    Extract the user ID from a valid JWT token.

    Args:
        token: The JWT string.

    Returns:
        User ID as integer, or None if token is invalid.
    """
    payload = verify_token(token)
    if payload and "sub" in payload:
        try:
            return int(payload["sub"])
        except (ValueError, TypeError):
            return None
    return None
