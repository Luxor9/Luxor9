#!/usr/bin/env python3
"""
Backend API Testing Script for GitHub Repository Integration System
Tests all backend endpoints and core functionality
"""

import asyncio
import httpx
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
import time

# Backend URL from frontend/.env
BACKEND_URL = "https://48ebe6b3-dfd7-41cc-b851-16557f38dfbc.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_results = []
        self.job_id = None
        self.selected_repo_ids = []
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()
    
    async def test_health_check(self):
        """Test the health check endpoint"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/health")
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("Health Check", True, f"Server is healthy, timestamp: {data.get('timestamp')}")
                else:
                    self.log_test("Health Check", False, "Invalid health response format", data)
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
    
    async def test_get_repositories(self):
        """Test fetching GitHub repositories"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/repositories")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Store some repo IDs for later tests
                        self.selected_repo_ids = [repo["id"] for repo in data[:3]]  # Take first 3 repos
                        
                        # Validate repository structure
                        first_repo = data[0]
                        required_fields = ["id", "github_id", "name", "full_name", "html_url", "clone_url"]
                        missing_fields = [field for field in required_fields if field not in first_repo]
                        
                        if not missing_fields:
                            self.log_test("Get Repositories", True, 
                                        f"Retrieved {len(data)} repositories successfully")
                        else:
                            self.log_test("Get Repositories", False, 
                                        f"Missing required fields: {missing_fields}", first_repo)
                    else:
                        self.log_test("Get Repositories", True, "No repositories found (empty list)")
                else:
                    self.log_test("Get Repositories", False, "Response is not a list", data)
            else:
                self.log_test("Get Repositories", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Get Repositories", False, f"Exception: {str(e)}")
    
    async def test_get_single_repository(self):
        """Test fetching a single repository"""
        if not self.selected_repo_ids:
            self.log_test("Get Single Repository", False, "No repository IDs available from previous test")
            return
            
        try:
            repo_id = self.selected_repo_ids[0]
            response = await self.client.get(f"{BACKEND_URL}/repositories/{repo_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["id"] == repo_id:
                    self.log_test("Get Single Repository", True, f"Retrieved repository: {data.get('name')}")
                else:
                    self.log_test("Get Single Repository", False, "Repository ID mismatch", data)
            elif response.status_code == 404:
                self.log_test("Get Single Repository", False, "Repository not found in database")
            else:
                self.log_test("Get Single Repository", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Get Single Repository", False, f"Exception: {str(e)}")
    
    async def test_select_repositories(self):
        """Test selecting repositories for integration"""
        if not self.selected_repo_ids:
            self.log_test("Select Repositories", False, "No repository IDs available from previous test")
            return
            
        try:
            payload = {
                "repository_ids": self.selected_repo_ids[:2]  # Select first 2 repos
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/repositories/select",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "selected_count" in data:
                    self.log_test("Select Repositories", True, 
                                f"Selected {data['selected_count']} repositories")
                else:
                    self.log_test("Select Repositories", False, "Invalid response format", data)
            else:
                self.log_test("Select Repositories", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Select Repositories", False, f"Exception: {str(e)}")
    
    async def test_start_integration(self):
        """Test starting repository integration"""
        if not self.selected_repo_ids:
            self.log_test("Start Integration", False, "No repository IDs available from previous test")
            return
            
        try:
            payload = {
                "repository_ids": self.selected_repo_ids[:2]  # Use first 2 repos
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/integration/start",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["job_id", "status", "progress", "log_messages", "conflicts"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.job_id = data["job_id"]
                    self.log_test("Start Integration", True, 
                                f"Integration started with job ID: {self.job_id}")
                else:
                    self.log_test("Start Integration", False, 
                                f"Missing required fields: {missing_fields}", data)
            else:
                self.log_test("Start Integration", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Start Integration", False, f"Exception: {str(e)}")
    
    async def test_integration_status(self):
        """Test checking integration job status"""
        if not self.job_id:
            self.log_test("Integration Status", False, "No job ID available from previous test")
            return
            
        try:
            response = await self.client.get(f"{BACKEND_URL}/integration/{self.job_id}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["job_id", "status", "progress", "log_messages", "conflicts"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    status = data["status"]
                    progress = data["progress"]
                    self.log_test("Integration Status", True, 
                                f"Job status: {status}, Progress: {progress}%")
                else:
                    self.log_test("Integration Status", False, 
                                f"Missing required fields: {missing_fields}", data)
            elif response.status_code == 404:
                self.log_test("Integration Status", False, "Job not found")
            else:
                self.log_test("Integration Status", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Integration Status", False, f"Exception: {str(e)}")
    
    async def test_integration_status_polling(self):
        """Test polling integration status until completion"""
        if not self.job_id:
            self.log_test("Integration Status Polling", False, "No job ID available from previous test")
            return
            
        try:
            max_attempts = 10
            attempt = 0
            
            while attempt < max_attempts:
                response = await self.client.get(f"{BACKEND_URL}/integration/{self.job_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    status = data.get("status")
                    progress = data.get("progress", 0)
                    
                    print(f"    Polling attempt {attempt + 1}: Status={status}, Progress={progress}%")
                    
                    if status in ["completed", "failed"]:
                        if status == "completed":
                            self.log_test("Integration Status Polling", True, 
                                        f"Integration completed successfully after {attempt + 1} attempts")
                        else:
                            self.log_test("Integration Status Polling", False, 
                                        f"Integration failed: {data.get('log_messages', [])}")
                        return
                    
                    attempt += 1
                    if attempt < max_attempts:
                        await asyncio.sleep(2)  # Wait 2 seconds between polls
                else:
                    self.log_test("Integration Status Polling", False, 
                                f"HTTP {response.status_code} on attempt {attempt + 1}")
                    return
            
            self.log_test("Integration Status Polling", False, 
                        f"Integration did not complete within {max_attempts} attempts")
                
        except Exception as e:
            self.log_test("Integration Status Polling", False, f"Exception: {str(e)}")
    
    async def test_download_integration(self):
        """Test downloading integration result"""
        if not self.job_id:
            self.log_test("Download Integration", False, "No job ID available from previous test")
            return
            
        try:
            response = await self.client.get(f"{BACKEND_URL}/integration/{self.job_id}/download")
            
            if response.status_code == 200:
                content_type = response.headers.get("content-type", "")
                if "zip" in content_type or "application/octet-stream" in content_type:
                    content_length = len(response.content)
                    self.log_test("Download Integration", True, 
                                f"Downloaded ZIP file ({content_length} bytes)")
                else:
                    self.log_test("Download Integration", False, 
                                f"Unexpected content type: {content_type}")
            elif response.status_code == 400:
                self.log_test("Download Integration", False, 
                            "Integration not completed or no output available")
            elif response.status_code == 404:
                self.log_test("Download Integration", False, "Job or output file not found")
            else:
                self.log_test("Download Integration", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Download Integration", False, f"Exception: {str(e)}")
    
    async def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        try:
            # Test invalid repository ID
            response = await self.client.get(f"{BACKEND_URL}/repositories/invalid-id")
            if response.status_code == 404:
                self.log_test("Invalid Repository ID", True, "Correctly returned 404 for invalid repository")
            else:
                self.log_test("Invalid Repository ID", False, f"Expected 404, got {response.status_code}")
            
            # Test invalid job ID
            response = await self.client.get(f"{BACKEND_URL}/integration/invalid-job-id")
            if response.status_code == 404:
                self.log_test("Invalid Job ID", True, "Correctly returned 404 for invalid job")
            else:
                self.log_test("Invalid Job ID", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Endpoints", False, f"Exception: {str(e)}")
    
    async def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Core functionality tests
        await self.test_health_check()
        await self.test_get_repositories()
        await self.test_get_single_repository()
        await self.test_select_repositories()
        await self.test_start_integration()
        await self.test_integration_status()
        await self.test_integration_status_polling()
        await self.test_download_integration()
        
        # Error handling tests
        await self.test_invalid_endpoints()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        
        return passed, failed

async def main():
    """Main test runner"""
    try:
        async with BackendTester() as tester:
            await tester.run_all_tests()
            
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"❌ Test runner failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())