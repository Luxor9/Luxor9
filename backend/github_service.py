import os
import asyncio
import aiofiles
import tempfile
import shutil
from typing import List, Dict, Optional, Any
from pathlib import Path
import httpx
from datetime import datetime
from git import Repo, GitCommandError
import logging
from pydantic import BaseModel, Field
import uuid
import json

logger = logging.getLogger(__name__)

class GitHubRepository(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    github_id: int
    name: str
    full_name: str
    description: Optional[str] = None
    html_url: str
    clone_url: str
    default_branch: str
    language: Optional[str] = None
    size: int
    created_at: datetime
    updated_at: datetime
    pushed_at: datetime
    stargazers_count: int
    watchers_count: int
    forks_count: int
    open_issues_count: int
    private: bool
    selected: bool = False

class IntegrationJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    repositories: List[str]  # List of repository IDs
    status: str = "pending"  # pending, running, completed, failed
    progress: int = 0
    log_messages: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    output_path: Optional[str] = None
    conflicts: List[Dict[str, Any]] = []

class GitHubService:
    def __init__(self, token: str):
        self.token = token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        self.session = None
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(headers=self.headers)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
    
    async def get_user_repositories(self, per_page: int = 100, page: int = 1) -> List[GitHubRepository]:
        """Fetch repositories for the authenticated user"""
        try:
            response = await self.session.get(
                f"{self.base_url}/user/repos",
                params={
                    "per_page": per_page,
                    "page": page,
                    "sort": "updated",
                    "direction": "desc"
                }
            )
            response.raise_for_status()
            
            repos_data = response.json()
            repositories = []
            
            for repo_data in repos_data:
                repo = GitHubRepository(
                    github_id=repo_data["id"],
                    name=repo_data["name"],
                    full_name=repo_data["full_name"],
                    description=repo_data.get("description"),
                    html_url=repo_data["html_url"],
                    clone_url=repo_data["clone_url"],
                    default_branch=repo_data["default_branch"],
                    language=repo_data.get("language"),
                    size=repo_data["size"],
                    created_at=datetime.fromisoformat(repo_data["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(repo_data["updated_at"].replace('Z', '+00:00')),
                    pushed_at=datetime.fromisoformat(repo_data["pushed_at"].replace('Z', '+00:00')),
                    stargazers_count=repo_data["stargazers_count"],
                    watchers_count=repo_data["watchers_count"],
                    forks_count=repo_data["forks_count"],
                    open_issues_count=repo_data["open_issues_count"],
                    private=repo_data["private"]
                )
                repositories.append(repo)
            
            return repositories
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching repositories: {e}")
            raise
        except Exception as e:
            logger.error(f"Error fetching repositories: {e}")
            raise
    
    async def get_repository_contents(self, repo_full_name: str, path: str = "") -> List[Dict[str, Any]]:
        """Get repository contents"""
        try:
            response = await self.session.get(
                f"{self.base_url}/repos/{repo_full_name}/contents/{path}"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching contents for {repo_full_name}: {e}")
            raise
    
    async def clone_repository(self, repo_url: str, target_path: str) -> Dict[str, Any]:
        """Clone a repository to target path"""
        try:
            # Use authenticated clone URL
            auth_url = repo_url.replace("https://", f"https://{self.token}@")
            
            # Clone the repository
            repo = await asyncio.to_thread(
                Repo.clone_from,
                auth_url,
                target_path,
                depth=1
            )
            
            # Get basic repo info
            branches = [str(branch) for branch in repo.branches]
            
            return {
                "path": target_path,
                "branches": branches,
                "status": "success"
            }
            
        except GitCommandError as e:
            logger.error(f"Git error cloning {repo_url}: {e}")
            return {
                "path": target_path,
                "error": str(e),
                "status": "failed"
            }
        except Exception as e:
            logger.error(f"Error cloning {repo_url}: {e}")
            return {
                "path": target_path,
                "error": str(e),
                "status": "failed"
            }

class RepositoryIntegrator:
    def __init__(self, github_service: GitHubService):
        self.github_service = github_service
        self.work_dir = Path(tempfile.mkdtemp(prefix="repo_integration_"))
        
    async def integrate_repositories(self, repositories: List[GitHubRepository], job_id: str) -> IntegrationJob:
        """Integrate multiple repositories into a single structure"""
        job = IntegrationJob(
            id=job_id,
            repositories=[repo.id for repo in repositories],
            status="running",
            progress=0
        )
        
        try:
            # Create integration directory
            integration_dir = self.work_dir / "integrated_repo"
            integration_dir.mkdir(parents=True, exist_ok=True)
            
            job.log_messages.append(f"Starting integration of {len(repositories)} repositories")
            
            # Clone each repository
            cloned_repos = []
            for i, repo in enumerate(repositories):
                try:
                    job.log_messages.append(f"Cloning repository: {repo.name}")
                    
                    repo_dir = self.work_dir / f"repo_{i}_{repo.name}"
                    clone_result = await self.github_service.clone_repository(
                        repo.clone_url,
                        str(repo_dir)
                    )
                    
                    if clone_result["status"] == "success":
                        cloned_repos.append({
                            "repo": repo,
                            "path": repo_dir,
                            "clone_result": clone_result
                        })
                        job.log_messages.append(f"Successfully cloned: {repo.name}")
                    else:
                        job.log_messages.append(f"Failed to clone {repo.name}: {clone_result.get('error', 'Unknown error')}")
                        
                except Exception as e:
                    job.log_messages.append(f"Error cloning {repo.name}: {str(e)}")
                    
                # Update progress
                job.progress = int((i + 1) / len(repositories) * 50)  # First 50% for cloning
            
            # Integrate the cloned repositories
            await self._merge_repositories(cloned_repos, integration_dir, job)
            
            # Create final archive
            output_path = await self._create_archive(integration_dir, job_id)
            job.output_path = output_path
            
            job.status = "completed"
            job.progress = 100
            job.log_messages.append("Integration completed successfully")
            
        except Exception as e:
            job.status = "failed"
            job.log_messages.append(f"Integration failed: {str(e)}")
            logger.error(f"Integration failed for job {job_id}: {e}")
            
        finally:
            job.updated_at = datetime.utcnow()
            
        return job
    
    async def _merge_repositories(self, cloned_repos: List[Dict], integration_dir: Path, job: IntegrationJob):
        """Merge cloned repositories into integrated structure"""
        total_files = 0
        processed_files = 0
        
        # First pass: count files
        for repo_data in cloned_repos:
            repo_path = Path(repo_data["path"])
            for file_path in repo_path.rglob("*"):
                if file_path.is_file() and not self._should_ignore_file(file_path):
                    total_files += 1
        
        # Second pass: merge files
        for repo_data in cloned_repos:
            repo = repo_data["repo"]
            repo_path = Path(repo_data["path"])
            
            # Create subdirectory for this repository
            repo_target_dir = integration_dir / repo.name
            repo_target_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy files
            for file_path in repo_path.rglob("*"):
                if file_path.is_file() and not self._should_ignore_file(file_path):
                    relative_path = file_path.relative_to(repo_path)
                    target_file = repo_target_dir / relative_path
                    
                    # Create parent directories
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Handle conflicts
                    if target_file.exists():
                        conflict_info = {
                            "file": str(relative_path),
                            "repositories": [repo.name],
                            "resolution": "kept_first"
                        }
                        job.conflicts.append(conflict_info)
                    else:
                        # Copy file
                        shutil.copy2(file_path, target_file)
                    
                    processed_files += 1
                    
                    # Update progress (50-90% for merging)
                    if total_files > 0:
                        merge_progress = int((processed_files / total_files) * 40)  # 40% for merging
                        job.progress = 50 + merge_progress
        
        # Create integration metadata
        await self._create_integration_metadata(integration_dir, cloned_repos, job)
        
        job.log_messages.append(f"Merged {processed_files} files with {len(job.conflicts)} conflicts")
    
    def _should_ignore_file(self, file_path: Path) -> bool:
        """Check if file should be ignored during integration"""
        ignore_patterns = {
            ".git",
            ".gitignore",
            "node_modules",
            ".venv",
            "__pycache__",
            ".pytest_cache",
            ".DS_Store",
            ".env"
        }
        
        return any(pattern in str(file_path) for pattern in ignore_patterns)
    
    async def _create_integration_metadata(self, integration_dir: Path, cloned_repos: List[Dict], job: IntegrationJob):
        """Create metadata file for the integration"""
        metadata = {
            "integration_id": job.id,
            "created_at": job.created_at.isoformat(),
            "repositories": [
                {
                    "name": repo_data["repo"].name,
                    "full_name": repo_data["repo"].full_name,
                    "url": repo_data["repo"].html_url,
                    "language": repo_data["repo"].language,
                    "size": repo_data["repo"].size
                }
                for repo_data in cloned_repos
            ],
            "conflicts": job.conflicts,
            "total_repositories": len(cloned_repos),
            "integration_summary": {
                "total_files": sum(
                    len(list(Path(repo_data["path"]).rglob("*")))
                    for repo_data in cloned_repos
                ),
                "conflicts_count": len(job.conflicts)
            }
        }
        
        metadata_file = integration_dir / "integration_metadata.json"
        async with aiofiles.open(metadata_file, "w") as f:
            await f.write(json.dumps(metadata, indent=2))
        
        # Create README for the integrated repository
        readme_content = f"""# Integrated Repository

This repository contains the integration of {len(cloned_repos)} repositories.

## Integration Details

- **Integration ID**: {job.id}
- **Created**: {job.created_at.isoformat()}
- **Total Repositories**: {len(cloned_repos)}
- **Conflicts**: {len(job.conflicts)}

## Included Repositories

"""
        
        for repo_data in cloned_repos:
            repo = repo_data["repo"]
            readme_content += f"- **{repo.name}** - {repo.description or 'No description'}\n"
            readme_content += f"  - URL: {repo.html_url}\n"
            readme_content += f"  - Language: {repo.language or 'Unknown'}\n\n"
        
        if job.conflicts:
            readme_content += "\n## Conflicts Encountered\n\n"
            for conflict in job.conflicts:
                readme_content += f"- **{conflict['file']}** - {conflict['resolution']}\n"
        
        readme_file = integration_dir / "README.md"
        async with aiofiles.open(readme_file, "w") as f:
            await f.write(readme_content)
    
    async def _create_archive(self, integration_dir: Path, job_id: str) -> str:
        """Create a ZIP archive of the integrated repository"""
        archive_path = f"/tmp/integrated_repo_{job_id}.zip"
        
        # Create archive
        await asyncio.to_thread(
            shutil.make_archive,
            archive_path.replace('.zip', ''),
            'zip',
            integration_dir
        )
        
        return archive_path
    
    def cleanup(self):
        """Clean up temporary files"""
        if self.work_dir.exists():
            shutil.rmtree(self.work_dir)

# Global service instance
github_service = None

async def get_github_service():
    global github_service
    if github_service is None:
        token = os.getenv("GITHUB_TOKEN")
        if not token:
            raise ValueError("GITHUB_TOKEN environment variable is required")
        github_service = GitHubService(token)
    return github_service