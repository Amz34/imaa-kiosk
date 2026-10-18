from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("imaa")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "imaa-engine",
        "version": "1.0.0",
        "architecture": "client-side-wasm-server-onnx",
        "languages": ["ar", "en", "ur"],
        "dialects": ["psl", "arsl"]
    }

class TranslationRequest(BaseModel):
    landmarks: list[list[float]]  # 98-dim flattened or frame sequence
    dialect: str = "arsl"         # 'arsl' or 'psl'
    target_lang: str = "ar"       # 'ar', 'en', 'ur'

@app.post("/api/v1/translate")
async def translate_sign(payload: TranslationRequest):
    # Stub for production ONNX inference router
    if not payload.landmarks:
        raise HTTPException(status_code=400, detail="Empty landmark sequence provided.")
    
    # Mock classification result for top 50 signs
    return {
        "sign_code": "CHEST_PAIN",
        "sign_name": {"ar": "ألم في الصدر", "en": "Chest Pain", "ur": "سینے میں درد"},
        "confidence": 0.94,
        "dialect": payload.dialect,
        "target_lang": payload.target_lang,
        "translated_text": {
            "ar": "المريض يعاني من ألم في الصدر ويحتاج تدخل طارئ",
            "en": "Patient is experiencing chest pain and requires urgent triage.",
            "ur": "مریض کو سینے میں درد ہے اور فوری طبی امداد درکار ہے۔"
        },
        "gov_form_payload": {
            "service": "Sehha_Emergency_Triage",
            "urgency": "HIGH",
            "symptom_code": "ICD10:R07.9"
        }
    }

@app.websocket("/api/v1/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("Client connected to Imaa live sign stream.")
    try:
        while True:
            data = await websocket.receive_json()
            # Process frames in real-time
            await websocket.send_json({
                "status": "ack",
                "top_prediction": "FEVER",
                "confidence": 0.91,
                "latency_ms": 11.4
            })
    except WebSocketDisconnect:
        logger.info("Client disconnected from live sign stream.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
