// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { server1, server2 } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentServer, setCurrentServer] = useState('server1');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const api = currentServer === 'server2' ? server1 : server2;
      const res = await api.post('/login', { email, password });
      
      // Almacena token y secreto MFA
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('mfaSecret', res.data.mfaSecret);
      localStorage.setItem('userId', res.data.userId);

      // Redirigimos a la pantalla de verificación MFA
      navigate('/verify-mfa');
    } catch (err) {
      let errorMessage = 'Error en la autenticación';
      
      if (err.response) {
        // Se puede mostrar un mensaje específico del servidor
        errorMessage = err.response.data?.message || err.response.data || errorMessage;
        
        // Si es Rate Limit => cambia de servidor
        if (err.response.status === 429) {
          setCurrentServer('server2');
          errorMessage = 'Redirigiendo al servidor secundario (sin Rate Limit)...';
          // Reintentamos automáticamente tras 1.5s
          setTimeout(() => handleSubmit(e), 1500);
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="server-indicator">
        Conectado a: <span>{currentServer === 'server1' ? 'Servidor 1 (Rate Limit)' : 'Servidor 2 (Sin Rate Limit)'}</span>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Correo:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      
      <div className="auth-link">
        ¿No tienes cuenta? <span onClick={() => navigate('/register')}>Regístrate</span>
      </div>
    </div>
  );
}
