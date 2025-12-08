import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './UpdatePassword.css'; // Importa o novo CSS

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
      
      setMessage('Password atualizada com sucesso! A redirecionar...');
      
      // Pequeno delay para o utilizador ler a mensagem
      setTimeout(() => {
        if (onPasswordUpdated) onPasswordUpdated();
      }, 2000);

    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-password-container">
      <div className="update-password-card">
        <div className="update-password-header">
          <h2>Definir Nova Password</h2>
          <p>Escolha uma nova senha segura para a sua conta.</p>
        </div>
        
        <form onSubmit={handleUpdatePassword}>
          <div className="form-group">
            <label htmlFor="new-password">Nova Password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" disabled={loading} className="update-btn">
            {loading ? 'A atualizar...' : 'Atualizar Password'}
          </button>

          {message && (
            <p className={`feedback-message ${message.includes('sucesso') ? 'success' : 'error'}`} style={{marginTop: '1rem', textAlign: 'center'}}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}