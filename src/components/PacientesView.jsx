import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPacientesByNutri } from '../services/neonDb';
import { Search, UserPlus, Phone, Mail, User, Eye, RefreshCw, Calendar } from 'lucide-react';

export function PacientesView({ onSelectPaciente }) {
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

  const filteredPacientes = pacientes.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.nome && p.nome.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.whatsapp && p.whatsapp.includes(term))
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="pacientes-view-container">
      {/* Header da Seção */}
      <div className="view-header">
        <div>
          <h2 className="view-title">Pacientes</h2>
          <p className="view-subtitle">
            Gerenciamento de todos os pacientes vinculados ao seu consultório
          </p>
        </div>
        <div className="view-header-actions">
          <button
            type="button"
            className="btn-secondary refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Atualizar lista em tempo real"
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="search-bar-wrapper">
        <div className="search-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar paciente por nome, e-mail ou telefone..."
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
          {filteredPacientes.length} {filteredPacientes.length === 1 ? 'paciente' : 'pacientes'}
        </span>
      </div>

      {/* Conteúdo da Tabela / Cards */}
      {loading ? (
        <div className="view-loading-box">
          <div className="spinner" />
          <span>Carregando pacientes do banco de dados Neon...</span>
        </div>
      ) : filteredPacientes.length === 0 ? (
        <div className="empty-pacientes-card">
          <div className="empty-icon-circle">
            <User size={32} />
          </div>
          <h3>
            {searchTerm
              ? 'Nenhum paciente encontrado para esta busca'
              : 'Nenhum paciente cadastrado ainda'}
          </h3>
          <p>
            {searchTerm
              ? 'Tente buscar por outro termo ou limpe o campo de pesquisa.'
              : 'Quando novos pacientes forem cadastrados, eles aparecerão listados aqui.'}
          </p>
        </div>
      ) : (
        <div className="pacientes-grid">
          {filteredPacientes.map((p) => (
            <div key={p.id} className="paciente-card" onClick={() => onSelectPaciente(p.id)}>
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

              <div className="paciente-card-body">
                {p.email && (
                  <div className="paciente-contact-row">
                    <Mail size={14} />
                    <span className="truncate">{p.email}</span>
                  </div>
                )}
                {p.whatsapp && (
                  <div className="paciente-contact-row">
                    <Phone size={14} />
                    <span>{p.whatsapp}</span>
                  </div>
                )}
              </div>

              <div className="paciente-card-footer">
                <button
                  type="button"
                  className="btn-view-profile"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPaciente(p.id);
                  }}
                >
                  <Eye size={15} />
                  <span>Ver Detalhes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
