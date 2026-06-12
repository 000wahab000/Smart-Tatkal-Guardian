# Smart Tatkal Guardian 🛡️
FAR AWAY 2026 Hackathon — Team AlgoMinds

## Services
| Service | Port | Description |
|---|---|---|
| simulator | 8001 | Generates fake IRCTC traffic |
| orchestrator | 8000 | Scores, decides, broadcasts |
| dashboard | 5173 | React monitoring UI |

## Quick Start
Terminal 1: cd orchestrator && uvicorn main:app --port 8000 --reload
Terminal 2: cd simulator && uvicorn main:app --port 8001 --reload  
Terminal 3: cd dashboard && npm run dev
Then: POST http://localhost:8001/simulate/start?rps=10
