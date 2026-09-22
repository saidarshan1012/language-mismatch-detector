import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

function LoginPage({ onLogin }) {
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = async () => {
    try {
      const response = await fetch('/api/coordinators');
      if (!response.ok) throw new Error('Failed to fetch coordinators');
      const data = await response.json();
      setCoordinators(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (coordinator) => {
    onLogin(coordinator);
    navigate('/dashboard');
  };

  const languageNames = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'pa': 'Punjabi',
    'ur': 'Urdu'
  };

  const languageFlags = {
    'en': '🇬🇧',
    'hi': '🇮🇳',
    'ta': '🇮🇳',
    'te': '🇮🇳',
    'kn': '🇮🇳',
    'ml': '🇮🇳',
    'bn': '🇮🇳',
    'gu': '🇮🇳',
    'pa': '🇮🇳',
    'ur': '🇵🇰'
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading-spinner"></div>
          <p>Loading coordinators...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="login-container">
        <div className="login-card error">
          <p>⚠️ Error: {error}</p>
          <button onClick={fetchCoordinators} className="btn retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>📞 Business Development</h1>
          <p className="subtitle">Select your profile to continue</p>
        </div>
        
        <div className="coordinators-grid">
          {coordinators.map(coordinator => (
            <div 
              key={coordinator.id}
              className="coordinator-card"
              onClick={() => handleSelectUser(coordinator)}
            >
              <div className="avatar">{coordinator.name.charAt(0)}</div>
              <h3>{coordinator.name}</h3>
              <p className="department">{coordinator.department}</p>
              <div className="languages">
                {coordinator.languages.map(lang => (
                  <span key={lang} className="language-tag">
                    {languageFlags[lang]} {languageNames[lang] || lang}
                  </span>
                ))}
              </div>
              {!coordinator.available && (
                <span className="unavailable-badge">Currently Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <footer className="login-footer">
        <p>GUVI Business Development System</p>
      </footer>
    </div>
  );
}

export default LoginPage;
