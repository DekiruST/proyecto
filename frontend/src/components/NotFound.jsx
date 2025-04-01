import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404 - Página no encontrada</h1>
      <p>La ruta a la que intentas acceder no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}