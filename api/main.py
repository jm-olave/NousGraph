from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import uuid
import os
import logging
from datetime import datetime
from typing import List
import aiofiles
import httpx
from pydantic import BaseModel

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get model service URL from environment variable, with a default for local dev
MODEL_SERVICE_URL = os.getenv("MODEL_URL", "http://localhost:8080") + "/classify"

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Medical Paper Classification API",
    description="API for classifying medical papers using PubMedBERT",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory Storage (for demo purposes) ---
# In a production environment, this would be a database (e.g., PostgreSQL, Redis)
jobs = {}

# --- Constants ---
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Pydantic Models ---
class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ClassificationJob:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.status = JobStatus.PENDING
        self.created_at = datetime.utcnow()
        self.completed_at = None
        self.results = []
        self.summary = {}
        self.error = None

class SingleTextRequest(BaseModel):
    text: str

class Prediction(BaseModel):
    category: str
    probability: float

# --- Helper Functions ---
async def call_model_service(texts: List[str]) -> List[List[Prediction]]:
    """Asynchronously calls the model service to get classifications."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client: # 2 minute timeout
            response = await client.post(MODEL_SERVICE_URL, json={"texts": texts})
            response.raise_for_status() # Raise an exception for bad status codes
            return response.json()["predictions"]
    except httpx.RequestError as e:
        logger.error(f"Error calling model service: {e}")
        raise HTTPException(status_code=503, detail=f"Model service is unavailable: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred while calling the model service: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred.")

# --- Background Task for CSV Processing ---
async def process_csv_background(job_id: str, file_path: str):
    """Background task to process a CSV file and get classifications."""
    jobs[job_id].status = JobStatus.PROCESSING
    logger.info(f"Starting processing for job_id: {job_id}")

    try:
        df = pd.read_csv(file_path, sep=None, engine='python', on_bad_lines='skip')
        if 'title' not in df.columns or 'abstract' not in df.columns:
            raise ValueError("CSV must contain 'title' and 'abstract' columns.")

        df['text'] = df['title'].astype(str) + " [SEP] " + df['abstract'].astype(str)
        texts_to_classify = df['text'].tolist()

        # Process in batches
        batch_size = 32
        all_predictions = []
        for i in range(0, len(texts_to_classify), batch_size):
            batch_texts = texts_to_classify[i:i + batch_size]
            logger.info(f"Job {job_id}: Classifying batch {i//batch_size + 1}...")
            batch_predictions = await call_model_service(batch_texts)
            all_predictions.extend(batch_predictions)

        # Structure results
        final_results = []
        category_counts = {}
        for i, row in df.iterrows():
            predictions = all_predictions[i]
            final_results.append({
                'id': i,
                'title': str(row['title']),
                'predictions': predictions
            })
            for pred in predictions:
                if pred['probability'] > 0.5: # Count if probability is over threshold
                    category_counts[pred['category']] = category_counts.get(pred['category'], 0) + 1

        jobs[job_id].results = final_results
        jobs[job_id].summary = {
            'total_papers': len(df),
            'category_counts': category_counts
        }
        jobs[job_id].status = JobStatus.COMPLETED
        jobs[job_id].completed_at = datetime.utcnow()
        logger.info(f"Successfully completed job_id: {job_id}")

    except Exception as e:
        logger.error(f"Processing failed for job {job_id}: {e}")
        jobs[job_id].status = JobStatus.FAILED
        jobs[job_id].error = str(e)
    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

# --- API Endpoints ---
@app.get("/")
async def root():
    return {"message": "Medical Paper Classification API is running."}

@app.get("/health")
async def health():
    """Health endpoint for Docker healthcheck."""
    return {
        "status": "ok",
        "service": "backend",
        "time": datetime.utcnow().isoformat()
    }

@app.post("/classify-text", response_model=List[Prediction])
async def classify_single_text(request: SingleTextRequest):
    """Classifies a single abstract text and returns the result immediately."""
    text = request.text or ""
    text_preview = (text[:120] + "...") if len(text) > 120 else text
    logger.info(f"/classify-text received: length={len(text)} preview={text_preview!r}")
    start_ts = datetime.utcnow()
    try:
        predictions = await call_model_service([text])
        duration_ms = int((datetime.utcnow() - start_ts).total_seconds() * 1000)
        logger.info(f"/classify-text completed in {duration_ms} ms with {len(predictions[0])} predictions")
        return predictions[0]
    except Exception as e:
        logger.exception(f"/classify-text failed: {e}")
        raise

@app.post("/upload")
async def upload_csv(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Uploads a CSV file for classification. Processing is done in the background."""
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")

    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File is too large. Max size is {MAX_FILE_SIZE // 1024 // 1024}MB.")

    job_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")

    try:
        async with aiofiles.open(file_path, 'wb') as buffer:
            while content := await file.read(1024 * 1024): # Read in 1MB chunks
                await buffer.write(content)

        jobs[job_id] = ClassificationJob(job_id)
        background_tasks.add_task(process_csv_background, job_id, file_path)

        return {"job_id": job_id, "status": JobStatus.PENDING}

    except Exception as e:
        logger.error(f"Error during file upload for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Retrieves the status of a classification job."""
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    response = {"job_id": job.job_id, "status": job.status}
    if job.error:
        response["error"] = job.error
    return response

@app.get("/results/{job_id}")
async def get_results(job_id: str):
    """Retrieves the results of a completed classification job."""
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.status == JobStatus.FAILED:
        return JSONResponse(status_code=500, content={"job_id": job_id, "error": job.error})

    if job.status != JobStatus.COMPLETED:
        return JSONResponse(status_code=202, content={"job_id": job_id, "status": job.status})

    return {
        "job_id": job.job_id,
        "status": job.status,
        "completed_at": job.completed_at.isoformat(),
        "results": job.results,
        "summary": job.summary
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
