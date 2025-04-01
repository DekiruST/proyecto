import axios from 'axios';

// Servidor 1 en http://localhost:3000 (con Rate Limit)
export const server1 = axios.create({
  baseURL: 'http://localhost:3000',
});

// Servidor 2 en http://localhost:3001 (sin Rate Limit)
export const server2 = axios.create({
  baseURL: 'http://localhost:3001',
});
