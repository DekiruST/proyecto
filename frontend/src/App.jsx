// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import RegisterForm from './components/RegisterForm';
import Logs from './components/Logs';
import VerifyMFA from './components/VerifyMFA';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/logs" element={<Logs />} />
      <Route path="/verify-mfa" element={<VerifyMFA />} />
    </Routes>
  );
}
