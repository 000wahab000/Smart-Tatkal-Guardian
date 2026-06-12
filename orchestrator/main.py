import asyncio
from collections import deque
from datetime import datetime
import os
import uuid

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from blacklist import maybe_blacklist, is_blacklisted, get_blacklist, clear_blacklist
from scorer import score_request

app = FastAPI(title="Smart Tatkal Guardian — Orchestrator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
async def get_landing():
    """Serve the premium landing page from the root directory."""
    path = os.path.join(os.path.dirname(__file__), "..", "landing.html")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Smart Tatkal Guardian — Orchestrator</h1><p>landing.html not found</p>", status_code=404)

# In-memory states
events = deque(maxlen=500)
stats = {
    "total": 0,
    "allowed": 0,
    "passed": 0,  # alias
    "honey": 0,
    "block": 0,
    "blocked": 0,  # alias
    "captcha": 0
}
connected_clients = set()

# Fair queue for genuine users
import time as _time
fair_queue: list[dict] = []          # list of {user_id, queued_at, priority}
QUEUE_WINDOW_SECONDS = 1800          # 30-minute Tatkal window
QUEUE_THROUGHPUT_PER_SEC = 2         # approx genuine requests processed per second


async def broadcast(data: dict):
    """Send JSON payload to all connected WebSocket clients."""
    disconnected = set()
    for client in list(connected_clients):
        try:
            await client.send_json(data)
        except Exception:
            disconnected.add(client)
    for client in disconnected:
        connected_clients.discard(client)


def assign_queue_slot(user_id: str, priority_score: int) -> dict:
    """Assign a queue position to a genuine user and return slot info."""
    global fair_queue
    # Remove stale entries older than 30 minutes
    now = _time.time()
    fair_queue = [e for e in fair_queue if now - e["queued_at"] < QUEUE_WINDOW_SECONDS]
    # Add this user
    slot = {
        "user_id": user_id,
        "queued_at": now,
        "priority": priority_score
    }
    fair_queue.append(slot)
    # Sort descending by priority so high-priority users are counted first
    fair_queue.sort(key=lambda x: x["priority"], reverse=True)
    # Find their position (1-indexed)
    position = next((i + 1 for i, e in enumerate(fair_queue) if e["user_id"] == user_id), len(fair_queue))
    # Estimate wait time based on position and throughput
    wait_seconds = max(0, (position - 1) / max(QUEUE_THROUGHPUT_PER_SEC, 1))
    if wait_seconds < 60:
        wait_str = f"~{int(wait_seconds)}s"
    else:
        wait_str = f"~{int(wait_seconds // 60)}m {int(wait_seconds % 60)}s"
    return {
        "queue_position": position,
        "estimated_wait": wait_str,
        "priority_score": priority_score
    }


@app.post("/ingest")
async def ingest(request: Request):
    data = await request.json()
    score_val = score_request(data)
    user_id = data.get("user_id")

    # Decision logic
    is_bot = is_blacklisted(user_id)
    _queue_info = None
    if score_val > 0.80 or (score_val >= 0.75 and is_bot):
        action = "BLOCK"
        action_ui = "BLOCK"
    elif score_val >= 0.65:
        action = "HONEYPOT"
        action_ui = "HONEY"
        maybe_blacklist(user_id)
    elif score_val >= 0.50:
        action = "CAPTCHA"
        action_ui = "CAPTCHA"
    else:
        action = "ALLOW"
        action_ui = "ALLOW"
        # Compute priority: invert the bot score so lower bot score = higher priority
        _priority = max(0, 100 - int(score_val * 100))
        _queue_info = assign_queue_slot(user_id, _priority)

    # Build flags
    flags = []
    behavioral = data.get("behavioral", {})
    if behavioral.get("time_since_last_request_ms", 9999) < 150:
        flags.append("RAPID_FIRE")
    if behavioral.get("ip_request_count", 0) > 10:
        flags.append("SHARED_IP")
    if behavioral.get("mouse_movement_score") == 0.0:
        flags.append("NO_MOUSE")
    if behavioral.get("typing_speed_cpm") == 0.0:
        flags.append("PASTE_INPUT")
    ua = behavioral.get("user_agent", "")
    if ua:
        ua_lower = ua.lower()
        if "python" in ua_lower or "bot" in ua_lower or "curl" in ua_lower:
            flags.append("BOT_UA")

    # Format timestamp to HH:MM:SS.SS
    ts_val = data.get("timestamp") or datetime.now().timestamp()
    dt = datetime.fromtimestamp(ts_val)
    timestamp_str = dt.strftime("%H:%M:%S.%f")[:-4]

    # Event payload matching UI expectations (LiveRequest schema)
    event = {
        "id": data.get("request_id") or str(uuid.uuid4())[:8],
        "timestamp": timestamp_str,
        "type": action_ui,
        "user_id": user_id,
        "train_id": data.get("train_id", ""),
        "route": f"{data.get('from_station', '')}-{data.get('to_station', '')}",
        "score": int(score_val * 100),
        "flags": flags,
        "queue_position": _queue_info["queue_position"] if _queue_info else None,
        "estimated_wait": _queue_info["estimated_wait"] if _queue_info else None,
        "priority_score": _queue_info["priority_score"] if _queue_info else None
    }

    # Update stats
    stats["total"] += 1
    if action == "BLOCK":
        stats["block"] += 1
        stats["blocked"] += 1
    elif action == "HONEYPOT":
        stats["honey"] += 1
    elif action == "CAPTCHA":
        stats["captcha"] = stats.get("captcha", 0) + 1
    else:
        stats["allowed"] += 1
        stats["passed"] += 1

    events.append(event)
    await broadcast(event)

    return event


@app.websocket("/ws/events")
async def ws_events(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    # Send stats on connect (with custom type to prevent interference with live feed)
    try:
        await websocket.send_json({"type": "stats", "stats": stats})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.discard(websocket)


@app.get("/stats")
async def get_stats():
    return stats


@app.get("/events/recent")
async def get_recent():
    return list(events)[-100:]


@app.get("/blacklist")
async def get_blacklist_route():
    return get_blacklist()


@app.post("/reset")
async def reset_route():
    clear_blacklist()
    events.clear()
    stats.update({
        "total": 0,
        "allowed": 0,
        "passed": 0,
        "honey": 0,
        "block": 0,
        "blocked": 0,
        "captcha": 0
    })
    return {"status": "reset"}


@app.get("/queue/stats")
async def get_queue_stats():
    """Return current fair queue state."""
    now = _time.time()
    active = [e for e in fair_queue if now - e["queued_at"] < QUEUE_WINDOW_SECONDS]
    return {
        "queue_length": len(active),
        "throughput_per_sec": QUEUE_THROUGHPUT_PER_SEC,
        "entries": active[:20]  # return top 20 for dashboard display
    }
