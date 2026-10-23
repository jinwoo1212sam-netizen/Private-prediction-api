# DRAGON-X 120 Pattern Live Prediction API

Vercel-ready API for **WinGo 1-Minute & 30-Seconds** live predictions and 120 pattern historical analysis.

## Features

- **Live Period Calculation:** Automatically fetches the latest result from WinGo APIs and computes the exact next `targetPeriod` (`+1`).
- **Live Prediction:** Generates predictions for **Size** (`BIG` / `SMALL`), **Color** (`RED` / `GREEN` / `VIOLET`), and **Number** (`0-9`).
- **120 Pattern Engine Integration:** Uses the 120-pattern `DragonX` analytical engine on live historical draws.

## API Endpoints

- `GET /api/analyze?type=1M` — WinGo 1-Minute Live Prediction & Analysis
- `GET /api/analyze?type=30S` — WinGo 30-Second Live Prediction & Analysis
- `GET /api/patterns` — Catalog of all 120 pattern detectors

## Vercel Deployment Steps

1. Download and extract this repository.
2. Push to GitHub.
3. Import project in Vercel and click **Deploy**.
