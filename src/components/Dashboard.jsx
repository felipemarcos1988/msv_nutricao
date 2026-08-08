import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Mail, ShieldCheck, Activity } from 'lucide-react';

export function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img src="/logo.png" alt="MSV Nutri Logo" className="dashboard-logo" />
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            MSV Nutrição
          </span>
        </div>
        <button onClick={logout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </header>

      <main className="dashboard-card">
        <span className="welcome-badge">Painel de Nutrição</span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>
          Bem-vinda(o), {user?.name || user?.email?.split('@')[0] || 'Nutricionista'}!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Sua sessão está ativa e autenticada via <strong>Neon Auth</strong>.
        </p>

        <div className="profile-grid">
          <div className="profile-stat">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} /> Nome Profissional
            </div>
            <div className="stat-value">{user?.name || 'Não informado'}</div>
          </div>

          <div className="profile-stat">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} /> E-mail Cadastrado
            </div>
            <div className="stat-value">{user?.email || 'N/A'}</div>
          </div>

          <div className="profile-stat">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} /> Status de Segurança
            </div>
            <div className="stat-value" style={{ color: 'var(--success-text)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Activity size={14} /> RLS & Auth Ativos
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
