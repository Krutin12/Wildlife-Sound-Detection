"""
OTP Service
===========
Cryptographically secure OTP generation, hashing, verification,
and utility helpers for the Two-Factor Authentication system.

Security Properties:
    - OTP generated via ``secrets.SystemRandom`` (CSPRNG)
    - OTP stored as SHA-256 hash (never plain text)
    - Constant-time comparison to prevent timing attacks
    - Challenge IDs are URL-safe random tokens
    - Recovery codes are securely random hex strings
"""

import hashlib
import hmac
import secrets
from typing import List, Tuple


# ============================================================
# OTP Generation & Hashing
# ============================================================

def generate_otp(length: int = 6) -> str:
    """
    Generate a cryptographically secure numeric OTP.

    Args:
        length: Number of digits (default 6).

    Returns:
        OTP string of exactly ``length`` digits.
    """
    secure_random = secrets.SystemRandom()
    lower = 10 ** (length - 1)
    upper = (10 ** length) - 1
    return str(secure_random.randint(lower, upper))


def hash_otp(otp: str) -> str:
    """
    Hash an OTP using SHA-256 for secure storage.

    Args:
        otp: Plain-text OTP string.

    Returns:
        Hex-encoded SHA-256 hash.
    """
    return hashlib.sha256(otp.encode("utf-8")).hexdigest()


def verify_otp(plain_otp: str, otp_hash: str) -> bool:
    """
    Verify an OTP against its stored hash using constant-time comparison.

    Args:
        plain_otp: The OTP entered by the user.
        otp_hash: The stored SHA-256 hash.

    Returns:
        True if the OTP matches, False otherwise.
    """
    computed = hashlib.sha256(plain_otp.encode("utf-8")).hexdigest()
    return hmac.compare_digest(computed, otp_hash)


# ============================================================
# Challenge ID
# ============================================================

def generate_challenge_id() -> str:
    """
    Generate a cryptographically secure, URL-safe challenge identifier.

    Returns:
        A 43-character URL-safe random string.
    """
    return secrets.token_urlsafe(32)


# ============================================================
# Recovery Codes
# ============================================================

def generate_recovery_codes(count: int = 8) -> List[str]:
    """
    Generate a set of single-use recovery codes.

    Each code is formatted as ``XXXXX-XXXXX`` (10 hex characters).

    Args:
        count: Number of recovery codes to generate.

    Returns:
        List of plain-text recovery codes.
    """
    codes = []
    for _ in range(count):
        raw = secrets.token_hex(5)  # 10 hex characters
        formatted = f"{raw[:5]}-{raw[5:]}".upper()
        codes.append(formatted)
    return codes


def hash_recovery_code(code: str) -> str:
    """
    Hash a recovery code for secure storage.

    Args:
        code: Plain-text recovery code (e.g. ``A1B2C-D3E4F``).

    Returns:
        Hex-encoded SHA-256 hash.
    """
    normalized = code.strip().upper().replace("-", "")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def verify_recovery_code(plain_code: str, code_hash: str) -> bool:
    """
    Verify a recovery code against its stored hash.

    Args:
        plain_code: The recovery code entered by the user.
        code_hash: The stored SHA-256 hash.

    Returns:
        True if the code matches.
    """
    normalized = plain_code.strip().upper().replace("-", "")
    computed = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return hmac.compare_digest(computed, code_hash)


# ============================================================
# Masking Helpers
# ============================================================

def mask_email(email: str) -> str:
    """
    Mask an email address for safe display.

    Example: ``krutin@gmail.com`` → ``k*****@gmail.com``

    Args:
        email: Full email address.

    Returns:
        Masked email string.
    """
    if not email or "@" not in email:
        return "***@***.***"
    local, domain = email.rsplit("@", 1)
    if len(local) <= 1:
        masked_local = local[0] + "***"
    elif len(local) <= 3:
        masked_local = local[0] + "*" * (len(local) - 1)
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"


def mask_phone(phone: str) -> str:
    """
    Mask a phone number for safe display.

    Example: ``9876543210`` → ``******3210``

    Args:
        phone: Full phone number string (digits).

    Returns:
        Masked phone string.
    """
    if not phone:
        return "**********"
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) <= 4:
        return "*" * len(digits)
    return "*" * (len(digits) - 4) + digits[-4:]
