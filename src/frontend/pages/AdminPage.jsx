import React, { useEffect, useState } from 'react';
import '../styles/AdminPage.css';

function AdminPage({ user }) {
  const [coordinators, setCoordinators] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoordinator, setNewCoordinator] = useState({
    name: '',
    languages: ['en'],
    department: 'Sales'
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coordRes, pendingRes] = await Promise.all([
        fetch('/api/coordinators'),
        fetch('/api/pending-transfers')
      ]);
      
      const coords = await coordRes.json();
      const pending = await pendingRes.json();
      
      setCoordinators(coords);
      setPendingTransfers(pending);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoordinator = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newCoordinator.name.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      const response = await fetch('/api/coordinators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoordinator)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add coordinator');
      }

      const added = await response.json();
      setSuccess(`Added ${added.name} successfully!`);
      setNewCoordinator({ name: '', languages: ['en'], department: 'Sales' });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleLanguage = (lang) => {
    const current = newCoordinator.languages;
    if (current.includes(lang)) {
      if (current.length > 1) {
        setNewCoordinator({
          ...newCoordinator,
          languages: current.filter(l => l !== lang)
        });
      }
    } else {
      setNewCoordinator({
        ...newCoordinator,
        languages: [...current, lang]
      });
    }
  };

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  ];

  const languageNames = Object.fromEntries(availableLanguages.map(l => [l.code, l.name]));
  const languageFlags = Object.fromEntries(availableLanguages.map(l => [l.code, l.flag]));

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading administration data...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>⚙️ Administration Panel</h1>
        <p>Manage coordinators and pending transfers</p>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✅ {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      <div className="admin-grid">
        <div className="admin-section">
          <div className="section-header">
            <h2>👥 Business Development Coordinators ({coordinators.length})</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add Coordinator'}
            </button>
          </div>

          {showAddForm && (
            <div className="add-form">
              <h3>Add New Coordinator</h3>
              <form onSubmit={handleAddCoordinator}>
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={newCoordinator.name}
                    onChange={(e) => setNewCoordinator({...newCoordinator, name: e.target.value})}
                    placeholder="Enter coordinator name"
                  />
                </div>

                <div className="form-group">
                  <label>Department:</label>
                  <select
                    value={newCoordinator.department}
                    onChange={(e) => setNewCoordinator({...newCoordinator, department: e.target.value})}
                  >
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Languages:</label>
                  <div className="language-checkboxes">
                    {availableLanguages.map(lang => (
                      <label 
                        key={lang.code}
                        className={`language-checkbox ${newCoordinator.languages.includes(lang.code) ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={newCoordinator.languages.includes(lang.code)}
                          onChange={() => handleToggleLanguage(lang.code)}
                        />
                        <span>{lang.flag} {lang.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary full-width">
                  Add Coordinator
                </button>
              </form>
            </div>
          )}

          <div className="coordinators-list">
            {coordinators.map(coordinator => (
              <div key={coordinator.id} className="coordinator-row">
                <div className="coordinator-avatar">{coordinator.name.charAt(0)}</div>
                <div className="coordinator-details">
                  <h3>{coordinator.name}</h3>
                  <p className="coordinator-dept">{coordinator.department}</p>
                  <div className="coordinator-langs">
                    {coordinator.languages.map(lang => (
                      <span key={lang} className="lang-chip">
                        {languageFlags[lang]} {languageNames[lang] || lang}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="coordinator-status">
                  <span className={`status-indicator ${coordinator.available ? 'available' : 'unavailable'}`}>
                    {coordinator.available ? 'Available' : 'Busy'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <div className="section-header">
            <h2>📋 Pending Transfers ({pendingTransfers.length})</h2>
          </div>

          {pendingTransfers.length === 0 ? (
            <div className="empty-pending">
              <span className="empty-icon">✅</span>
              <p>No pending transfers</p>
              <small>Leads requiring language transfer will appear here</small>
            </div>
          ) : (
            <div className="pending-list">
              {pendingTransfers.map((pending, index) => (
                <div key={index} className="pending-item">
                  <div className="pending-info">
                    <h4>{pending.lead?.name || 'Unknown Lead'}</h4>
                    <p className="required-lang">
                      Requires: <strong>{languageNames[pending.requiredLanguage] || pending.requiredLanguage}</strong>
                    </p>
                  </div>
                  <div className="pending-since">
                    Since {new Date(pending.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingTransfers.length > 0 && (
            <div className="pending-action">
              <p className="help-text">
                💡 Tip: Add a coordinator who speaks the required language to automatically transfer these leads.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
