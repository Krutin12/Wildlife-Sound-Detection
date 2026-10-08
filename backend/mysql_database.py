"""
MySQL & Database Connection Handler
===================================
Manages database operations for the Animal Sound Identification System.
Supports MySQL database connection (with MySQL Workbench compatible schema)
and fallback SQLite database handling if MySQL server is not locally running.
"""

import hashlib
import json
import os
import secrets
import sqlite3
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

# Try importing MySQL client library
try:
    import pymysql
    PYMYSQL_AVAILABLE = True
except ImportError:
    PYMYSQL_AVAILABLE = False


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


class DatabaseManager:
    """
    Handles database operations for MySQL with fallback to SQLite.
    Persists prediction records and species metadata.
    """

    def __init__(self):
        _load_env_file()
        self.db_type = "mysql"
        self.mysql_config = {
            "host": os.environ.get("MYSQL_HOST", "localhost"),
            "port": int(os.environ.get("MYSQL_PORT", 3306)),
            "user": os.environ.get("MYSQL_USER", "root"),
            "password": os.environ.get("MYSQL_PASSWORD", "Rootpass@123"),
            "database": os.environ.get("MYSQL_DATABASE", "wildlife_db"),
            "charset": "utf8mb4",
            "autocommit": True,
            "connect_timeout": 3,
        }
        self.sqlite_path = config.DATABASE_PATH
        self._init_db()

    def _get_mysql_connection(self):
        """Try connecting to MySQL Workbench server."""
        if not PYMYSQL_AVAILABLE:
            return None

        passwords_to_try = [
            self.mysql_config["password"],
            "Rootpass@123",
            "root",
            "root123",
            "password",
            "123456",
            "1234",
            "",
        ]
        
        # Deduplicate preserving order
        seen = set()
        passwords = [p for p in passwords_to_try if not (p in seen or seen.add(p))]

        for pwd in passwords:
            cfg = self.mysql_config.copy()
            cfg["password"] = pwd
            try:
                conn = pymysql.connect(**cfg)
                self.mysql_config["password"] = pwd
                return conn
            except Exception:
                try:
                    # Try connecting without database to create it if missing
                    cfg_no_db = cfg.copy()
                    db_name = cfg_no_db.pop("database")
                    conn = pymysql.connect(**cfg_no_db)
                    cursor = conn.cursor()
                    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                    conn.select_db(db_name)
                    self.mysql_config["password"] = pwd
                    return conn
                except Exception:
                    continue
        return None

    def _init_db(self):
        """Initialize tables in MySQL Workbench or SQLite."""
        mysql_conn = self._get_mysql_connection()
        if mysql_conn:
            try:
                self.db_type = "mysql"
                cursor = mysql_conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS species_info (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        primary_label VARCHAR(50) NOT NULL UNIQUE,
                        common_name VARCHAR(100) NOT NULL,
                        scientific_name VARCHAR(100) NOT NULL,
                        animal_class VARCHAR(50) DEFAULT 'Unknown',
                        habitat TEXT,
                        diet TEXT,
                        geographic_distribution TEXT,
                        conservation_status VARCHAR(50) DEFAULT 'Least Concern',
                        interesting_facts TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS prediction_history (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        filename VARCHAR(255) NOT NULL,
                        predicted_label VARCHAR(50) NOT NULL,
                        common_name VARCHAR(100) NOT NULL,
                        scientific_name VARCHAR(100) NOT NULL,
                        confidence FLOAT NOT NULL,
                        animal_class VARCHAR(50) DEFAULT 'Unknown',
                        habitat TEXT,
                        diet TEXT,
                        distribution TEXT,
                        conservation_status VARCHAR(50) DEFAULT 'N/A',
                        interesting_facts TEXT,
                        top_k_json TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        first_name VARCHAR(100) NOT NULL,
                        last_name VARCHAR(100) NOT NULL,
                        email VARCHAR(150) NOT NULL,
                        username VARCHAR(100) NOT NULL UNIQUE,
                        password_hash VARCHAR(255) NOT NULL,
                        salt VARCHAR(64) NOT NULL,
                        phone_number VARCHAR(30) NOT NULL,
                        two_factor_enabled TINYINT(1) DEFAULT 0,
                        two_factor_method VARCHAR(10) DEFAULT 'email',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # -- 2FA: Challenges table (OTP state) --
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS two_factor_challenges (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        challenge_id VARCHAR(64) NOT NULL UNIQUE,
                        otp_hash VARCHAR(255) NOT NULL,
                        otp_expires_at DATETIME NOT NULL,
                        otp_attempts INT DEFAULT 0,
                        otp_last_sent_at DATETIME,
                        method VARCHAR(10) NOT NULL,
                        is_used TINYINT(1) DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_challenge_id (challenge_id),
                        INDEX idx_user_id (user_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # -- 2FA: Recovery codes table --
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS recovery_codes (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        code_hash VARCHAR(255) NOT NULL,
                        is_used TINYINT(1) DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_rc_user_id (user_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                # Auto-migrate existing MySQL users table columns if missing
                try:
                    cursor.execute("SHOW COLUMNS FROM users LIKE 'two_factor_enabled'")
                    if not cursor.fetchone():
                        cursor.execute("ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0")
                    cursor.execute("SHOW COLUMNS FROM users LIKE 'two_factor_method'")
                    if not cursor.fetchone():
                        cursor.execute("ALTER TABLE users ADD COLUMN two_factor_method VARCHAR(10) DEFAULT 'email'")
                except Exception as mig_err:
                    print(f"MySQL column migration note: {mig_err}")

                mysql_conn.close()
                print("MySQL Workbench Database 'wildlife_db' successfully connected and initialized!")
                return
            except Exception as e:
                print(f"MySQL initialization warning: {e}")

        # Fallback to SQLite
        self.db_type = "sqlite"
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
        conn = sqlite3.connect(self.sqlite_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                two_factor_enabled INTEGER DEFAULT 0,
                two_factor_method TEXT DEFAULT 'email',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS two_factor_challenges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                challenge_id TEXT NOT NULL UNIQUE,
                otp_hash TEXT NOT NULL,
                otp_expires_at TEXT NOT NULL,
                otp_attempts INTEGER DEFAULT 0,
                otp_last_sent_at TEXT,
                method TEXT NOT NULL,
                is_used INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS recovery_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                code_hash TEXT NOT NULL,
                is_used INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS species_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                primary_label TEXT UNIQUE,
                common_name TEXT,
                scientific_name TEXT,
                animal_class TEXT,
                habitat TEXT,
                diet TEXT,
                geographic_distribution TEXT,
                conservation_status TEXT,
                interesting_facts TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS prediction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                predicted_label TEXT,
                common_name TEXT,
                scientific_name TEXT,
                confidence REAL,
                animal_class TEXT,
                habitat TEXT,
                diet TEXT,
                distribution TEXT,
                conservation_status TEXT,
                interesting_facts TEXT,
                top_k_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Auto-migrate existing SQLite users table columns if missing
        try:
            cursor.execute("PRAGMA table_info(users)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            if "two_factor_enabled" not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0")
            if "two_factor_method" not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN two_factor_method TEXT DEFAULT 'email'")
        except Exception as mig_err:
            print(f"SQLite column migration note: {mig_err}")

        conn.commit()
        conn.close()
        print(f"SQLite Database successfully connected and initialized at: {self.sqlite_path}")

    def save_prediction(self, prediction_data: Dict[str, Any], filename: str) -> Optional[int]:
        """Save a prediction result into MySQL / SQLite database."""
        top_k_str = json.dumps(prediction_data.get("top_k_predictions", []))
        
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    query = """
                        INSERT INTO prediction_history
                        (filename, predicted_label, common_name, scientific_name, confidence,
                         animal_class, habitat, diet, distribution, conservation_status,
                         interesting_facts, top_k_json)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(query, (
                        filename,
                        prediction_data.get("predicted_label", "Unknown"),
                        prediction_data.get("common_name", "Unknown"),
                        prediction_data.get("scientific_name", "N/A"),
                        float(prediction_data.get("confidence", 0.0)),
                        prediction_data.get("animal_class", "N/A"),
                        prediction_data.get("habitat", "N/A"),
                        prediction_data.get("diet", "N/A"),
                        prediction_data.get("distribution", "N/A"),
                        prediction_data.get("conservation_status", "N/A"),
                        prediction_data.get("interesting_facts", "N/A"),
                        top_k_str,
                    ))
                    inserted_id = cursor.lastrowid
                    conn.close()
                    return inserted_id
                except Exception as e:
                    print(f"Error saving prediction to MySQL: {e}")

        # SQLite fallback
        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            query = """
                INSERT INTO prediction_history
                (filename, predicted_label, common_name, scientific_name, confidence,
                 animal_class, habitat, diet, distribution, conservation_status,
                 interesting_facts, top_k_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            cursor.execute(query, (
                filename,
                prediction_data.get("predicted_label", "Unknown"),
                prediction_data.get("common_name", "Unknown"),
                prediction_data.get("scientific_name", "N/A"),
                float(prediction_data.get("confidence", 0.0)),
                prediction_data.get("animal_class", "N/A"),
                prediction_data.get("habitat", "N/A"),
                prediction_data.get("diet", "N/A"),
                prediction_data.get("distribution", "N/A"),
                prediction_data.get("conservation_status", "N/A"),
                prediction_data.get("interesting_facts", "N/A"),
                top_k_str,
            ))
            conn.commit()
            inserted_id = cursor.lastrowid
            conn.close()
            return inserted_id
        except Exception as e:
            print(f"Error saving prediction to SQLite: {e}")
            return None

    def get_prediction_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent prediction history from database."""
        history = []
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor(pymysql.cursors.DictCursor)
                    cursor.execute("""
                        SELECT * FROM prediction_history 
                        ORDER BY created_at DESC LIMIT %s
                    """, (limit,))
                    rows = cursor.fetchall()
                    conn.close()
                    for r in rows:
                        if isinstance(r.get("top_k_json"), str):
                            try:
                                r["top_k_predictions"] = json.loads(r["top_k_json"])
                            except Exception:
                                r["top_k_predictions"] = []
                        elif isinstance(r.get("top_k_json"), (list, dict)):
                            r["top_k_predictions"] = r["top_k_json"]
                        if isinstance(r.get("created_at"), datetime):
                            r["created_at"] = r["created_at"].isoformat()
                        history.append(r)
                    return history
                except Exception as e:
                    print(f"Error reading MySQL history: {e}")

        # SQLite fallback
        try:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM prediction_history 
                ORDER BY created_at DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            conn.close()
            for r in rows:
                item = dict(r)
                if item.get("top_k_json"):
                    try:
                        item["top_k_predictions"] = json.loads(item["top_k_json"])
                    except Exception:
                        item["top_k_predictions"] = []
                history.append(item)
        except Exception as e:
            print(f"Error reading SQLite history: {e}")

        return history

    def delete_prediction(self, prediction_id: int) -> bool:
        """Delete a prediction by ID."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute("DELETE FROM prediction_history WHERE id = %s", (prediction_id,))
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error deleting MySQL prediction: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM prediction_history WHERE id = ?", (prediction_id,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error deleting SQLite prediction: {e}")
            return False

    def clear_all_history(self) -> bool:
        """Clear all records from prediction history."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute("TRUNCATE TABLE prediction_history;")
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error clearing MySQL history: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM prediction_history;")
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error clearing SQLite history: {e}")
            return False

    def get_all_species(self) -> List[Dict[str, Any]]:
        """Retrieve species metadata library."""
        species = []
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor(pymysql.cursors.DictCursor)
                    cursor.execute("SELECT * FROM species_info ORDER BY common_name ASC")
                    rows = cursor.fetchall()
                    conn.close()
                    return list(rows)
                except Exception as e:
                    print(f"Error fetching MySQL species: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM species_info ORDER BY common_name ASC")
            rows = cursor.fetchall()
            conn.close()
            return [dict(r) for r in rows]
        except Exception as e:
            print(f"Error fetching SQLite species: {e}")
            return species

    def get_db_status(self) -> Dict[str, Any]:
        """Return status info of database connection."""
        mysql_active = False
        if PYMYSQL_AVAILABLE and self._get_mysql_connection():
            mysql_active = True

        history_count = len(self.get_prediction_history(limit=1000))
        species_count = len(self.get_all_species())

        return {
            "active_db": self.db_type,
            "mysql_available": PYMYSQL_AVAILABLE,
            "mysql_connected": mysql_active,
            "sqlite_path": self.sqlite_path,
            "history_count": history_count,
            "species_count": species_count,
        }

    # ============================================================
    # User Authentication & Encrypted Passwords
    # ============================================================
    def _hash_password(self, password: str, salt: Optional[str] = None) -> tuple:
        """Hash password using salted PBKDF2-HMAC-SHA256 encryption."""
        if not salt:
            salt = secrets.token_hex(16)
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            1000
        )
        return key.hex(), salt

    def check_username_exists(self, username: str) -> bool:
        """Check if username already exists in database."""
        uname = username.strip().lower()
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute("SELECT id FROM users WHERE LOWER(username) = %s", (uname,))
                    row = cursor.fetchone()
                    conn.close()
                    return row is not None
                except Exception as e:
                    print(f"Error checking MySQL username: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE LOWER(username) = ?", (uname,))
            row = cursor.fetchone()
            conn.close()
            return row is not None
        except Exception as e:
            print(f"Error checking SQLite username: {e}")
            return False

    def check_email_exists(self, email: str) -> bool:
        """Check if email address already exists in database."""
        clean_email = email.strip().lower()
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute("SELECT id FROM users WHERE LOWER(email) = %s", (clean_email,))
                    row = cursor.fetchone()
                    conn.close()
                    return row is not None
                except Exception as e:
                    print(f"Error checking MySQL email: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (clean_email,))
            row = cursor.fetchone()
            conn.close()
            return row is not None
        except Exception as e:
            print(f"Error checking SQLite email: {e}")
            return False

    def register_user(self, user_data: Dict[str, str]) -> Dict[str, Any]:
        """Register a new user with salted password encryption."""
        username = user_data["username"].strip()
        email = user_data["email"].strip().lower()

        if self.check_username_exists(username):
            raise ValueError("Username already taken")
        if self.check_email_exists(email):
            raise ValueError("Email address already registered")

        pwd_hash, salt = self._hash_password(user_data["password"])
        fname = user_data["first_name"].strip()
        lname = user_data["last_name"].strip()
        email = user_data["email"].strip().lower()
        phone = user_data["phone_number"].strip()

        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor(pymysql.cursors.DictCursor)
                    cursor.execute("""
                        INSERT INTO users (first_name, last_name, email, username, password_hash, salt, phone_number)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (fname, lname, email, username, pwd_hash, salt, phone))
                    user_id = cursor.lastrowid
                    cursor.execute("SELECT id, first_name, last_name, email, username, phone_number, created_at FROM users WHERE id = %s", (user_id,))
                    res = cursor.fetchone()
                    conn.close()
                    if res and "created_at" in res and res["created_at"]:
                        res["created_at"] = str(res["created_at"])
                    return res
                except Exception as e:
                    print(f"Error inserting MySQL user: {e}")

        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (first_name, last_name, email, username, password_hash, salt, phone_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (fname, lname, email, username, pwd_hash, salt, phone))
        conn.commit()
        user_id = cursor.lastrowid
        cursor.execute("SELECT id, first_name, last_name, email, username, phone_number, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        res = dict(row)
        if res.get("created_at"):
            res["created_at"] = str(res["created_at"])
        return res

    def verify_user_login(self, username: str, plain_password: str) -> Optional[Dict[str, Any]]:
        """Verify user login credentials against encrypted password hash."""
        uname = username.strip().lower()
        user_row = None

        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor(pymysql.cursors.DictCursor)
                    cursor.execute("SELECT * FROM users WHERE LOWER(username) = %s", (uname,))
                    user_row = cursor.fetchone()
                    conn.close()
                except Exception as e:
                    print(f"Error checking MySQL user login: {e}")

        if not user_row:
            try:
                conn = sqlite3.connect(self.sqlite_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE LOWER(username) = ?", (uname,))
                row = cursor.fetchone()
                conn.close()
                if row:
                    user_row = dict(row)
            except Exception as e:
                print(f"Error checking SQLite user login: {e}")

        if not user_row:
            return None

        # Verify password
        calc_hash, _ = self._hash_password(plain_password, salt=user_row["salt"])
        if secrets.compare_digest(calc_hash, user_row["password_hash"]):
            return {
                "id": user_row["id"],
                "first_name": user_row["first_name"],
                "last_name": user_row["last_name"],
                "email": user_row["email"],
                "username": user_row["username"],
                "phone_number": user_row["phone_number"],
                "created_at": str(user_row.get("created_at", "")),
            }
        return None

    # ============================================================
    # Two-Factor Authentication Database Methods
    # ============================================================

    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Fetch a user record by ID (excludes password_hash and salt)."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor(pymysql.cursors.DictCursor)
                    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        return {
                            "id": row["id"],
                            "first_name": row.get("first_name", ""),
                            "last_name": row.get("last_name", ""),
                            "email": row.get("email", ""),
                            "username": row.get("username", ""),
                            "phone_number": row.get("phone_number", ""),
                            "two_factor_enabled": bool(row.get("two_factor_enabled", 0)),
                            "two_factor_method": row.get("two_factor_method", "email") or "email",
                            "created_at": str(row.get("created_at", "")),
                        }
                except Exception as e:
                    print(f"Error fetching MySQL user by id: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                r = dict(row)
                return {
                    "id": r["id"],
                    "first_name": r.get("first_name", ""),
                    "last_name": r.get("last_name", ""),
                    "email": r.get("email", ""),
                    "username": r.get("username", ""),
                    "phone_number": r.get("phone_number", ""),
                    "two_factor_enabled": bool(r.get("two_factor_enabled", 0)),
                    "two_factor_method": r.get("two_factor_method", "email") or "email",
                    "created_at": str(r.get("created_at", "")),
                }
        except Exception as e:
            print(f"Error fetching SQLite user by id: {e}")
        return None

    def get_user_2fa_status(self, user_id: int) -> Dict[str, Any]:
        """Get the 2FA status for a user."""
        user = self.get_user_by_id(user_id)
        if not user:
            return {"enabled": False}
        return {
            "enabled": bool(user.get("two_factor_enabled", 0)),
            "method": user.get("two_factor_method", "email"),
            "email": user.get("email", ""),
            "phone_number": user.get("phone_number", ""),
        }

    def enable_2fa(self, user_id: int, method: str = "email") -> bool:
        """Enable 2FA for a user."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE users SET two_factor_enabled = 1, two_factor_method = %s WHERE id = %s",
                        (method, user_id)
                    )
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error enabling MySQL 2FA: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET two_factor_enabled = 1, two_factor_method = ? WHERE id = ?",
                (method, user_id)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error enabling SQLite 2FA: {e}")
            return False

    def disable_2fa(self, user_id: int) -> bool:
        """Disable 2FA for a user."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE users SET two_factor_enabled = 0 WHERE id = %s",
                        (user_id,)
                    )
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error disabling MySQL 2FA: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET two_factor_enabled = 0 WHERE id = ?",
                (user_id,)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error disabling SQLite 2FA: {e}")
            return False

    def update_2fa_method(self, user_id: int, method: str) -> bool:
        """Change the 2FA verification method for a user."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE users SET two_factor_method = %s WHERE id = %s",
                        (method, user_id)
                    )
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error updating MySQL 2FA method: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET two_factor_method = ? WHERE id = ?",
                (method, user_id)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating SQLite 2FA method: {e}")
            return False

    def create_2fa_challenge(self, user_id: int, challenge_id: str,
                             otp_hash: str, method: str, expires_at: str) -> bool:
        """Create a new 2FA challenge (invalidates any previous active challenges for this user)."""
        # Invalidate previous challenges for this user first
        self._invalidate_user_challenges(user_id)

        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "INSERT INTO two_factor_challenges "
                        "(user_id, challenge_id, otp_hash, otp_expires_at, otp_last_sent_at, method) "
                        "VALUES (%s, %s, %s, %s, NOW(), %s)",
                        (user_id, challenge_id, otp_hash, expires_at, method)
                    )
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error creating MySQL 2FA challenge: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO two_factor_challenges "
                "(user_id, challenge_id, otp_hash, otp_expires_at, otp_last_sent_at, method) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, challenge_id, otp_hash, expires_at, now, method)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating SQLite 2FA challenge: {e}")
            return False

    def _invalidate_user_challenges(self, user_id: int):
        """Mark all active challenges for a user as used."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE two_factor_challenges SET is_used = 1 WHERE user_id = %s AND is_used = 0",
                        (user_id,)
                    )
                    conn.close()
                except Exception as e:
                    print(f"Error invalidating MySQL challenges: {e}")
                return

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE two_factor_challenges SET is_used = 1 WHERE user_id = ? AND is_used = 0",
                (user_id,)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error invalidating SQLite challenges: {e}")

    def get_2fa_challenge(self, challenge_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve an active (non-used) 2FA challenge by its ID."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor(pymysql.cursors.DictCursor)
                    cursor.execute(
                        "SELECT * FROM two_factor_challenges "
                        "WHERE challenge_id = %s AND is_used = 0",
                        (challenge_id,)
                    )
                    row = cursor.fetchone()
                    conn.close()
                    if row:
                        for k in ("otp_expires_at", "otp_last_sent_at", "created_at"):
                            if isinstance(row.get(k), datetime):
                                row[k] = row[k].strftime("%Y-%m-%d %H:%M:%S")
                    return row
                except Exception as e:
                    print(f"Error fetching MySQL 2FA challenge: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM two_factor_challenges "
                "WHERE challenge_id = ? AND is_used = 0",
                (challenge_id,)
            )
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None
        except Exception as e:
            print(f"Error fetching SQLite 2FA challenge: {e}")
            return None

    def increment_challenge_attempts(self, challenge_id: str) -> bool:
        """Increment the OTP attempt counter for a challenge."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE two_factor_challenges SET otp_attempts = otp_attempts + 1 "
                        "WHERE challenge_id = %s AND is_used = 0",
                        (challenge_id,)
                    )
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error incrementing MySQL challenge attempts: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE two_factor_challenges SET otp_attempts = otp_attempts + 1 "
                "WHERE challenge_id = ? AND is_used = 0",
                (challenge_id,)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error incrementing SQLite challenge attempts: {e}")
            return False

    def invalidate_challenge(self, challenge_id: str) -> bool:
        """Mark a challenge as used (invalidated)."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE two_factor_challenges SET is_used = 1 WHERE challenge_id = %s",
                        (challenge_id,)
                    )
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error invalidating MySQL challenge: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE two_factor_challenges SET is_used = 1 WHERE challenge_id = ?",
                (challenge_id,)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error invalidating SQLite challenge: {e}")
            return False

    def update_challenge_otp(self, challenge_id: str, new_otp_hash: str, new_expires_at: str) -> bool:
        """Update OTP hash, expiry, reset attempts, and set last-sent time for resend."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE two_factor_challenges "
                        "SET otp_hash = %s, otp_expires_at = %s, otp_attempts = 0, otp_last_sent_at = NOW() "
                        "WHERE challenge_id = %s AND is_used = 0",
                        (new_otp_hash, new_expires_at, challenge_id)
                    )
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error updating MySQL challenge OTP: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "UPDATE two_factor_challenges "
                "SET otp_hash = ?, otp_expires_at = ?, otp_attempts = 0, otp_last_sent_at = ? "
                "WHERE challenge_id = ? AND is_used = 0",
                (new_otp_hash, new_expires_at, now, challenge_id)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating SQLite challenge OTP: {e}")
            return False

    # -- Recovery Codes --

    def store_recovery_codes(self, user_id: int, code_hashes: list) -> bool:
        """Store hashed recovery codes for a user (deletes old ones first)."""
        self.delete_recovery_codes(user_id)

        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    for ch in code_hashes:
                        cursor.execute(
                            "INSERT INTO recovery_codes (user_id, code_hash) VALUES (%s, %s)",
                            (user_id, ch)
                        )
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error storing MySQL recovery codes: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            for ch in code_hashes:
                cursor.execute(
                    "INSERT INTO recovery_codes (user_id, code_hash) VALUES (?, ?)",
                    (user_id, ch)
                )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error storing SQLite recovery codes: {e}")
            return False

    def verify_and_use_recovery_code(self, user_id: int, code_hash: str) -> bool:
        """Check if an unused recovery code matches, mark it as used."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor(pymysql.cursors.DictCursor)
                    cursor.execute(
                        "SELECT id, code_hash FROM recovery_codes "
                        "WHERE user_id = %s AND is_used = 0",
                        (user_id,)
                    )
                    rows = cursor.fetchall()
                    import hmac as _hmac
                    for row in rows:
                        if _hmac.compare_digest(row["code_hash"], code_hash):
                            cursor.execute(
                                "UPDATE recovery_codes SET is_used = 1 WHERE id = %s",
                                (row["id"],)
                            )
                            conn.close()
                            return True
                    conn.close()
                    return False
                except Exception as e:
                    print(f"Error verifying MySQL recovery code: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, code_hash FROM recovery_codes "
                "WHERE user_id = ? AND is_used = 0",
                (user_id,)
            )
            rows = cursor.fetchall()
            import hmac as _hmac
            for row in rows:
                if _hmac.compare_digest(row["code_hash"], code_hash):
                    cursor.execute(
                        "UPDATE recovery_codes SET is_used = 1 WHERE id = ?",
                        (row["id"],)
                    )
                    conn.commit()
                    conn.close()
                    return True
            conn.close()
            return False
        except Exception as e:
            print(f"Error verifying SQLite recovery code: {e}")
            return False

    def delete_recovery_codes(self, user_id: int) -> bool:
        """Delete all recovery codes for a user."""
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "DELETE FROM recovery_codes WHERE user_id = %s",
                        (user_id,)
                    )
                    conn.close()
                    return True
                except Exception as e:
                    print(f"Error deleting MySQL recovery codes: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM recovery_codes WHERE user_id = ?",
                (user_id,)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error deleting SQLite recovery codes: {e}")
            return False

    def get_full_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Fetch full user record including password_hash, salt, and 2FA fields."""
        uname = username.strip().lower()
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor(pymysql.cursors.DictCursor)
                    cursor.execute("SELECT * FROM users WHERE LOWER(username) = %s", (uname,))
                    row = cursor.fetchone()
                    conn.close()
                    return row
                except Exception as e:
                    print(f"Error fetching MySQL full user: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE LOWER(username) = ?", (uname,))
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None
        except Exception as e:
            print(f"Error fetching SQLite full user: {e}")
            return None

    def update_user_profile(self, user_id: int, first_name: str, last_name: str, email: str, phone_number: str) -> Optional[Dict[str, Any]]:
        """Update user profile information with uniqueness checks."""
        clean_email = email.strip().lower()
        fname = first_name.strip()
        lname = last_name.strip()
        phone = phone_number.strip()

        # Check if email is taken by someone else
        if self.db_type == "mysql":
            conn = self._get_mysql_connection()
            if conn:
                try:
                    cursor = conn.cursor(pymysql.cursors.DictCursor)
                    cursor.execute("SELECT id FROM users WHERE LOWER(email) = %s AND id != %s", (clean_email, user_id))
                    if cursor.fetchone():
                        conn.close()
                        raise ValueError("Email is already in use by another account.")
                    cursor.execute(
                        "UPDATE users SET first_name = %s, last_name = %s, email = %s, phone_number = %s WHERE id = %s",
                        (fname, lname, clean_email, phone, user_id)
                    )
                    conn.close()
                    return self.get_user_by_id(user_id)
                except ValueError:
                    raise
                except Exception as e:
                    print(f"Error updating MySQL user profile: {e}")

        try:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE LOWER(email) = ? AND id != ?", (clean_email, user_id))
            if cursor.fetchone():
                conn.close()
                raise ValueError("Email is already in use by another account.")
            cursor.execute(
                "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE id = ?",
                (fname, lname, clean_email, phone, user_id)
            )
            conn.commit()
            conn.close()
            return self.get_user_by_id(user_id)
        except ValueError:
            raise
        except Exception as e:
            print(f"Error updating SQLite user profile: {e}")
            return None


db_manager = DatabaseManager()

