import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const API_BASE = 'http://localhost:8000/api';

function App() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('jobs');
  const [search, setSearch] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    fetchJobs();
  }, []);

  // Fetch applications when user logs in
  useEffect(() => {
    if (token) {
      fetchApplications();
    }
  }, [token]);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const response = await axios.get(`${API_BASE}/auth/me/`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        setUser(response.data);
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/jobs/`);
      setJobs(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Failed to load jobs. Make sure the Django server is running at http://localhost:8000');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_BASE}/my-applications/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const response = await axios.post(`${API_BASE}/auth/login/`, {
        username,
        password
      });
      
      const { access, user: userData } = response.data;
      localStorage.setItem('token', access);
      setToken(access);
      setUser(userData);
      setView('jobs');
      fetchApplications();
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || 'Invalid credentials'));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/register/`, {
        username,
        email,
        password
      });
      alert('Registration successful! Please login.');
      setView('login');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || 'Error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setApplications([]);
    setView('jobs');
  };

  const handleApply = async () => {
    if (!selectedJob) return;

    const formData = new FormData();
    formData.append('job', selectedJob.id);
    formData.append('cover_letter', coverLetter);
    formData.append('status', 'pending');
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    try {
      await axios.post(`${API_BASE}/applications/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Application submitted successfully!');
      setShowApplyModal(false);
      setCoverLetter('');
      setResumeFile(null);
      fetchApplications();
    } catch (error) {
      alert('Failed to submit application: ' + (error.response?.data?.detail || 'Error'));
    }
  };

  const openApplyModal = (job) => {
    if (!user) {
      setView('login');
      return;
    }
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company_name.toLowerCase().includes(search.toLowerCase()) ||
    job.location.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'warning',
      'reviewed': 'info',
      'shortlisted': 'success',
      'rejected': 'danger',
      'hired': 'primary'
    };
    return badges[status] || 'secondary';
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderNavbar = () => (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container-fluid">
        <span className="navbar-brand">Job Board</span>
        <div className="navbar-nav">
          <button className="btn btn-light btn-sm me-2" onClick={() => { setView('jobs'); fetchJobs(); }}>
            Jobs
          </button>
          {user && (
            <button className="btn btn-outline-light btn-sm me-2" onClick={() => setView('applications')}>
              My Applications ({applications.length})
            </button>
          )}
          {user && (
            <button className="btn btn-outline-light btn-sm me-2" onClick={() => setView('post-job')}>
              Post Job
            </button>
          )}
          {user ? (
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Logout ({user.username})
            </button>
          ) : (
            <>
              <button className="btn btn-outline-light btn-sm me-2" onClick={() => setView('login')}>
                Login
              </button>
              <button className="btn btn-success btn-sm" onClick={() => setView('register')}>
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );

  const renderJobs = () => (
    <div>
      <div className="row mb-4">
        <div className="col-md-8">
          <h1>Available Jobs</h1>
          <p className="text-muted">Find your next career opportunity</p>
        </div>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="row">
        {filteredJobs.map(job => (
          <div key={job.id} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{job.title}</h5>
                <h6 className="card-subtitle mb-2 text-muted">{job.company_name}</h6>
                <p className="card-text">
                  {job.description.length > 100 
                    ? `${job.description.substring(0, 100)}...` 
                    : job.description}
                </p>
                <div className="mb-3">
                  <span className="badge bg-primary me-1">{job.location}</span>
                  <span className="badge bg-success me-1">{job.job_type}</span>
                  {job.salary && <span className="badge bg-warning">{job.salary}</span>}
                </div>
                <button 
                  className="btn btn-primary me-2"
                  onClick={() => alert(`Job: ${job.title}\nCompany: ${job.company_name}\nSalary: ${job.salary || 'Not specified'}\n\n${job.description}`)}
                >
                  View Details
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => openApplyModal(job)}
                >
                  Apply Now
                </button>
              </div>
              <div className="card-footer text-muted">
                <small>Posted {new Date(job.created_at).toLocaleDateString()}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && !loading && (
        <div className="text-center py-5">
          <h3>No jobs found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );

  const renderApplications = () => (
    <div>
      <h1 className="mb-4">My Applications</h1>
      
      {applications.length === 0 ? (
        <div className="text-center py-5">
          <h3>No applications yet</h3>
          <p>Apply for jobs to see them here</p>
          <button className="btn btn-primary" onClick={() => setView('jobs')}>
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Cover Letter</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id}>
                  <td><strong>{app.job_title}</strong></td>
                  <td>{app.job?.company_name || 'N/A'}</td>
                  <td>
                    <span className={`badge bg-${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => alert(`Cover Letter:\n\n${app.cover_letter}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderLogin = () => (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card">
          <div className="card-body">
            <h3 className="card-title text-center mb-4">Login</h3>
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input type="text" className="form-control" name="username" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" name="password" required />
              </div>
              <button type="submit" className="btn btn-primary w-100">Login</button>
            </form>
            <div className="text-center mt-3">
              <p className="mb-0">
                Don't have an account?{' '}
                <button className="btn btn-link p-0" onClick={() => setView('register')}>
                  Register here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card">
          <div className="card-body">
            <h3 className="card-title text-center mb-4">Register</h3>
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input type="text" className="form-control" name="username" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" name="password" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control" name="confirmPassword" required />
              </div>
              <button type="submit" className="btn btn-success w-100">Register</button>
            </form>
            <div className="text-center mt-3">
              <p className="mb-0">
                Already have an account?{' '}
                <button className="btn btn-link p-0" onClick={() => setView('login')}>
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPostJob = () => (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-4">Post a New Job</h3>
            <p className="text-muted">Post job form will be implemented here</p>
            <button className="btn btn-secondary" onClick={() => setView('jobs')}>
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApplyModal = () => (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Apply for: {selectedJob?.title}</h5>
            <button type="button" className="btn-close" onClick={() => setShowApplyModal(false)}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Cover Letter *</label>
              <textarea 
                className="form-control" 
                rows="6"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're a great fit for this position..."
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Resume (Optional)</label>
              <input 
                type="file" 
                className="form-control"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setResumeFile(e.target.files[0])}
              />
              <small className="text-muted">PDF, DOC, DOCX, or TXT files only (max 5MB)</small>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleApply}>
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================

  if (loading && view === 'jobs') {
    return (
      <div className="container mt-5">
        {renderNavbar()}
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {renderNavbar()}
      
      {showApplyModal && renderApplyModal()}
      
      <div id="content">
        {view === 'jobs' && renderJobs()}
        {view === 'applications' && renderApplications()}
        {view === 'login' && renderLogin()}
        {view === 'register' && renderRegister()}
        {view === 'post-job' && renderPostJob()}
      </div>
    </div>
  );
}

export default App;