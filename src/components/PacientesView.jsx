import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPacientesByNutri } from '../services/neonDb';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  User,
  Users,
  Eye,
  RefreshCw,
  Calendar,
  Sparkles,
  ChevronRight,
  Target,
  Clock,
} from 'lucide-react';

export function PacientesView({ onSelectPaciente, onNovoPaciente, onOpenAnalista }) {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPacientes = async () => {
    if (!user?.id) return;
    try {
      const data = await getPacientesByNutri(user.id);
      setPacientes(data || []);
    } catch (err) {
      console.error('Erro ao buscar lista de pacientes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPacientes();
  };

  // Filtro de busca por nome, e-mail ou WhatsApp
  const filteredPacientes = pacientes.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nomeMatch = p.nome && p.nome.toLowerCase().includes(term);
    const emailMatch = p.email && p.email.toLowerCase().includes(term);
    const zapMatch = p.whatsapp && p.whatsapp.includes(term);
    const objMatch =
      p.objetivo_texto && p.objetivo_texto.toLowerCase().includes(term);
    const objsArrayMatch =
      Array.isArray(p.objetivos) &&
      p.objetivos.some((o) => o && o.toLowerCase().includes(term));

    return nomeMatch || emailMatch || zapMatch || objMatch || objsArrayMatch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="pacientes-view-container fade-in">
      {/* Header da Seção com Botão Novo Paciente */}
      <div className="pacientes-top-header">
        <div>
          <div className="hero-greeting">
            <Users size={16} className="sparkle-icon" />
            <span>Gestão Clínica</span>
          </div>
          <h2 className="view-title">Pacientes</h2>
          <p className="view-subtitle">
            Gerenciamento de todos os pacientes vinculados ao seu consultório
          </p>
        </div>

        <div className="header-actions-row">
          <button
            type="button"
            className="btn-refresh-pill"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Atualizar lista"
          >
            <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            className="btn-primary-action btn-novo-paciente"
            onClick={onNovoPaciente}
          >
            <UserPlus size={18} />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="search-bar-wrapper">
        <div className="search-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar paciente por nome, objetivo, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>
        <span className="search-count-badge">
          {filteredPacientes.length}{' '}
          {filteredPacientes.length === 1 ? 'paciente' : 'pacientes'}
        </span>
      </div>

      {/* Conteúdo da Listagem */}
      {loading ? (
        <div className="view-loading-box">
          <div className="spinner" />
          <span>Carregando pacientes do banco de dados Neon...</span>
        </div>
      ) : filteredPacientes.length === 0 ? (
        <div className="empty-pacientes-card">
          <div className="empty-icon-circle">
            <User size={36} />
          </div>
          <h3>
            {searchTerm
              ? 'Nenhum paciente encontrado para esta busca'
              : 'Nenhum paciente cadastrado ainda'}
          </h3>
          <p>
            {searchTerm
              ? 'Tente buscar por outro termo ou limpe o campo de pesquisa.'
              : 'Comece cadastrando seu primeiro paciente para gerenciar atendimentos, planos alimentares e evolução clínica.'}
          </p>
          {!searchTerm && (
            <button
              type="button"
              className="btn-primary-action"
              onClick={onNovoPaciente}
              style={{ marginTop: '1.25rem' }}
            >
              <UserPlus size={18} />
              <span>Cadastrar Primeiro Paciente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="pacientes-grid">
          {filteredPacientes.map((p) => {
            const dataUltimaConsulta = formatDate(p.ultima_data_consulta);
            const objetivosList = Array.isArray(p.objetivos) ? p.objetivos : [];

            return (
              <div
                key={p.id}
                className="paciente-card"
                onClick={() => onSelectPaciente(p.id)}
                role="button"
                tabIndex={0}
                title="Clique para abrir o perfil do paciente"
              >
                {/* Header do Card com Avatar e Nome */}
                <div className="paciente-card-header">
                  <div className="paciente-avatar">
                    {p.nome ? p.nome.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div className="paciente-main-info">
                    <h4 className="paciente-name">{p.nome}</h4>
                    <span className="paciente-created">
                      Cadastrado em {formatDate(p.created_at)}
                    </span>
                  </div>
                </div>

                {/* Corpo do Card: Objetivos e Última Consulta conforme Prompt 4 */}
                <div className="paciente-card-body">
                  {/* Bloco de Objetivo */}
                  <div className="paciente-card-item-row">
                    <div className="paciente-card-label-row">
                      <Target size={14} className="icon-emerald" />
                      <span className="card-sub-label">Objetivo:</span>
                    </div>
                    <div className="paciente-card-tags-cloud">
                      {objetivosList.length > 0 ? (
                        objetivosList.slice(0, 3).map((obj) => (
                          <span key={obj} className="card-goal-chip">
                            {obj}
                          </span>
                        ))
                      ) : p.objetivo_texto ? (
                        <span className="card-goal-text">{p.objetivo_texto}</span>
                      ) : (
                        <span className="card-empty-text">Não informado</span>
                      )}
                      {objetivosList.length > 3 && (
                        <span className="card-goal-more">+{objetivosList.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Bloco de Data da Última Consulta */}
                  <div className="paciente-card-item-row">
                    <div className="paciente-card-label-row">
                      <Clock size={14} className="icon-blue" />
                      <span className="card-sub-label">Última consulta:</span>
                    </div>
                    <div className="paciente-card-value-display">
                      {dataUltimaConsulta ? (
                        <span className="card-date-badge">{dataUltimaConsulta}</span>
                      ) : (
                        <span className="card-no-consult-badge">
                          Sem consultas registradas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contatos Rápidos se houver */}
                  {(p.email || p.whatsapp) && (
                    <div className="paciente-card-contacts">
                      {p.email && (
                        <div className="contact-mini-item">
                          <Mail size={13} />
                          <span className="truncate">{p.email}</span>
                        </div>
                      )}
                      {p.whatsapp && (
                        <div className="contact-mini-item">
                          <Phone size={13} />
                          <span>{p.whatsapp}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer do Card com Ação */}
                <div className="paciente-card-footer">
                  <span className="view-profile-hint">Ver Perfil Completo</span>
                  <div className="btn-view-circle">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
