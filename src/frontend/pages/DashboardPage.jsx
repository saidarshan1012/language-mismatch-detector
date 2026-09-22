import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/DashboardPage.css';

function DashboardPage({ user }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, [user.id]);

  const fetchLeads = async () => {
    try {
      const response = await fetch(`/api/leads?coordinatorId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const statusColors = {
    'new': 'status-new',
    'in_progress': 'status-progress',
    'transferred': 'status-transferred',
    'pending_transfer': 'status-pending',
    'completed': 'status-completed'
  };

  const statusLabels = {
    'new': 'New',
    'in_progress': 'In Progress',
    'transferred': 'Transferred',
    'pending_transfer': 'Pending Transfer',
    'completed': 'Completed'
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your leads...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user.name}! 👋</h1>
          <p>Here are your assigned leads</p>
        </div>
        
        <div className="stats-cards">
          <div className="stat-card">
            <span className="stat-number">{leads.filter(l => l.status === 'new').length}</span>
            <span className="stat-label">New Leads</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{leads.filter(l => l.status === 'in_progress').length}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{leads.filter(l => l.status === 'transferred').length}</span>
            <span className="stat-label">Transferred</span>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <label>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Leads</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="transferred">Transferred</option>
          <option value="pending_transfer">Pending Transfer</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No leads found</h3>
          <p>
            {filter === 'all' 
              ? "You don't have any leads assigned yet." 
              : `No leads with status "${statusLabels[filter] || filter}"`}
          </p>
        </div>
      ) : (
        <div className="leads-grid">
          {filteredLeads.map(lead => (
            <Link to={`/lead/${lead.id}`} key={lead.id} className="lead-card">
              <div className="lead-header">
                <h3>{lead.name}</h3>
                <span className={`status-badge ${statusColors[lead.status]}`}>
                  {statusLabels[lead.status] || lead.status}
                </span>
              </div>
              <div className="lead-info">
                <p>📞 {lead.phone || 'No phone'}</p>
                <p>✉️ {lead.email || 'No email'}</p>
              </div>
              {lead.callTranscriptions && lead.callTranscriptions.length > 0 && (
                <div className="transcription-count">
                  📝 {lead.callTranscriptions.length} transcription(s)
                </div>
              )}
              {lead.requiredLanguage && (
                <div className="required-language">
                  ⚠️ Requires: <strong>{lead.requiredLanguage.toUpperCase()}</strong>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
