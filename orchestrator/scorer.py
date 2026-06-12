import random


def score_request(data: dict) -> float:
    """Compute a bot probability score between 0.0 and 1.0 based on behavioral data."""
    behavioral = data.get("behavioral", {})
    score = 0.0

    # 1. time_since_last_request_ms
    time_ms = behavioral.get("time_since_last_request_ms")
    if time_ms is not None:
        if time_ms < 150:
            score += 0.30
        elif 150 <= time_ms <= 500:
            score += 0.15

    # 2. requests_per_minute
    rpm = behavioral.get("requests_per_minute")
    if rpm is not None:
        if rpm > 50:
            score += 0.25
        elif 20 <= rpm <= 50:
            score += 0.10

    # 3. mouse_movement_score
    mouse = behavioral.get("mouse_movement_score")
    if mouse is not None:
        if mouse == 0.0:
            score += 0.20
        elif mouse < 0.3:
            score += 0.10

    # 4. typing_speed_cpm
    typing = behavioral.get("typing_speed_cpm")
    if typing is not None:
        if typing == 0.0:
            score += 0.15
        elif typing > 400:
            score += 0.10

    # 5. ip_request_count
    ip_count = behavioral.get("ip_request_count")
    if ip_count is not None:
        if ip_count > 20:
            score += 0.10
        elif ip_count > 10:
            score += 0.05

    # 6. device_fingerprint starts with "fp_bot_"
    fp = behavioral.get("device_fingerprint")
    if fp and fp.startswith("fp_bot_"):
        score += 0.10

    # 7. user_agent contains "python", "bot", or "curl"
    ua = behavioral.get("user_agent")
    if ua:
        ua_lower = ua.lower()
        if "python" in ua_lower or "bot" in ua_lower or "curl" in ua_lower:
            score += 0.10

    # Add noise
    score += random.uniform(-0.03, 0.03)

    # Cap 0.0 to 1.0
    score = max(0.0, min(1.0, score))

    # Return rounded to 3 decimals
    return round(score, 3)
