import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardMetrics } from '../services/neonDb';
import { Sidebar } from './Sidebar';
import { PacientesView } from './PacientesView';
import { PacienteModal } from './PacienteModal';
import { AnalistaView } from './AnalistaView';
import {
  Users,
  CalendarDays,
  ClockAlert,
  Menu,
  RefreshCw,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  User,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const isPaciente = user?.role === 'paciente';

  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'pacientes' | 'analista'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);

  const fetchMetrics = async () => {
    if (!user?.id || isPaciente) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await getDashboardMetrics(user.id);
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao carregar métricas do dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user?.id, isPaciente]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const handleOpenPaciente = (pacienteId) => {
    setSelectedPacienteId(pacienteId);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const getBreadcrumbTitle = () => {
    if (currentView === 'pacientes') return 'Pacientes';
    if (currentView === 'analista') return 'Perfil Analista';
    return 'Nutricionista';
  };

  return (
    <div className="dashboard-app-layout">
      {/* Sidebar Fixa à Esquerda */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Área Principal de Conteúdo */}
      <div className="dashboard-main-wrapper">
        {/* Top Header Mobile / Desktop */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <div className="topbar-breadcrumb">
              <span className="breadcrumb-root">MSV Nutrição</span>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span className="breadcrumb-current">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="realtime-status-pill">
              <span className="pulse-dot" />
              <span>Neon PostgreSQL Conectado</span>
            </div>
            <button
              type="button"
              className="btn-refresh-top"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Atualizar dados em tempo real"
            >
              <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
              <span className="refresh-text">Atualizar</span>
            </button>
          </div>
        </header>

        {/* Conteúdo Dinâmico: Nutricionista, Pacientes ou Analista */}
        <main className="dashboard-content-area">
          {currentView === 'pacientes' ? (
            <PacientesView
              onSelectPaciente={handleOpenPaciente}
              onOpenAnalista={(id) => {
                setSelectedPacienteId(id);
                setCurrentView('analista');
              }}
            />
          ) : currentView === 'analista' ? (
            <AnalistaView initialPacienteId={selectedPacienteId} />
          ) : isPaciente ? (
            /* Visualização Simplificada para Perfil do Paciente */
            <div className="paciente-dashboard-welcome">
              <div className="welcome-banner">
                <div className="banner-badge">
                  <User size={14} /> Portal do Paciente
                </div>
                <h2>Bem-vindo(a), {user?.nome || 'Paciente'}!</h2>
                <p>Acompanhe suas consultas, metas e orientações nutricionais.</p>
              </div>
            </div>
          ) : (
            /* Visualização do Nutricionista com os 3 Cards de Informação */
            <div className="nutri-dashboard-container">
              {/* Saudação e Boas-Vindas */}
              <div className="dashboard-hero-header">
                <div>
                  <div className="hero-greeting">
                    <Sparkles size={16} className="sparkle-icon" />
                    <span>Painel Clínico</span>
                  </div>
                  <h1 className="hero-title">
                    Olá, Dr(a). {user?.nome || user?.name || 'Nutricionista'}
                  </h1>
                  <p className="hero-subtitle">
                    Aqui está o resumo em tempo real dos seus pacientes e consultas da semana.
                  </p>
                </div>
              </div>

              {/* Grid dos 3 Cards Principais */}
              <div className="dashboard-cards-grid">
                {/* Card 1 — Total de Pacientes Ativos */}
                <div className="dashboard-card-item card-pacientes-ativos">
                  <div className="card-item-top">
                    <div className="card-icon-box bg-emerald">
                      <Users size={24} />
                    </div>
                    <span className="card-chip chip-emerald">Em Acompanhamento</span>
                  </div>

                  <div className="card-item-content">
                    <div className="metric-number-display">
                      {loading ? (
                        <div className="metric-skeleton" />
                      ) : (
                        <span className="metric-value">{metrics.totalPacientes}</span>
                      )}
                    </div>
                    <h3 className="metric-title">Total de Pacientes Ativos</h3>
                    <p className="metric-description">
                      Pacientes cadastrados sob seus cuidados clínicos no sistema.
                    </p>
                  </div>

                  <div className="card-item-footer">
                    <button
                      type="button"
                      className="card-action-btn"
                      onClick={() => setCurrentView('pacientes')}
                    >
                      <span>Ver todos os pacientes</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Card 2 — Consultas da Semana */}
                <div className="dashboard-card-item card-consultas-semana">
                  <div className="card-item-top">
                    <div className="card-icon-box bg-blue">
                      <CalendarDays size={24} />
                    </div>
                    <span className="card-chip chip-blue">Semana Atual</span>
                  </div>

                  <div className="card-item-content">
                    <div className="metric-number-display">
                      {loading ? (
                        <div className="metric-skeleton" />
                      ) : (
                        <span className="metric-value">{metrics.consultasSemana}</span>
                      )}
                    </div>
                    <h3 className="metric-title">Consultas da Semana</h3>
                    <p className="metric-description">
                      Atendimentos e retornos registrados no período corrente.
                    </p>
                  </div>

                  <div className="card-item-footer">
                    <div className="footer-status-pill">
                      <TrendingUp size={14} />
                      <span>Agendamentos da semana</span>
                    </div>
                  </div>
                </div>

                {/* Card 3 — Pacientes sem Retorno */}
                <div className="dashboard-card-item card-sem-retorno">
                  <div className="card-item-top">
                    <div className="card-icon-box bg-amber">
                      <ClockAlert size={24} />
                    </div>
                    <span className="card-chip chip-amber">
                      {metrics.pacientesSemRetorno.length} sem retorno
                    </span>
                  </div>

                  <div className="card-item-content-full">
                    <div className="card-header-row">
                      <div>
                        <h3 className="metric-title">Pacientes sem Retorno</h3>
                        <p className="metric-description">
                          Última consulta há mais de 30 dias sem próximo agendamento.
                        </p>
                      </div>
                    </div>

                    {/* Lista de Pacientes Sem Retorno */}
                    <div className="sem-retorno-list-container">
                      {loading ? (
                        <div className="list-loading-state">
                          <div className="spinner" />
                          <span>Carregando pacientes...</span>
                        </div>
                      ) : metrics.pacientesSemRetorno.length === 0 ? (
                        <div className="empty-return-state">
                          <div className="empty-return-icon">
                            <CheckCircle2 size={28} />
                          </div>
                          <div className="empty-return-text">
                            <strong>Nenhum paciente sem retorno no momento</strong>
                            <span>Todos os seus pacientes estão com o acompanhamento em dia!</span>
                          </div>
                        </div>
                      ) : (
                        <div className="return-patient-items">
                          {metrics.pacientesSemRetorno.map((p) => (
                            <div
                              key={p.id}
                              className="return-patient-row"
                              onClick={() => handleOpenPaciente(p.id)}
                              role="button"
                              tabIndex={0}
                              title="Clique para ver o perfil completo do paciente"
                            >
                              <div className="return-patient-info">
                                <div className="return-patient-avatar">
                                  {p.nome ? p.nome.charAt(0).toUpperCase() : 'P'}
                                </div>
                                <div>
                                  <span className="return-patient-name">{p.nome}</span>
                                  <div className="return-patient-meta">
                                    <span>
                                      Última consulta: {formatDate(p.ultima_data_consulta)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="return-patient-action">
                                <span className="days-alert-badge">
                                  {p.dias_sem_consulta
                                    ? `Há ${p.dias_sem_consulta} dias`
                                    : 'Mais de 30 dias'}
                                </span>
                                <ChevronRight size={16} className="row-arrow" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Detalhes do Paciente */}
      {selectedPacienteId && (
        <PacienteModal
          pacienteId={selectedPacienteId}
          onClose={() => setSelectedPacienteId(null)}
        />
      )}
    </div>
  );
}
