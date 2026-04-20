import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import History from './pages/History';

import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';

const NavigateToHome = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/" : "/login"} replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/favorites" element={<Navigate to="/" replace />} />
              <Route path="/history" element={<History />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NavigateToHome />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
};


export default App;
