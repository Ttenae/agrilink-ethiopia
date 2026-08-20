import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from predict import predict_disease
import shutil
import uuid
from datetime import datetime

app = FastAPI(title="AgriLink AI Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3005", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    """
    Detect crop disease from uploaded image.
    Returns disease name, confidence, and treatment suggestions.
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        # Save uploaded file
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Run prediction
        result = predict_disease(filepath)
        
        # Clean up uploaded file
        os.remove(filepath)
        
        # Add timestamp and ID
        result["id"] = str(uuid.uuid4())
        result["timestamp"] = datetime.now().isoformat()
        result["image_analyzed"] = file.filename
        result["model_version"] = "1.0.0"
        
        return JSONResponse(content=result)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)