import { useState } from 'react';
import './AIAdvisor.css';

const recommendations = [
  {
    icon: '🛡️',
    title: 'Optimize Emergency Fund',
    impact: 'Medium Impact',
    impactColor: 'text-yellow-400',
    desc: 'Your emergency fund is almost complete. Consider moving $5,000 to a high-yield savings account to earn 3.5% APY instead of your current 0.5%.',
    gradient: 'from-emerald-500/20'
  },
  {
    icon: '📊',
    title: 'Rebalance Investment Portfolio',
    impact: 'Medium Impact',
    impactColor: 'text-yellow-400',
    desc: 'Your tech allocation is 5% higher than your target. Consider rebalancing to reduce risk and align with your long-term strategy.',
    gradient: 'from-blue-500/20'
  },
  {
    icon: '💳',
    title: 'Reduce Credit Card Debt',
    impact: 'High Impact',
    impactColor: 'text-red-400',
    desc: 'Prioritize paying off your credit card balance of $1,250.67 to avoid 18.99% APR interest charges.',
    gradient: 'from-red-500/20'
  },
  {
    icon: '🛒',
    title: 'Shopping Budget Alert',
    impact: 'Low Impact',
    impactColor: 'text-emerald-400',
    desc: "You've exceeded your shopping budget by $112.80 this month. Review recent purchases and adjust next month's budget if needed.",
    gradient: 'from-pink-500/20'
  }
];

const strengths = [
  { icon: '💰', title: 'Consistent Savings', desc: "You're consistently saving 22% of your income, which is above the recommended 20%." },
  { icon: '📈', title: 'Diversified Investments', desc: 'Your investment portfolio is well-diversified across different asset classes.' },
  { icon: '🎯', title: 'Clear Financial Goals', desc: 'You have well-defined financial goals with specific timelines and regular contributions.' }
];

const improvements = [
  { icon: '💳', title: 'Credit Card Debt', desc: 'Your credit card has a high-interest balance that should be prioritized for repayment.' },
  { icon: '📊', title: 'Portfolio Rebalancing', desc: 'Your investment portfolio has drifted from your target allocation and needs rebalancing.' },
  { icon: '🛒', title: 'Shopping Budget', desc: 'You consistently exceed your shopping budget, which affects your overall financial plan.' }
];

const projections = [
  { label: 'Retirement', value: '$1,250,000.00', subtitle: 'Projected at age 65', note: "You're on track to reach 83% of your retirement goal." },
  { label: 'Home Purchase', value: '$50,000.00', subtitle: 'Projected in 14 months', note: "You're on track to reach your down payment goal on schedule." },
  { label: 'Net Worth', value: '$250,000.00', subtitle: 'Projected in 5 years', note: 'Your net worth is projected to grow by 534% in the next 5 years.' }
];

