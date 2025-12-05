import React, { useState } from 'react';
import './NewLoginForm.css';
import { supabase } from '../supabaseClient';

export default function NewLoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false); // NOVO ESTADO
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Lógica para enviar o email de recuperação
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Redireciona para a URL atual após clicar no email
      });

      if (error) throw error;
      setMessage('Verifique o seu email para o link de recuperação.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
        if (isRegistering) {
            // Lógica de Registo (igual ao anterior)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (authError) throw authError;

            if (!authData.user) throw new Error("Falha no registo.");

            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    external_id: authData.user.id,
                    email: authData.user.email,
                    full_name: fullName,
                    external_provider: 'email'
                });

            if (profileError) throw profileError;
            
            setMessage('Sucesso! Verifique o email para confirmar a conta.');

        } else {
            // Lógica de Login
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            if (onLoginSuccess) onLoginSuccess(data.session);
        }
    } catch (error) {
        setMessage(error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
        setMessage(error.message);
        setLoading(false);
    }
  };

  // Renderização do Formulário de Recuperação
  if (isRecovery) {
    return (
        <div className="login-page-container">
            <div className="login-form-section" style={{width: '100%'}}>
                <div className="login-form-wrapper">
                    <h1 className="welcome-text">Recuperar Password</h1>
                    <p className="sub-welcome-text">Insira o seu email para receber um link de recuperação.</p>
                    <form onSubmit={handleResetPassword} className="login-form-fields">
                        <div>
                            <label className="input-label">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="submit-button">
                            {loading ? 'A enviar...' : 'Enviar Link'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => { setIsRecovery(false); setMessage(''); }} 
                            className="switch-mode-button"
                            style={{marginTop: '1rem', width: '100%', textAlign: 'center'}}
                        >
                            Voltar ao Login
                        </button>
                        {message && <p className={`feedback-message ${message.includes('Verifique') ? 'success' : 'error'}`}>{message}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
  }

  // Renderização Normal (Login/Registo)
  return (
    <div className="login-page-container">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <div className="brand-logo-container">
            <div className="brand-logo-icon"><span>W</span></div>
            <span className="brand-name">WiseWallet</span>
          </div>

          <h1 className="welcome-text">{isRegistering ? 'Criar conta' : 'Bem-vindo de volta'}</h1>
          <p className="sub-welcome-text">
            {isRegistering ? 'Registe-se na WiseWallet' : 'Entre na sua conta WiseWallet'}
          </p>

          <form onSubmit={handleSubmit} className="login-form-fields">
            {isRegistering && (
                <div>
                    <label className="input-label">Nome Completo</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input-field"
                        required
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
              />
            </div>

            <div>
              <div className="password-header">
                <label className="input-label">Password</label>
                {!isRegistering && (
                    <button 
                        type="button" 
                        className="forgot-password-link" 
                        onClick={() => setIsRecovery(true)}
                        style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}}
                    >
                        Esqueceu-se da password?
                    </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="submit-button">
              {loading ? <div className="spinner" /> : (isRegistering ? 'Registar' : 'Entrar')}
            </button>

            <div className="or-divider">Ou {isRegistering ? 'registe-se' : 'entre'} com</div>

            <div className="social-login-buttons">
              <button type="button" onClick={handleGoogleLogin} className="social-button google-button" disabled={loading}>
                Google
              </button>
            </div>

            <p className="no-account-text">
                {isRegistering ? 'Já tem conta?' : "Não tem conta?"}
                <button type="button" onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }} className="switch-mode-button">
                    {isRegistering ? 'Entrar' : 'Registar'}
                </button>
            </p>

            {message && <p className={`feedback-message ${message.includes('Sucesso') ? 'success' : 'error'}`}>{message}</p>}
          </form>
        </div>
      </div>
      <div className="features-section">
         {/* Conteúdo lateral mantém-se igual */}
         <div className="features-content">
            <h2 className="features-title">A sua liberdade financeira começa aqui</h2>
         </div>
      </div>
    </div>
  );
}