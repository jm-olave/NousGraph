from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import uuid
import os
import logging
from datetime import datetime
from typing import List, Dict, Any
import aiofiles
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Medical Paper Classification API",
    description="API for classifying medical papers using PubMedBERT",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js dev and prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo (replace with database in production)
jobs = {}
results = {}

# Constants
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {'.csv'}
UPLOAD_DIR = "uploads"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ClassificationResult:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.status = JobStatus.PENDING
        self.created_at = datetime.utcnow()
        self.completed_at = None
        self.results = []
        self.error = None

def validate_csv_file(file: UploadFile) -> bool:
    """Validate uploaded CSV file"""
    if not file.filename.lower().endswith('.csv'):
        return False

    if file.size > MAX_FILE_SIZE:
        return False

    return True

async def save_upload_file(file: UploadFile) -> str:
    """Save uploaded file and return file path"""
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    async with aiofiles.open(file_path, 'wb') as buffer:
        content = await file.read()
        await buffer.write(content)

    return file_path

def process_csv_background(job_id: str, file_path: str):
    """Background task to process CSV file"""
    try:
        # Update job status
        jobs[job_id].status = JobStatus.PROCESSING
        logger.info(f"Started processing job {job_id}")

        # Read CSV file
        df = pd.read_csv(file_path, sep=None, engine='python')  # Auto-detect separator

        # Validate required columns
        required_columns = ['title', 'abstract']
        if not all(col in df.columns for col in required_columns):
            raise ValueError(f"CSV must contain columns: {', '.join(required_columns)}")

        # Process each row
        classifications = []
        categories = ['neurological', 'cardiovascular', 'hepatorenal', 'oncological']

        for idx, row in df.iterrows():
            # Combine title and abstract
            text = f"{row['title']} [SEP] {row['abstract']}"

            # Mock classification (replace with actual model inference)
            # In real implementation, this would call the model service
            mock_predictions = []
            for i, category in enumerate(categories):
                confidence = 0.1 + (idx * 0.1 + i * 0.2) % 0.8  # Mock confidence
                if confidence > 0.5:
                    mock_predictions.append({
                        'category': category,
                        'confidence': round(confidence, 3)
                    })

            classifications.append({
                'id': idx,
                'title': str(row['title']),
                'abstract': str(row['abstract'])[:200] + "..." if len(str(row['abstract'])) > 200 else str(row['abstract']),
                'predictions': mock_predictions,
                'group': str(row.get('group', 'unknown'))
            })

        # Calculate summary statistics
        category_counts = {}
        for classification in classifications:
            for pred in classification['predictions']:
                category = pred['category']
                category_counts[category] = category_counts.get(category, 0) + 1

        summary = {
            'total_papers': len(classifications),
            'categories': category_counts,
            'processed_at': datetime.utcnow().isoformat()
        }

        # Store results
        jobs[job_id].status = JobStatus.COMPLETED
        jobs[job_id].completed_at = datetime.utcnow()
        jobs[job_id].results = classifications
        jobs[job_id].summary = summary

        logger.info(f"Completed processing job {job_id}")

    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        jobs[job_id].status = JobStatus.FAILED
        jobs[job_id].error = str(e)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Medical Paper Classification API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/upload")
async def upload_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    options: str = None
):
    """Upload and process CSV file"""
    try:
        # Validate file
        if not validate_csv_file(file):
            raise HTTPException(
                status_code=400,
                detail="Invalid file. Must be CSV format and under 50MB."
            )

        # Generate job ID
        job_id = str(uuid.uuid4())

        # Save uploaded file
        file_path = await save_upload_file(file)

        # Create job record
        jobs[job_id] = ClassificationResult(job_id)

        # Start background processing
        background_tasks.add_task(process_csv_background, job_id, file_path)

        return {
            "job_id": job_id,
            "message": "File uploaded successfully. Processing started.",
            "status": "processing"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get processing status for a job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job.status,
        "created_at": job.created_at.isoformat(),
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "error": job.error
    }

@app.get("/results/{job_id}")
async def get_results(job_id: str):
    """Get classification results for a job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]

    if job.status == JobStatus.FAILED:
        raise HTTPException(status_code=500, detail=f"Processing failed: {job.error}")

    if job.status != JobStatus.COMPLETED:
        return JSONResponse(
            status_code=202,
            content={
                "job_id": job_id,
                "status": job.status,
                "message": "Processing not yet completed"
            }
        )

    return {
        "job_id": job_id,
        "status": job.status,
        "results": job.results,
        "summary": job.summary
    }

@app.get("/jobs")
async def list_jobs():
    """List all jobs"""
    return {
        "jobs": [
            {
                "job_id": job_id,
                "status": job.status,
                "created_at": job.created_at.isoformat(),
                "completed_at": job.completed_at.isoformat() if job.completed_at else None
            }
            for job_id, job in jobs.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)