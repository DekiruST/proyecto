// RegisterForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Supongamos que server1 es tu servidor con rate limit
import { server1 } from '../services/api'; 
// IMPORTANTE: instala y luego importa QRCode
import QRCode from 'react-qr-code';

export default function RegisterForm() {
  const navigate = useNavigate();
  
  // Estados para los campos de registro
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });

  // Estado para mostrar errores (opcional)
  const [error, setError] = useState('');
  
  // Estado que guardará el otpauth_url que devuelve tu servidor
  const [qrUrl, setQrUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Llamas a tu servidor para registrar al usuario
      const response = await server1.post('/register', formData);

      // El servidor te envía userId, y *otpauth_url* 
      // si lo has agregado en la respuesta
      const { userId, otpauth_url } = response.data;

      // Almacenas la URL TOTP en tu estado
      setQrUrl(otpauth_url);

      // (Opcional) Guardas userId si lo necesitas
      sessionStorage.setItem('registeredUserId', userId);

      // A partir de aquí, decides si rediriges a otro lado 
      // o simplemente te quedas en esta vista para mostrar el QR.
      // navigate('/login'); // EJEMPLO: si quisieras pasar a login directo

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
        ¿Ya tienes cuenta? <span onClick={() => navigate('/login')}>Inicia Sesión</span>
      </div>
    </div>
  );
}
