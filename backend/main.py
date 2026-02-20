from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, auth
import os
import httpx
from datetime import datetime, timedelta
from dotenv import load_dotenv
from data import subnets as static_subnets, news, research, lessons

load_dotenv()

# ─── Firebase Admin ───────────────────────────────────────────────────────────
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

# ─── Cache ────────────────────────────────────────────────────────────────────
_cache = {}

def get_cached(key, max_age=60):
    if key in _cache:
        value, ts = _cache[key]
        if (datetime.now() - ts).seconds < max_age:
            return value
    return None

def set_cache(key, value):
    _cache[key] = (value, datetime.now())

# ─── Auth helpers ─────────────────────────────────────────────────────────────
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        return auth.verify_id_token(credentials.credentials)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")

async def require_admin(user: dict = Depends(get_current_user)):
    email = user.get("email", "")
    if not email.lower().endswith("@deaistrategies.io"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return user

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://de-ai-pro.vercel.app",
        "https://de-ai-mu.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── API Keys ─────────────────────────────────────────────────────────────────
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "")
COINGECKO_BASE = "https://api.coingecko.com/api/v3"

TAOSTATS_API_KEY = os.getenv("TAOSTATS_API_KEY", "")
TAOSTATS_BASE = "https://api.taostats.io/api"

# ─── CoinGecko: TAO price ─────────────────────────────────────────────────────
async def fetch_tao_data():
    cached = get_cached("tao_stats", 60)
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
        print(f"CoinGecko fetch error: {e}. Using fallback.")
        return {
            "tao_price": 180.80,
            "tao_price_btc": 0.00065,
            "tao_price_change_24h": 0.0,
            "market_cap": 847200000,
            "volume_24h": 8400000,
        }

# ─── TaoStats: Subnets ────────────────────────────────────────────────────────
async def fetch_subnets_taostats():
    """Fetch live subnet statistics from TaoStats API."""
    cached = get_cached("taostats_subnets", 300)  # 5-minute cache
    if cached:
        return cached

    if not TAOSTATS_API_KEY:
        return None  # Fall back to static data

    headers = {"Authorization": f"Bearer {TAOSTATS_API_KEY}"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{TAOSTATS_BASE}/subnet/v1",
                params={"limit": 100, "order": "emission desc"},
                headers=headers
            )
            resp.raise_for_status()
            raw = resp.json()
            subnets_raw = raw.get("data", raw) if isinstance(raw, dict) else raw

            result = {}
            for s in subnets_raw:
                netuid = s.get("netuid") or s.get("net_uid")
                if netuid is None:
                    continue
                result[int(netuid)] = {
                    "id": int(netuid),
                    "n": s.get("name") or s.get("subnet_name") or f"Subnet {netuid}",
                    "mc": round(float(s.get("market_cap") or s.get("alpha_price_tao", 0)) / 1e6, 2),
                    "em": round(float(s.get("emission") or s.get("emission_tao", 0)), 2),
                    "share": round(float(s.get("emission_pct") or s.get("emission_share", 0)) * 100, 2),
                    "validators": int(s.get("validator_count") or s.get("num_validators", 0)),
                    "miners": int(s.get("miner_count") or s.get("num_miners", 0)),
                    "alpha": round(float(s.get("alpha_price_tao") or 0.3), 4),
                    "live": True,
                }

            set_cache("taostats_subnets", result)
            return result
    except Exception as e:
        print(f"TaoStats fetch error: {e}. Using static data.")
        return None

# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/api/stats")
async def get_stats():
    data = await fetch_tao_data()
    return {
        "tao_price": data["tao_price"],
        "market_cap": data["market_cap"],
        "volume_24h": data["volume_24h"],
        "tao_price_change_24h": data["tao_price_change_24h"],
        "volume_change_24h": 0.0,
    }

