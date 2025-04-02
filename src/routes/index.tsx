import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Products from '../pages/Products';
import Chats from '../pages/Chats';
import Promos from '../pages/Promos';
import Donzela from '../pages/Donzela';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import TestConnection from '../pages/TestConnection';
import DirectTest from '../pages/DirectTest';
import ResetPassword from '../pages/ResetPassword';
import ForceLogout from '../pages/ForceLogout';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../auth.jsx';

const AppRoutes = () => {
  const { user } = useAuth();

  // Se o usuário estiver autenticado e tentar acessar login/register, redireciona para home
  if (user && window.location.pathname.match(/^\/(login|register)$/)) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/test-connection" element={<TestConnection />} />
      <Route path="/direct-test" element={<DirectTest />} />
      <Route path="/logout" element={<ForceLogout />} />
      
      {/* Rotas protegidas */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
      <Route path="/promos" element={<ProtectedRoute><Promos /></ProtectedRoute>} />
      <Route path="/donzela" element={<ProtectedRoute><Donzela /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* Rota raiz e fallback */}
      <Route path="/" element={<Navigate to={user ? "/home" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={user ? "/home" : "/login"} replace />} />
    </Routes>
  );
};

export default AppRoutes;