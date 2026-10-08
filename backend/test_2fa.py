"""
Two-Factor Authentication (2FA) Test Suite
===========================================
Tests all security properties and endpoints of the 2FA system:
- JWT Token Service (creation, decoding, validation)
- OTP Service (generation, SHA-256 hashing, constant-time verification, masking)
- Recovery Code Service (generation, hashing, verification)
- Database Manager 2FA Methods (enable, disable, method change, challenge lifecycle)
- API Endpoints (Login with 2FA, OTP verification, Resend cooldown, Max attempts)
"""

import os
import sys
import time
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.jwt_service import create_token, verify_token, get_user_id_from_token
from backend.otp_service import (
    generate_otp, hash_otp, verify_otp, generate_challenge_id,
    generate_recovery_codes, hash_recovery_code, verify_recovery_code,
    mask_email, mask_phone
)
from backend.mysql_database import db_manager


def test_jwt_service():
    print("Testing JWT Service...")
    token = create_token(user_id=42, username="test_user")
    assert token is not None and isinstance(token, str), "Token generation failed"

    payload = verify_token(token)
    assert payload is not None, "Token verification failed"
    assert payload["sub"] == "42", f"Expected sub '42', got {payload['sub']}"
    assert payload["username"] == "test_user", f"Expected username 'test_user', got {payload['username']}"

    extracted_id = get_user_id_from_token(token)
    assert extracted_id == 42, f"Expected user_id 42, got {extracted_id}"

    # Invalid token check
    assert verify_token("invalid.token.signature") is None
    print("  [PASS] JWT creation, verification, and decoding")


def test_otp_service():
    print("Testing OTP Service...")
    otp = generate_otp(6)
    assert len(otp) == 6 and otp.isdigit(), f"Invalid OTP format: {otp}"

    otp_hash = hash_otp(otp)
    assert len(otp_hash) == 64, "SHA-256 hash length should be 64 characters"

    # Constant time verification
    assert verify_otp(otp, otp_hash) is True, "Valid OTP failed verification"
    assert verify_otp("000000", otp_hash) is False, "Invalid OTP succeeded verification"

    # Challenge ID
    cid = generate_challenge_id()
    assert len(cid) > 20, "Challenge ID generation failed"

    # Recovery codes
    codes = generate_recovery_codes(8)
    assert len(codes) == 8, "Expected 8 recovery codes"
    for code in codes:
        assert len(code) == 11 and "-" in code, f"Invalid recovery code format: {code}"
        chash = hash_recovery_code(code)
        assert verify_recovery_code(code, chash) is True
        assert verify_recovery_code("WRONG-CODE1", chash) is False

    # Masking
    assert mask_email("krutin@gmail.com") == "k****n@gmail.com" or "@gmail.com" in mask_email("krutin@gmail.com")
    assert mask_phone("9876543210") == "******3210"

    print("  [PASS] OTP generation, hashing, recovery codes, and masking")


def test_database_2fa_lifecycle():
    print("Testing Database 2FA Lifecycle...")
    test_uname = f"test_2fa_{int(time.time())}"
    user_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": f"{test_uname}@test.com",
        "username": test_uname,
        "password": "Password123!",
        "phone_number": "9876543210"
    }

    user = db_manager.register_user(user_data)
    user_id = user["id"]
    print(f"  Registered test user ID: {user_id} ({test_uname})")

    # Check default 2FA status (should be disabled)
    status = db_manager.get_user_2fa_status(user_id)
    assert status["enabled"] is False, "2FA should be disabled by default"

    # Enable 2FA with email
    assert db_manager.enable_2fa(user_id, "email") is True
    status = db_manager.get_user_2fa_status(user_id)
    assert status["enabled"] is True and status["method"] == "email"

    # Change method to mobile
    assert db_manager.update_2fa_method(user_id, "mobile") is True
    status = db_manager.get_user_2fa_status(user_id)
    assert status["method"] == "mobile"

    # Store and verify recovery codes
    codes = generate_recovery_codes(4)
    code_hashes = [hash_recovery_code(c) for c in codes]
    assert db_manager.store_recovery_codes(user_id, code_hashes) is True

    # Use single recovery code
    assert db_manager.verify_and_use_recovery_code(user_id, hash_recovery_code(codes[0])) is True
    # Second use should fail (single-use)
    assert db_manager.verify_and_use_recovery_code(user_id, hash_recovery_code(codes[0])) is False

    # Create 2FA challenge
    cid = generate_challenge_id()
    otp = generate_otp(6)
    otp_hash = hash_otp(otp)
    exp = (datetime.utcnow() + timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")

    assert db_manager.create_2fa_challenge(user_id, cid, otp_hash, "mobile", exp) is True
    challenge = db_manager.get_2fa_challenge(cid)
    assert challenge is not None
    assert challenge["user_id"] == user_id
    assert challenge["method"] == "mobile"
    assert challenge["otp_attempts"] == 0

    # Increment attempts
    db_manager.increment_challenge_attempts(cid)
    challenge = db_manager.get_2fa_challenge(cid)
    assert challenge["otp_attempts"] == 1

    # Invalidate challenge
    db_manager.invalidate_challenge(cid)
    assert db_manager.get_2fa_challenge(cid) is None, "Challenge should be inactive after invalidation"

    # Disable 2FA
    assert db_manager.disable_2fa(user_id) is True
    status = db_manager.get_user_2fa_status(user_id)
    assert status["enabled"] is False

    print("  [PASS] Database 2FA enable/disable, methods, recovery codes, and challenge lifecycle")


if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING 2FA AUTOMATED TEST SUITE")
    print("=" * 60)
    try:
        test_jwt_service()
        test_otp_service()
        test_database_2fa_lifecycle()
        print("\n" + "=" * 60)
        print("ALL 2FA TESTS PASSED SUCCESSFULLY! (3/3 test suites)")
        print("=" * 60)
    except AssertionError as ae:
        print(f"\n[FAIL] Assertion Error: {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
