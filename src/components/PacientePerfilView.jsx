import React, { useState, useEffect, useMemo } from 'react';
import {
  getPacienteById,
  updatePacienteCompleto,
  deletePaciente,
  getConsultasByPaciente,
} from '../services/neonDb';
import {
  formatPhone,
  formatSmartTime,
  calculateAge,
  calculateIMC,
  getImcBadge,
  calculateWaterIntake,
} from './NovoPacienteView';

import {
  User,
  HeartPulse,
  Coffee,
  ArrowLeft,
  Edit3,
  Save,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Weight,
  Ruler,
  Activity,
  Droplets,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Sparkles,
  TrendingUp,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  { id: 'Sedentário', label: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
  { id: 'Levemente ativo', label: 'Levemente ativo', desc: '1 a 3 dias por semana' },
  { id: 'Moderadamente ativo', label: 'Moderadamente ativo', desc: '3 a 5 dias por semana' },
  { id: 'Muito ativo', label: 'Muito ativo', desc: '6 a 7 dias por semana' },
  { id: 'Extremamente ativo', label: 'Extremamente ativo', desc: 'Treinos intensos diários / atleta' },
];

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

export function PacientePerfilView({
  pacienteId,
  onBack,
  onOpenAnalista,
  onPacienteDeleted,
  successNotification,
  refreshKey,
}) {
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedback, setFeedback] = useState(successNotification || null);
  const [activeTab, setActiveTab] = useState('resumo'); // 'resumo' | 'pessoal' | 'clinico' | 'habitos' | 'consultas'

  // Campos em modo de edição
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  const [pesoAtual, setPesoAtual] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivos, setObjetivos] = useState([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [patologias, setPatologias] = useState([]);
  const [customPatologia, setCustomPatologia] = useState('');
  const [restricoes, setRestricoes] = useState([]);
  const [customRestricao, setCustomRestricao] = useState('');
  const [alergias, setAlergias] = useState([]);
  const [customAlergia, setCustomAlergia] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [atividadeFisica, setAtividadeFisica] = useState(false);
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const populateForm = (data) => {
    if (!data) return;
    setNome(data.nome || '');
    // Formata data_nascimento para YYYY-MM-DD
    if (data.data_nascimento) {
      const dt = new Date(data.data_nascimento);
      setDataNascimento(dt.toISOString().slice(0, 10));
    } else {
      setDataNascimento('');
    }
    setSexo(data.sexo || '');
    setTelefone(data.telefone || '');
    setWhatsapp(data.whatsapp || '');
    setEmail(data.email || '');

    setPesoAtual(data.peso_inicial !== null && data.peso_inicial !== undefined ? String(data.peso_inicial) : '');
    setAltura(data.altura !== null && data.altura !== undefined ? String(data.altura) : '');
    setObjetivos(Array.isArray(data.objetivos) ? data.objetivos : []);
    setObjetivoTexto(data.objetivo_texto || '');
    setNivelAtividade(data.nivel_atividade || '');
    setPatologias(Array.isArray(data.patologias) ? data.patologias : []);
    setRestricoes(Array.isArray(data.restricoes_alimentares) ? data.restricoes_alimentares : []);
    setAlergias(Array.isArray(data.alergias) ? data.alergias : []);
    setMedicamentos(data.medicamentos || '');
    setSuplementos(data.suplementos || '');

    setRefeicoesPorDia(data.refeicoes_por_dia !== null && data.refeicoes_por_dia !== undefined ? String(data.refeicoes_por_dia) : '');
    setHorarioAcorda(data.horario_acorda || '');
    setHorarioDorme(data.horario_dorme || '');
    setLitrosAgua(data.litros_agua !== null && data.litros_agua !== undefined ? String(data.litros_agua) : '');
    setAtividadeFisica(Boolean(data.atividade_fisica));
    setAtividadeDescricao(data.atividade_fisica_descricao || '');
    setObservacoes(data.observacoes || '');
  };

  const loadData = async () => {
    if (!pacienteId) return;
    try {
      setLoading(true);
      const [pacData, consData] = await Promise.all([
        getPacienteById(pacienteId),
        getConsultasByPaciente(pacienteId),
      ]);
      setPaciente(pacData);
      setConsultas(consData || []);
      populateForm(pacData);
    } catch (err) {
      console.error('Erro ao carregar perfil do paciente:', err);
      setFeedback({ type: 'error', message: 'Erro ao carregar dados do paciente.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pacienteId, refreshKey]);


  // Cálculos dinâmicos
  const calculatedAge = useMemo(
    () => calculateAge(isEditing ? dataNascimento : paciente?.data_nascimento),
    [isEditing, dataNascimento, paciente?.data_nascimento]
  );

  const calculatedIMC = useMemo(() => {
    const p = isEditing ? pesoAtual : paciente?.peso_inicial;
    const a = isEditing ? altura : paciente?.altura;
    return calculateIMC(p, a);
  }, [isEditing, pesoAtual, altura, paciente?.peso_inicial, paciente?.altura]);

  const imcBadge = useMemo(() => getImcBadge(calculatedIMC), [calculatedIMC]);

  const calculatedWater = useMemo(() => {
    const p = isEditing ? pesoAtual : paciente?.peso_inicial;
    const af = isEditing ? atividadeFisica : paciente?.atividade_fisica;
    return calculateWaterIntake(p, calculatedAge, af);
  }, [isEditing, pesoAtual, paciente?.peso_inicial, calculatedAge, atividadeFisica, paciente?.atividade_fisica]);


  // Manipuladores de Toggle para Listas com Opção 'Nenhum'
  const handleToggleMultiSelect = (list, setList, item) => {
    if (item === 'Nenhum') {
      if (list.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
      return;
    }

    const filtered = list.filter((i) => i !== 'Nenhum');
    if (filtered.includes(item)) {
      setList(filtered.filter((i) => i !== item));
    } else {
      setList([...filtered, item]);
    }
  };

  const handleAddCustomItem = (customVal, setCustomVal, list, setList) => {
    const val = customVal.trim();
    if (!val) return;
    const filtered = list.filter((i) => i !== 'Nenhum');
    if (!filtered.includes(val)) {
      setList([...filtered, val]);
    }
    setCustomVal('');
  };

  const handleRemoveItem = (item, list, setList) => {
    setList(list.filter((i) => i !== item));
  };

  // Salvar alterações no modo de edição (CRUD)
  const handleSaveChanges = async () => {
    if (!nome.trim()) {
      setFeedback({ type: 'error', message: 'O nome completo é obrigatório.' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        telefone: telefone ? telefone.trim() : null,
        whatsapp: whatsapp ? whatsapp.trim() : null,
        email: email ? email.trim().toLowerCase() : null,
        peso_inicial: pesoAtual ? parseFloat(pesoAtual) : null,
        altura: altura ? parseFloat(altura) : null,
        objetivos: objetivos,
        objetivo_texto: objetivoTexto ? objetivoTexto.trim() : null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologias,
        restricoes_alimentares: restricoes,
        alergias: alergias,
        medicamentos: medicamentos ? medicamentos.trim() : null,
        suplementos: suplementos ? suplementos.trim() : null,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
        horario_acorda: horarioAcorda ? formatSmartTime(horarioAcorda) : null,
        horario_dorme: horarioDorme ? formatSmartTime(horarioDorme) : null,
        litros_agua: litrosAgua ? parseFloat(litrosAgua) : null,
        atividade_fisica: Boolean(atividadeFisica),
        atividade_fisica_descricao: atividadeFisica && atividadeDescricao ? atividadeDescricao.trim() : null,
        observacoes: observacoes ? observacoes.trim() : null,
      };

      const updated = await updatePacienteCompleto(pacienteId, payload);
      setPaciente(updated);
      populateForm(updated);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Dados do paciente atualizados com sucesso!' });
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
      setFeedback({ type: 'error', message: 'Não foi possível salvar as alterações.' });
    } finally {
      setSaving(false);
    }
  };

  // Excluir paciente
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deletePaciente(pacienteId);
      setShowDeleteModal(false);
      if (onPacienteDeleted) {
        onPacienteDeleted();
      }
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
      setFeedback({ type: 'error', message: 'Não foi possível excluir o paciente.' });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não informada';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="perfil-loading-container">
        <div className="spinner" />
        <span>Carregando dados completos do paciente...</span>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="empty-pacientes-card">
        <h3>Paciente não encontrado</h3>
        <button type="button" className="btn-secondary-action" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Voltar para Lista</span>
        </button>
      </div>
    );
  }

  return (
    <div className="paciente-perfil-page">
      {/* Barra Superior de Ações */}
      <div className="perfil-topbar">
        <button type="button" className="btn-back-link" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Voltar para Pacientes</span>
        </button>

        <div className="perfil-actions-group">
          {onOpenAnalista && (
            <button
              type="button"
              className="btn-analista-shortcut"
              onClick={() => onOpenAnalista(paciente.id)}
              title="Abrir evolução gráfica no Analista"
            >
              <TrendingUp size={16} />
              <span>Ver no Analista</span>
            </button>
          )}

          {isEditing ? (
            <>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => {
                  populateForm(paciente);
                  setIsEditing(false);
                }}
                disabled={saving}
              >
                Cancelar Edição
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="spinner-sm" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-edit-action"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} />
                <span>Editar Informações</span>
              </button>
              <button
                type="button"
                className="btn-delete-action"
                onClick={() => setShowDeleteModal(true)}
                title="Excluir paciente"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Banner de Notificação / Feedback */}
      {feedback && (
        <div className={`form-alert-banner ${feedback.type === 'error' ? 'alert-error' : 'alert-success'} fade-in`}>
          {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{feedback.message}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setFeedback(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Cabeçalho do Perfil (Card Hero) */}
      <div className="perfil-hero-card">
        <div className="perfil-hero-left">
          <div className="perfil-avatar-circle">
            {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="perfil-hero-info">
            <div className="perfil-name-row">
              <h1 className="perfil-patient-name">{paciente.nome}</h1>
              {calculatedAge !== null && (
                <span className="hero-age-pill">{calculatedAge} anos</span>
              )}
            </div>

            <div className="perfil-contact-chips">
              {paciente.email && (
                <div className="contact-chip-item">
                  <Mail size={14} />
                  <span>{paciente.email}</span>
                </div>
              )}
              {paciente.whatsapp && (
                <a
                  href={`https://wa.me/${paciente.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-chip-item chip-whatsapp"
                  title="Conversar no WhatsApp"
                >
                  <MessageCircle size={14} />
                  <span>{paciente.whatsapp}</span>
                  <ExternalLink size={12} className="ext-icon" />
                </a>
              )}
              {paciente.telefone && !paciente.whatsapp && (
                <div className="contact-chip-item">
                  <Phone size={14} />
                  <span>{paciente.telefone}</span>
                </div>
              )}
              {paciente.data_nascimento && (
                <div className="contact-chip-item">
                  <Calendar size={14} />
                  <span>Nascimento: {formatDate(paciente.data_nascimento)}</span>
                </div>
              )}
            </div>

            {/* Tags de Objetivos */}
            {paciente.objetivos && paciente.objetivos.length > 0 && (
              <div className="perfil-goals-row">
                <span className="goals-label">Objetivos:</span>
                {paciente.objetivos.map((obj) => (
                  <span key={obj} className="goal-tag">
                    {obj}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumo Rápido de Métricas Antropométricas */}
        <div className="perfil-hero-right">
          <div className="quick-metric-card">
            <div className="quick-metric-icon bg-emerald">
              <Weight size={18} />
            </div>
            <div className="quick-metric-text">
              <span className="qm-label">Peso Inicial</span>
              <strong className="qm-value">
                {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}
              </strong>
            </div>
          </div>

          <div className="quick-metric-card">
            <div className="quick-metric-icon bg-blue">
              <Ruler size={18} />
            </div>
            <div className="quick-metric-text">
              <span className="qm-label">Altura</span>
              <strong className="qm-value">
                {paciente.altura ? `${paciente.altura} cm` : '—'}
              </strong>
            </div>
          </div>

          <div className="quick-metric-card">
            <div className="quick-metric-icon bg-amber">
              <Activity size={18} />
            </div>
            <div className="quick-metric-text">
              <span className="qm-label">IMC Calculado</span>
              <div className="qm-imc-row">
                <strong className="qm-value">
                  {calculatedIMC !== null ? `${calculatedIMC}` : '—'}
                </strong>
                {imcBadge && (
                  <span className={`qm-imc-chip ${imcBadge.class}`}>
                    {imcBadge.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="quick-metric-card">
            <div className="quick-metric-icon bg-cyan">
              <Droplets size={18} />
            </div>
            <div className="quick-metric-text">
              <span className="qm-label">Água Diária Recomendada</span>
              <div className="qm-water-row">
                <strong className="qm-value">
                  {calculatedWater ? calculatedWater.formatted : '—'}
                </strong>
                {calculatedWater && (
                  <span className="qm-water-chip">
                    {calculatedWater.rateMl} ml/kg
                  </span>
                )}
              </div>
              {calculatedWater && (paciente.atividade_fisica || atividadeFisica) && (
                <span className="qm-water-subtext">
                  {calculatedWater.formattedActive} c/ treino
                </span>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Navegação de Abas do Perfil */}
      <div className="perfil-tabs-bar">
        <button
          type="button"
          className={`perfil-tab-link ${activeTab === 'resumo' ? 'active' : ''}`}
          onClick={() => setActiveTab('resumo')}
        >
          <Sparkles size={16} />
          <span>Visão Geral</span>
        </button>
        <button
          type="button"
          className={`perfil-tab-link ${activeTab === 'pessoal' ? 'active' : ''}`}
          onClick={() => setActiveTab('pessoal')}
        >
          <User size={16} />
          <span>Pessoal</span>
        </button>
        <button
          type="button"
          className={`perfil-tab-link ${activeTab === 'clinico' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinico')}
        >
          <HeartPulse size={16} />
          <span>Clínico</span>
        </button>
        <button
          type="button"
          className={`perfil-tab-link ${activeTab === 'habitos' ? 'active' : ''}`}
          onClick={() => setActiveTab('habitos')}
        >
          <Coffee size={16} />
          <span>Hábitos</span>
        </button>
        <button
          type="button"
          className={`perfil-tab-link ${activeTab === 'consultas' ? 'active' : ''}`}
          onClick={() => setActiveTab('consultas')}
        >
          <Clock size={16} />
          <span>Consultas ({consultas.length})</span>
        </button>
      </div>

      {/* ===================================================================
          CONTEÚDO DAS ABAS / SEÇÕES DO PERFIL
          =================================================================== */}
      <div className="perfil-card-content">
        {/* ABA: VISÃO GERAL / RESUMO */}
        {activeTab === 'resumo' && !isEditing && (
          <div className="perfil-summary-grid fade-in">
            {/* Bloco 1: Clínico Resumo */}
            <div className="summary-section-box">
              <div className="section-box-header">
                <HeartPulse size={18} className="icon-emerald" />
                <h4>Perfil Clínico e Saúde</h4>
              </div>
              <div className="section-box-body">
                <div className="info-detail-row">
                  <span className="info-detail-label">Nível de Atividade:</span>
                  <span className="info-detail-value">{paciente.nivel_atividade || 'Não informado'}</span>
                </div>
                <div className="info-detail-row">
                  <span className="info-detail-label">Patologias:</span>
                  <div className="info-tags-list">
                    {paciente.patologias && paciente.patologias.length > 0 ? (
                      paciente.patologias.map((p) => <span key={p} className="badge-tag">{p}</span>)
                    ) : (
                      <span className="info-detail-value">Nenhuma informada</span>
                    )}
                  </div>
                </div>
                <div className="info-detail-row">
                  <span className="info-detail-label">Restrições Alimentares:</span>
                  <div className="info-tags-list">
                    {paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 ? (
                      paciente.restricoes_alimentares.map((r) => <span key={r} className="badge-tag">{r}</span>)
                    ) : (
                      <span className="info-detail-value">Nenhuma informada</span>
                    )}
                  </div>
                </div>
                <div className="info-detail-row">
                  <span className="info-detail-label">Alergias:</span>
                  <div className="info-tags-list">
                    {paciente.alergias && paciente.alergias.length > 0 ? (
                      paciente.alergias.map((a) => <span key={a} className="badge-tag badge-tag-alert">{a}</span>)
                    ) : (
                      <span className="info-detail-value">Nenhuma informada</span>
                    )}
                  </div>
                </div>
                {paciente.medicamentos && (
                  <div className="info-detail-block">
                    <span className="info-detail-label">Medicamentos Contínuos:</span>
                    <p className="info-text-content">{paciente.medicamentos}</p>
                  </div>
                )}
                {paciente.suplementos && (
                  <div className="info-detail-block">
                    <span className="info-detail-label">Suplementos em Uso:</span>
                    <p className="info-text-content">{paciente.suplementos}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Hábitos Resumo */}
            <div className="summary-section-box">
              <div className="section-box-header">
                <Coffee size={18} className="icon-amber" />
                <h4>Hábitos e Rotina</h4>
              </div>
              <div className="section-box-body">
                <div className="info-detail-row">
                  <span className="info-detail-label">Refeições / Dia:</span>
                  <span className="info-detail-value">
                    {paciente.refeicoes_por_dia ? `${paciente.refeicoes_por_dia} refeições` : 'Não informado'}
                  </span>
                </div>
                <div className="info-detail-row water-detail-row">
                  <span className="info-detail-label">Ingestão Hídrica:</span>
                  <div className="water-summary-status-wrap">
                    <span className="info-detail-value">
                      {paciente.litros_agua ? `${paciente.litros_agua} litros/dia` : 'Não informado'}
                    </span>
                    {calculatedWater && (
                      <span className="water-meta-chip">
                        Meta: <strong>{paciente.atividade_fisica ? calculatedWater.formattedActive : calculatedWater.formatted}</strong> ({calculatedWater.rateMl} ml/kg)
                      </span>
                    )}
                    {paciente.litros_agua && calculatedWater && (
                      parseFloat(paciente.litros_agua) >= (paciente.atividade_fisica ? calculatedWater.activeLiters : calculatedWater.baseLiters) ? (
                        <span className="water-badge-success">
                          <CheckCircle2 size={12} /> Meta Atingida
                        </span>
                      ) : (
                        <span className="water-badge-warning">
                          <AlertCircle size={12} /> {(calculatedWater.baseLiters - parseFloat(paciente.litros_agua)).toFixed(1)} L abaixo da meta
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="info-detail-row">
                  <span className="info-detail-label">Horário de Sono:</span>
                  <span className="info-detail-value">
                    {paciente.horario_acorda || paciente.horario_dorme
                      ? `Acorda: ${paciente.horario_acorda || '—'} | Dorme: ${paciente.horario_dorme || '—'}`
                      : 'Não informado'}
                  </span>
                </div>
                <div className="info-detail-row">
                  <span className="info-detail-label">Atividade Física:</span>
                  <span className="info-detail-value">
                    {paciente.atividade_fisica ? 'Sim' : 'Não'}
                    {paciente.atividade_fisica_descricao ? ` (${paciente.atividade_fisica_descricao})` : ''}
                  </span>
                </div>
                {paciente.observacoes && (
                  <div className="info-detail-block">
                    <span className="info-detail-label">Observações Clínicas:</span>
                    <p className="info-text-content">{paciente.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA: DADOS PESSOAIS */}
        {(activeTab === 'pessoal' || (isEditing && activeTab === 'pessoal')) && (
          <div className="tab-content-panel fade-in">
            <div className="tab-panel-header">
              <div className="panel-title-group">
                <User size={20} className="panel-icon" />
                <div>
                  <h3 className="panel-heading">Dados Pessoais</h3>
                  <p className="panel-subheading">Informações de contato e identificação do paciente</p>
                </div>
              </div>
            </div>

            <div className="form-grid-layout">
              <div className="form-field-group col-span-2">
                <label className="field-label required" htmlFor="edit-nome">
                  Nome Completo
                </label>
                <div className="field-input-wrapper">
                  <input
                    id="edit-nome"
                    type="text"
                    className="field-input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="edit-nasc">
                  Data de Nascimento
                </label>
                <div className="field-input-wrapper">
                  <input
                    id="edit-nasc"
                    type="date"
                    className="field-input"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                {calculatedAge !== null && (
                  <div className="field-calc-badge">
                    <Sparkles size={13} />
                    <span>Idade: <strong>{calculatedAge} anos</strong></span>
                  </div>
                )}
              </div>

              <div className="form-field-group">
                <label className="field-label">Sexo</label>
                <div className="radio-pills-group">
                  {['Feminino', 'Masculino', 'Outro'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`radio-pill-btn ${sexo === item ? 'active' : ''}`}
                      onClick={() => isEditing && setSexo(sexo === item ? '' : item)}
                      disabled={!isEditing}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="edit-tel">
                  Telefone
                </label>
                <div className="field-input-wrapper">
                  <Phone size={16} className="input-prefix-icon" />
                  <input
                    id="edit-tel"
                    type="tel"
                    className="field-input with-icon"
                    placeholder="(11) 3456-7890"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="edit-zap">
                  WhatsApp
                </label>
                <div className="field-input-wrapper">
                  <Phone size={16} className="input-prefix-icon whatsapp-icon-color" />
                  <input
                    id="edit-zap"
                    type="tel"
                    className="field-input with-icon"
                    placeholder="(11) 98765-4321"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-field-group col-span-2">
                <label className="field-label" htmlFor="edit-email">
                  E-mail
                </label>
                <div className="field-input-wrapper">
                  <Mail size={16} className="input-prefix-icon" />
                  <input
                    id="edit-email"
                    type="email"
                    className="field-input with-icon"
                    placeholder="paciente@exemplo.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: DADOS CLÍNICOS */}
        {(activeTab === 'clinico' || (isEditing && activeTab === 'clinico')) && (
          <div className="tab-content-panel fade-in">
            <div className="tab-panel-header">
              <div className="panel-title-group">
                <HeartPulse size={20} className="panel-icon icon-emerald" />
                <div>
                  <h3 className="panel-heading">Dados Clínicos e Antropométricos</h3>
                  <p className="panel-subheading">
                    Métricas biométricas, objetivos, patologias, restrições e medicações
                  </p>
                </div>
              </div>
            </div>

            <div className="form-grid-layout">
              <div className="form-field-group">
                <label className="field-label" htmlFor="edit-peso">
                  Peso Atual
                </label>
                <div className="field-input-wrapper suffix-wrapper">
                  <Weight size={16} className="input-prefix-icon" />
                  <input
                    id="edit-peso"
                    type="number"
                    step="0.1"
                    className="field-input with-icon with-suffix"
                    value={pesoAtual}
                    onChange={(e) => setPesoAtual(e.target.value)}
                    disabled={!isEditing}
                  />
                  <span className="input-suffix-tag">kg</span>
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="edit-altura">
                  Altura
                </label>
                <div className="field-input-wrapper suffix-wrapper">
                  <Ruler size={16} className="input-prefix-icon" />
                  <input
                    id="edit-altura"
                    type="number"
                    step="0.5"
                    className="field-input with-icon with-suffix"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    disabled={!isEditing}
                  />
                  <span className="input-suffix-tag">cm</span>
                </div>
              </div>

              {/* IMC */}
              <div className="form-field-group col-span-2">
                <label className="field-label">IMC (Índice de Massa Corporal)</label>
                <div className="imc-calc-display-card">
                  <div className="imc-value-box">
                    <span className="imc-label">Resultado:</span>
                    <span className="imc-value-number">
                      {calculatedIMC !== null ? `${calculatedIMC} kg/m²` : '—'}
                    </span>
                  </div>
                  {imcBadge && (
                    <div className={`imc-status-badge ${imcBadge.class}`}>
                      <Activity size={14} />
                      <span>{imcBadge.label}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Objetivos */}
              <div className="form-field-group col-span-2">
                <label className="field-label">Objetivos</label>
                <div className="chips-cloud-wrapper">
                  {OBJETIVOS_OPCOES.map((obj) => {
                    const isSelected = objetivos.includes(obj);
                    return (
                      <button
                        key={obj}
                        type="button"
                        className={`selection-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (!isEditing) return;
                          if (isSelected) {
                            setObjetivos(objetivos.filter((o) => o !== obj));
                          } else {
                            setObjetivos([...objetivos, obj]);
                          }
                        }}
                        disabled={!isEditing}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                        <span>{obj}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="field-sub-input" style={{ marginTop: '0.75rem' }}>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Outro objetivo ou detalhamento..."
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Nível de Atividade */}
              <div className="form-field-group col-span-2">
                <label className="field-label">Nível de Atividade Física</label>
                <div className="activity-cards-grid">
                  {NIVEIS_ATIVIDADE.map((lvl) => {
                    const isSelected = nivelAtividade === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        className={`activity-select-card ${isSelected ? 'selected' : ''} ${!isEditing ? 'card-disabled' : ''}`}
                        onClick={() => isEditing && setNivelAtividade(isSelected ? '' : lvl.id)}
                      >
                        <div className="activity-card-header">
                          <strong>{lvl.label}</strong>
                          {isSelected && <CheckCircle2 size={16} className="check-icon" />}
                        </div>
                        <span className="activity-card-desc">{lvl.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Patologias */}
              <div className="form-field-group col-span-2">
                <label className="field-label">Patologias ou Condições de Saúde</label>
                <div className="chips-cloud-wrapper">
                  <button
                    type="button"
                    className={`selection-chip chip-none ${patologias.includes('Nenhum') ? 'selected-none' : ''}`}
                    onClick={() => isEditing && handleToggleMultiSelect(patologias, setPatologias, 'Nenhum')}
                    disabled={!isEditing}
                  >
                    {patologias.includes('Nenhum') && <CheckCircle2 size={14} />}
                    <span>Nenhum</span>
                  </button>

                  {PATOLOGIAS_OPCOES.map((pat) => {
                    const isSelected = patologias.includes(pat);
                    return (
                      <button
                        key={pat}
                        type="button"
                        className={`selection-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => isEditing && handleToggleMultiSelect(patologias, setPatologias, pat)}
                        disabled={!isEditing}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                        <span>{pat}</span>
                      </button>
                    );
                  })}

                  {patologias
                    .filter((p) => p !== 'Nenhum' && !PATOLOGIAS_OPCOES.includes(p))
                    .map((custom) => (
                      <span key={custom} className="selection-chip custom-chip selected">
                        <span>{custom}</span>
                        {isEditing && (
                          <button
                            type="button"
                            className="chip-remove-btn"
                            onClick={() => handleRemoveItem(custom, patologias, setPatologias)}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                </div>

                {isEditing && (
                  <div className="add-tag-inline-form">
                    <input
                      type="text"
                      className="field-input add-tag-input"
                      placeholder="Adicionar outra patologia..."
                      value={customPatologia}
                      onChange={(e) => setCustomPatologia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomItem(customPatologia, setCustomPatologia, patologias, setPatologias);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-add-tag"
                      onClick={() => handleAddCustomItem(customPatologia, setCustomPatologia, patologias, setPatologias)}
                    >
                      <Plus size={15} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Restrições */}
              <div className="form-field-group col-span-2">
                <label className="field-label">Restrições Alimentares</label>
                <div className="chips-cloud-wrapper">
                  <button
                    type="button"
                    className={`selection-chip chip-none ${restricoes.includes('Nenhum') ? 'selected-none' : ''}`}
                    onClick={() => isEditing && handleToggleMultiSelect(restricoes, setRestricoes, 'Nenhum')}
                    disabled={!isEditing}
                  >
                    {restricoes.includes('Nenhum') && <CheckCircle2 size={14} />}
                    <span>Nenhum</span>
                  </button>

                  {RESTRICOES_OPCOES.map((rest) => {
                    const isSelected = restricoes.includes(rest);
                    return (
                      <button
                        key={rest}
                        type="button"
                        className={`selection-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => isEditing && handleToggleMultiSelect(restricoes, setRestricoes, rest)}
                        disabled={!isEditing}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                        <span>{rest}</span>
                      </button>
                    );
                  })}

                  {restricoes
                    .filter((r) => r !== 'Nenhum' && !RESTRICOES_OPCOES.includes(r))
                    .map((custom) => (
                      <span key={custom} className="selection-chip custom-chip selected">
                        <span>{custom}</span>
                        {isEditing && (
                          <button
                            type="button"
                            className="chip-remove-btn"
                            onClick={() => handleRemoveItem(custom, restricoes, setRestricoes)}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                </div>

                {isEditing && (
                  <div className="add-tag-inline-form">
                    <input
                      type="text"
                      className="field-input add-tag-input"
                      placeholder="Adicionar outra restrição..."
                      value={customRestricao}
                      onChange={(e) => setCustomRestricao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomItem(customRestricao, setCustomRestricao, restricoes, setRestricoes);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-add-tag"
                      onClick={() => handleAddCustomItem(customRestricao, setCustomRestricao, restricoes, setRestricoes)}
                    >
                      <Plus size={15} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Alergias */}
              <div className="form-field-group col-span-2">
                <label className="field-label">Alergias Alimentares</label>
                <div className="chips-cloud-wrapper">
                  <button
                    type="button"
                    className={`selection-chip chip-none ${alergias.includes('Nenhum') ? 'selected-none' : ''}`}
                    onClick={() => isEditing && handleToggleMultiSelect(alergias, setAlergias, 'Nenhum')}
                    disabled={!isEditing}
                  >
                    {alergias.includes('Nenhum') && <CheckCircle2 size={14} />}
                    <span>Nenhum</span>
                  </button>

                  {ALERGIAS_OPCOES.map((alerg) => {
                    const isSelected = alergias.includes(alerg);
                    return (
                      <button
                        key={alerg}
                        type="button"
                        className={`selection-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => isEditing && handleToggleMultiSelect(alergias, setAlergias, alerg)}
                        disabled={!isEditing}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                        <span>{alerg}</span>
                      </button>
                    );
                  })}

                  {alergias
                    .filter((a) => a !== 'Nenhum' && !ALERGIAS_OPCOES.includes(a))
                    .map((custom) => (
                      <span key={custom} className="selection-chip custom-chip selected">
                        <span>{custom}</span>
                        {isEditing && (
                          <button
                            type="button"
                            className="chip-remove-btn"
                            onClick={() => handleRemoveItem(custom, alergias, setAlergias)}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                </div>

                {isEditing && (
                  <div className="add-tag-inline-form">
                    <input
                      type="text"
                      className="field-input add-tag-input"
                      placeholder="Adicionar outra alergia..."
                      value={customAlergia}
                      onChange={(e) => setCustomAlergia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomItem(customAlergia, setCustomAlergia, alergias, setAlergias);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-add-tag"
                      onClick={() => handleAddCustomItem(customAlergia, setCustomAlergia, alergias, setAlergias)}
                    >
                      <Plus size={15} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Medicamentos e Suplementos */}
              <div className="form-field-group">
                <label className="field-label" htmlFor="edit-med">
                  Medicamentos Contínuos
                </label>
                <div className="field-input-wrapper">
                  <textarea
                    id="edit-med"
                    rows={3}
                    className="field-textarea"
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="edit-sup">
                  Suplementos em Uso
                </label>
                <div className="field-input-wrapper">
                  <textarea
                    id="edit-sup"
                    rows={3}
                    className="field-textarea"
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: HÁBITOS */}
        {(activeTab === 'habitos' || (isEditing && activeTab === 'habitos')) && (
          <div className="tab-content-panel fade-in">
            <div className="tab-panel-header">
              <div className="panel-title-group">
                <Coffee size={20} className="panel-icon icon-amber" />
                <div>
                  <h3 className="panel-heading">Hábitos e Rotina</h3>
                  <p className="panel-subheading">Horários de sono, ingestão de água e atividade física</p>
                </div>
              </div>
            </div>

            <div className="form-grid-layout">
              <div className="form-field-group">
                <label className="field-label" htmlFor="edit-ref">
                  Refeições por dia
                </label>
                <div className="field-input-wrapper">
                  <input
                    id="edit-ref"
                    type="number"
                    className="field-input"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-field-group col-span-2">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="edit-agua">
                    Quantidade de água por dia
                  </label>
                  {calculatedWater && (
                    <span className="field-calc-badge-water">
                      <Droplets size={12} /> Meta ideal: <strong>{atividadeFisica ? calculatedWater.formattedActive : calculatedWater.formatted}</strong> ({calculatedWater.rateMl} ml/kg)
                    </span>
                  )}
                </div>
                <div className="water-input-action-row">
                  <div className="field-input-wrapper suffix-wrapper flex-1">
                    <Droplets size={16} className="input-prefix-icon icon-cyan" />
                    <input
                      id="edit-agua"
                      type="number"
                      step="0.1"
                      min="0"
                      max="15"
                      className="field-input with-icon with-suffix"
                      value={litrosAgua}
                      onChange={(e) => setLitrosAgua(e.target.value)}
                      disabled={!isEditing}
                    />
                    <span className="input-suffix-tag">litros</span>
                  </div>
                  {isEditing && calculatedWater && (
                    <button
                      type="button"
                      className="btn-apply-water-auto"
                      onClick={() => setLitrosAgua(String(atividadeFisica ? calculatedWater.activeLiters : calculatedWater.baseLiters))}
                      title="Aplicar cálculo automático de água recomendado"
                    >
                      <Sparkles size={14} />
                      <span>Usar Meta ({atividadeFisica ? calculatedWater.formattedActive : calculatedWater.formatted})</span>
                    </button>
                  )}
                </div>

                {/* Card Explicativo de Consumo de Água */}
                {calculatedWater && (
                  <div className="water-calc-info-card fade-in">
                    <div className="water-calc-info-left">
                      <div className="water-calc-icon-box">
                        <Droplets size={20} />
                      </div>
                      <div>
                        <div className="water-calc-title-row">
                          <strong className="water-calc-highlight">{calculatedWater.formatted} / dia</strong>
                          <span className="water-calc-ml-sub">({calculatedWater.formattedMl})</span>
                        </div>
                        <span className="water-calc-explanation">
                          Base: {pesoAtual || paciente.peso_inicial} kg × {calculatedWater.rateMl} ml/kg ({calculatedWater.faixaDesc})
                        </span>
                      </div>
                    </div>
                    {((isEditing ? atividadeFisica : paciente.atividade_fisica)) && (
                      <div className="water-calc-active-badge">
                        <span>+500 ml pelo treino: <strong>{calculatedWater.formattedActive}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>


              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="edit-acorda">
                    Horário que acorda
                  </label>
                  {isEditing && <span className="field-hint-chip">Ex: 6 → 06:00</span>}
                </div>
                <div className="field-input-wrapper">
                  <Clock size={16} className="input-prefix-icon" />
                  <input
                    id="edit-acorda"
                    type="text"
                    className="field-input with-icon"
                    value={horarioAcorda}
                    onChange={(e) => setHorarioAcorda(e.target.value)}
                    onBlur={(e) => setHorarioAcorda(formatSmartTime(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="edit-dorme">
                    Horário que dorme
                  </label>
                  {isEditing && <span className="field-hint-chip">Ex: 23 → 23:00</span>}
                </div>
                <div className="field-input-wrapper">
                  <Clock size={16} className="input-prefix-icon" />
                  <input
                    id="edit-dorme"
                    type="text"
                    className="field-input with-icon"
                    value={horarioDorme}
                    onChange={(e) => setHorarioDorme(e.target.value)}
                    onBlur={(e) => setHorarioDorme(formatSmartTime(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-field-group col-span-2">
                <label className="field-label">Pratica atividade física?</label>
                <div className="toggle-selection-row">
                  <button
                    type="button"
                    className={`toggle-option-btn ${!atividadeFisica ? 'active' : ''}`}
                    onClick={() => isEditing && setAtividadeFisica(false)}
                    disabled={!isEditing}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    className={`toggle-option-btn ${atividadeFisica ? 'active' : ''}`}
                    onClick={() => isEditing && setAtividadeFisica(true)}
                    disabled={!isEditing}
                  >
                    Sim
                  </button>
                </div>

                {atividadeFisica && (
                  <div className="conditional-expand-box fade-in" style={{ marginTop: '0.75rem' }}>
                    <label className="field-sublabel" htmlFor="edit-atv-desc">
                      Atividade física e frequência semanal:
                    </label>
                    <input
                      id="edit-atv-desc"
                      type="text"
                      className="field-input"
                      value={atividadeDescricao}
                      onChange={(e) => setAtividadeDescricao(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                )}
              </div>

              <div className="form-field-group col-span-2">
                <label className="field-label" htmlFor="edit-obs">
                  Observações Gerais
                </label>
                <div className="field-input-wrapper">
                  <textarea
                    id="edit-obs"
                    rows={4}
                    className="field-textarea"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: HISTÓRICO DE CONSULTAS */}
        {activeTab === 'consultas' && !isEditing && (
          <div className="perfil-consultas-section fade-in">
            <div className="section-box-header" style={{ marginBottom: '1.25rem' }}>
              <Clock size={20} className="icon-blue" />
              <div>
                <h3 className="panel-heading">Histórico de Atendimentos</h3>
                <p className="panel-subheading">Registros de consultas, medidas e evolução do paciente</p>
              </div>
            </div>

            {consultas.length === 0 ? (
              <div className="empty-consultas-box">
                <AlertCircle size={28} />
                <strong>Nenhuma consulta registrada ainda</strong>
                <p>As consultas registradas aparecerão aqui com evolução biométrica.</p>
              </div>
            ) : (
              <div className="consultas-timeline-wrapper">
                {consultas.map((c, index) => (
                  <div key={c.id || index} className="consulta-timeline-item">
                    <div className="timeline-marker-dot" />
                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <div className="timeline-date-badge">
                          <Calendar size={14} />
                          <span>Consulta em {formatDate(c.data_consulta)}</span>
                        </div>
                        {c.proximo_retorno && (
                          <span className="retorno-status-chip">
                            Retorno agendado: {formatDate(c.proximo_retorno)}
                          </span>
                        )}
                      </div>

                      <div className="timeline-metrics-pills">
                        {c.peso && (
                          <div className="tm-pill">
                            <span>Peso:</span> <strong>{c.peso} kg</strong>
                          </div>
                        )}
                        {c.cintura && (
                          <div className="tm-pill">
                            <span>Cintura:</span> <strong>{c.cintura} cm</strong>
                          </div>
                        )}
                        {c.quadril && (
                          <div className="tm-pill">
                            <span>Quadril:</span> <strong>{c.quadril} cm</strong>
                          </div>
                        )}
                        {c.percentual_gordura && (
                          <div className="tm-pill">
                            <span>% Gordura:</span> <strong>{c.percentual_gordura}%</strong>
                          </div>
                        )}
                      </div>

                      {c.observacoes && (
                        <p className="timeline-obs-text">{c.observacoes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="modal-icon-badge alert-badge">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3>Excluir Paciente</h3>
                  <p className="modal-subtitle">Ação irreversível</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="delete-modal-text">
                Tem certeza de que deseja remover permanentemente o(a) paciente{' '}
                <strong>{paciente.nome}</strong> e todos os seus históricos de consultas e planos
                alimentares?
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger-action"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="spinner-sm" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
