import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, TrendingUp, LogOut, Stethoscope, User, ChevronRight } from 'lucide-react';

export function Sidebar({ currentView, onViewChange, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const isPaciente = user?.role === 'paciente';

  const navItems = isPaciente
    ? [
        { id: 'dashboard', label: 'Meu Painel', icon: LayoutDashboard },
      ]
    : [
        { id: 'dashboard', label: 'Nutricionista', icon: LayoutDashboard },
        { id: 'pacientes', label: 'Pacientes', icon: Users },
        { id: 'analista', label: 'Analista', icon: TrendingUp },
      ];

  // Identifica qual item do menu deve ficar ativo
  const isItemActive = (itemId) => {
    if (itemId === 'pacientes') {
      return (
        currentView === 'pacientes' ||
        currentView === 'novo-paciente' ||
        currentView === 'perfil-paciente'
      );
    }
    return currentView === itemId;
  };

  return (
    <>
      {/* Overlay para mobile */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Header com Logo */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo-bear.png" alt="MSV Nutrição" className="sidebar-logo" />
            <div className="sidebar-brand-text">
              <span className="brand-title">MSV Nutrição</span>
              <span className="brand-subtitle">
                {isPaciente ? 'Portal do Paciente' : 'Gestão Clínica'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu Principal</div>
          <ul className="sidebar-menu-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                    onClick={() => {
                      onViewChange(item.id);
                      if (setMobileOpen) setMobileOpen(false);
                    }}
                  >
                    <div className="nav-item-icon">
                      <Icon size={20} />
                    </div>
                    <span className="nav-item-label">{item.label}</span>
                    {active && <ChevronRight size={16} className="nav-item-arrow" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer do Menu Lateral com Usuário e Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {isPaciente ? <User size={18} /> : <Stethoscope size={18} />}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name" title={user?.nome || user?.name || 'Usuário'}>
                {user?.nome || user?.name || (isPaciente ? 'Paciente' : 'Nutricionista')}
              </span>
              <span className="sidebar-user-role">
                {isPaciente ? 'Paciente' : 'Nutricionista'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={logout}
            title="Encerrar sessão"
          >
            <LogOut size={18} />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
}
