import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Sistema de Autenticación con MFA</h1>
      
      <div className="team-info">
        <div className="member-card">
          <h3>Alumno</h3>
          <p>Nombre: TSU Jose Maria Santa Ana</p>
          <p>Grupo: IDGS011</p>
        </div>
        
        <div className="member-card">
          <h3>Docente</h3>
          <p>Nombre: M.C.C Emmanuel Martinez Hernandez</p>
          <p>Materia: Seguridad en Aplicaciones</p>
        </div>
      </div>

      <p className="app-description">
        Esta aplicación demuestra un sistema de autenticación seguro con JWT, 
        autenticación de dos factores (MFA) y registro detallado de logs.
      </p>

      <button 
        className="logs-button"
        onClick={() => navigate('/logs')}
      >
        Ver Gráficos de Logs
      </button>
    </div>
  );
}
