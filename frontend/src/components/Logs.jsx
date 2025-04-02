import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

import { Bar, Pie } from 'react-chartjs-2';

export default function Logs() {
  const [logs, setLogs] = useState({ server1: [], server2: [] });
  const [activeTab, setActiveTab] = useState('level');
  const [loading, setLoading] = useState(false);

  const handleFetchLogs = async () => {
    setLoading(true);
    try {
      const q1 = query(collection(db, 'logs'), where('server', '==', 1));
      const q2 = query(collection(db, 'logs'), where('server', '==', 2));

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const server1Logs = snap1.docs.map(doc => doc.data());
      const server2Logs = snap2.docs.map(doc => doc.data());

      console.log("Servidor 1 logs:", server1Logs);
      console.log("Servidor 2 logs:", server2Logs);

      setLogs({ server1: server1Logs, server2: server2Logs });
    } catch (err) {
      console.error("Error al cargar logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const allLogs = [...logs.server1, ...logs.server2];

  return (
    <div className="logs-container">
      <h2>Vista de Logs con Tabs</h2>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('level')} style={{ marginRight: 8 }}>Por logLevel</button>
        <button onClick={() => setActiveTab('status')} style={{ marginRight: 8 }}>Por status HTTP</button>
        <button onClick={() => setActiveTab('userAgent')} style={{ marginRight: 8 }}>Por User Agent</button>
        <button onClick={() => setActiveTab('responseTime')} style={{ marginRight: 8 }}>Tiempo Promedio</button>
        <button onClick={handleFetchLogs}>🔄 Recargar Gráficas</button>
      </div>

      {loading && <p>Cargando datos...</p>}

      {!loading && (
        <>
          {activeTab === 'level' && <LogsByLevel server1Logs={logs.server1} server2Logs={logs.server2} />}
          {activeTab === 'status' && <LogsByStatus server1Logs={logs.server1} server2Logs={logs.server2} />}
          {activeTab === 'userAgent' && <LogsByUserAgent logs={allLogs} />}
          {activeTab === 'responseTime' && <LogsByResponseTime logs={allLogs} />}
        </>
      )}
    </div>
  );
}

function LogsByLevel({ server1Logs, server2Logs }) {
  const logLevels = ['info', 'warn', 'error', 'debug'];
  const count = (arr, level) => arr.filter(log => log.logLevel === level).length;
  const countOthers = arr => arr.length - logLevels.reduce((acc, lvl) => acc + count(arr, lvl), 0);
  const labels = [...logLevels, 'otros'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Servidor 1 (Rate Limit)',
        data: [...logLevels.map(lvl => count(server1Logs, lvl)), countOthers(server1Logs)],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Servidor 2 (Sin Rate Limit)',
        data: [...logLevels.map(lvl => count(server2Logs, lvl)), countOthers(server2Logs)],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      }
    ]
  };

  return (
    <div>
      <h3>Gráfica por logLevel</h3>
      <Bar data={data} options={{ responsive: true, plugins: { title: { display: true, text: 'Logs por logLevel' }, legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}

function LogsByStatus({ server1Logs, server2Logs }) {
  const statuses = [200, 201, 400, 404, 500];
  const count = (arr, st) => arr.filter(log => log.status === st).length;
  const countOthers = arr => arr.length - statuses.reduce((acc, s) => acc + count(arr, s), 0);
  const labels = [...statuses.map(st => st.toString()), 'otros'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Servidor 1 (Rate Limit)',
        data: [...statuses.map(s => count(server1Logs, s)), countOthers(server1Logs)],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Servidor 2 (Sin Rate Limit)',
        data: [...statuses.map(s => count(server2Logs, s)), countOthers(server2Logs)],
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      }
    ]
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Gráfica por status</h3>
      <Bar data={data} options={{ responsive: true, plugins: { title: { display: true, text: 'Logs por status HTTP' }, legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}

function LogsByUserAgent({ logs }) {
  const counts = logs.reduce((acc, log) => {
    const agent = log.userAgent || 'Desconocido';
    acc[agent] = (acc[agent] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(counts);
  const data = {
    labels,
    datasets: [{
      label: 'User Agents',
      data: Object.values(counts),
      backgroundColor: labels.map(() => `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.6)`),
    }]
  };

  return (
    <div>
      <h3>Gráfica de User Agents</h3>
      <Pie data={data} options={{ responsive: true, plugins: { title: { display: true, text: 'Logs por User Agent' }, legend: { position: 'bottom' } } }} />
    </div>
  );
}

function LogsByResponseTime({ logs }) {
  const group = logs.reduce((acc, log) => {
    const server = log.server === 1 ? 'Servidor 1' : 'Servidor 2';
    acc[server] = acc[server] || { total: 0, count: 0 };
    acc[server].total += log.responseTime || 0;
    acc[server].count++;
    return acc;
  }, {});

  const labels = Object.keys(group);
  const data = {
    labels,
    datasets: [{
      label: 'Tiempo promedio (ms)',
      data: labels.map(s => group[s].total / group[s].count),
      backgroundColor: ['rgba(255, 206, 86, 0.7)', 'rgba(54, 162, 235, 0.7)'],
    }]
  };

  return (
    <div>
      <h3>Gráfica de Tiempos de Respuesta</h3>
      <Bar data={data} options={{ responsive: true, plugins: { title: { display: true, text: 'Tiempo de respuesta promedio por servidor' }, legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}
