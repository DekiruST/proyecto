// src/components/VerifyMFA.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { server1, server2 } from '../services/api';

export default function VerifyMFA() {
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Obtenemos estos datos de localStorage
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  // Si no hay, el usuario debería pasar primero por login

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // El servidor que generó el token, en general, es el que debemos llamar.
      // Pero si hemos cambiado a server2, podríamos checar la última variable.
      // Para simplificar, llamaremos a server1 (o en producción, guardas cuál usaste).
      const api = token ? server1 : server2;

      const res = await api.post('/verify-mfa', {
        token,
        mfaCode,
        userId
      });

      // Autenticación MFA exitosa
      localStorage.setItem('accessToken', res.data.accessToken);
      navigate('/'); // redirige a Home
    } catch (err) {
      let errorMessage = 'Error verificando MFA';
      if (err.response) {
        errorMessage = err.response.data || errorMessage;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="mfa-container">
      <h2>Verificación de 2 Factores (MFA)</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <label>Código de Autenticación</label>
          <input
            type="text"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            required
          />
        </div>
        <button type="submit">Verificar</button>
      </form>
    </div>
  );
}
