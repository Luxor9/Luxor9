from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import asyncio

# Import our GitHub service
from github_service import (
    GitHubService, 
    RepositoryIntegrator, 
    GitHubRepository, 
    IntegrationJob,
    get_github_service
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
repositories_collection = db.repositories
jobs_collection = db.integration_jobs

# Create the main app without a prefix
app = FastAPI(title="GitHub Repository Integration System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class RepositorySelection(BaseModel):
    repository_ids: List[str]

class IntegrationJobResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    log_messages: List[str]
    conflicts: List[Dict[str, Any]]
    output_path: Optional[str] = None

# Store running jobs in memory (in production, use Redis or database)
running_jobs: Dict[str, IntegrationJob] = {}

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "GitHub Repository Integration System"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# GitHub repository endpoints
@api_router.get("/repositories", response_model=List[GitHubRepository])
async def get_repositories():
    """Get all repositories for the authenticated user"""
    try:
        async with await get_github_service() as github_service:
            repositories = await github_service.get_user_repositories()
            
            # Store/update repositories in database
            for repo in repositories:
                await repositories_collection.replace_one(
                    {"github_id": repo.github_id},
                    repo.dict(),
                    upsert=True
                )
            
            return repositories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching repositories: {str(e)}")

@api_router.get("/repositories/{repo_id}")
async def get_repository(repo_id: str):
    """Get a specific repository"""
    repo = await repositories_collection.find_one({"id": repo_id})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo

@api_router.post("/repositories/select")
async def select_repositories(selection: RepositorySelection):
    """Mark repositories as selected for integration"""
    try:
        result = await repositories_collection.update_many(
            {"id": {"$in": selection.repository_ids}},
            {"$set": {"selected": True}}
        )
        
        return {
            "message": f"Selected {result.modified_count} repositories",
            "selected_count": result.modified_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error selecting repositories: {str(e)}")

@api_router.post("/integration/start", response_model=IntegrationJobResponse)
async def start_integration(background_tasks: BackgroundTasks, selection: RepositorySelection):
    """Start integration of selected repositories"""
    try:
        # Get selected repositories
        selected_repos = []
        for repo_id in selection.repository_ids:
            repo_data = await repositories_collection.find_one({"id": repo_id})
            if repo_data:
                selected_repos.append(GitHubRepository(**repo_data))
        
        if not selected_repos:
            raise HTTPException(status_code=400, detail="No valid repositories selected")
        
        # Create job
        job_id = str(uuid.uuid4())
        job = IntegrationJob(
            id=job_id,
            repositories=selection.repository_ids,
            status="pending"
        )
        
        # Store job in memory and database
        running_jobs[job_id] = job
        await jobs_collection.insert_one(job.dict())
        
        # Start background integration
        background_tasks.add_task(run_integration, job_id, selected_repos)
        
        return IntegrationJobResponse(
            job_id=job_id,
            status=job.status,
            progress=job.progress,
            log_messages=job.log_messages,
            conflicts=job.conflicts
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting integration: {str(e)}")

@api_router.get("/integration/{job_id}", response_model=IntegrationJobResponse)
async def get_integration_status(job_id: str):
    """Get the status of an integration job"""
    job = running_jobs.get(job_id)
    if not job:
        # Try to load from database
        job_data = await jobs_collection.find_one({"id": job_id})
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        job = IntegrationJob(**job_data)
    
    return IntegrationJobResponse(
        job_id=job_id,
        status=job.status,
        progress=job.progress,
        log_messages=job.log_messages,
        conflicts=job.conflicts,
        output_path=job.output_path
    )

@api_router.get("/integration/{job_id}/download")
async def download_integration_result(job_id: str):
    """Download the integrated repository as a ZIP file"""
    job = running_jobs.get(job_id)
    if not job:
        job_data = await jobs_collection.find_one({"id": job_id})
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        job = IntegrationJob(**job_data)
    
    if job.status != "completed" or not job.output_path:
        raise HTTPException(status_code=400, detail="Integration not completed or no output available")
    
    if not os.path.exists(job.output_path):
        raise HTTPException(status_code=404, detail="Output file not found")
    
    return FileResponse(
        path=job.output_path,
        filename=f"integrated_repo_{job_id}.zip",
        media_type="application/zip"
    )

# Background task to run integration
async def run_integration(job_id: str, repositories: List[GitHubRepository]):
    """Background task to run repository integration"""
    try:
        job = running_jobs[job_id]
        job.status = "running"
        job.updated_at = datetime.utcnow()
        
        # Update job in database
        await jobs_collection.replace_one(
            {"id": job_id},
            job.dict()
        )
        
        # Run integration
        async with await get_github_service() as github_service:
            integrator = RepositoryIntegrator(github_service)
            result_job = await integrator.integrate_repositories(repositories, job_id)
            
            # Update job with results
            running_jobs[job_id] = result_job
            await jobs_collection.replace_one(
                {"id": job_id},
                result_job.dict()
            )
            
            # Cleanup
            integrator.cleanup()
            
    except Exception as e:
        # Update job with error
        job = running_jobs.get(job_id)
        if job:
            job.status = "failed"
            job.log_messages.append(f"Integration failed: {str(e)}")
            job.updated_at = datetime.utcnow()
            
            await jobs_collection.replace_one(
                {"id": job_id},
                job.dict()
            )
        
        logging.error(f"Integration failed for job {job_id}: {e}")

# Original status check endpoints
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
