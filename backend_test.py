#!/usr/bin/env python3
"""
Backend Testing Suite for GitHub Repository Orchestration System
Tests all backend API endpoints and functionality
"""

import requests
import json
import time
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent / "frontend" / ".env")

# Get backend URL from environment
BACKEND_BASE_URL = os.getenv("REACT_APP_BACKEND_URL")
if not BACKEND_BASE_URL:
    print("❌ REACT_APP_BACKEND_URL not found in environment")
    exit(1)

API_BASE_URL = f"{BACKEND_BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = {
            "github_api_integration": False,
            "repository_management": False,
            "integration_engine": False,
            "job_management": False,
            "download_system": False
        }
        self.test_data = {}
        
    def log_test(self, test_name, success, message):
        """Log test results"""
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
        return success
    
    def test_api_health(self):
        """Test basic API health check"""
        print("\n=== Testing API Health Check ===")
        try:
            response = self.session.get(f"{API_BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                return self.log_test("API Health", True, f"API is running: {data.get('message', 'OK')}")
            else:
                return self.log_test("API Health", False, f"API returned status {response.status_code}")
        except Exception as e:
            return self.log_test("API Health", False, f"Connection failed: {str(e)}")
    
    def test_github_api_integration(self):
        """Test GitHub API Integration - /api/repositories/fetch"""
        print("\n=== Testing GitHub API Integration ===")
        
        try:
            # Test repository fetching
            print("Testing repository fetch from GitHub...")
            response = self.session.post(f"{API_BASE_URL}/repositories/fetch")
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', '')
                if 'Successfully fetched' in message:
                    self.test_results["github_api_integration"] = True
                    return self.log_test("GitHub API Integration", True, f"Repositories fetched: {message}")
                else:
                    return self.log_test("GitHub API Integration", False, f"Unexpected response: {message}")
            else:
                error_detail = response.json().get('detail', 'Unknown error') if response.headers.get('content-type') == 'application/json' else response.text
                return self.log_test("GitHub API Integration", False, f"Fetch failed with status {response.status_code}: {error_detail}")
                
        except Exception as e:
            return self.log_test("GitHub API Integration", False, f"Exception occurred: {str(e)}")
    
    def test_repository_management(self):
        """Test Repository Management API"""
        print("\n=== Testing Repository Management API ===")
        
        try:
            # Test getting all repositories
            print("Testing GET /api/repositories...")
            response = self.session.get(f"{API_BASE_URL}/repositories")
            
            if response.status_code == 200:
                repositories = response.json()
                if isinstance(repositories, list):
                    repo_count = len(repositories)
                    self.log_test("Get All Repositories", True, f"Retrieved {repo_count} repositories")
                    
                    if repo_count > 0:
                        # Store first repository for individual testing
                        self.test_data['sample_repo'] = repositories[0]
                        
                        # Test getting individual repository
                        repo_id = repositories[0]['id']
                        print(f"Testing GET /api/repositories/{repo_id}...")
                        
                        individual_response = self.session.get(f"{API_BASE_URL}/repositories/{repo_id}")
                        if individual_response.status_code == 200:
                            repo_data = individual_response.json()
                            if repo_data['id'] == repo_id:
                                self.test_results["repository_management"] = True
                                return self.log_test("Repository Management", True, f"Individual repository retrieval successful for {repo_data['name']}")
                            else:
                                return self.log_test("Repository Management", False, "Repository ID mismatch in individual retrieval")
                        else:
                            return self.log_test("Repository Management", False, f"Individual repository retrieval failed with status {individual_response.status_code}")
                    else:
                        return self.log_test("Repository Management", False, "No repositories found - need to fetch repositories first")
                else:
                    return self.log_test("Repository Management", False, "Response is not a list")
            else:
                error_detail = response.json().get('detail', 'Unknown error') if response.headers.get('content-type') == 'application/json' else response.text
                return self.log_test("Repository Management", False, f"Failed with status {response.status_code}: {error_detail}")
                
        except Exception as e:
            return self.log_test("Repository Management", False, f"Exception occurred: {str(e)}")
    
    def test_job_management(self):
        """Test Integration Job Management API"""
        print("\n=== Testing Job Management API ===")
        
        try:
            # First, ensure we have repositories to work with
            if 'sample_repo' not in self.test_data:
                return self.log_test("Job Management", False, "No sample repository available for testing")
            
            # Test creating an integration job
            print("Testing POST /api/integration/jobs...")
            job_data = {
                "name": "Test Integration Job",
                "repository_ids": [self.test_data['sample_repo']['id']]
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/integration/jobs",
                json=job_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                job = response.json()
                job_id = job['id']
                self.test_data['sample_job'] = job
                self.log_test("Create Integration Job", True, f"Job created with ID: {job_id}")
                
                # Test getting all jobs
                print("Testing GET /api/integration/jobs...")
                jobs_response = self.session.get(f"{API_BASE_URL}/integration/jobs")
                
                if jobs_response.status_code == 200:
                    jobs = jobs_response.json()
                    if isinstance(jobs, list) and len(jobs) > 0:
                        self.log_test("Get All Jobs", True, f"Retrieved {len(jobs)} jobs")
                        
                        # Test getting individual job
                        print(f"Testing GET /api/integration/jobs/{job_id}...")
                        individual_job_response = self.session.get(f"{API_BASE_URL}/integration/jobs/{job_id}")
                        
                        if individual_job_response.status_code == 200:
                            individual_job = individual_job_response.json()
                            if individual_job['id'] == job_id:
                                self.test_results["job_management"] = True
                                return self.log_test("Job Management", True, f"Individual job retrieval successful for job: {individual_job['name']}")
                            else:
                                return self.log_test("Job Management", False, "Job ID mismatch in individual retrieval")
                        else:
                            return self.log_test("Job Management", False, f"Individual job retrieval failed with status {individual_job_response.status_code}")
                    else:
                        return self.log_test("Job Management", False, "No jobs found after creation")
                else:
                    return self.log_test("Job Management", False, f"Get all jobs failed with status {jobs_response.status_code}")
            else:
                error_detail = response.json().get('detail', 'Unknown error') if response.headers.get('content-type') == 'application/json' else response.text
                return self.log_test("Job Management", False, f"Job creation failed with status {response.status_code}: {error_detail}")
                
        except Exception as e:
            return self.log_test("Job Management", False, f"Exception occurred: {str(e)}")
    
    def test_integration_engine(self):
        """Test Integration Engine - Background Job Processing"""
        print("\n=== Testing Integration Engine ===")
        
        try:
            if 'sample_job' not in self.test_data:
                return self.log_test("Integration Engine", False, "No sample job available for testing")
            
            job_id = self.test_data['sample_job']['id']
            
            # Monitor job progress for up to 60 seconds
            print(f"Monitoring job {job_id} progress...")
            max_wait_time = 60
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                response = self.session.get(f"{API_BASE_URL}/integration/jobs/{job_id}")
                
                if response.status_code == 200:
                    job = response.json()
                    status = job['status']
                    progress = job['progress']
                    
                    print(f"Job status: {status}, Progress: {progress}%")
                    
                    if status == "completed":
                        self.test_results["integration_engine"] = True
                        return self.log_test("Integration Engine", True, f"Job completed successfully with {progress}% progress")
                    elif status == "failed":
                        error_msg = job.get('error_message', 'Unknown error')
                        return self.log_test("Integration Engine", False, f"Job failed: {error_msg}")
                    elif status in ["pending", "running"]:
                        time.sleep(5)  # Wait 5 seconds before checking again
                        continue
                    else:
                        return self.log_test("Integration Engine", False, f"Unknown job status: {status}")
                else:
                    return self.log_test("Integration Engine", False, f"Failed to get job status: {response.status_code}")
            
            # If we reach here, the job didn't complete within the timeout
            return self.log_test("Integration Engine", False, f"Job did not complete within {max_wait_time} seconds")
            
        except Exception as e:
            return self.log_test("Integration Engine", False, f"Exception occurred: {str(e)}")
    
    def test_download_system(self):
        """Test Download System - ZIP file generation and serving"""
        print("\n=== Testing Download System ===")
        
        try:
            if 'sample_job' not in self.test_data:
                return self.log_test("Download System", False, "No sample job available for testing")
            
            job_id = self.test_data['sample_job']['id']
            
            # Check if job is completed first
            job_response = self.session.get(f"{API_BASE_URL}/integration/jobs/{job_id}")
            if job_response.status_code != 200:
                return self.log_test("Download System", False, "Cannot retrieve job status for download test")
            
            job = job_response.json()
            if job['status'] != "completed":
                return self.log_test("Download System", False, f"Job is not completed (status: {job['status']}), cannot test download")
            
            # Test download endpoint
            print(f"Testing GET /api/integration/jobs/{job_id}/download...")
            download_response = self.session.get(f"{API_BASE_URL}/integration/jobs/{job_id}/download")
            
            if download_response.status_code == 200:
                # Check if response is a ZIP file
                content_type = download_response.headers.get('content-type', '')
                content_disposition = download_response.headers.get('content-disposition', '')
                
                if 'application/zip' in content_type or 'zip' in content_disposition:
                    content_length = len(download_response.content)
                    if content_length > 0:
                        self.test_results["download_system"] = True
                        return self.log_test("Download System", True, f"ZIP file downloaded successfully ({content_length} bytes)")
                    else:
                        return self.log_test("Download System", False, "Downloaded file is empty")
                else:
                    return self.log_test("Download System", False, f"Response is not a ZIP file (content-type: {content_type})")
            else:
                error_detail = download_response.json().get('detail', 'Unknown error') if download_response.headers.get('content-type') == 'application/json' else download_response.text
                return self.log_test("Download System", False, f"Download failed with status {download_response.status_code}: {error_detail}")
                
        except Exception as e:
            return self.log_test("Download System", False, f"Exception occurred: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"🚀 Starting Backend Tests for GitHub Repository Orchestration System")
        print(f"Backend URL: {API_BASE_URL}")
        print("=" * 80)
        
        # Test sequence
        tests = [
            ("API Health Check", self.test_api_health),
            ("GitHub API Integration", self.test_github_api_integration),
            ("Repository Management", self.test_repository_management),
            ("Job Management", self.test_job_management),
            ("Integration Engine", self.test_integration_engine),
            ("Download System", self.test_download_system)
        ]
        
        for test_name, test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log_test(test_name, False, f"Test execution failed: {str(e)}")
        
        # Summary
        print("\n" + "=" * 80)
        print("🏁 BACKEND TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(self.test_results.values())
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}")
        
        print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All backend tests passed!")
            return True
        else:
            print("⚠️  Some backend tests failed. Check the details above.")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)