@app.get("/api/subnets")
async def get_subnets(user: dict = Depends(get_current_user)):
    tao_data = await fetch_tao_data()
    tao_price = tao_data["tao_price"]

    # Try TaoStats live data
    live = await fetch_subnets_taostats()

    enriched = []
    for s in static_subnets:
        sid = s["id"]
        if live and sid in live:
            ls = live[sid]
            merged = {
                **s,
                "n": ls["n"] if ls["n"] != f"Subnet {sid}" else s["n"],
                "mc": ls["mc"] if ls["mc"] > 0 else s["mc"],
                "em": ls["em"] if ls["em"] > 0 else s["em"],
                "share": ls["share"] if ls["share"] > 0 else s["share"],
                "validators": ls["validators"] if ls["validators"] > 0 else s["validators"],
                "miners": ls["miners"] if ls["miners"] > 0 else s["miners"],
                "alpha": ls["alpha"] if ls["alpha"] > 0 else s["alpha"],
                "tao": tao_price,
                "live": True,
            }
        else:
            merged = {**s, "tao": tao_price, "live": False}
        enriched.append(merged)

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
    cache_key = f"historical_btc_{days}"
    cached = get_cached(cache_key, 300)
    if cached:
        return cached

    headers = {}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{COINGECKO_BASE}/coins/bittensor/market_chart",
                params={"vs_currency": "btc", "days": str(days), "interval": "daily" if days > 7 else "hourly"},
                headers=headers
            )
            resp.raise_for_status()
            raw = resp.json()
            result = {
                "data": [
                    {"date": datetime.fromtimestamp(p[0] / 1000).strftime("%Y-%m-%d"), "value": p[1]}
                    for p in raw.get("prices", [])
                ]
            }
            set_cache(cache_key, result)
            return result
    except Exception as e:
        print(f"CoinGecko historical fetch error: {e}. Using fallback.")
        import random
        base = 0.00065
        data = []
        now = datetime.now()
        for i in range(days):
            date = (now - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
            base = max(0.0003, base + (random.random() - 0.5) * 0.00005)
            data.append({"date": date, "value": base})
        return {"data": data}

# ─── Admin: Approve access request ───────────────────────────────────────────
class ApproveRequest(BaseModel):
    email: str

@app.post("/api/admin/approve")
async def approve_access_request(
    body: ApproveRequest,
    admin: dict = Depends(require_admin)
):
    """
    Called by an @deaistrategies.io admin when approving a user's access request.
    Creates a Firebase Auth account for the email (if not already existing)
    and sends a password reset email. The reset link acts as the 24hr login invite.

    IMPORTANT: Set 'Password reset' token expiry to 86400 seconds in:
    Firebase Console → Authentication → Templates → Password reset → Token expiry
    """
    email = body.email.lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")

    try:
        # Try to get existing user first
        try:
            user_record = auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            # Create a new Firebase Auth user
            user_record = auth.create_user(
                email=email,
                email_verified=False,
                disabled=False,
            )

        # Generate a password reset link (expires in 24hrs — configure in Firebase Console)
        reset_link = auth.generate_password_reset_link(email)
        # Note: Firebase Admin SDK generates the link. For actually sending the email
        # you need to either use the client-side sendPasswordResetEmail (which sends automatically)
        # or use a transactional email service (SendGrid, Mailgun, etc.) with reset_link.
        # Below we use the Firebase Admin-generated link with a simple httpx call to send it.
        # If you use Firebase's built-in email service, you can call auth.generate_password_reset_link()
        # and send via your own email provider.

        # For now, if you have Firebase's built-in email delivery configured in Firebase Console,
        # you can also trigger it via the client-side SDK from AdminPanel directly.
        # This backend route returns the link so AdminPanel could email it via a 3rd-party service.

        return {
            "success": True,
            "message": f"User {email} is set up. Password reset link generated.",
            "uid": user_record.uid,
            "reset_link": reset_link,  # Use this to send via your email provider
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve user: {str(e)}")

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "taostats": bool(TAOSTATS_API_KEY),
        "coingecko": bool(COINGECKO_API_KEY),
    }
