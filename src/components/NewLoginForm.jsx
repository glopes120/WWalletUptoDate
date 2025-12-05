import React, { useState } from 'react';
import './NewLoginForm.css';
import { supabase } from '../supabaseClient';

export default function NewLoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');


  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
        if (isRegistering) {
            // Register user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error("Falha no registo: O objeto do utilizador não foi retornado.");
            }

            const userId = authData.user.id;
            const userEmail = authData.user.email;
            const userProvider = authData.user.app_metadata.provider || 'email';
            const userAvatar = authData.user.user_metadata.avatar_url || null;

            // Insert user profile into 'public.users' table
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    external_id: userId,
                    email: userEmail,
                    full_name: fullName,
                    external_provider: userProvider,
                    profile_image_url: userAvatar
                });

            if (profileError) {
                console.error("Erro ao criar o perfil na tabela 'users':", profileError.message);
                throw new Error(`Conta criada, mas falha ao guardar o perfil. (${profileError.message})`);
            }
            
            setMessage('Sucesso! Por favor, verifique o seu email para confirmar a conta.');

        } else {
            // Login logic
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            if (onLoginSuccess) {
                onLoginSuccess(data.session);
            }
        }
    
    } catch (error) {
        setMessage(error.message);
    
    } finally {
        setLoading(false);
    }
};

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
    });

    if (error) {
        setMessage(error.message);
        setLoading(false);
    }
  };


  return (
    <div className="login-page-container">
      {/* Left - Login Form */}
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <div className="brand-logo-container">
            <div className="brand-logo-icon">
              <span>W</span>
            </div>
            <span className="brand-name">WiseWallet</span>
          </div>

          <h1 className="welcome-text">{isRegistering ? 'Create your account' : 'Welcome back'}</h1>
          <p className="sub-welcome-text">
            {isRegistering ? 'Sign up for your WiseWallet account' : 'Sign in to your WiseWallet account'}
          </p>

          <form onSubmit={handleSubmit} className="login-form-fields">
            {isRegistering && (
                <div>
                    <label className="input-label">Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input-field"
                        required
                        autoComplete="name"
                    />
                </div>
            )}
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="password-header">
                <label className="input-label">Password</label>
                {!isRegistering && (
                    <a href="#" className="forgot-password-link">Forgot password?</a>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
                autoComplete={isRegistering ? "new-password" : "current-password"}
              />
            </div>

            {!isRegistering && (
                <label className="remember-me-checkbox">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="checkbox-input"
                    />
                    <span className="checkbox-label">Remember me</span>
                </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  <svg className="submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  {isRegistering ? 'Sign Up' : 'Sign In'}
                </>
              )}
            </button>

            <div className="or-divider">Or {isRegistering ? 'sign up' : 'sign in'} with</div>

            <div className="social-login-buttons">
              <button onClick={handleGoogleLogin} className="social-button google-button" disabled={loading}>
                <svg className="social-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>

            <p className="no-account-text">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                <button onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }} disabled={loading} className="switch-mode-button">
                    {isRegistering ? 'Sign In' : 'Sign Up'}
                </button>
            </p>

            {message && <p className={`feedback-message ${message.includes('Success') ? 'success' : 'error'}`}>{message}</p>}
          </form>
        </div>
      </div>

      {/* Right - Features */}
      <div className="features-section">
        <div className="features-background-animation">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="animated-dot"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="features-content">
          <h2 className="features-title">Financial freedom starts here</h2>
          <p className="features-subtitle">Take control of your finances with AI-powered insights and personalized recommendations.</p>

          <div className="feature-list">
            {[
              { num: '01', title: 'Smart Portfolio Management', desc: 'Track and optimize your investments with real-time analytics' },
              { num: '02', title: 'Personalized Financial Goals', desc: 'Set and achieve your financial goals with AI-guided plans' },
              { num: '03', title: 'Intelligent Budget Tracking', desc: 'Monitor your spending and save more with smart budgeting tools' }
            ].map((item) => (
              <div key={item.num} className="feature-item">
                <div className="feature-item-icon">
                  {item.num}
                </div>
                <div>
                  <h3 className="feature-item-title">{item.title}</h3>
                  <p className="feature-item-description">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="user-count-section">
            <div className="user-avatars">
              {['bg-emerald-400', 'bg-blue-400', 'bg-purple-400'].map((bg, i) => (
                <div key={i} className={`user-avatar ${bg}`} />
              ))}
            </div>
            <p className="user-count-text">Join <span className="user-count-highlight">12,500+</span> users already managing their finances with us</p>
          </div>
        </div>
      </div>
    </div>
  );
}
