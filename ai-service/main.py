import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from predict import predict_disease
import shutil
import uuid
from datetime import datetime
import gc
import torch

app = FastAPI(title="AgriLink AI Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3005", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cleanup middleware
@app.middleware("http")
async def cleanup_after_request(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    finally:
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "AgriLink AI Service is running", "status": "active"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "disease-detection"}

@app.post("/predict/disease")
async def detect_disease(file: UploadFile = File(...)):
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        result = predict_disease(filepath)
        
        os.remove(filepath)
        
        result["id"] = str(uuid.uuid4())
        result["timestamp"] = datetime.now().isoformat()
        result["image_analyzed"] = file.filename
        result["model_version"] = "1.0.0"
        
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return JSONResponse(content=result)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)