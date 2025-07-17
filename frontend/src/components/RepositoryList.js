import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  RefreshCw, 
  Download, 
  CheckCircle, 
  Circle, 
  GitBranch, 
  Star, 
  Users, 
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RepositoryList = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRepos, setSelectedRepos] = useState(new Set());
  const [integrationJob, setIntegrationJob] = useState(null);
  const [isIntegrating, setIsIntegrating] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API}/repositories`);
      setRepositories(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  const toggleRepositorySelection = (repoId) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const startIntegration = async () => {
    if (selectedRepos.size === 0) {
      alert('Please select at least one repository');
      return;
    }

    try {
      setIsIntegrating(true);
      setError(null);
      
      const response = await axios.post(`${API}/integration/start`, {
        repository_ids: Array.from(selectedRepos)
      });
      
      setIntegrationJob(response.data);
      
      // Start polling for job status
      pollJobStatus(response.data.job_id);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start integration');
      setIsIntegrating(false);
    }
  };

  const pollJobStatus = async (jobId) => {
    try {
      const response = await axios.get(`${API}/integration/${jobId}`);
      setIntegrationJob(response.data);
      
      if (response.data.status === 'running' || response.data.status === 'pending') {
        // Continue polling
        setTimeout(() => pollJobStatus(jobId), 2000);
      } else {
        setIsIntegrating(false);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get job status');
      setIsIntegrating(false);
    }
  };

  const downloadIntegration = async () => {
    if (!integrationJob || !integrationJob.output_path) {
      alert('No integration result available');
      return;
    }

    try {
      const response = await axios.get(
        `${API}/integration/${integrationJob.job_id}/download`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `integrated_repo_${integrationJob.job_id}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to download integration result');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading repositories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          GitHub Repository Integration
        </h1>
        <p className="text-gray-600">
          Select repositories to integrate into a single repository structure
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={fetchRepositories}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <button
          onClick={startIntegration}
          disabled={selectedRepos.size === 0 || isIntegrating}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <GitBranch className="w-4 h-4 mr-2" />
          Integrate Selected ({selectedRepos.size})
        </button>
      </div>

      {integrationJob && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Integration Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`text-sm font-medium ${getStatusColor(integrationJob.status)}`}>
                {integrationJob.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Progress:</span>
              <span className="text-sm font-medium">{integrationJob.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${integrationJob.progress}%` }}
              />
            </div>
            
            {integrationJob.log_messages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Log Messages:</h4>
                <div className="bg-gray-100 rounded p-2 max-h-32 overflow-y-auto">
                  {integrationJob.log_messages.map((message, index) => (
                    <div key={index} className="text-xs text-gray-600 mb-1">
                      {message}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {integrationJob.conflicts.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Conflicts ({integrationJob.conflicts.length}):
                </h4>
                <div className="bg-yellow-50 rounded p-2 max-h-32 overflow-y-auto">
                  {integrationJob.conflicts.map((conflict, index) => (
                    <div key={index} className="text-xs text-yellow-800 mb-1">
                      {conflict.file} - {conflict.resolution}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {integrationJob.status === 'completed' && (
              <button
                onClick={downloadIntegration}
                className="mt-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Integrated Repository
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Repositories ({repositories.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {repositories.map((repo) => (
            <div key={repo.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => toggleRepositorySelection(repo.id)}
                    className="mt-1 text-blue-600 hover:text-blue-800"
                  >
                    {selectedRepos.has(repo.id) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {repo.name}
                      </h3>
                      {repo.private && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          Private
                        </span>
                      )}
                      {repo.language && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mt-1">
                      {repo.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {repo.stargazers_count}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {repo.forks_count}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(repo.updated_at)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {repositories.length === 0 && !loading && (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No repositories found</p>
        </div>
      )}
    </div>
  );
};

export default RepositoryList;