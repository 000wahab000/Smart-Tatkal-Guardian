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
    "blocked": 0  # alias
}
connected_clients = set()


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


@app.post("/ingest")
async def ingest(request: Request):
    data = await request.json()
    score_val = score_request(data)
    user_id = data.get("user_id")

    # Decision logic
    is_bot = is_blacklisted(user_id)
    if score_val >= 0.75 and is_bot:
        action = "BLOCK"
        action_ui = "BLOCK"
    elif score_val >= 0.65:
        action = "HONEYPOT"
        action_ui = "HONEY"
        maybe_blacklist(user_id)
    else:
        action = "ALLOW"
        action_ui = "ALLOW"

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
        "flags": flags
    }

    # Update stats
    stats["total"] += 1
    if action == "BLOCK":
        stats["block"] += 1
        stats["blocked"] += 1
    elif action == "HONEYPOT":
        stats["honey"] += 1
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
        "blocked": 0
    })
    return {"status": "reset"}
