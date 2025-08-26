from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import logging
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os
import time

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# The path where the model is stored, relative to the Docker container's working directory
MODEL_PATH = "./my_medical_model"

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Medical Classification Model Service",
    description="ML service for medical paper classification using a fine-tuned PubMedBERT model.",
    version="2.0.0"
)

# --- Model Loading ---
model = None
tokenizer = None

@app.on_event("startup")
def load_model():
    """Load the tokenizer and model at application startup."""
    global model, tokenizer
    if not os.path.exists(MODEL_PATH):
        logger.error(f"Model directory not found at: {MODEL_PATH}")
        logger.error("Please ensure the trained model is placed in the 'model' directory.")
        # In a real scenario, you might want to prevent the app from starting
        return

    try:
        logger.info(f"Loading model from path: {MODEL_PATH}")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        model.eval()  # Set model to evaluation mode
        logger.info("Model and tokenizer loaded successfully.")
    except Exception as e:
        logger.error(f"Fatal error during model loading: {e}")
        # This is a critical error, so we might want to stop the service

# --- Pydantic Models ---
class ClassificationRequest(BaseModel):
    texts: List[str]
    max_length: int = 512  # Max length used during training

class Prediction(BaseModel):
    category: str
    probability: float

class ClassificationResponse(BaseModel):
    predictions: List[List[Prediction]]

# --- API Endpoints ---
CATEGORIES = ['neurological', 'cardiovascular', 'hepatorenal', 'oncological']

@app.post("/classify", response_model=ClassificationResponse)
async def classify_texts(request: ClassificationRequest):
    """Classifies a batch of medical texts."""
    if not model or not tokenizer:
        logger.error("Classification requested but model/tokenizer not loaded")
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Please check service logs for errors."
        )

    batch_size = len(request.texts)
    first_preview = ""
    if batch_size:
        first = request.texts[0]
        first_preview = (first[:120] + "...") if len(first) > 120 else first
    logger.info(f"/classify received: batch={batch_size} max_length={request.max_length} first_preview={first_preview!r}")

    start_ts = time.perf_counter()
    try:
        inputs = tokenizer(
            request.texts,
            return_tensors='pt',
            truncation=True,
            padding=True,
            max_length=request.max_length
        )

        with torch.no_grad():
            outputs = model(**inputs)
            probabilities = torch.sigmoid(outputs.logits)

        duration_ms = int((time.perf_counter() - start_ts) * 1000)
        logger.info(f"/classify inference completed in {duration_ms} ms")

        all_predictions: List[List[Prediction]] = []
        for i in range(batch_size):
            text_predictions = [
                Prediction(category=category, probability=round(probabilities[i][j].item(), 4))
                for j, category in enumerate(CATEGORIES)
            ]
            all_predictions.append(text_predictions)

        logger.info(f"/classify returning predictions for batch={batch_size}")
        return ClassificationResponse(predictions=all_predictions)

    except Exception as e:
        logger.exception("An error occurred during classification")
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")

@app.get("/health")
async def health_check():
    """Health check endpoint to verify service and model status."""
    model_status = "loaded" if model and tokenizer else "not loaded"
    return {"status": "healthy", "model_status": model_status}

if __name__ == "__main__":
    import uvicorn
    # This block is for local testing and is not used by Docker
    # To test locally, you would need to have the model in ./my_medical_model
    uvicorn.run("model_service:app", host="0.0.0.0", port=8080, reload=True)