from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .data import subnets, news, research, lessons

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stats")
async def get_stats():
    return {
        "tao_price": 180.80,
        "market_cap": 847200000,
        "volume_24h": 8400000,
        "tao_price_change_24h": 5.2,
        "volume_change_24h": 12.3
    }

@app.get("/api/subnets")
async def get_subnets():
    return subnets

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
async def get_historical_btc():
    # Mock data for chart
    return {"data": []}
