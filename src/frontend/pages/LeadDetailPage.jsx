import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/LeadDetailPage.css';

function LeadDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [transferResult, setTransferResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await fetch(`/api/leads/${id}`);
      if (!response.ok) throw new Error('Failed to fetch lead');
      const data = await response.json();
      setLead(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTranscript = async () => {
    if (!transcriptText.trim()) {
      setError('Please enter transcript text');
      return;
    }

    setUploading(true);
    setError(null);
    setAnalysisResult(null);
    setTransferResult(null);

    try {
      const response = await fetch(`/api/leads/${id}/transcription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptText }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to upload transcript');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
      setTransferResult(result.transfer);
      setTranscriptText('');
      setShowUploadForm(false);
      
      // Refresh lead data
      fetchLead();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const loadSampleTranscript = () => {
    setTranscriptText(`Agent: Hello, this is ${user.name} from GUVI. How can I help you today?
Customer: [Customer speaks in their preferred language]
Agent: I understand. Let me help you with that.`);
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

  const statusLabels = {
    'new': 'New',
    'in_progress': 'In Progress',
    'transferred': 'Transferred',
    'pending_transfer': 'Pending Transfer',
    'completed': 'Completed'
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading lead details...</p>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="detail-loading error">
        <span>⚠️</span>
        <p>Error: {error}</p>
        <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="lead-detail-container">
      <div className="breadcrumb">
        <Link to="/dashboard">← Back to Dashboard</Link>
      </div>

      <div className="lead-header-card">
        <div className="lead-info-section">
          <h1>{lead.name}</h1>
          <div className="lead-meta">
            <span className="status-badge status-{lead.status}">
              {statusLabels[lead.status] || lead.status}
            </span>
            {lead.requiredLanguage && (
              <span className="required-lang-badge">
                Requires: {languageNames[lead.requiredLanguage] || lead.requiredLanguage}
              </span>
            )}
          </div>
          <div className="contact-info">
            <p>📞 {lead.phone || 'No phone number'}</p>
            <p>✉️ {lead.email || 'No email'}</p>
          </div>
        </div>
        
        {(lead.status === 'new' || lead.status === 'in_progress') && (
          <div className="action-buttons">
            {lead.status === 'new' && (
              <button 
                className="btn btn-secondary"
                onClick={async () => {
                  await fetch('/api/leads/' + id + '/status', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'in_progress' })
                  });
                  fetchLead();
                }}
              >
                Start Call
              </button>
            )}
            <button 
              className="btn btn-primary"
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              📝 Upload Transcription
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {showUploadForm && (
        <div className="upload-form-card">
          <h2>Upload Call Transcription</h2>
          <p className="help-text">
            Paste the transcript from your call. The system will detect the customer's language
            and automatically transfer the lead to a coordinator who speaks that language.
          </p>
          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="Paste the call transcript here...

Example format:
Agent: Hello, how can I help you today?
Customer: [Customer's response]
Agent: [Your response]..."
            rows={10}
          />
          <div className="upload-actions">
            <button 
              className="btn btn-secondary"
              onClick={loadSampleTranscript}
            >
              Load Template
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleUploadTranscript}
              disabled={uploading || !transcriptText.trim()}
            >
              {uploading ? 'Analyzing...' : 'Upload & Analyze'}
            </button>
            <button 
              className="btn btn-cancel"
              onClick={() => {
                setShowUploadForm(false);
                setTranscriptText('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {analysisResult && (
        <div className={`analysis-result-card ${analysisResult.hasLanguageMismatch ? 'mismatch' : 'match'}`}>
          <h2>📋 Analysis Result</h2>
          
          <div className="analysis-summary">
            {analysisResult.hasLanguageMismatch ? (
              <div className="mismatch-alert">
                <span className="icon">⚠️</span>
                <div>
                  <h3>Language Mismatch Detected</h3>
                  <p>{analysisResult.summary}</p>
                </div>
              </div>
            ) : (
              <div className="match-alert">
                <span className="icon">✅</span>
                <div>
                  <h3>No Language Mismatch</h3>
                  <p>{analysisResult.summary}</p>
                </div>
              </div>
            )}
          </div>

          <div className="speakers-grid">
            {Object.entries(analysisResult.speakerDetails || {}).map(([speaker, details]) => (
              <div key={speaker} className="speaker-card">
                <div className="speaker-header">
                  <h4>{speaker}</h4>
                  <span className={`role-badge ${details.role}`}>
                    {details.role}
                  </span>
                </div>
                <div className="speaker-language">
                  <span className="lang-badge">
                    {languageNames[details.language?.code] || details.language?.code || 'Unknown'}
                  </span>
                  {details.isCodeSwitching && (
                    <span className="code-switch-badge">Code-switching</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {transferResult && (
            <div className={`transfer-result ${transferResult.queued ? 'queued' : 'transferred'}`}>
              <h3>
                {transferResult.queued ? '📋 Queued for Transfer' : '✅ Transferred'}
              </h3>
              <p>{transferResult.message}</p>
              {transferResult.targetCoordinator && (
                <div className="target-coordinator">
                  <strong>Transferred to:</strong> {transferResult.targetCoordinator.name}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="transcriptions-card">
        <h2>📞 Call History ({lead.callTranscriptions?.length || 0} calls)</h2>
        
        {(!lead.callTranscriptions || lead.callTranscriptions.length === 0) ? (
          <div className="empty-transcriptions">
            <p>No call transcriptions yet. Upload your first call transcription above.</p>
          </div>
        ) : (
          <div className="transcriptions-list">
            {[...lead.callTranscriptions].reverse().map((transcript, index) => (
              <div key={transcript.id} className="transcript-item">
                <div className="transcript-header">
                  <span className="transcript-date">
                    {new Date(transcript.timestamp).toLocaleString()}
                  </span>
                  <div className="detected-languages">
                    {transcript.detectedLanguages?.map(lang => (
                      <span key={lang} className="lang-tag">
                        {languageNames[lang] || lang}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="transcript-text">
                  {transcript.transcript.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadDetailPage;
