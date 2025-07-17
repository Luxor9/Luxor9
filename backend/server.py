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
import json
import asyncio
import shutil
import tempfile
import zipfile
import aiofiles
import aiohttp
from github import Github
from git import Repo
import git


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# GitHub connection
github_token = os.environ['GITHUB_TOKEN']
github_client = Github(github_token)

# Create the main app without a prefix
app = FastAPI(title="GitHub Repository Orchestration System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Directory for temporary files
TEMP_DIR = Path("/tmp/github_orchestration")
TEMP_DIR.mkdir(exist_ok=True)

# Models
class GitHubRepository(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    github_id: int
    name: str
    full_name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    size: int = 0
    private: bool = False
    html_url: str
    clone_url: str
    default_branch: str = "main"
    created_at: datetime
    updated_at: datetime
    fetched_at: datetime = Field(default_factory=datetime.utcnow)

class IntegrationJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    repository_ids: List[str]
    status: str = "pending"  # pending, running, completed, failed
    progress: int = 0
    total_repos: int = 0
    current_repo: Optional[str] = None
    error_message: Optional[str] = None
    conflicts: List[Dict[str, Any]] = []
    output_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class IntegrationJobCreate(BaseModel):
    name: str
    repository_ids: List[str]

class IntegrationJobStatus(BaseModel):
    id: str
    name: str
    status: str
    progress: int
    total_repos: int
    current_repo: Optional[str] = None
    error_message: Optional[str] = None
    conflicts: List[Dict[str, Any]] = []
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# GitHub API endpoints
@api_router.get("/")
async def root():
    return {"message": "GitHub Repository Orchestration System API"}

@api_router.post("/repositories/fetch")
async def fetch_repositories():
    """Fetch all repositories from GitHub and store in database"""
    try:
        user = github_client.get_user()
        repos = user.get_repos()
        
        repository_list = []
        
        for repo in repos:
            repo_data = GitHubRepository(
                github_id=repo.id,
                name=repo.name,
                full_name=repo.full_name,
                description=repo.description,
                language=repo.language,
                stars=repo.stargazers_count,
                forks=repo.forks_count,
                size=repo.size,
                private=repo.private,
                html_url=repo.html_url,
                clone_url=repo.clone_url,
                default_branch=repo.default_branch or "main",
                created_at=repo.created_at,
                updated_at=repo.updated_at
            )
            repository_list.append(repo_data)
        
        # Clear existing repositories and insert new ones
        await db.repositories.delete_many({})
        if repository_list:
            repo_dicts = [repo.dict() for repo in repository_list]
            await db.repositories.insert_many(repo_dicts)
        
        logger.info(f"Fetched and stored {len(repository_list)} repositories")
        return {"message": f"Successfully fetched {len(repository_list)} repositories"}
        
    except Exception as e:
        logger.error(f"Error fetching repositories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch repositories: {str(e)}")

@api_router.get("/repositories", response_model=List[GitHubRepository])
async def get_repositories():
    """Get all repositories from database"""
    try:
        repos = await db.repositories.find().to_list(1000)
        return [GitHubRepository(**repo) for repo in repos]
    except Exception as e:
        logger.error(f"Error getting repositories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get repositories: {str(e)}")

@api_router.get("/repositories/{repo_id}", response_model=GitHubRepository)
async def get_repository(repo_id: str):
    """Get a specific repository"""
    try:
        repo = await db.repositories.find_one({"id": repo_id})
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")
        return GitHubRepository(**repo)
    except Exception as e:
        logger.error(f"Error getting repository {repo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get repository: {str(e)}")

# Integration endpoints
@api_router.post("/integration/jobs", response_model=IntegrationJob)
async def create_integration_job(job_data: IntegrationJobCreate, background_tasks: BackgroundTasks):
    """Create a new integration job"""
    try:
        # Validate repository IDs
        repo_count = await db.repositories.count_documents({"id": {"$in": job_data.repository_ids}})
        if repo_count != len(job_data.repository_ids):
            raise HTTPException(status_code=400, detail="One or more repository IDs are invalid")
        
        job = IntegrationJob(
            name=job_data.name,
            repository_ids=job_data.repository_ids,
            total_repos=len(job_data.repository_ids)
        )
        
        # Store job in database
        await db.integration_jobs.insert_one(job.dict())
        
        # Start background task
        background_tasks.add_task(process_integration_job, job.id)
        
        logger.info(f"Created integration job {job.id} with {len(job_data.repository_ids)} repositories")
        return job
        
    except Exception as e:
        logger.error(f"Error creating integration job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create integration job: {str(e)}")

@api_router.get("/integration/jobs", response_model=List[IntegrationJobStatus])
async def get_integration_jobs():
    """Get all integration jobs"""
    try:
        jobs = await db.integration_jobs.find().sort("created_at", -1).to_list(100)
        return [IntegrationJobStatus(**job) for job in jobs]
    except Exception as e:
        logger.error(f"Error getting integration jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get integration jobs: {str(e)}")

@api_router.get("/integration/jobs/{job_id}", response_model=IntegrationJobStatus)
async def get_integration_job(job_id: str):
    """Get a specific integration job"""
    try:
        job = await db.integration_jobs.find_one({"id": job_id})
        if not job:
            raise HTTPException(status_code=404, detail="Integration job not found")
        return IntegrationJobStatus(**job)
    except Exception as e:
        logger.error(f"Error getting integration job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get integration job: {str(e)}")

@api_router.get("/integration/jobs/{job_id}/download")
async def download_integration_result(job_id: str):
    """Download the integrated repository as a ZIP file"""
    try:
        job = await db.integration_jobs.find_one({"id": job_id})
        if not job:
            raise HTTPException(status_code=404, detail="Integration job not found")
        
        if job["status"] != "completed":
            raise HTTPException(status_code=400, detail="Integration job is not completed")
        
        if not job.get("output_path") or not os.path.exists(job["output_path"]):
            raise HTTPException(status_code=404, detail="Integration result file not found")
        
        return FileResponse(
            path=job["output_path"],
            filename=f"{job['name']}-integration.zip",
            media_type="application/zip"
        )
        
    except Exception as e:
        logger.error(f"Error downloading integration result {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download integration result: {str(e)}")

# Background task for processing integration jobs
async def process_integration_job(job_id: str):
    """Process an integration job in the background"""
    try:
        # Update job status to running
        await db.integration_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": "running", "started_at": datetime.utcnow()}}
        )
        
        # Get job details
        job = await db.integration_jobs.find_one({"id": job_id})
        if not job:
            logger.error(f"Integration job {job_id} not found")
            return
        
        # Get repositories
        repos = await db.repositories.find({"id": {"$in": job["repository_ids"]}}).to_list(1000)
        
        # Create temporary directory for integration
        integration_dir = TEMP_DIR / f"integration_{job_id}"
        integration_dir.mkdir(exist_ok=True)
        
        conflicts = []
        processed_repos = 0
        
        for repo in repos:
            try:
                # Update current repo
                await db.integration_jobs.update_one(
                    {"id": job_id},
                    {"$set": {"current_repo": repo["name"]}}
                )
                
                # Clone repository
                repo_dir = integration_dir / repo["name"]
                logger.info(f"Cloning repository {repo['name']} to {repo_dir}")
                
                # Clone with authentication
                clone_url = repo["clone_url"].replace("https://", f"https://{github_token}@")
                git_repo = Repo.clone_from(clone_url, repo_dir)
                
                # Remove .git directory to avoid conflicts
                git_dir = repo_dir / ".git"
                if git_dir.exists():
                    shutil.rmtree(git_dir)
                
                processed_repos += 1
                progress = int((processed_repos / len(repos)) * 100)
                
                # Update progress
                await db.integration_jobs.update_one(
                    {"id": job_id},
                    {"$set": {"progress": progress}}
                )
                
                logger.info(f"Successfully processed repository {repo['name']}")
                
            except Exception as e:
                logger.error(f"Error processing repository {repo['name']}: {str(e)}")
                conflicts.append({
                    "repository": repo["name"],
                    "error": str(e),
                    "type": "clone_error"
                })
        
        # Create ZIP file
        zip_path = TEMP_DIR / f"{job['name']}-integration.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(integration_dir):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(integration_dir)
                    zipf.write(file_path, arcname)
        
        # Update job as completed
        await db.integration_jobs.update_one(
            {"id": job_id},
            {
                "$set": {
                    "status": "completed",
                    "progress": 100,
                    "completed_at": datetime.utcnow(),
                    "conflicts": conflicts,
                    "output_path": str(zip_path),
                    "current_repo": None
                }
            }
        )
        
        # Clean up temporary directory
        shutil.rmtree(integration_dir)
        
        logger.info(f"Integration job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error processing integration job {job_id}: {str(e)}")
        await db.integration_jobs.update_one(
            {"id": job_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": str(e),
                    "completed_at": datetime.utcnow(),
                    "current_repo": None
                }
            }
        )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()