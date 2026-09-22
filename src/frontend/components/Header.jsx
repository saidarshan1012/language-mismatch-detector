import React from 'react';
import { Link } from 'react-router-dom';

function Header({ user, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="logo">📞 GUVI BDC</h1>
      </div>
      
      <nav className="header-nav">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/admin" className="nav-link">Admin</Link>
      </nav>
      
      <div className="header-right">
        <div className="user-info">
          <span className="user-avatar">{user.name.charAt(0)}</span>
          <span className="user-name">{user.name}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
