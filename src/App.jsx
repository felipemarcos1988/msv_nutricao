import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Cadastro } from './components/Cadastro';
import { Dashboard } from './components/Dashboard';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

function MainApp() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'cadastro'

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px', borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#ffffff' }} />
        <span>Verificando sessão...</span>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard />
      ) : (
        <div className="auth-page-wrapper">
          {authMode === 'login' ? (
            <Login onSwitchToCadastro={() => setAuthMode('cadastro')} />
          ) : (
            <Cadastro onSwitchToLogin={() => setAuthMode('login')} />
          )}
        </div>
      )}
      <PWAInstallPrompt />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
