import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPaciente } from '../services/neonDb';
import {
  User,
  HeartPulse,
  Coffee,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Calendar,
  Phone,
  Mail,
  Sparkles,
  Info,
  Clock,
  Droplets,
  Activity,
  Ruler,
  Weight,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

// Opções pré-definidas conforme Prompt 4
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

// Funções utilitárias de formatação e cálculo
export function formatPhone(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function formatSmartTime(input) {
  if (!input) return '';
  const str = input.toString().trim();
  if (str.includes(':')) {
    const parts = str.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 1 || digits.length === 2) {
    let h = parseInt(digits, 10);
    if (h > 23) h = 23;
    return `${h.toString().padStart(2, '0')}:00`;
  }
  if (digits.length === 3) {
    let h = parseInt(digits.slice(0, 1), 10);
    let m = parseInt(digits.slice(1), 10);
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  if (digits.length >= 4) {
    let h = parseInt(digits.slice(0, 2), 10);
    let m = parseInt(digits.slice(2, 4), 10);
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  return str;
}

export function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function calculateIMC(peso, alturaCm) {
  const p = parseFloat(peso);
  const a = parseFloat(alturaCm);
  if (!p || !a || p <= 0 || a <= 0) return null;

  // Altura em metros
  const alturaM = a > 3 ? a / 100 : a;
  const imc = p / (alturaM * alturaM);
  return parseFloat(imc.toFixed(1));
}

export function getImcBadge(imc) {
  if (!imc || isNaN(imc)) return null;
  if (imc < 18.5) return { label: 'Abaixo do peso', class: 'imc-blue' };
  if (imc < 25.0) return { label: 'Peso normal', class: 'imc-emerald' };
  if (imc < 30.0) return { label: 'Sobrepeso', class: 'imc-amber' };
  if (imc < 35.0) return { label: 'Obesidade Grau I', class: 'imc-red' };
  if (imc < 40.0) return { label: 'Obesidade Grau II', class: 'imc-red' };
  return { label: 'Obesidade Grau III (Mórbida)', class: 'imc-red' };
}

/**
 * Cálculo de consumo diário de água recomendado baseado no peso corporal e faixa etária:
 * - Até 17 anos: 40 ml por kg
 * - De 18 a 55 anos: 35 ml por kg
 * - De 55 a 65 anos: 30 ml por kg
 * - Acima de 65 anos: 25 ml por kg
 * - Atividade física: +500 ml a 1 litro
 */
export function calculateWaterIntake(peso, idade, praticaAtividade = false) {
  const p = parseFloat(peso);
  if (!p || isNaN(p) || p <= 0) return null;

  let rateMl = 35; // Padrão adulto 18 a 55 anos
  let faixaDesc = 'De 18 a 55 anos (35 ml/kg)';
  const age = parseInt(idade, 10);

  if (!isNaN(age) && age >= 0) {
    if (age <= 17) {
      rateMl = 40;
      faixaDesc = 'Até 17 anos (40 ml/kg)';
    } else if (age <= 55) {
      rateMl = 35;
      faixaDesc = 'De 18 a 55 anos (35 ml/kg)';
    } else if (age <= 65) {
      rateMl = 30;
      faixaDesc = 'De 55 a 65 anos (30 ml/kg)';
    } else {
      rateMl = 25;
      faixaDesc = 'Acima de 65 anos (25 ml/kg)';
    }
  }

  const baseMl = Math.round(p * rateMl);
  const baseLiters = parseFloat((baseMl / 1000).toFixed(2));
  const activeMl = baseMl + 500;
  const activeLiters = parseFloat((activeMl / 1000).toFixed(2));

  return {
    rateMl,
    faixaDesc,
    baseMl,
    baseLiters,
    activeMl,
    activeLiters,
    formatted: `${(baseMl / 1000).toFixed(2).replace('.', ',')} L`,
    formattedMl: `${baseMl.toLocaleString('pt-BR')} ml/dia`,
    formattedActive: `${(activeMl / 1000).toFixed(2).replace('.', ',')} L`,
    formattedActiveMl: `${activeMl.toLocaleString('pt-BR')} ml/dia`,
  };
}

export function NovoPacienteView({ onCancel, onSavedSuccess }) {

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'

  // Estados do formulário
  // Aba 1 - Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 - Clínico
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

  // Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [atividadeFisica, setAtividadeFisica] = useState(false);
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Estados de controle e feedback
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validatedTab1, setValidatedTab1] = useState(false);

  // Cálculos dinâmicos
  const calculatedAge = useMemo(() => calculateAge(dataNascimento), [dataNascimento]);
  const calculatedIMC = useMemo(() => calculateIMC(pesoAtual, altura), [pesoAtual, altura]);
  const imcBadge = useMemo(() => getImcBadge(calculatedIMC), [calculatedIMC]);
  const calculatedWater = useMemo(
    () => calculateWaterIntake(pesoAtual, calculatedAge, atividadeFisica),
    [pesoAtual, calculatedAge, atividadeFisica]
  );


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

  // Submissão do formulário
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // Validação: único campo obrigatório é o nome completo
    if (!nome.trim()) {
      setErrorMsg('O nome completo do paciente é obrigatório.');
      setActiveTab('pessoal');
      setValidatedTab1(true);
      return;
    }

    if (!user?.id) {
      setErrorMsg('Sessão inválida. Por favor faça login novamente.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nutricionista_id: user.id,
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

      const novoPaciente = await createPaciente(payload);
      if (novoPaciente && novoPaciente.id) {
        if (onSavedSuccess) {
          onSavedSuccess(novoPaciente);
        }
      } else {
        setErrorMsg('Não foi possível salvar o paciente. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao salvar o paciente no banco de dados.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="novo-paciente-container">
      {/* Header com Navegação e Título */}
      <div className="novo-paciente-topbar">
        <button
          type="button"
          className="btn-back-link"
          onClick={onCancel}
          title="Voltar para a lista de pacientes"
        >
          <ArrowLeft size={18} />
          <span>Voltar para Pacientes</span>
        </button>

        <div className="topbar-actions">
          <button
            type="button"
            className="btn-secondary-action"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleSubmit}
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
                <span>Salvar Paciente</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="novo-paciente-header">
        <div className="hero-greeting">
          <Sparkles size={16} className="sparkle-icon" />
          <span>Cadastro de Paciente</span>
        </div>
        <h2 className="view-title">Novo Paciente</h2>
        <p className="view-subtitle">
          Preencha os dados cadastrais, histórico clínico e hábitos para acompanhamento nutricional.
        </p>
      </div>

      {errorMsg && (
        <div className="form-alert-banner alert-error">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navegador das 3 Abas */}
      <div className="tabs-navigation-wrapper">
        <div className="tabs-navigation-bar">
          <button
            type="button"
            className={`tab-nav-button ${activeTab === 'pessoal' ? 'active' : ''}`}
            onClick={() => setActiveTab('pessoal')}
          >
            <div className="tab-icon-wrapper">
              <User size={18} />
            </div>
            <div className="tab-text-info">
              <span className="tab-num">Aba 1</span>
              <span className="tab-title">Pessoal</span>
            </div>
          </button>

          <button
            type="button"
            className={`tab-nav-button ${activeTab === 'clinico' ? 'active' : ''}`}
            onClick={() => setActiveTab('clinico')}
          >
            <div className="tab-icon-wrapper">
              <HeartPulse size={18} />
            </div>
            <div className="tab-text-info">
              <span className="tab-num">Aba 2</span>
              <span className="tab-title">Clínico</span>
            </div>
          </button>

          <button
            type="button"
            className={`tab-nav-button ${activeTab === 'habitos' ? 'active' : ''}`}
            onClick={() => setActiveTab('habitos')}
          >
            <div className="tab-icon-wrapper">
              <Coffee size={18} />
            </div>
            <div className="tab-text-info">
              <span className="tab-num">Aba 3</span>
              <span className="tab-title">Hábitos</span>
            </div>
          </button>
        </div>
      </div>

      {/* Formulário Principal */}
      <div className="novo-paciente-card">
        {/* ===================================================================
            ABA 1 — PESSOAL
            =================================================================== */}
        {activeTab === 'pessoal' && (
          <div className="tab-content-panel fade-in">
            <div className="tab-panel-header">
              <div className="panel-title-group">
                <User size={20} className="panel-icon" />
                <div>
                  <h3 className="panel-heading">Dados Pessoais</h3>
                  <p className="panel-subheading">Informações básicas e canais de contato do paciente</p>
                </div>
              </div>
            </div>

            <div className="form-grid-layout">
              {/* Nome Completo (Obrigatório) */}
              <div className="form-field-group col-span-2">
                <label className="field-label required" htmlFor="nome-completo">
                  Nome Completo
                </label>
                <div className="field-input-wrapper">
                  <input
                    id="nome-completo"
                    type="text"
                    className={`field-input ${validatedTab1 && !nome.trim() ? 'input-error' : ''}`}
                    placeholder="Ex: Ana Clara Martins de Souza"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoFocus
                  />
                </div>
                {validatedTab1 && !nome.trim() && (
                  <span className="field-error-text">O nome completo é obrigatório.</span>
                )}
              </div>

              {/* Data de Nascimento + Idade Automática */}
              <div className="form-field-group">
                <label className="field-label" htmlFor="data-nascimento">
                  Data de Nascimento
                </label>
                <div className="field-input-wrapper">
                  <input
                    id="data-nascimento"
                    type="date"
                    className="field-input"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
                {calculatedAge !== null && (
                  <div className="field-calc-badge">
                    <Sparkles size={13} />
                    <span>Idade: <strong>{calculatedAge} anos</strong></span>
                  </div>
                )}
              </div>

              {/* Sexo */}
              <div className="form-field-group">
                <label className="field-label">Sexo</label>
                <div className="radio-pills-group">
                  {['Feminino', 'Masculino', 'Outro'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`radio-pill-btn ${sexo === item ? 'active' : ''}`}
                      onClick={() => setSexo(sexo === item ? '' : item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telefone */}
              <div className="form-field-group">
                <label className="field-label" htmlFor="telefone">
                  Telefone
                </label>
                <div className="field-input-wrapper">
                  <Phone size={16} className="input-prefix-icon" />
                  <input
                    id="telefone"
                    type="tel"
                    className="field-input with-icon"
                    placeholder="(11) 3456-7890"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    maxLength={15}
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="whatsapp">
                    WhatsApp
                  </label>
                  {telefone && !whatsapp && (
                    <button
                      type="button"
                      className="link-btn-copy"
                      onClick={() => setWhatsapp(telefone)}
                    >
                      Copiar do telefone
                    </button>
                  )}
                </div>
                <div className="field-input-wrapper">
                  <Phone size={16} className="input-prefix-icon whatsapp-icon-color" />
                  <input
                    id="whatsapp"
                    type="tel"
                    className="field-input with-icon"
                    placeholder="(11) 98765-4321"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-field-group col-span-2">
                <label className="field-label" htmlFor="email">
                  E-mail
                </label>
                <div className="field-input-wrapper">
                  <Mail size={16} className="input-prefix-icon" />
                  <input
                    id="email"
                    type="email"
                    className="field-input with-icon"
                    placeholder="paciente@exemplo.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="tab-panel-footer">
              <div />
              <button
                type="button"
                className="btn-next-tab"
                onClick={() => {
                  if (!nome.trim()) {
                    setValidatedTab1(true);
                    setErrorMsg('Por favor, informe o nome completo para prosseguir.');
                    return;
                  }
                  setErrorMsg('');
                  setActiveTab('clinico');
                }}
              >
                <span>Avançar para Clínico</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 2 — CLÍNICO
            =================================================================== */}
        {activeTab === 'clinico' && (
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
              {/* Peso Atual com Sufixo 'kg' */}
              <div className="form-field-group">
                <label className="field-label" htmlFor="peso-atual">
                  Peso Atual
                </label>
                <div className="field-input-wrapper suffix-wrapper">
                  <Weight size={16} className="input-prefix-icon" />
                  <input
                    id="peso-atual"
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    className="field-input with-icon with-suffix"
                    placeholder="Ex: 72.5"
                    value={pesoAtual}
                    onChange={(e) => setPesoAtual(e.target.value)}
                  />
                  <span className="input-suffix-tag">kg</span>
                </div>
              </div>

              {/* Altura com Sufixo 'cm' */}
              <div className="form-field-group">
                <label className="field-label" htmlFor="altura">
                  Altura
                </label>
                <div className="field-input-wrapper suffix-wrapper">
                  <Ruler size={16} className="input-prefix-icon" />
                  <input
                    id="altura"
                    type="number"
                    step="0.5"
                    min="30"
                    max="250"
                    className="field-input with-icon with-suffix"
                    placeholder="Ex: 172"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                  />
                  <span className="input-suffix-tag">cm</span>
                </div>
              </div>

              {/* IMC Calculado Automaticamente (Somente Leitura) */}
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
                  {!calculatedIMC && (
                    <span className="imc-hint-text">
                      Preencha o peso e a altura para o cálculo automático do IMC.
                    </span>
                  )}
                </div>
              </div>

              {/* Objetivos (Múltipla Escolha + Campo Livre) */}
              <div className="form-field-group col-span-2">
                <label className="field-label">Objetivos Nutricionais</label>
                <div className="chips-cloud-wrapper">
                  {OBJETIVOS_OPCOES.map((obj) => {
                    const isSelected = objetivos.includes(obj);
                    return (
                      <button
                        key={obj}
                        type="button"
                        className={`selection-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setObjetivos(objetivos.filter((o) => o !== obj));
                          } else {
                            setObjetivos([...objetivos, obj]);
                          }
                        }}
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
                    placeholder="Outro objetivo ou detalhamento específico..."
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                  />
                </div>
              </div>

              {/* Nível de Atividade Física (Seleção Única) */}
              <div className="form-field-group col-span-2">
                <label className="field-label">Nível de Atividade Física</label>
                <div className="activity-cards-grid">
                  {NIVEIS_ATIVIDADE.map((lvl) => {
                    const isSelected = nivelAtividade === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        className={`activity-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setNivelAtividade(isSelected ? '' : lvl.id)}
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

              {/* Patologias ou Condições de Saúde */}
              <div className="form-field-group col-span-2">
                <div className="field-label-row">
                  <label className="field-label">Patologias ou Condições de Saúde</label>
                  {patologias.length > 0 && !patologias.includes('Nenhum') && (
                    <span className="field-counter-badge">{patologias.length} selecionada(s)</span>
                  )}
                </div>
                <div className="chips-cloud-wrapper">
                  <button
                    type="button"
                    className={`selection-chip chip-none ${patologias.includes('Nenhum') ? 'selected-none' : ''}`}
                    onClick={() => handleToggleMultiSelect(patologias, setPatologias, 'Nenhum')}
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
                        onClick={() => handleToggleMultiSelect(patologias, setPatologias, pat)}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                        <span>{pat}</span>
                      </button>
                    );
                  })}

                  {/* Patologias customizadas adicionadas */}
                  {patologias
                    .filter((p) => p !== 'Nenhum' && !PATOLOGIAS_OPCOES.includes(p))
                    .map((custom) => (
                      <span key={custom} className="selection-chip custom-chip selected">
                        <span>{custom}</span>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={() => handleRemoveItem(custom, patologias, setPatologias)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                </div>

                {/* Input para adicionar patologia livremente */}
                <div className="add-tag-inline-form">
                  <input
                    type="text"
                    className="field-input add-tag-input"
                    placeholder="Adicionar outra patologia ou condição..."
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
              </div>

              {/* Restrições Alimentares */}
              <div className="form-field-group col-span-2">
                <div className="field-label-row">
                  <label className="field-label">Restrições Alimentares</label>
                  {restricoes.length > 0 && !restricoes.includes('Nenhum') && (
                    <span className="field-counter-badge">{restricoes.length} selecionada(s)</span>
                  )}
                </div>
                <div className="chips-cloud-wrapper">
                  <button
                    type="button"
                    className={`selection-chip chip-none ${restricoes.includes('Nenhum') ? 'selected-none' : ''}`}
                    onClick={() => handleToggleMultiSelect(restricoes, setRestricoes, 'Nenhum')}
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
                        onClick={() => handleToggleMultiSelect(restricoes, setRestricoes, rest)}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                        <span>{rest}</span>
                      </button>
                    );
                  })}

                  {/* Restrições customizadas */}
                  {restricoes
                    .filter((r) => r !== 'Nenhum' && !RESTRICOES_OPCOES.includes(r))
                    .map((custom) => (
                      <span key={custom} className="selection-chip custom-chip selected">
                        <span>{custom}</span>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={() => handleRemoveItem(custom, restricoes, setRestricoes)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                </div>

                <div className="add-tag-inline-form">
                  <input
                    type="text"
                    className="field-input add-tag-input"
                    placeholder="Adicionar outra restrição alimentar..."
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
              </div>

              {/* Alergias Alimentares */}
              <div className="form-field-group col-span-2">
                <div className="field-label-row">
                  <label className="field-label">Alergias Alimentares</label>
                  {alergias.length > 0 && !alergias.includes('Nenhum') && (
                    <span className="field-counter-badge">{alergias.length} selecionada(s)</span>
                  )}
                </div>
                <div className="chips-cloud-wrapper">
                  <button
                    type="button"
                    className={`selection-chip chip-none ${alergias.includes('Nenhum') ? 'selected-none' : ''}`}
                    onClick={() => handleToggleMultiSelect(alergias, setAlergias, 'Nenhum')}
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
                        onClick={() => handleToggleMultiSelect(alergias, setAlergias, alerg)}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                        <span>{alerg}</span>
                      </button>
                    );
                  })}

                  {/* Alergias customizadas */}
                  {alergias
                    .filter((a) => a !== 'Nenhum' && !ALERGIAS_OPCOES.includes(a))
                    .map((custom) => (
                      <span key={custom} className="selection-chip custom-chip selected">
                        <span>{custom}</span>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={() => handleRemoveItem(custom, alergias, setAlergias)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                </div>

                <div className="add-tag-inline-form">
                  <input
                    type="text"
                    className="field-input add-tag-input"
                    placeholder="Adicionar outra alergia alimentar..."
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
              </div>

              {/* Medicamentos Contínuos */}
              <div className="form-field-group">
                <label className="field-label" htmlFor="medicamentos">
                  Medicamentos Contínuos
                </label>
                <div className="field-input-wrapper">
                  <textarea
                    id="medicamentos"
                    rows={3}
                    className="field-textarea"
                    placeholder="Descreva medicamentos de uso regular, dosagens e horários..."
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                  />
                </div>
              </div>

              {/* Suplementos em Uso */}
              <div className="form-field-group">
                <label className="field-label" htmlFor="suplementos">
                  Suplementos em Uso
                </label>
                <div className="field-input-wrapper">
                  <textarea
                    id="suplementos"
                    rows={3}
                    className="field-textarea"
                    placeholder="Ex: Whey Protein, Creatina, Vitamina D, Ômega 3..."
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="tab-panel-footer">
              <button
                type="button"
                className="btn-prev-tab"
                onClick={() => setActiveTab('pessoal')}
              >
                <ArrowLeft size={16} />
                <span>Voltar para Pessoal</span>
              </button>
              <button
                type="button"
                className="btn-next-tab"
                onClick={() => setActiveTab('habitos')}
              >
                <span>Avançar para Hábitos</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 3 — HÁBITOS
            =================================================================== */}
        {activeTab === 'habitos' && (
          <div className="tab-content-panel fade-in">
            <div className="tab-panel-header">
              <div className="panel-title-group">
                <Coffee size={20} className="panel-icon icon-amber" />
                <div>
                  <h3 className="panel-heading">Hábitos e Rotina Diária</h3>
                  <p className="panel-subheading">
                    Horários de sono, ingestão hídrica, atividade física e anotações gerais
                  </p>
                </div>
              </div>
            </div>

            <div className="form-grid-layout">
              {/* Quantas Refeições Faz por Dia */}
              <div className="form-field-group">
                <label className="field-label" htmlFor="refeicoes-dia">
                  Quantas refeições faz por dia?
                </label>
                <div className="field-input-wrapper">
                  <input
                    id="refeicoes-dia"
                    type="number"
                    min="1"
                    max="12"
                    className="field-input"
                    placeholder="Ex: 4"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  />
                </div>
              </div>

              {/* Quantidade de Água com Sufixo 'litros' e Cálculo Automático Recomendado */}
              <div className="form-field-group col-span-2">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="litros-agua">
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
                      id="litros-agua"
                      type="number"
                      step="0.1"
                      min="0"
                      max="15"
                      className="field-input with-icon with-suffix"
                      placeholder={calculatedWater ? `Sugerido: ${calculatedWater.baseLiters}` : 'Ex: 2.5'}
                      value={litrosAgua}
                      onChange={(e) => setLitrosAgua(e.target.value)}
                    />
                    <span className="input-suffix-tag">litros</span>
                  </div>
                  {calculatedWater && (
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
                          Base: {pesoAtual} kg × {calculatedWater.rateMl} ml/kg ({calculatedWater.faixaDesc})
                        </span>
                      </div>
                    </div>
                    {atividadeFisica && (
                      <div className="water-calc-active-badge">
                        <span>+500 ml pelo treino: <strong>{calculatedWater.formattedActive}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>


              {/* Horário que Acorda (Conversão Inteligente) */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="horario-acorda">
                    Horário que acorda
                  </label>
                  <span className="field-hint-chip">Ex: 6 → 06:00, 630 → 06:30</span>
                </div>
                <div className="field-input-wrapper">
                  <Clock size={16} className="input-prefix-icon" />
                  <input
                    id="horario-acorda"
                    type="text"
                    className="field-input with-icon"
                    placeholder="Ex: 06:30"
                    value={horarioAcorda}
                    onChange={(e) => setHorarioAcorda(e.target.value)}
                    onBlur={(e) => setHorarioAcorda(formatSmartTime(e.target.value))}
                  />
                </div>
              </div>

              {/* Horário que Dorme (Conversão Inteligente) */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="horario-dorme">
                    Horário que dorme
                  </label>
                  <span className="field-hint-chip">Ex: 23 → 23:00, 2230 → 22:30</span>
                </div>
                <div className="field-input-wrapper">
                  <Clock size={16} className="input-prefix-icon" />
                  <input
                    id="horario-dorme"
                    type="text"
                    className="field-input with-icon"
                    placeholder="Ex: 23:00"
                    value={horarioDorme}
                    onChange={(e) => setHorarioDorme(e.target.value)}
                    onBlur={(e) => setHorarioDorme(formatSmartTime(e.target.value))}
                  />
                </div>
              </div>

              {/* Pratica Atividade Física (Sim/Não Toggle + Detalhe Condicional) */}
              <div className="form-field-group col-span-2">
                <label className="field-label">Pratica atividade física regularmente?</label>
                <div className="toggle-selection-row">
                  <button
                    type="button"
                    className={`toggle-option-btn ${!atividadeFisica ? 'active' : ''}`}
                    onClick={() => setAtividadeFisica(false)}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    className={`toggle-option-btn ${atividadeFisica ? 'active' : ''}`}
                    onClick={() => setAtividadeFisica(true)}
                  >
                    Sim
                  </button>
                </div>

                {atividadeFisica && (
                  <div className="conditional-expand-box fade-in">
                    <label className="field-sublabel" htmlFor="atividade-descricao">
                      Qual atividade física e frequência semanal?
                    </label>
                    <input
                      id="atividade-descricao"
                      type="text"
                      className="field-input"
                      placeholder="Ex: Musculação 4x na semana e corrida aos sábados"
                      value={atividadeDescricao}
                      onChange={(e) => setAtividadeDescricao(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div className="form-field-group col-span-2">
                <label className="field-label" htmlFor="observacoes-gerais">
                  Observações Gerais
                </label>
                <div className="field-input-wrapper">
                  <textarea
                    id="observacoes-gerais"
                    rows={4}
                    className="field-textarea"
                    placeholder="Anotações de anamnese, preferências alimentares, rotina de trabalho ou outros pontos importantes..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="tab-panel-footer">
              <button
                type="button"
                className="btn-prev-tab"
                onClick={() => setActiveTab('clinico')}
              >
                <ArrowLeft size={16} />
                <span>Voltar para Clínico</span>
              </button>
              <button
                type="button"
                className="btn-primary-action btn-lg"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="spinner-sm" />
                    <span>Cadastrando paciente...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Concluir e Salvar Paciente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
