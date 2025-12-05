import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './NewLoginForm.css'; // Reutilizamos os estilos para consistência

export default function UpdatePassword({ onPasswordUpdated }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;
      
      setMessage('Password atualizada com sucesso!');
      setTimeout(() => {
        if (onPasswordUpdated) onPasswordUpdated();
      }, 1500);

    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container" style={{justifyContent: 'center', alignItems: 'center', background: '#111827'}}>
      <div className="login-form-wrapper" style={{background: '#1f2937', padding: '2rem', borderRadius: '1rem'}}>
        <h2 className="welcome-text">Definir Nova Password</h2>
        <form onSubmit={handleUpdatePassword} className="login-form-fields">
          <div>
            <label className="input-label">Nova Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Nova password segura"
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'A atualizar...' : 'Atualizar Password'}
          </button>
          {message && <p className={`feedback-message ${message.includes('sucesso') ? 'success' : 'error'}`}>{message}</p>}
        </form>
      </div>
    </div>
  );
}