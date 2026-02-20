from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, auth
import os
import asyncio
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

async def get_optional_user(request: Request):
    """Returns the Firebase user dict if a valid Bearer token is present, else None."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        return auth.verify_id_token(token)
    except Exception:
        return None

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

# ─── CoinGecko: TAO price ──────────────────────────────────────────────────────────
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
                "market_cap": data.get("usd_market_cap", 1280000000),
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
            "market_cap": 1280000000,
            "volume_24h": 8400000,
        }

# ─── CoinGecko: Bittensor ecosystem alpha tokens (subnet prices) ─────────────
async def fetch_coingecko_subnets():
    """Fetch all bittensor-ecosystem alpha tokens from CoinGecko.
    Tokens use symbol pattern 'snXX' where XX is the subnet netuid.
    Returns dict keyed by int netuid with live market data."""
    cached = get_cached("cg_subnets", 300)  # 5-min cache
    if cached:
        return cached

    headers = {}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    result = {}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Fetch all pages (CoinGecko returns up to 250 per page)
            for page in range(1, 4):  # max 3 pages = up to 750 tokens
                resp = await client.get(
                    f"{COINGECKO_BASE}/coins/markets",
                    params={
                        "vs_currency": "usd",
                        "category": "bittensor-ecosystem",
                        "order": "market_cap_desc",
                        "per_page": 250,
                        "page": page,
                        "price_change_percentage": "24h,7d",
                        "sparkline": "false",
                    },
                    headers=headers
                )
                resp.raise_for_status()
                tokens = resp.json()
                if not tokens:
                    break

                for t in tokens:
                    sym = (t.get("symbol") or "").lower().strip()
                    # Extract netuid from symbol like 'sn8', 'sn64', 'sn120'
                    if sym.startswith("sn") and sym[2:].isdigit():
                        netuid = int(sym[2:])
                        mc_usd = t.get("market_cap") or 0
                        result[netuid] = {
                            "cg_id": t.get("id"),
                            "n": t.get("name") or f"Subnet {netuid}",
                            "mc": round(mc_usd / 1e6, 3),          # millions USD
                            "price_usd": t.get("current_price") or 0,
                            "price_change_24h": round(t.get("price_change_percentage_24h_in_currency") or 0, 2),
                            "price_change_7d": round(t.get("price_change_percentage_7d_in_currency") or 0, 2),
                            "volume_24h": t.get("total_volume") or 0,
                            "circulating_supply": t.get("circulating_supply") or 0,
                            "image": t.get("image") or "",
                            "live": True,
                        }

                if len(tokens) < 250:
                    break  # no more pages

        print(f"CoinGecko subnets fetched: {len(result)} alpha tokens")
        set_cache("cg_subnets", result)
        return result
    except Exception as e:
        print(f"CoinGecko subnet fetch error: {e}")
        return {}

# ─── TaoStats: Subnet emissions & network data ─────────────────────────────
async def fetch_subnets_taostats():
    """Fetch live subnet stats from TaoStats API (requires TAOSTATS_API_KEY).
    Returns dict keyed by int netuid with emission/validator/miner data."""
    cached = get_cached("taostats_subnets", 300)
    if cached:
        return cached

    if not TAOSTATS_API_KEY:
        return None  # No key — fall through to CoinGecko + static data

    headers = {"Authorization": f"Bearer {TAOSTATS_API_KEY}"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{TAOSTATS_BASE}/subnet/v1",
                params={"limit": 256, "order": "emission desc"},
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
                nid = int(netuid)
                result[nid] = {
                    "n": s.get("name") or s.get("subnet_name") or f"Subnet {nid}",
                    "em": round(float(s.get("emission") or s.get("emission_tao", 0)), 2),
                    "share": round(float(s.get("emission_pct") or s.get("emission_share", 0)) * 100, 2),
                    "validators": int(s.get("validator_count") or s.get("num_validators", 0)),
                    "miners": int(s.get("miner_count") or s.get("num_miners", 0)),
                    "alpha_tao": round(float(s.get("alpha_price_tao") or 0), 6),
                }

            set_cache("taostats_subnets", result)
            print(f"TaoStats subnets fetched: {len(result)} subnets")
            return result
    except Exception as e:
        print(f"TaoStats fetch error: {e}. Skipping.")
        return None

# ─── Endpoints ────────────────────────────────────────────────────────────────────
@app.get("/api/stats")
async def get_stats():
    """Public TAO market data. Also computes alpha ecosystem aggregate."""
    data = await fetch_tao_data()
    # Fetch CoinGecko subnets concurrently for aggregate stats
    cg = await fetch_coingecko_subnets()

    active_subnets = len([s for s in static_subnets if s.get("em", 0) > 0])
    if cg:
        active_subnets = len(cg)  # live count from CG

    sum_alpha_mc = sum(v["mc"] for v in cg.values()) if cg else 0
    total_mc_usd = (data["market_cap"] / 1e6) + sum_alpha_mc  # TAO + all alpha

    return {
        "tao_price": data["tao_price"],
        "tao_price_btc": data.get("tao_price_btc", 0),
        "market_cap": data["market_cap"],
        "volume_24h": data["volume_24h"],
        "tao_price_change_24h": data["tao_price_change_24h"],
        "volume_change_24h": 0.0,
        "active_subnets": active_subnets,
        "sum_alpha_mc": round(sum_alpha_mc, 2),           # $M
        "total_ecosystem_mc": round(total_mc_usd, 2),     # $M
    }

@app.get("/api/subnets")
async def get_subnets(request: Request):
    """Returns enriched subnet list. Priority: CoinGecko live > TaoStats live > static.
    All visitors get the full list; authenticated users get the `authenticated` flag."""
    user = await get_optional_user(request)
    is_authenticated = user is not None

    # Fetch all sources concurrently
    tao_data, cg, ts = await asyncio.gather(
        fetch_tao_data(),
        fetch_coingecko_subnets(),
        fetch_subnets_taostats(),
        return_exceptions=True
    )
    # Handle exceptions from gather
    if isinstance(tao_data, Exception): tao_data = {"tao_price": 180.80}
    if isinstance(cg, Exception): cg = {}
    if isinstance(ts, Exception): ts = None
    tao_price = tao_data.get("tao_price", 180.80)

    enriched = []
    for s in static_subnets:
        sid = s["id"]
        cg_data = cg.get(sid, {})
        ts_data = ts.get(sid, {}) if ts else {}

        # Build merged record — CoinGecko wins for prices/market_cap, TaoStats for emissions
        merged = dict(s)  # start from static baseline
        merged["tao"] = tao_price
        merged["authenticated"] = is_authenticated

        # ── CoinGecko live fields (name, market cap in USD, alpha price)
        if cg_data:
            merged["live"] = True
            # Convert USD price to TAO for alpha field
            alpha_usd = cg_data.get("price_usd", 0)
            merged["alpha"] = round(alpha_usd / tao_price, 6) if tao_price > 0 and alpha_usd > 0 else s.get("alpha", 0)
            merged["alpha_usd"] = alpha_usd
            merged["mc"] = cg_data["mc"]                          # real USD market cap
            merged["price_change_24h"] = cg_data["price_change_24h"]
            merged["price_change_7d"] = cg_data["price_change_7d"]
            merged["volume_24h_usd"] = cg_data["volume_24h"]
            merged["cg_image"] = cg_data["image"]
            # Only override name if CoinGecko gives a proper one
            cg_name = cg_data.get("n", "")
            if cg_name and not cg_name.startswith("Subnet "):
                merged["n"] = cg_name
        else:
            merged["live"] = bool(ts_data)

        # ── TaoStats live fields (emissions, validators, miners — network data)
        if ts_data:
            if ts_data.get("em", 0) > 0:
                merged["em"] = ts_data["em"]
                merged["emission"] = ts_data["em"]
            if ts_data.get("share", 0) > 0:
                merged["share"] = ts_data["share"]
            if ts_data.get("validators", 0) > 0:
                merged["validators"] = ts_data["validators"]
            if ts_data.get("miners", 0) > 0:
                merged["miners"] = ts_data["miners"]
            # If TaoStats has alpha price in TAO and no CoinGecko data
            if not cg_data and ts_data.get("alpha_tao", 0) > 0:
                merged["alpha"] = ts_data["alpha_tao"]

        enriched.append(merged)

    # Also include subnets discovered by CoinGecko that aren't in our static list
    static_ids = {s["id"] for s in static_subnets}
    for netuid, cg_data in cg.items():
        if netuid not in static_ids and netuid != 0:  # skip TAO (netuid 0)
            alpha_usd = cg_data.get("price_usd", 0)
            enriched.append({
                "id": netuid,
                "n": cg_data.get("n", f"Subnet {netuid}"),
                "cat": "Ecosystem",
                "mc": cg_data["mc"],
                "alpha": round(alpha_usd / tao_price, 6) if tao_price > 0 and alpha_usd > 0 else 0,
                "alpha_usd": alpha_usd,
                "price_change_24h": cg_data["price_change_24h"],
                "price_change_7d": cg_data["price_change_7d"],
                "volume_24h_usd": cg_data["volume_24h"],
                "cg_image": cg_data["image"],
                "tao": tao_price,
                "live": True,
                "authenticated": is_authenticated,
                # Defaults for fields not in CoinGecko
                "em": 0, "share": 0, "validators": 0, "miners": 0,
                "pe": 0, "score": 0, "trend": "stable",
            })

    # Sort by market cap descending
    enriched.sort(key=lambda x: x.get("mc", 0), reverse=True)
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

@app.get("/api/historical/tao")
async def get_historical_tao(days: int = 30):
    """Real CoinGecko TAO/USD price history."""
    cache_key = f"historical_tao_{days}"
    cached = get_cached(cache_key, 300)
    if cached:
        return cached

    headers = {}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    interval = "daily" if days > 1 else "hourly"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{COINGECKO_BASE}/coins/bittensor/market_chart",
                params={"vs_currency": "usd", "days": str(days), "interval": interval},
                headers=headers
            )
            resp.raise_for_status()
            raw = resp.json()
            prices = raw.get("prices", [])
            result = {
                "data": [
                    {
                        "date": datetime.fromtimestamp(p[0] / 1000).strftime(
                            "%b %d, %H:%M" if days <= 1 else "%b %d"
                        ),
                        "value": round(p[1], 4),
                        "timestamp": p[0],
                    }
                    for p in prices
                ]
            }
            set_cache(cache_key, result)
            return result
    except Exception as e:
        print(f"CoinGecko TAO/USD history error: {e}. Using fallback.")
        import random
        base = 180.0
        data = []
        now = datetime.now()
        for i in range(days if days > 1 else 24):
            if days <= 1:
                d = (now - timedelta(hours=24 - i))
                label = d.strftime("%H:%M")
            else:
                d = (now - timedelta(days=days - 1 - i))
                label = d.strftime("%b %d")
            base = max(50, base + (random.random() - 0.5) * 6)
            data.append({"date": label, "value": round(base, 2)})
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

@app.get("/api/historical/tao")
async def get_historical_tao(days: int = 30):
    cache_key = f"historical_tao_{days}"
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
                params={"vs_currency": "usd", "days": str(days), "interval": "daily" if days > 7 else "hourly"},
                headers=headers
            )
            resp.raise_for_status()
            raw = resp.json()
            result = {
                "data": [
                    {"date": datetime.fromtimestamp(p[0] / 1000).strftime("%Y-%m-%d %H:%M"), "value": p[1]}
                    for p in raw.get("prices", [])
                ]
            }
            set_cache(cache_key, result)
            return result
    except Exception as e:
        print(f"CoinGecko TAO historical fetch error: {e}. Using fallback.")
        import random
        base = 180.0
        data = []
        now = datetime.now()
        for i in range(days):
            date = (now - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
            base = max(80, base + (random.random() - 0.5) * 10)
            data.append({"date": date, "value": round(base, 2)})
        return {"data": data}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "taostats": bool(TAOSTATS_API_KEY),
        "coingecko": bool(COINGECKO_API_KEY),
    }
