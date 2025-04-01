// src/components/Logs.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Importar lo necesario de Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Importar el componente de barras
import { Bar } from 'react-chartjs-2';

export default function Logs() {
  // Aquí guardamos los logs de server1 y server2
  const [logs, setLogs] = useState({ server1: [], server2: [] });

  // Estado para controlar la pestaña activa: 'level' o 'status'
  const [activeTab, setActiveTab] = useState('level');

  useEffect(() => {
    // Suscripción a logs del servidor 1 (server=1)
    const q1 = query(collection(db, 'logs'), where('server', '==', 1));
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const server1Logs = snapshot.docs.map(doc => doc.data());
      setLogs(prev => ({ ...prev, server1: server1Logs }));
    });

    // Suscripción a logs del servidor 2 (server=2)
    const q2 = query(collection(db, 'logs'), where('server', '==', 2));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const server2Logs = snapshot.docs.map(doc => doc.data());
      setLogs(prev => ({ ...prev, server2: server2Logs }));
    });

    // Cleanup al desmontar
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  return (
    <div className="logs-container">
      <h2>Vista de Logs con Tabs</h2>
      
      {/* Botones de Tabs */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('level')} style={{ marginRight: 8 }}>
          Por logLevel
        </button>
        <button onClick={() => setActiveTab('status')}>
          Por status HTTP
        </button>
      </div>

      {activeTab === 'level' && (
        <LogsByLevel server1Logs={logs.server1} server2Logs={logs.server2} />
      )}

      {activeTab === 'status' && (
        <LogsByStatus server1Logs={logs.server1} server2Logs={logs.server2} />
      )}
    </div>
  );
}

function LogsByLevel({ server1Logs, server2Logs }) {
  const logLevels = ['info', 'warn', 'error', 'debug'];


  const countLogsByLogLevel = (logsArray, level) => 
    logsArray.filter(log => log.logLevel === level).length;


  const countOthers = (logsArray) => {
    const sumKnown = logLevels.reduce(
      (acc, lvl) => acc + countLogsByLogLevel(logsArray, lvl),
      0
    );
    return logsArray.length - sumKnown;
  };

  const labels = [...logLevels, 'otros'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Servidor 1 (Rate Limit)',
        data: [
          ...logLevels.map(lvl => countLogsByLogLevel(server1Logs, lvl)),
          countOthers(server1Logs)
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.7)', // azul
      },
      {
        label: 'Servidor 2 (Sin Rate Limit)',
        data: [
          ...logLevels.map(lvl => countLogsByLogLevel(server2Logs, lvl)),
          countOthers(server2Logs)
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.7)', // rojo
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Logs agrupados por logLevel (Server 1 vs Server 2)',
      },
      legend: { position: 'bottom' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div>
      <h3>Gráfica por logLevel</h3>
      <Bar data={data} options={options} />
    </div>
  );
}


function LogsByStatus({ server1Logs, server2Logs }) {
  // array con los status principales que graficamos
  const statuses = [200, 201, 400, 404, 500];

  const countLogsByStatus = (logsArray, st) =>
    logsArray.filter(log => log.status === st).length;

  const countOthersStatus = (logsArray) => {
    const sumKnown = statuses.reduce(
      (acc, st) => acc + countLogsByStatus(logsArray, st),
      0
    );
    return logsArray.length - sumKnown;
  };

  // Esta función obtiene un array único de los códigos que no están en statuses
  const getOthersStatus = (logsArray) => {
    const otherStatuses = new Set();
    logsArray.forEach(log => {
      if (!statuses.includes(log.status)) {
        otherStatuses.add(log.status);
      }
    });
    return [...otherStatuses]; // convertimos Set a array
  };

  // labels y data para la gráfica
  const labels = [...statuses.map(st => st.toString()), 'otros'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Servidor 1 (Rate Limit)',
        data: [
          ...statuses.map(st => countLogsByStatus(server1Logs, st)),
          countOthersStatus(server1Logs)
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Servidor 2 (Sin Rate Limit)',
        data: [
          ...statuses.map(st => countLogsByStatus(server2Logs, st)),
          countOthersStatus(server2Logs)
        ],
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Logs agrupados por status HTTP (Server 1 vs Server 2)',
      },
      legend: { position: 'bottom' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Obtenemos los arrays de “otros” statuses para cada servidor
  const server1Others = getOthersStatus(server1Logs);
  const server2Others = getOthersStatus(server2Logs);

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Gráfica por status</h3>
      <Bar data={data} options={options} />

      {/* Mostrar al usuario cuáles son los status que están quedando en “otros” */}
      <div style={{ marginTop: '1rem' }}>
        <p><strong>Servidor 1 (otros):</strong> {server1Others.join(', ') || 'Ninguno'}</p>
        <p><strong>Servidor 2 (otros):</strong> {server2Others.join(', ') || 'Ninguno'}</p>
      </div>
    </div>
  );
}

