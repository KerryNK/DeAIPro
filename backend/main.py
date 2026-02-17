from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from data import subnets, news, research, lessons

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://de-ai-pro.vercel.app",
    "https://de-ai-pro.vercel.app/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stats")
@limiter.limit("60/minute")
async def get_stats(request: Request):
    return {
        "tao_price": 180.80,
        "market_cap": 847200000,
        "volume_24h": 8400000,
        "tao_price_change_24h": 5.2,
        "volume_change_24h": 12.3
    }

@app.get("/api/subnets")
@limiter.limit("60/minute")
async def get_subnets(request: Request):
    return subnets

@app.get("/api/news")
@limiter.limit("60/minute")
async def get_news(request: Request):
    return news

@app.get("/api/research")
@limiter.limit("60/minute")
async def get_research(request: Request):
    return research

@app.get("/api/academy")
@limiter.limit("60/minute")
async def get_academy(request: Request):
    return lessons

@app.get("/api/historical/btc")
@limiter.limit("60/minute")
async def get_historical_btc(request: Request):
    # Mock data for chart - 30 days of data
    import random
    from datetime import datetime, timedelta
    
    base_ratio = 0.00065
    data = []
    now = datetime.now()
    
    for i in range(30):
        date = (now - timedelta(days=29-i)).strftime("%Y-%m-%d")
        # Random walk
        change = (random.random() - 0.5) * 0.00005
        base_ratio += change
        data.append({"date": date, "value": base_ratio})
        
    return {"data": data}
