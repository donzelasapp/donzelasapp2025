import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Register2 from './pages/Register2';
import Home from './pages/Home';
import Products from './pages/Products';
import Chats from './pages/Chats';
import Promos from './pages/Promos';
import Donzela from './pages/Donzela';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import TestConnection from './pages/TestConnection';
import DirectTest from './pages/DirectTest';
import ResetPassword from './pages/ResetPassword';
import ForceLogout from './pages/ForceLogout';
import FixProfile from './pages/FixProfile';
import TestStorage from './pages/TestStorage';

// Componentes
import Navigation from './components/Navigation';
import PrivateRoute from './components/PrivateRoute';

// Layout para rotas protegidas
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-black relative flex flex-col">
    <main className="flex-1 pb-20">
      {children}
    </main>
    <Navigation />
  </div>
);

// App principal
function App() {
  return (
    <AuthProvider>
      <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* Rotas públicas */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register2" element={<Register2 />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/test-connection" element={<TestConnection />} />
        <Route path="/direct-test" element={<DirectTest />} />
        <Route path="/logout" element={<ForceLogout />} />
        <Route path="/fix-profile" element={<FixProfile />} />
        <Route path="/storage-test" element={
          <PrivateRoute>
            <TestStorage />
          </PrivateRoute>
        } />
        
        {/* Rotas protegidas */}
        <Route path="/home" element={
          <PrivateRoute>
            <ProtectedLayout>
              <Home />
            </ProtectedLayout>
          </PrivateRoute>
        } />
        <Route path="/products" element={
          <PrivateRoute>
            <ProtectedLayout>
              <Products />
            </ProtectedLayout>
          </PrivateRoute>
        } />
        <Route path="/chats" element={
          <PrivateRoute>
            <ProtectedLayout>
              <Chats />
            </ProtectedLayout>
          </PrivateRoute>
        } />
        <Route path="/promos" element={
          <PrivateRoute>
            <ProtectedLayout>
              <Promos />
            </ProtectedLayout>
          </PrivateRoute>
        } />
        <Route path="/donzela" element={
          <PrivateRoute>
            <ProtectedLayout>
              <Donzela />
            </ProtectedLayout>
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <ProtectedLayout>
              <Profile />
            </ProtectedLayout>
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          </PrivateRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;