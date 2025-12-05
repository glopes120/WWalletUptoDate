import { useState } from 'react';
import './Sidebar.css';
import { supabase } from '../supabaseClient'; // Import Supabase client

const menuItems = [
  { icon: '🏠', label: 'Dashboard' },
  { icon: '💰', label: 'Budget' },
  { icon: '💼', label: 'Portfolio' },
  { icon: '🎯', label: 'Financial Goals' },
  { icon: '🤖', label: 'AI Advisor' },

  { icon: '⚙️', label: 'Settings' }
];

export default function Sidebar({ onSelectMenuItem, activeItem, user }) {
  const [collapsed, setCollapsed] = useState(false);

  const userName = user?.email ? user.email.split('@')[0] : 'User';
  const userAvatar = userName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
        // Optionally, you can add a notification here to inform the user
    }
    // Supabase's onAuthStateChange listener in App.jsx will handle session changes
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <span>W</span>
          </div>
          {!collapsed && <span className="logo-text">WiseWallet</span>}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="collapse-btn"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className="user-profile">
        <div className="user-avatar">
          {userAvatar}
        </div>
        {!collapsed && (
          <div className="user-info">
            <p className="user-name">{userName}</p>
            <p className="user-plan">Premium Plan</p>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectMenuItem(item.label)}
            className={`nav-item ${activeItem === item.label ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="ai-assistant-card">
          <div className="ai-card-header">
            <span className="ai-card-icon">✨</span>
            <span className="ai-card-title">AI Financial Assistant</span>
          </div>
          <p className="ai-card-description">Get instant answers to your financial questions and personalized advice.</p>
          <button className="ai-card-button" onClick={() => onSelectMenuItem('AI Assistant')}>
            💬 Start Chat
          </button>
        </div>
      )}

      <div className="sidebar-footer">
        <button className="footer-link">
          <span className="footer-icon">❓</span>
          {!collapsed && <span className="footer-label">Help & Support</span>}
        </button>
        <button className="footer-link" onClick={handleSignOut}>
          <span className="footer-icon">🚪</span>
          {!collapsed && <span className="footer-label">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
