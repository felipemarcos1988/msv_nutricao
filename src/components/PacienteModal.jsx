import React, { useEffect, useState } from 'react';
import { X, User, Phone, Mail, Calendar, Weight, Ruler, Activity, Clock, AlertCircle } from 'lucide-react';
import { getPacienteById, getConsultasByPaciente } from '../services/neonDb';

export function PacienteModal({ pacienteId, onClose, onScheduleConsulta }) {
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pacienteId) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [pacData, consData] = await Promise.all([
          getPacienteById(pacienteId),
          getConsultasByPaciente(pacienteId),
        ]);
        if (isMounted) {
          setPaciente(pacData);
          setConsultas(consData || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do paciente:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [pacienteId]);

  if (!pacienteId) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não informada';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-icon-badge">
              <User size={20} />
            </div>
            <div>
              <h3>Perfil do Paciente</h3>
              <p className="modal-subtitle">Dados cadastrais e histórico de consultas</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading-state">
              <div className="spinner" />
              <span>Carregando dados do paciente...</span>
            </div>
          ) : paciente ? (
            <div className="modal-content-grid">
              {/* Informações Básicas */}
              <div className="patient-summary-card">
                <h4 className="patient-name-title">{paciente.nome}</h4>
                <div className="patient-contact-grid">
                  <div className="patient-contact-item">
                    <Mail size={16} />
                    <span>{paciente.email || 'E-mail não cadastrado'}</span>
                  </div>
                  <div className="patient-contact-item">
                    <Phone size={16} />
                    {paciente.whatsapp ? (
                      <a
                        href={`https://wa.me/${paciente.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp-link"
                      >
                        {paciente.whatsapp}
                      </a>
                    ) : (
                      <span>WhatsApp não informado</span>
                    )}
                  </div>
                  <div className="patient-contact-item">
                    <Calendar size={16} />
                    <span>Nasc: {formatDate(paciente.data_nascimento)}</span>
                  </div>
                </div>

                {/* Métricas Físicas */}
                <div className="patient-metrics-row">
                  <div className="patient-metric-pill">
                    <Weight size={16} />
                    <span>Peso Inicial: <strong>{paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'N/A'}</strong></span>
                  </div>
                  <div className="patient-metric-pill">
                    <Ruler size={16} />
                    <span>Altura: <strong>{paciente.altura ? `${paciente.altura} m` : 'N/A'}</strong></span>
                  </div>
                  {paciente.nivel_atividade && (
                    <div className="patient-metric-pill">
                      <Activity size={16} />
                      <span>Atividade: <strong>{paciente.nivel_atividade}</strong></span>
                    </div>
                  )}
                </div>

                {paciente.objetivo_texto && (
                  <div className="patient-objective-box">
                    <strong>Objetivo:</strong> {paciente.objetivo_texto}
                  </div>
                )}
              </div>

              {/* Histórico de Consultas */}
              <div className="patient-history-section">
                <h5 className="section-subtitle">
                  <Clock size={16} /> Histórico de Consultas ({consultas.length})
                </h5>

                {consultas.length === 0 ? (
                  <div className="empty-history-box">
                    <AlertCircle size={18} />
                    <span>Nenhuma consulta registrada para este paciente ainda.</span>
                  </div>
                ) : (
                  <div className="consultas-timeline">
                    {consultas.map((c) => (
                      <div key={c.id} className="consulta-card">
                        <div className="consulta-header">
                          <span className="consulta-date">
                            Consulta em {formatDate(c.data_consulta)}
                          </span>
                          {c.proximo_retorno && (
                            <span className="retorno-badge">
                              Retorno: {formatDate(c.proximo_retorno)}
                            </span>
                          )}
                        </div>
                        <div className="consulta-metrics">
                          {c.peso && <span><strong>Peso:</strong> {c.peso} kg</span>}
                          {c.cintura && <span><strong>Cintura:</strong> {c.cintura} cm</span>}
                          {c.percentual_gordura && <span><strong>% Gordura:</strong> {c.percentual_gordura}%</span>}
                        </div>
                        {c.observacoes && (
                          <p className="consulta-obs">{c.observacoes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="modal-error-state">
              <span>Paciente não encontrado.</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