export default function AIAdvisor() {
  const [healthScore] = useState(78);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AI financial advisor. How can I help with your finances today?" }
  ]);
  const [input, setInput] = useState('');
  
  const getScoreColor = (score) => {
    if (score >= 90) return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Excellent' };
    if (score >= 70) return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Good' };
    if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Fair' };
    return { bg: 'bg-red-500', text: 'text-red-400', label: 'Poor' };
  };

  const scoreInfo = getScoreColor(healthScore);

  const sendMessage = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Based on your financial profile, I'd recommend focusing on paying off your credit card debt first since it has a high interest rate of 18.99%. After that, continue building your emergency fund. Would you like me to create a detailed plan for you?" 
      }]);
    }, 1000);
  };

  return (
    <div className="ai-advisor-main-container">
      {/* Header */}
      <div className="ai-advisor-header">
        <div className="ai-advisor-header-title-container">
          <div>
            <h1 className="ai-advisor-header-title">AI Financial Advisor</h1>
            <p className="ai-advisor-header-subtitle">Personalized insights and recommendations for your financial journey</p>
          </div>
          <div className="ai-advisor-header-icon">✨</div>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="recommendation-cards-container">
        {recommendations.map((rec, i) => (
          <div key={i} className={`recommendation-card bg-gradient-to-r ${rec.gradient} to-transparent`}>
            <div className="recommendation-card-content-header">
              <span className="recommendation-card-icon">{rec.icon}</span>
              <div>
                <h3 className="recommendation-card-title">{rec.title}</h3>
                <span className={`recommendation-card-impact ${rec.impactColor}`}>● {rec.impact}</span>
              </div>
            </div>
            <p className="recommendation-card-description">{rec.desc}</p>
            <button className="recommendation-action-button">
              Take Action
            </button>
          </div>
        ))}
      </div>

      {/* Financial Health Score */}
      <div className="financial-health-score-container">
        <h2 className="financial-health-score-title">Financial Health Score</h2>
        <div className="financial-health-score-content">
          <div className="health-score-circle">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" className="health-score-bg" fill="none" />
              <circle 
                cx="48" cy="48" r="40" 
                className="health-score-progress"
                strokeDasharray={`${(healthScore / 100) * 251} 251`}
              />
            </svg>
            <div className="health-score-text">
              <span className="health-score-value">{healthScore}</span>
            </div>
          </div>
          <div>
            <p className={`health-score-label ${scoreInfo.text}`}>{scoreInfo.label}</p>
            <p className="health-score-description">Your financial health is on the right track</p>
          </div>
          <div className="health-score-legend">
            <p className="text-red-400">● Poor (0-50)</p>
            <p className="text-yellow-400">● Fair (51-70)</p>
            <p className="text-emerald-400">● Good (71-90)</p>
            <p className="text-blue-400">● Excellent (91-100)</p>
          </div>
        </div>
        <div className="health-score-progress-bar">
          <div className={`health-score-progress-fill ${scoreInfo.bg}`} style={{ width: `${healthScore}%` }} />
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="strengths-improvements-container">
        <div className="strengths-card-section">
          <h2 className="strengths-section-title">Strengths</h2>
          <div className="strengths-list">
            {strengths.map((item, i) => (
              <div key={i} className="strength-card">
                <span className="strength-icon">{item.icon}</span>
                <div>
                  <h3 className="strength-title">{item.title}</h3>
                  <p className="strength-description">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="improvements-card-section">
          <h2 className="improvements-section-title">Areas to Improve</h2>
          <div className="improvements-list">
            {improvements.map((item, i) => (
              <div key={i} className="improvement-card">
                <span className="improvement-icon">{item.icon}</span>
                <div>
                  <h3 className="improvement-title">{item.title}</h3>
                  <p className="improvement-description">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Long-Term Projections */}
      <div className="projections-container">
        <h2 className="projections-title">Long-Term Projections</h2>
        <p className="projections-subtitle">Based on your current savings rate, investment strategy, and financial goals, here's how your financial future looks:</p>
        <div className="projections-grid">
          {projections.map((proj, i) => (
            <div key={i} className="projection-item">
              <p className="projection-label">{proj.label}</p>
              <p className="projection-value">{proj.value}</p>
              <p className="projection-subtitle-text">{proj.subtitle}</p>
              <p className="projection-note">{proj.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Button */}
      <div className="chat-cta-button-container">
        <button 
          onClick={() => setShowChat(true)}
          className="chat-cta-button"
        >
          💬 Chat with AI Assistant
        </button>
      </div>

      {/* Chat Modal with Smooth Animation */}
      {showChat && (
        <>
          {/* Backdrop */}
          <div 
            className="modal-backdrop"
            onClick={() => setShowChat(false)}
          />
          
          {/* Chat Modal */}
          <div 
            className="chat-modal"
            onClick={() => setShowChat(false)}
          >
            <div 
              className="chat-modal-content"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="chat-header-modal">
                <div className="chat-header-details">
                  <div className="chat-header-modal-icon">
                    <span>🤖</span>
                  </div>
                  <div>
                    <h3 className="chat-header-modal-title">AI Financial Advisor</h3>
                    <p className="chat-header-modal-subtitle">Ask me anything about your finances</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChat(false)}
                  className="close-button"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div className="messages-container">
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`message-bubble-wrapper ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationFillMode: 'backwards'
                    }}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'message-user-bubble' 
                        : 'message-assistant-bubble'
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className="message-role-indicator">
                          <span className="message-role-icon">🤖</span>
                          <span className="message-role-text">AI Advisor</span>
                        </div>
                      )}
                      <p className="message-content-text">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="chat-input-container-wrapper">
                <div className="chat-input-elements">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about investments, retirement, budgeting..."
                    className="chat-input"
                  />
                  <button 
                    onClick={sendMessage}
                    className="send-button"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <div className="suggestion-chips-container">
                  {['💰 Savings tips', '📈 Investment advice', '🎯 Goal planning', '💳 Debt reduction'].map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(suggestion.split(' ').slice(1).join(' '))}
                      className="suggestion-chip"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
