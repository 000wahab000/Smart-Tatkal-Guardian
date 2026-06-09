import uuid
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker("en_IN")

STATIONS = ["MUMBAI", "DELHI", "PUNE", "JAIPUR", "AHMEDABAD", "CHENNAI", "KOLKATA", "HYDERABAD"]
TRAINS = ["12951", "12002", "12301", "22221", "12909", "12137"]

BOT_FINGERPRINTS = ["fp_bot_001", "fp_bot_002", "fp_bot_003", "fp_bot_004", "fp_bot_005"]
BOT_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124",
    "python-requests/2.28.0",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
]
BOT_IPS = [
    "103.21.45.12", "103.21.45.13", "103.21.45.14", "103.21.45.15",
    "103.21.45.16", "45.67.89.100", "45.67.89.101", "45.67.89.102",
    "192.168.10.50", "192.168.10.51",
]


def _random_date() -> str:
    days_ahead = random.randint(7, 30)
    return (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")


def _random_stations():
    src = random.choice(STATIONS)
    dst = random.choice([s for s in STATIONS if s != src])
    return src, dst


def generate_bot_profile() -> dict:
    src, dst = _random_stations()
    return {
        "request_id": str(uuid.uuid4()),
        "timestamp": datetime.now().timestamp(),
        "user_id": "USR_" + "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=4)),
        "session_id": "SES_" + "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=4)),
        "train_id": random.choice(TRAINS),
        "from_station": src,
        "to_station": dst,
        "date": _random_date(),
        "is_bot": True,
        "behavioral": {
            "time_since_last_request_ms": round(random.uniform(50, 200), 2),
            "requests_per_minute": round(random.uniform(40, 80), 2),
            "device_fingerprint": random.choice(BOT_FINGERPRINTS),
            "user_agent": random.choice(BOT_USER_AGENTS),
            "typing_speed_cpm": 0.0,
            "mouse_movement_score": 0.0,
            "ip_address": random.choice(BOT_IPS),
            "ip_request_count": random.randint(15, 50),
        },
    }


def generate_human_profile() -> dict:
    src, dst = _random_stations()
    return {
        "request_id": str(uuid.uuid4()),
        "timestamp": datetime.now().timestamp(),
        "user_id": "USR_" + "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=4)),
        "session_id": "SES_" + "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=4)),
        "train_id": random.choice(TRAINS),
        "from_station": src,
        "to_station": dst,
        "date": _random_date(),
        "is_bot": False,
        "behavioral": {
            "time_since_last_request_ms": round(random.uniform(3000, 15000), 2),
            "requests_per_minute": round(random.uniform(2, 8), 2),
            "device_fingerprint": str(uuid.uuid4()),
            "user_agent": fake.user_agent(),
            "typing_speed_cpm": round(random.uniform(180, 320), 2),
            "mouse_movement_score": round(random.uniform(0.6, 1.0), 3),
            "ip_address": fake.ipv4(),
            "ip_request_count": random.randint(1, 3),
        },
    }
