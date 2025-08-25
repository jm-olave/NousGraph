from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Medical Classification Model Service",
    description="ML service for medical paper classification",
    version="1.0.0"
)

class ClassificationRequest(BaseModel):
    texts: List[str]
    max_length: int = 512

class Prediction(BaseModel):
    category: str
    confidence: float

class ClassificationResponse(BaseModel):
    predictions: List[List[Prediction]]

# Mock categories (replace with actual model)
CATEGORIES = ['neurological', 'cardiovascular', 'hepatorenal', 'oncological']

def mock_classify_text(text: str) -> List[Prediction]:
    """Mock classification function - replace with actual model inference"""
    import random
    random.seed(hash(text) % 1000)  # Deterministic for testing

    predictions = []
    for category in CATEGORIES:
        confidence = random.uniform(0.1, 0.9)
        if confidence > 0.3:  # Only include predictions above threshold
            predictions.append(Prediction(
                category=category,
                confidence=round(confidence, 3)
            ))

    # Sort by confidence and take top predictions
    predictions.sort(key=lambda x: x.confidence, reverse=True)
    return predictions[:2]  # Return top 2 predictions

@app.post("/classify", response_model=ClassificationResponse)
async def classify_texts(request: ClassificationRequest):
    """Classify medical texts"""
    try:
        logger.info(f"Classifying {len(request.texts)} texts")

        all_predictions = []
        for text in request.texts:
            predictions = mock_classify_text(text)
            all_predictions.append(predictions)

            # Simulate processing time
            time.sleep(0.1)

        return ClassificationResponse(predictions=all_predictions)

    except Exception as e:
        logger.error(f"Classification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Classification failed")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model": "mock_classifier"}

@app.get("/categories")
async def get_categories():
    """Get available categories"""
    return {"categories": CATEGORIES}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)