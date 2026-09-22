import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadDetailPage from './pages/LeadDetailPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import './styles/App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <Router>
      <div className="app">
        {currentUser && <Header user={currentUser} onLogout={handleLogout} />}
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                currentUser ? 
                  <Navigate to="/dashboard" /> : 
                  <LoginPage onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                currentUser ? 
                  <DashboardPage user={currentUser} /> : 
                  <Navigate to="/" />
              } 
            />
            <Route 
              path="/lead/:id" 
              element={
                currentUser ? 
                  <LeadDetailPage user={currentUser} /> : 
                  <Navigate to="/" />
              } 
            />
            <Route 
              path="/admin" 
              element={
                currentUser ? 
                  <AdminPage user={currentUser} /> : 
                  <Navigate to="/" />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);