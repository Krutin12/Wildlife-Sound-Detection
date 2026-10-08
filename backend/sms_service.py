"""
SMS Service
===========
SMS OTP delivery with pluggable provider abstraction for Two-Factor Authentication.

Supported Providers:
    - ``console`` (default) — Logs the OTP to the server console for development.
    - ``twilio``            — Sends via Twilio REST API.

Environment Variables:
    SMS_PROVIDER          – Provider name: ``console`` or ``twilio`` (default: console)
    TWILIO_ACCOUNT_SID    – Twilio Account SID
    TWILIO_AUTH_TOKEN     – Twilio Auth Token
    TWILIO_FROM_NUMBER    – Twilio sender phone number (E.164 format)
"""

import os
from abc import ABC, abstractmethod
from typing import Optional


# ============================================================
# Abstract Provider
# ============================================================

class SMSProvider(ABC):
    """Base class for SMS providers."""

    @abstractmethod
    def send(self, to_number: str, message: str) -> bool:
        """
        Send an SMS message.

        Args:
            to_number: Recipient phone number.
            message: SMS text body.

        Returns:
            True on success, False on failure.
        """
        ...


# ============================================================
# Console Provider (Development)
# ============================================================

class ConsoleProvider(SMSProvider):
    """Development provider that logs SMS to the server console."""

    def send(self, to_number: str, message: str) -> bool:
        print(f"[SMS SERVICE – DEV MODE] To: {to_number}")
        print(f"  Message: {message}")
        print("  ⚠  SMS_PROVIDER=console. Set SMS_PROVIDER=twilio for production.")
        return True


# ============================================================
# Twilio Provider
# ============================================================

class TwilioProvider(SMSProvider):
    """Twilio REST API provider for production SMS delivery."""

    def __init__(self):
        self.account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
        self.auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
        self.from_number = os.environ.get("TWILIO_FROM_NUMBER", "")

        if not all([self.account_sid, self.auth_token, self.from_number]):
            print("[SMS SERVICE WARNING] Twilio credentials not fully configured.")

    def send(self, to_number: str, message: str) -> bool:
        if not all([self.account_sid, self.auth_token, self.from_number]):
            print("[SMS SERVICE ERROR] Twilio credentials missing.")
            return False

        try:
            import urllib.request
            import urllib.parse
            import base64

            url = (
                f"https://api.twilio.com/2010-04-01/Accounts/"
                f"{self.account_sid}/Messages.json"
            )

            # Ensure phone number has country code
            formatted_to = to_number.strip()
            if not formatted_to.startswith("+"):
                formatted_to = "+91" + formatted_to  # Default to India (+91)

            data = urllib.parse.urlencode({
                "To": formatted_to,
                "From": self.from_number,
                "Body": message,
            }).encode("utf-8")

            # Basic auth header
            credentials = base64.b64encode(
                f"{self.account_sid}:{self.auth_token}".encode()
            ).decode("utf-8")

            req = urllib.request.Request(url, data=data, method="POST")
            req.add_header("Authorization", f"Basic {credentials}")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")

            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201):
                    return True
                else:
                    print(f"[SMS SERVICE ERROR] Twilio returned status {resp.status}")
                    return False

        except Exception as e:
            print(f"[SMS SERVICE ERROR] Twilio send failed: {e}")
            return False


# ============================================================
# Provider Factory
# ============================================================

_PROVIDERS = {
    "console": ConsoleProvider,
    "twilio": TwilioProvider,
}

def _get_provider() -> SMSProvider:
    """Get the configured SMS provider instance."""
    provider_name = os.environ.get("SMS_PROVIDER", "console").lower().strip()
    provider_cls = _PROVIDERS.get(provider_name, ConsoleProvider)
    return provider_cls()


# ============================================================
# Public API
# ============================================================

def send_otp_sms(to_number: str, otp_code: str) -> bool:
    """
    Send an OTP verification SMS to the given phone number.

    Args:
        to_number: Recipient phone number.
        otp_code: The plain-text OTP code.

    Returns:
        True if the SMS was sent (or logged) successfully.
    """
    print("\n" + "=" * 60)
    print("         🌿 LISTENLEAF 2FA VERIFICATION CODE 🌿         ")
    print("-" * 60)
    print(f"  Delivery Method : SMS")
    print(f"  Recipient       : {to_number}")
    print(f"  OTP Code        : >>>  {otp_code}  <<<")
    print(f"  Valid Duration  : 5 Minutes")
    print("=" * 60 + "\n")

    message = (
        f"Your ListenLeaf AI verification code is: {otp_code}\n"
        f"Valid for 5 minutes. Do not share this code."
    )
    provider = _get_provider()
    return provider.send(to_number, message)
