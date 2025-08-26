# Medical Paper Classification System

Containerized web application for classifying medical papers using a fine-tuned PubMedBERT model. Upload CSVs and get per-paper probabilities across four categories: neurological, cardiovascular, hepatorenal, and oncological.

Key updates:
- Complete training pipeline is documented and implemented in [python.def train_optimized_medical_classifier()](last_v2.ipynb:982) within [last_v2.ipynb](last_v2.ipynb).
- EDA and feature engineering are documented in [markdown.## Step 2: Exploratory Data Analysis (EDA)](DataAnalysis.ipynb:63) within [DataAnalysis.ipynb](DataAnalysis.ipynb).
- Initial UI design prototype was explored with v0: https://v0-medical-paper-classification.vercel.app/; the fully functional UI runs in the Dockerized Next.js app in this repository.

## Architecture Overview

This project uses a multi-service architecture orchestrated with Docker Compose:

```mermaid
graph TB
    A[Next.js Frontend (ui)] -->|HTTP| B[FastAPI API (api)]
    B -->|HTTP JSON| C[Model Service (model)]
    B -->|SQL| D[(PostgreSQL)]
    A -->|CSV upload| B
    B -->|Results JSON| A

    subgraph "Docker Network"
        A
        B
        C
        D
    end
```

### Components (as implemented)

- Frontend (Next.js)
  - Location: `/ui`
  - Tech: Next.js 14 (app router), React, TypeScript, TailwindCSS
  - Notable files: [typescript.export default function Page()](ui/app/page.tsx), [typescript.export function ClientBody()](ui/app/ClientBody.tsx), [typescript.export default function MedicalEdaDashboard()](ui/components/medical-eda-dashboard.tsx), and dashboard components under `/ui/components/dashboard/*`.
  - Role: CSV upload, progress, and results visualization.

- Backend API (FastAPI)
  - Location: `/api`
  - Entry: [python.app = FastAPI(...)](api/main.py:22)
  - Endpoints: [python.@app.post("/upload")](api/main.py:151), [python.@app.get("/status/{job_id}")](api/main.py:177), [python.@app.get("/results/{job_id}")](api/main.py:189), [python.@app.post("/classify-text")](api/main.py:144), [python.@app.get("/")](api/main.py:140)
  - Coordinates CSV processing and calls the model service in batches via [python.async def call_model_service()](api/main.py:70)

- Model Service (FastAPI)
  - Location: `/model`
  - Entry: [python.app = FastAPI(...)](model/model_service.py:17)
  - Endpoint: [python.@app.post("/classify")](model/model_service.py:62)
  - Loads a fine-tuned PubMedBERT model from `./my_medical_model` inside the container (see setup below).

- Database (PostgreSQL)
  - Provided by `docker-compose.yml`. Current API implementation stores job state in-memory for the demo flow; a DB connection string is wired for future persistence.

## Project Structure (actual)

```
.
├── api/
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── model/
│   ├── Dockerfile
│   ├── model_service.py
│   └── requirements.txt
├── ui/
│   ├── Dockerfile
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── eda/page.tsx
│   ├── components/
│   │   ├── navigation.tsx
│   │   ├── medical-eda-dashboard.tsx
│   │   └── dashboard/{file-upload,progress-tracker,results-panel}.tsx
│   ├── components/ui/*.tsx
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docker-compose.yml
├── last_v2.ipynb                # Full model training pipeline
├── DataAnalysis.ipynb           # Full EDA
├── requirements.txt
└── README.md
```

Notes:
- The earlier README referenced nested API modules (app/, models.py, routes/). The current code uses a single-file FastAPI entry at `/api/main.py`.
- The model service expects the trained model artifacts to be available at runtime inside `/model/my_medical_model` (see Setup).

## Notebooks

- Training pipeline: [python.def train_optimized_medical_classifier()](last_v2.ipynb:982) inside [last_v2.ipynb](last_v2.ipynb) implements:
  - Multi-label classification with PubMedBERT
  - Data augmentation tailored to multi-organ co-occurrence
  - Class weighting via [python.def calculate_class_weights()](last_v2.ipynb:254)
  - Custom trainer with BCE-with-logits weighted loss via [python.class ImprovedTrainer(Trainer)](last_v2.ipynb:211)
  - Evaluation metrics via [python.def compute_multilabel_metrics()](last_v2.ipynb:98)
  - Saves model to `./pubmedbert-medical-v6`
  - Provides a packaging snippet to export minimal artifacts to `my_medical_model.zip` for deployment

- EDA: [markdown.## Step 2: Exploratory Data Analysis (EDA)](DataAnalysis.ipynb:63) inside [DataAnalysis.ipynb](DataAnalysis.ipynb) covers:
  - Dataset inspection, target distribution, imbalance analysis
  - Visualizations (bar, pie, word clouds)
  - Recommendations for modeling and handling imbalance
  - Basic feature engineering preparation

## Prototype vs. Production UI

- Prototype: v0-based first impression (design exploration) at https://v0-medical-paper-classification.vercel.app/
- Production: The complete, functional UI is the Dockerized Next.js app under `/ui`. All project functionality runs within the Docker containers defined in `docker-compose.yml`.

## CSV Format

The system expects CSV files with at least:
- Columns: title, abstract
- Optional: group (for reference/labeling)

Delimiters are auto-detected during API parsing. Example:

```csv
title,abstract,group
"Paper Title","Abstract text...","neurological|cardiovascular"
```

Limits:
- Max upload size: 50MB
- Texts are tokenized to max_length=512 in the model service

## End-to-end Docker Setup

Prerequisites:
- Docker Desktop with Docker Compose
- 8GB+ RAM recommended
- Internet access if building images that fetch dependencies

1) Prepare environment files (optional but recommended)
- Frontend (/ui/.env.local):
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_MAX_FILE_SIZE=52428800
  ```
- Backend (/api/.env) or docker-compose environment section:
  ```
  DATABASE_URL=postgresql://classifier:password@db:5432/medical_classifier
  MODEL_URL=http://model:8080
  UPLOAD_DIR=/app/uploads
  ```
  Important: MODEL_URL must be http://model:8080 when using Docker so the API can reach the model service on the Docker network (default fallback http://localhost:8080 only works when running model locally on host, not in Compose).
- Model Service: No env required if you provide the model at ./model/my_medical_model. It loads from that path at startup.

2) Provide the trained model artifacts
The model service looks for artifacts under ./model/my_medical_model (inside the container, relative to /app). Place the minimal HuggingFace-compatible files there:
- config.json
- model.safetensors (or pytorch_model.bin)
- tokenizer.json
- tokenizer_config.json
- vocab.txt (for uncased BERT)
- special_tokens_map.json

Two ways to provide them:
- a) Copy the exported model dir from training: If you trained with [python.def train_optimized_medical_classifier()](last_v2.ipynb:982), it saved to ./pubmedbert-medical-v6. Copy its contents into ./model/my_medical_model.
- b) Use the provided packaging code in [python.files_needed](last_v2.ipynb:1424) to make my_medical_model.zip, extract into ./model/my_medical_model.

Resulting tree (host):
```
model/
  my_medical_model/
    config.json
    model.safetensors
    tokenizer.json
    tokenizer_config.json
    vocab.txt
    special_tokens_map.json
```

3) Build and run with Docker Compose
From repo root:
```
docker-compose up --build
```

This will start:
- Frontend at http://localhost:3000
- Backend at http://localhost:8000 (docs at /docs)
- Model at http://localhost:8080 (health at /health)
- PostgreSQL at localhost:5432 (db named medical_classifier)

4) Verify services
- Model health: GET http://localhost:8080/health
  - Should return model_status: "loaded". If "not loaded", re-check step 2 path and files.
- API root: GET http://localhost:8000/
- API docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

5) Use the app
- Open the frontend
- Upload a CSV with columns title, abstract
- Track progress and view results

6) Optional: Persist volumes
docker-compose.yml defines named volumes:
- postgres_data for DB state
- uploads for API upload directory
- model_cache for model cache (if used by the model container)

## Configuration Reference

- Frontend
  - Port: 3000
  - Dockerfile builds the Next app: [docker.Dockerfile](ui/Dockerfile:1)
- Backend
  - Env: MODEL_URL must point to model service (http://model:8080)
  - Upload dir: /app/uploads (bind-mounted volume)
  - Batch size in processing: 32 in [python.for i in range(0, len(texts_to_classify), batch_size)](api/main.py:101)
- Model Service
  - Loads from ./my_medical_model at startup: [python.MODEL_PATH = "./my_medical_model"](model/model_service.py:14)
  - Categories: [python.CATEGORIES = ['neurological','cardiovascular','hepatorenal','oncological']](model/model_service.py:60)

## API Quick Reference

- Upload CSV
  - [python.@app.post("/upload")](api/main.py:151)
  - Response includes job_id
- Check status
  - [python.@app.get("/status/{job_id}")](api/main.py:177)
- Fetch results
  - [python.@app.get("/results/{job_id}")](api/main.py:189)
- Single text classify
  - [python.@app.post("/classify-text")](api/main.py:144)

## Troubleshooting

- Backend cannot reach model service in Docker
  - Symptom: 503 from API, logs show model service unavailable.
  - Likely cause: MODEL_URL not set to http://model:8080.
  - Fix: Set MODEL_URL=http://model:8080 in backend environment (Compose or .env) and restart.

- Model service shows "model not loaded"
  - Ensure ./model/my_medical_model contains all required files listed above.
  - File names must match HuggingFace expectations.
  - Rebuild container if files changed.

- CSV parsing errors
  - Ensure columns title and abstract exist (API enforces this in [python.if 'title' not in df.columns or 'abstract' not in df.columns:](api/main.py:92)).
  - The API uses pandas engine='python' with sep=None for auto delimiter detection.

## License

MIT

## Acknowledgments

- Initial UI design exploration via v0 prototype: https://v0-medical-paper-classification.vercel.app/
- Based on PubMedBERT: microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext