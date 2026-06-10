import copy
import httpx

ORCHESTRATOR_URL = "http://localhost:8000/ingest"


async def send_request(request_dict: dict) -> bool:
    """Strip is_bot field and POST to orchestrator."""
    payload = copy.deepcopy(request_dict)
    payload.pop("is_bot", None)  # NEVER expose this to other services

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.post(ORCHESTRATOR_URL, json=payload)
            if response.status_code in (200, 201):
                return True
            print(f"[sender] Orchestrator returned {response.status_code}")
            return False
    except (httpx.ConnectError, httpx.TimeoutException):
        print(f"[sender] Orchestrator offline — logging locally")
        return False
    except Exception as e:
        print(f"[sender] Unexpected error: {e}")
        return False
