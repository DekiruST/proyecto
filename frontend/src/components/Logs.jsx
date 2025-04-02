// src/components/Logs.jsx
import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Chart.js config
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

import { Bar } from 'react-chartjs-2';

export default function Logs() {
  const [logs, setLogs] = useState({ server1: [], server2: [] });
  const [activeTab, setActiveTab] = useState('level');
  const [loading, setLoading] = useState(false);

  const cargarLogs = async () => {
    setLoading(true);
    try {
      const q1 = query(collection(db, 'logs'), where('server', '==', 1));
      const q2 = query(collection(db, 'logs'), where('server', '==', 2));

      const [snap1, snap2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const server1Logs = snap1.docs.map(doc => doc.data());
      const server2Logs = snap2.docs.map(doc => doc.data());

      setLogs({ server1: server1Logs, server2: server2Logs });
    } catch (err) {
      console.error('Error cargando logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logs-container">
      <h2>Vista de Logs con Tabs</h2>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('level')} style={{ marginRight: 8 }}>
          Por logLevel
        </button>
        <button onClick={() => setActiveTab('status')} style={{ marginRight: 8 }}>
          Por status HTTP
        </button>
        <button onClick={cargarLogs} disabled={loading}>
          🔄 {loading ? 'Cargando...' : 'Recargar Gráficas'}
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
    const sumKnown = logLevels.reduce((acc, lvl) => acc + countLogsByLogLevel(logsArray, lvl), 0);
    return logsArray.length - sumKnown;
  };

  const labels = [...logLevels, 'otros'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Servidor 1 (Rate Limit)',
        data: [...logLevels.map(lvl => countLogsByLogLevel(server1Logs, lvl)), countOthers(server1Logs)],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Servidor 2 (Sin Rate Limit)',
        data: [...logLevels.map(lvl => countLogsByLogLevel(server2Logs, lvl)), countOthers(server2Logs)],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Logs por logLevel' },
      legend: { position: 'bottom' }
    },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div>
      <h3>Gráfica por logLevel</h3>
      <Bar data={data} options={options} />
    </div>
  );
}

function LogsByStatus({ server1Logs, server2Logs }) {
  const statuses = [200, 201, 400, 404, 500];

  const countLogsByStatus = (logsArray, st) =>
    logsArray.filter(log => log.status === st).length;

  const countOthersStatus = (logsArray) => {
    const sumKnown = statuses.reduce((acc, st) => acc + countLogsByStatus(logsArray, st), 0);
    return logsArray.length - sumKnown;
  };

  const getOthersStatus = (logsArray) => {
    const otherStatuses = new Set();
    logsArray.forEach(log => {
      if (!statuses.includes(log.status)) {
        otherStatuses.add(log.status);
      }
    });
    return [...otherStatuses];
  };

  const labels = [...statuses.map(st => st.toString()), 'otros'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Servidor 1 (Rate Limit)',
        data: [...statuses.map(st => countLogsByStatus(server1Logs, st)), countOthersStatus(server1Logs)],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Servidor 2 (Sin Rate Limit)',
        data: [...statuses.map(st => countLogsByStatus(server2Logs, st)), countOthersStatus(server2Logs)],
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Logs agrupados por status HTTP (Server 1 vs Server 2)' },
      legend: { position: 'bottom' }
    },
    scales: { y: { beginAtZero: true } }
  };

  const server1Others = getOthersStatus(server1Logs);
  const server2Others = getOthersStatus(server2Logs);

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Gráfica por status</h3>
      <Bar data={data} options={options} />
      <div style={{ marginTop: '1rem' }}>
        <p><strong>Servidor 1 (otros):</strong> {server1Others.join(', ') || 'Ninguno'}</p>
        <p><strong>Servidor 2 (otros):</strong> {server2Others.join(', ') || 'Ninguno'}</p>
      </div>
    </div>
  );
}
