"""
Email Service
=============
SMTP-based email OTP delivery for Two-Factor Authentication.

Reads all credentials from environment variables:
    SMTP_HOST       – SMTP server hostname (default: smtp.gmail.com)
    SMTP_PORT       – SMTP server port (default: 587)
    SMTP_USER       – SMTP login username / email
    SMTP_PASSWORD   – SMTP login password / app password
    SMTP_FROM_EMAIL – Sender email address (defaults to SMTP_USER)

If SMTP is not configured, falls back to console logging for development.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional


# ============================================================
# Automatic .env File Loader
# ============================================================
def _load_env_file():
    """Load key-value pairs from .env file into os.environ if present."""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(root_dir, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
        except Exception as e:
            print(f"Note: Could not load .env file: {e}")

_load_env_file()

# ============================================================
# Configuration
# ============================================================
def get_smtp_config():
    _load_env_file()
    user = os.environ.get("SMTP_USER", "").strip()
    pwd = os.environ.get("SMTP_PASSWORD", "").strip().replace(" ", "")
    return {
        "host": os.environ.get("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": user,
        "password": pwd,
        "from_email": os.environ.get("SMTP_FROM_EMAIL", user) or user,
    }


def _is_smtp_configured() -> bool:
    """Check whether SMTP credentials are available."""
    cfg = get_smtp_config()
    return bool(cfg["user"] and cfg["password"])


def _build_otp_email_html(otp_code: str) -> str:
    """Build a professional HTML email body for OTP delivery."""
    return f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f4f7f5;">
  <div style="max-width:480px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg, #3d6b4f, #2d5a3a); padding:32px 24px; text-align:center;">
      <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:800; letter-spacing:-0.02em;">
        🌿 ListenLeaf AI
      </h1>
      <p style="color:rgba(255,255,255,0.75); margin:6px 0 0 0; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase;">
        Two-Factor Authentication
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px 28px;">
      <p style="color:#2d3a2f; font-size:15px; margin:0 0 20px 0; line-height:1.6;">
        Your verification code is:
      </p>

      <div style="background:#f0f7f2; border:2px solid #3d6b4f; border-radius:12px; padding:20px; text-align:center; margin:0 0 24px 0;">
        <span style="font-family:'JetBrains Mono', monospace; font-size:36px; font-weight:800; color:#2d5a3a; letter-spacing:8px;">
          {otp_code}
        </span>
      </div>

      <p style="color:#5a6b5e; font-size:13px; margin:0 0 8px 0; line-height:1.5;">
        This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
      </p>
      <p style="color:#7a8b7e; font-size:12px; margin:0; line-height:1.5;">
        If you did not request this code, please ignore this email and secure your account.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f4f7f5; padding:16px 28px; text-align:center; border-top:1px solid #e8ede9;">
      <p style="color:#a0ada3; font-size:11px; margin:0;">
        ListenLeaf AI • Wildlife Bioacoustic Intelligence Platform
      </p>
    </div>
  </div>
</body>
</html>"""


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send an OTP verification email.

    Args:
        to_email: Recipient email address.
        otp_code: The plain-text OTP code.

    Returns:
        True if the email was sent (or logged) successfully.
    """
    print("\n" + "=" * 60)
    print("         🌿 LISTENLEAF 2FA VERIFICATION CODE 🌿         ")
    print("-" * 60)
    print(f"  Delivery Method : Email")
    print(f"  Recipient       : {to_email}")
    print(f"  OTP Code        : >>>  {otp_code}  <<<")
    print(f"  Valid Duration  : 5 Minutes")
    print("=" * 60 + "\n")

    cfg = get_smtp_config()
    if not _is_smtp_configured():
        print("  [DEV MODE] SMTP not configured. Use the OTP code printed above.")
        print("  To enable real Gmail delivery, add SMTP_USER and SMTP_PASSWORD in your .env file.")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your ListenLeaf AI Verification Code"
        msg["From"] = cfg["from_email"]
        msg["To"] = to_email

        # Plain text fallback
        text_body = (
            f"Your ListenLeaf AI verification code is: {otp_code}\n\n"
            f"This code expires in 5 minutes. Do not share it with anyone.\n\n"
            f"If you did not request this code, please ignore this email."
        )
        msg.attach(MIMEText(text_body, "plain"))

        # HTML body
        html_body = _build_otp_email_html(otp_code)
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(cfg["user"], cfg["password"])
            server.sendmail(cfg["from_email"], to_email, msg.as_string())

        print(f"  [EMAIL SENT] Real verification email delivered to: {to_email}")
        return True

    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] Failed to send OTP to {to_email}: {e}")
        print(f"  Check your SMTP_USER and SMTP_PASSWORD credentials in .env.")
        return False
