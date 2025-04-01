import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { server1 } from '../services/api'; 
import QRCode from 'react-qr-code';

export default function RegisterForm() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });

  const [error, setError] = useState('');
  
  const [qrUrl, setQrUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await server1.post('/register', formData);
      const { userId, otpauth_url } = response.data;
      setQrUrl(otpauth_url);
      sessionStorage.setItem('registeredUserId', userId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error en el registro');
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Crear Cuenta</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Nombre de Usuario</label>
          <input
            type="text"
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            minLength="8"
            required
          />
        </div>

        <button type="submit">Registrarse</button>
      </form>

      {/* Si qrUrl tiene un valor, mostramos el QR con react-qr-code */}
      {qrUrl && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Escanea este código con Microsoft Authenticator</h3>
          <QRCode value={qrUrl} />
        </div>
      )}

<div className="auth-links" style={{ marginTop: '1rem' }}>
  ¿Ya tienes cuenta? <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: 'blue' }}>Inicia Sesión</span>
</div>

    </div>
  );
}
