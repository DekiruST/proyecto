import axios from 'axios';

export const server1 = axios.create({
  baseURL: 'https://server1-mzw6.onrender.com',
});

export const server2 = axios.create({
  baseURL: 'https://server2-t91v.onrender.com', 
});
