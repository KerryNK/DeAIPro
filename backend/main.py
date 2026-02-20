from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, auth
import os
import httpx
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv
from data import subnets, news, research, lessons

load_dotenv()

# Initialize Firebase Admin
try:
    if not firebase_admin._apps:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin initialized successfully")
        else:
            print(f"Warning: {cred_path} not found. Firebase Auth will not work.")
except Exception as e:
    print(f"Error initializing Firebase Admin: {e}")

app = FastAPI()

security = HTTPBearer()

# Simple in-memory cache
_cache = {}

def get_cached(key):
    """Return cached value if not older than 60 seconds."""
    if key in _cache:
        value, timestamp = _cache[key]
        if (datetime.now() - timestamp).seconds < 60:
            return value
    return None

def set_cache(key, value):
    _cache[key] = (value, datetime.now())

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://de-ai-pro.vercel.app",
    "https://de-ai-pro.vercel.app/",
    "https://de-ai-mu.vercel.app",
    "https://de-ai-mu.vercel.app/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "")
COINGECKO_BASE = "https://api.coingecko.com/api/v3"

async def fetch_tao_data():
    """Fetch live TAO price and 24h change from CoinGecko."""
    cached = get_cached("tao_stats")
    if cached:
        return cached

    headers = {}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{COINGECKO_BASE}/simple/price",
                params={
                    "ids": "bittensor",
                    "vs_currencies": "usd,btc",
                    "include_24hr_change": "true",
                    "include_market_cap": "true",
                    "include_24hr_vol": "true"
                },
                headers=headers
            )
            resp.raise_for_status()
            data = resp.json().get("bittensor", {})
            result = {
                "tao_price": data.get("usd", 180.80),
                "tao_price_btc": data.get("btc", 0.00065),
                "tao_price_change_24h": round(data.get("usd_24h_change", 0), 2),
                "market_cap": data.get("usd_market_cap", 847200000),
                "volume_24h": data.get("usd_24h_vol", 8400000),
            }
            set_cache("tao_stats", result)
            return result
    except Exception as e:
        print(f"CoinGecko fetch error: {e}. Using fallback values.")
        return {
            "tao_price": 180.80,
            "tao_price_btc": 0.00065,
            "tao_price_change_24h": 0.0,
            "market_cap": 847200000,
            "volume_24h": 8400000,
        }

@app.get("/api/stats")
async def get_stats():
    data = await fetch_tao_data()
    return {
        "tao_price": data["tao_price"],
        "market_cap": data["market_cap"],
        "volume_24h": data["volume_24h"],
        "tao_price_change_24h": data["tao_price_change_24h"],
        "volume_change_24h": 12.3  # TODO: derive from CoinGecko vol_change
    }

@app.get("/api/subnets")
async def get_subnets(user: dict = Depends(get_current_user)):
    # Enrich subnets with live TAO price for accurate calculations
    tao_data = await fetch_tao_data()
    enriched = [{**s, "tao": tao_data["tao_price"]} for s in subnets]
    return enriched

@app.get("/api/news")
async def get_news():
    return news

@app.get("/api/research")
async def get_research():
    return research

@app.get("/api/academy")
async def get_academy():
    return lessons

@app.get("/api/historical/btc")
async def get_historical_btc(days: int = 30):
    """Fetch real TAO/BTC historical data from CoinGecko."""
    cache_key = f"historical_btc_{days}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    headers = {}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{COINGECKO_BASE}/coins/bittensor/market_chart",
                params={
                    "vs_currency": "btc",
                    "days": str(days),
                    "interval": "daily" if days > 7 else "hourly"
                },
                headers=headers
            )
            resp.raise_for_status()
            raw = resp.json()
            data_points = raw.get("prices", [])
            result = {
                "data": [
                    {
                        "date": datetime.fromtimestamp(p[0] / 1000).strftime("%Y-%m-%d %H:%M"),
                        "value": p[1]
                    }
                    for p in data_points
                ]
            }
            set_cache(cache_key, result)
            return result
    except Exception as e:
        print(f"CoinGecko historical fetch error: {e}. Using mock data.")
        import random
        base_ratio = 0.00065
        data = []
        now = datetime.now()
        for i in range(days):
            date = (now - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
            change = (random.random() - 0.5) * 0.00005
            base_ratio = max(0.0003, base_ratio + change)
            data.append({"date": date, "value": base_ratio})
        return {"data": data}

@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
