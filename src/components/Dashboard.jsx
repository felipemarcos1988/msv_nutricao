import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Mail, ShieldCheck, Activity, Stethoscope, Droplets, Utensils, Database } from 'lucide-react';

export function Dashboard() {
  const { user, logout } = useAuth();
  const isPaciente = user?.role === 'paciente';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img src="/logo.png" alt="MSV Nutri Logo" className="dashboard-logo" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
              MSV Nutrição
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isPaciente ? 'Acompanhamento do Paciente' : 'Gestão Clínica para Nutricionistas'}
            </span>
          </div>
        </div>
        <button onClick={logout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </header>

      <main className="dashboard-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className={`welcome-badge ${isPaciente ? 'badge-paciente' : 'badge-nutri'}`}>
            {isPaciente ? <User size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> : <Stethoscope size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
            {isPaciente ? 'Portal do Paciente' : 'Painel do Nutricionista'}
          </span>
          <span className="db-badge">
            <Database size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Tabela Neon: {isPaciente ? 'public.pacientes' : 'public.nutricionistas'}
          </span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>
          Bem-vinda(o), {user?.nome || user?.name || (isPaciente ? 'Paciente' : 'Nutricionista')}!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {isPaciente
            ? 'Sua conta está conectada e seus dados de saúde estão sincronizados no Neon PostgreSQL.'
            : 'Sua sessão está ativa e autenticada com acesso completo aos dados clínicos no Neon PostgreSQL.'}
        </p>

        <div className="profile-grid">
          <div className="profile-stat">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} /> {isPaciente ? 'Nome do Paciente' : 'Nome Profissional'}
            </div>
            <div className="stat-value">{user?.nome || user?.name || 'Não informado'}</div>
          </div>

          <div className="profile-stat">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} /> E-mail Cadastrado
            </div>
            <div className="stat-value" style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}>{user?.email || 'N/A'}</div>
          </div>

          {isPaciente ? (
            <>
              <div className="profile-stat">
                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Droplets size={14} /> Meta Diária de Água
                </div>
                <div className="stat-value" style={{ color: '#60a5fa' }}>
                  {user?.litros_agua ? `${user.litros_agua} Litros / dia` : '2.0 Litros / dia'}
                </div>
              </div>

              <div className="profile-stat">
                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Utensils size={14} /> Plano Alimentar
                </div>
                <div className="stat-value" style={{ color: 'var(--success-text)' }}>
                  Acompanhamento Ativo
                </div>
              </div>
            </>
          ) : (
            <div className="profile-stat">
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={14} /> Status de Segurança
              </div>
              <div className="stat-value" style={{ color: 'var(--success-text)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Activity size={14} /> RLS & Auth Ativos
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
