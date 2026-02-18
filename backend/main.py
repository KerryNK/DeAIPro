from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, auth
import os
from data import subnets, news, research, lessons

# Initialize Firebase Admin
# Expects serviceAccountKey.json in the same directory or pointed to by GOOGLE_APPLICATION_CREDENTIALS
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
async def get_subnets(user: dict = Depends(get_current_user)):
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
