import copy
import httpx

SCORER_URL = "http://localhost:8002/score"


async def send_request(request_dict: dict) -> bool:
    """Strip is_bot field and POST to scorer."""
    payload = copy.deepcopy(request_dict)
    payload.pop("is_bot", None)  # NEVER expose this to other services

    # Wrap to match scorer's ScoreRequest schema
    scorer_payload = {
        "user_id": payload.get("user_id", "USR_UNKNOWN"),
        "behavioral": payload,
    }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.post(SCORER_URL, json=scorer_payload)
            if response.status_code in (200, 201):
                return response.json()        # return dict for WebSocket broadcast
            print(f"[sender] Scorer returned {response.status_code}")
            return None
    except (httpx.ConnectError, httpx.TimeoutException):
        print(f"[sender] Scorer offline — logging locally")
        return None
    except Exception as e:
        print(f"[sender] Unexpected error: {e}")
        return None

