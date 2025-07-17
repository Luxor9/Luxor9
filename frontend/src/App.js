import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Components
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const RepositoryCard = ({ repo, isSelected, onSelect }) => (
  <div className={`border rounded-lg p-4 transition-all duration-200 ${
    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
  }`}>
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(repo.id)}
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{repo.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{repo.description || 'No description'}</p>
          <div className="flex items-center space-x-4 mt-2">
            {repo.language && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                {repo.language}
              </span>
            )}
            <span className="text-xs text-gray-500">⭐ {repo.stars}</span>
            <span className="text-xs text-gray-500">🔀 {repo.forks}</span>
            <span className="text-xs text-gray-500">{repo.private ? '🔒 Private' : '🌐 Public'}</span>
          </div>
        </div>
      </div>
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 text-sm"
      >
        View on GitHub →
      </a>
    </div>
  </div>
);

const IntegrationJobCard = ({ job, onDownload }) => (
  <div className="border rounded-lg p-4 bg-white shadow-sm">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{job.name}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {job.total_repos} repositories • Created {new Date(job.created_at).toLocaleDateString()}
        </p>
        
        <div className="mt-3">
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${
              job.status === 'completed' ? 'bg-green-100 text-green-800' :
              job.status === 'running' ? 'bg-blue-100 text-blue-800' :
              job.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.status.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">{job.progress}%</span>
          </div>
          
          {job.status === 'running' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
              {job.current_repo && (
                <p className="text-xs text-gray-600 mt-1">Processing: {job.current_repo}</p>
              )}
            </div>
          )}
          
          {job.conflicts && job.conflicts.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-yellow-600">⚠️ {job.conflicts.length} conflicts detected</p>
            </div>
          )}
          
          {job.error_message && (
            <div className="mt-2">
              <p className="text-xs text-red-600">❌ {job.error_message}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2">
        {job.status === 'completed' && (
          <button
            onClick={() => onDownload(job.id)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            Download
          </button>
        )}
      </div>
    </div>
  </div>
);

const Home = () => {
  const [repositories, setRepositories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [integrationName, setIntegrationName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [activeTab, setActiveTab] = useState('repositories');

  // Fetch repositories on component mount
  useEffect(() => {
    loadRepositories();
    loadJobs();
  }, []);

  // Poll for job updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'jobs') {
        loadJobs();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const loadRepositories = async () => {
    try {
      const response = await axios.get(`${API}/repositories`);
      setRepositories(response.data);
    } catch (error) {
      console.error('Error loading repositories:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await axios.get(`${API}/integration/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const refreshRepositories = async () => {
    setIsRefreshing(true);
    try {
      await axios.post(`${API}/repositories/fetch`);
      await loadRepositories();
    } catch (error) {
      console.error('Error refreshing repositories:', error);
      alert('Failed to refresh repositories. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRepositorySelect = (repoId) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleSelectAll = () => {
    const filteredRepos = getFilteredRepositories();
    if (selectedRepos.size === filteredRepos.length) {
      setSelectedRepos(new Set());
    } else {
      setSelectedRepos(new Set(filteredRepos.map(repo => repo.id)));
    }
  };

  const startIntegration = async () => {
    if (selectedRepos.size === 0) {
      alert('Please select at least one repository');
      return;
    }

    if (!integrationName.trim()) {
      alert('Please enter an integration name');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API}/integration/jobs`, {
        name: integrationName,
        repository_ids: Array.from(selectedRepos)
      });
      
      setIntegrationName('');
      setSelectedRepos(new Set());
      setActiveTab('jobs');
      await loadJobs();
    } catch (error) {
      console.error('Error starting integration:', error);
      alert('Failed to start integration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadIntegration = async (jobId) => {
    try {
      const response = await axios.get(`${API}/integration/jobs/${jobId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `integration-${jobId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading integration:', error);
      alert('Failed to download integration. Please try again.');
    }
  };

  const getFilteredRepositories = () => {
    return repositories.filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLanguage = !languageFilter || repo.language === languageFilter;
      return matchesSearch && matchesLanguage;
    });
  };

  const getUniqueLanguages = () => {
    const languages = [...new Set(repositories.map(repo => repo.language).filter(Boolean))];
    return languages.sort();
  };

  const filteredRepositories = getFilteredRepositories();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GitHub Repository Orchestration</h1>
          <p className="mt-2 text-gray-600">
            Integrate and manage your GitHub repositories in one place
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('repositories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'repositories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Repositories ({repositories.length})
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Integration Jobs ({jobs.length})
            </button>
          </nav>
        </div>

        {/* Repositories Tab */}
        {activeTab === 'repositories' && (
          <div>
            {/* Actions */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex space-x-3">
                <button
                  onClick={refreshRepositories}
                  disabled={isRefreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh Repositories'}
                </button>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  {selectedRepos.size === filteredRepositories.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {selectedRepos.size} selected
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Languages</option>
                  {getUniqueLanguages().map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Integration Setup */}
            {selectedRepos.size > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">
                  Create Integration ({selectedRepos.size} repositories selected)
                </h3>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <input
                    type="text"
                    placeholder="Integration name (e.g., 'My Project Monorepo')"
                    value={integrationName}
                    onChange={(e) => setIntegrationName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={startIntegration}
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Starting...' : 'Start Integration'}
                  </button>
                </div>
              </div>
            )}

            {/* Repository List */}
            <div className="space-y-4">
              {filteredRepositories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No repositories found</p>
                </div>
              ) : (
                filteredRepositories.map(repo => (
                  <RepositoryCard
                    key={repo.id}
                    repo={repo}
                    isSelected={selectedRepos.has(repo.id)}
                    onSelect={handleRepositorySelect}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Integration Jobs</h2>
              <p className="text-gray-600">Monitor and download your repository integrations</p>
            </div>

            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No integration jobs found</p>
                </div>
              ) : (
                jobs.map(job => (
                  <IntegrationJobCard
                    key={job.id}
                    job={job}
                    onDownload={downloadIntegration}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;