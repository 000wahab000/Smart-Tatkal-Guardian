import asyncio
import random
from collections import deque
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from profiles import generate_bot_profile, generate_human_profile
from sender import send_request


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield  # startup / shutdown hook (keeps event loop alive)

app = FastAPI(title="Smart Tatkal Guardian — Simulator", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory state ──────────────────────────────────────────────────────────
running: bool = False
sent_count: int = 0
bot_count: int = 0
human_count: int = 0
request_log: deque = deque(maxlen=100)   # includes is_bot — internal only
_bg_task: asyncio.Task | None = None


# ── Background generator ─────────────────────────────────────────────────────
async def _generate_traffic(rps: int):
    global running, sent_count, bot_count, human_count

    delay = 1.0 / max(rps, 1)

    while running:
        # 80% bots, 20% humans
        if random.random() < 0.80:
            profile = generate_bot_profile()
            bot_count += 1
        else:
            profile = generate_human_profile()
            human_count += 1

        sent_count += 1
        request_log.append(profile)          # full profile with is_bot
        await send_request(profile)          # sender strips is_bot before POST

        await asyncio.sleep(delay)


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.post("/simulate/start")
async def start_simulation(rps: int = 10):
    global running, _bg_task, sent_count, bot_count, human_count

    if running:
        return {"status": "already_running", "rps": rps}

    # Reset counters on fresh start
    sent_count = 0
    bot_count = 0
    human_count = 0
    request_log.clear()

    running = True
    loop = asyncio.get_event_loop()
    _bg_task = loop.create_task(_generate_traffic(rps))
    print(f"[simulator] Started — {rps} req/sec")
    return {"status": "started", "rps": rps}


@app.post("/simulate/stop")
async def stop_simulation():
    global running, _bg_task

    running = False
    if _bg_task:
        _bg_task.cancel()
        _bg_task = None

    print(f"[simulator] Stopped — total sent: {sent_count}")
    return {"status": "stopped", "sent_count": sent_count}


@app.get("/simulate/status")
async def get_status():
    return {
        "running": running,
        "sent_count": sent_count,
        "bot_count": bot_count,
        "human_count": human_count,
    }


@app.get("/simulate/replay")
async def replay():
    """Returns last 100 requests including is_bot field (internal use only)."""
    return list(request_log)