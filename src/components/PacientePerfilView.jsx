import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  getPacienteById,
  updatePacienteCompleto,
  deletePaciente,
  getConsultasByPaciente,
  createConsulta,
  deleteConsulta,
  getPlanosByPaciente,
  createPlanoAlimentar,
  deletePlanoAlimentar,
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
  PlanoAlimentarEditor,
  criarPlanoVazio,
  DIAS_SEMANA,
  REFEICOES_CONFIG,
  extrairCalorias,
  calcularMediaCaloriasRefeicao,
  calcularTotalCaloriasDia,
} from './PlanoAlimentarEditor';


import { gerarPlanoAlimentarPdf } from '../services/pdfReportService';

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
  FileText,
  Utensils,
  ChevronRight,
  TrendingDown,
  RotateCcw,
  Eye,
  CalendarCheck,
  Percent,
  Info,
  Copy,
  Printer,
  Flame,
  Download,
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
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3 Seções Principais (Prompt 5)
  // 'dados' (Seção 1) | 'consultas' (Seção 2) | 'planos' (Seção 3)
  const [activeSection, setActiveSection] = useState('dados');
  // Sub-abas da Seção 1 (Dados do Paciente)
  const [dadosSubTab, setDadosSubTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'

  // Estados de Edição da Seção 1 (Dados)
  const [isDirty, setIsDirty] = useState(false);
  const [savingDados, setSavingDados] = useState(false);
  const [feedback, setFeedback] = useState(successNotification || null);

  // Modal de Exclusão de Paciente
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal de Nova Consulta (Seção 2)
  const [showNovaConsultaModal, setShowNovaConsultaModal] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [consultaError, setConsultaError] = useState('');
  const [novaConsultaData, setNovaConsultaData] = useState({
    data_consulta: new Date().toISOString().slice(0, 10),
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  });

  // Modal de Exclusão de Consulta
  const [consultaToDelete, setConsultaToDelete] = useState(null);
  const [deletingConsulta, setDeletingConsulta] = useState(false);

  // Estados da Seção 3 — Planos Alimentares (Prompt 6)
  const [selectedPlano, setSelectedPlano] = useState(null);
  const [visualizerDiaIndex, setVisualizerDiaIndex] = useState(0);
  const [copiedVisualizerText, setCopiedVisualizerText] = useState(false);
  const [planoEmEdicao, setPlanoEmEdicao] = useState(null);
  const [generatingIaPlan, setGeneratingIaPlan] = useState(false);
  const [aiProgressMessage, setAiProgressMessage] = useState('');
  const [savingPlano, setSavingPlano] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState(null);
  const [deletingPlano, setDeletingPlano] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);


  // Campos de Dados do Paciente (Seção 1 - Edição Direta)
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
    setIsDirty(false);
  };

  const loadData = async () => {
    if (!pacienteId) return;
    try {
      setLoading(true);
      const [pacData, consData, planosData] = await Promise.all([
        getPacienteById(pacienteId),
        getConsultasByPaciente(pacienteId),
        getPlanosByPaciente(pacienteId),
      ]);
      setPaciente(pacData);
      setConsultas(consData || []);
      setPlanos(planosData || []);
      populateForm(pacData);
    } catch (err) {
      console.error('Erro ao carregar dados do paciente:', err);
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
    () => calculateAge(dataNascimento || paciente?.data_nascimento),
    [dataNascimento, paciente?.data_nascimento]
  );

  const calculatedIMC = useMemo(() => {
    const p = pesoAtual || paciente?.peso_inicial;
    const a = altura || paciente?.altura;
    return calculateIMC(p, a);
  }, [pesoAtual, altura, paciente?.peso_inicial, paciente?.altura]);

  const imcBadge = useMemo(() => getImcBadge(calculatedIMC), [calculatedIMC]);

  const calculatedWater = useMemo(() => {
    const p = pesoAtual || paciente?.peso_inicial;
    const af = atividadeFisica ?? paciente?.atividade_fisica;
    return calculateWaterIntake(p, calculatedAge, af);
  }, [pesoAtual, paciente?.peso_inicial, calculatedAge, atividadeFisica, paciente?.atividade_fisica]);

  // Manipuladores de Toggle para Listas com Opção 'Nenhum'
  const handleToggleMultiSelect = (list, setList, item) => {
    setIsDirty(true);
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
    setIsDirty(true);
    const filtered = list.filter((i) => i !== 'Nenhum');
    if (!filtered.includes(val)) {
      setList([...filtered, val]);
    }
    setCustomVal('');
  };

  const handleRemoveItem = (item, list, setList) => {
    setIsDirty(true);
    setList(list.filter((i) => i !== item));
  };

  // Salvar Alterações da Seção 1 (Dados do Paciente)
  const handleSaveDados = async (e) => {
    if (e) e.preventDefault();
    if (!nome.trim()) {
      setFeedback({ type: 'error', message: 'O nome completo do paciente é obrigatório.' });
      return;
    }

    try {
      setSavingDados(true);
      setFeedback(null);

      const payload = {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        telefone: telefone || null,
        whatsapp: whatsapp || null,
        email: email ? email.trim().toLowerCase() : null,
        peso_inicial: pesoAtual ? Number(pesoAtual) : null,
        altura: altura ? Number(altura) : null,
        objetivos,
        objetivo_texto: objetivoTexto || null,
        nivel_atividade: nivelAtividade || null,
        patologias,
        restricoes_alimentares: restricoes,
        alergias,
        medicamentos: medicamentos || null,
        suplementos: suplementos || null,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
        horario_acorda: horarioAcorda || null,
        horario_dorme: horarioDorme || null,
        litros_agua: litrosAgua ? Number(litrosAgua) : null,
        atividade_fisica: Boolean(atividadeFisica),
        atividade_fisica_descricao: atividadeDescricao || null,
        observacoes: observacoes || null,
      };

      const updated = await updatePacienteCompleto(pacienteId, payload);
      if (updated) {
        setPaciente(updated);
        populateForm(updated);
        setFeedback({ type: 'success', message: 'Dados do paciente atualizados com sucesso no Neon!' });
        setIsDirty(false);
      }
    } catch (err) {
      console.error('Erro ao salvar alterações:', err);
      setFeedback({ type: 'error', message: 'Erro ao salvar alterações no Neon PostgreSQL.' });
    } finally {
      setSavingDados(false);
    }
  };

  // Excluir Paciente
  const handleDeletePaciente = async () => {
    try {
      setDeleting(true);
      const success = await deletePaciente(pacienteId);
      if (success) {
        if (onPacienteDeleted) onPacienteDeleted();
        else onBack();
      }
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
      setFeedback({ type: 'error', message: 'Erro ao excluir paciente.' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Abrir Modal de Nova Consulta
  const handleOpenNovaConsulta = () => {
    setConsultaError('');
    setNovaConsultaData({
      data_consulta: new Date().toISOString().slice(0, 10),
      peso: consultas.length > 0 ? String(consultas[0].peso) : (paciente?.peso_inicial ? String(paciente.peso_inicial) : ''),
      cintura: '',
      quadril: '',
      percentual_gordura: '',
      observacoes: '',
      proximo_retorno: '',
    });
    setShowNovaConsultaModal(true);
  };

  // Salvar Nova Consulta (Seção 2)
  const handleSaveNovaConsulta = async (e) => {
    if (e) e.preventDefault();
    setConsultaError('');

    if (!novaConsultaData.data_consulta) {
      setConsultaError('A data da consulta é obrigatória.');
      return;
    }
    if (!novaConsultaData.peso || isNaN(parseFloat(novaConsultaData.peso)) || parseFloat(novaConsultaData.peso) <= 0) {
      setConsultaError('Informe um peso válido para a consulta.');
      return;
    }

    try {
      setSavingConsulta(true);
      const payload = {
        paciente_id: pacienteId,
        data_consulta: novaConsultaData.data_consulta,
        peso: parseFloat(novaConsultaData.peso),
        cintura: novaConsultaData.cintura ? parseFloat(novaConsultaData.cintura) : null,
        quadril: novaConsultaData.quadril ? parseFloat(novaConsultaData.quadril) : null,
        percentual_gordura: novaConsultaData.percentual_gordura ? parseFloat(novaConsultaData.percentual_gordura) : null,
        observacoes: novaConsultaData.observacoes || null,
        proximo_retorno: novaConsultaData.proximo_retorno || null,
      };

      const created = await createConsulta(payload);
      if (created) {
        setShowNovaConsultaModal(false);
        setFeedback({ type: 'success', message: 'Consulta registrada e gráfico atualizado com sucesso!' });
        // Recarrega consultas e paciente em tempo real
        const [consData, pacData] = await Promise.all([
          getConsultasByPaciente(pacienteId),
          getPacienteById(pacienteId),
        ]);
        setConsultas(consData || []);
        setPaciente(pacData);
      }
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      setConsultaError('Erro ao registrar consulta no Neon. Verifique os dados e tente novamente.');
    } finally {
      setSavingConsulta(false);
    }
  };


  // Excluir Consulta
  const handleDeleteConsultaConfirm = async () => {
    if (!consultaToDelete) return;
    try {
      setDeletingConsulta(true);
      const success = await deleteConsulta(consultaToDelete.id);
      if (success) {
        setConsultas(consultas.filter((c) => c.id !== consultaToDelete.id));
        setFeedback({ type: 'success', message: 'Consulta removida com sucesso.' });
      }
    } catch (err) {
      console.error('Erro ao excluir consulta:', err);
      setFeedback({ type: 'error', message: 'Erro ao remover consulta.' });
    } finally {
      setDeletingConsulta(false);
      setConsultaToDelete(null);
    }
  };


  // =========================================================================
  // HANDLERS DA SEÇÃO 3 — PLANOS ALIMENTARES (PROMPT 6)
  // =========================================================================

  // Iniciar Geração de Plano Alimentar com IA
  const handleGerarPlanoIa = async () => {
    if (generatingIaPlan) return;
    setGeneratingIaPlan(true);
    setFeedback(null);
    setAiProgressMessage('Buscando dados clínicos e histórico do paciente...');

    // Mensagens dinâmicas com rotação periódica
    const progressMessages = [
      'Buscando dados cadastrais, objetivos e restrições...',
      'Inteligência Artificial calculando metas e cardápio...',
      'Montando combinações de alimentos típicos da culinária brasileira...',
      'Estruturando as 5 refeições para os 7 dias da semana...',
      'Finalizando plano semanal personalizado...',
    ];
    let msgIndex = 0;
    const intervalTimer = setInterval(() => {
      msgIndex = (msgIndex + 1) % progressMessages.length;
      setAiProgressMessage(progressMessages[msgIndex]);
    }, 2500);

    try {
      const pacientePayload = {
        nome: nome.trim() || paciente.nome,
        idade: calculatedAge,
        sexo: sexo || paciente.sexo,
        peso: pesoAtual ? Number(pesoAtual) : paciente.peso_inicial,
        altura: altura ? Number(altura) : paciente.altura,
        imc: calculatedIMC,
        objetivos,
        objetivo_texto: objetivoTexto,
        nivel_atividade: nivelAtividade,
        patologias,
        restricoes_alimentares: restricoes,
        alergias,
        medicamentos,
        suplementos,
        refeicoes_por_dia: refeicoesPorDia,
        horario_acorda: horarioAcorda,
        horario_dorme: horarioDorme,
        litros_agua: litrosAgua,
        atividade_fisica: Boolean(atividadeFisica),
        atividade_fisica_descricao: atividadeDescricao,
        observacoes,
        historico_consultas: consultas.map((c) => ({
          data_consulta: c.data_consulta,
          peso: c.peso,
          observacoes: c.observacoes,
        })),
      };

      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paciente: pacientePayload }),
      });

      clearInterval(intervalTimer);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro de resposta da API (Status ${response.status})`);
      }

      const resData = await response.json();
      if (!resData.success || !resData.data || !Array.isArray(resData.data.plano_semanal)) {
        throw new Error(resData.error || 'A IA não retornou uma estrutura de plano alimentar válida.');
      }

      const planoGeradoFormatado = {
        titulo: `Plano Alimentar Semanal (IA) — ${nome.trim() || paciente.nome}`,
        observacoes: `Plano semanal elaborado com Inteligência Artificial baseado nos objetivos (${objetivos.join(', ') || 'reeducação alimentar'}) e restrições do paciente.`,
        plano_semanal: resData.data.plano_semanal,
      };

      setPlanoEmEdicao(planoGeradoFormatado);
      setFeedback({
        type: 'success',
        message: '✨ Plano alimentar semanal gerado com IA! Você pode editar qualquer refeição antes de salvar.',
      });
    } catch (err) {
      clearInterval(intervalTimer);
      console.error('Erro ao gerar plano alimentar com IA:', err);
      setFeedback({
        type: 'error',
        message:
          'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        isAiError: true,
      });
    } finally {
      setGeneratingIaPlan(false);
    }
  };

  // Iniciar Criação Manual de Plano Alimentar
  const handleIniciarPlanoManual = () => {
    setPlanoEmEdicao(criarPlanoVazio(nome.trim() || paciente?.nome));
    setFeedback(null);
  };

  // Salvar Plano Alimentar no Neon PostgreSQL
  const handleSalvarPlano = async (planoData) => {
    try {
      setSavingPlano(true);
      setFeedback(null);

      const novoPlano = await createPlanoAlimentar({
        paciente_id: pacienteId,
        conteudo: planoData,
      });

      if (novoPlano) {
        // Atualiza histórico em tempo real
        const planosAtualizados = await getPlanosByPaciente(pacienteId);
        setPlanos(planosAtualizados || []);
        setPlanoEmEdicao(null);
        setFeedback({
          type: 'success',
          message: 'Plano alimentar salvo com sucesso no Neon PostgreSQL!',
        });
      }
    } catch (err) {
      console.error('Erro ao salvar plano alimentar:', err);
      setFeedback({
        type: 'error',
        message: 'Erro ao salvar plano alimentar no banco de dados Neon.',
      });
    } finally {
      setSavingPlano(false);
    }
  };

  // Excluir Plano Alimentar
  const handleDeletePlanoConfirm = async () => {
    if (!planoToDelete) return;
    try {
      setDeletingPlano(true);
      const success = await deletePlanoAlimentar(planoToDelete.id);
      if (success) {
        setPlanos(planos.filter((p) => p.id !== planoToDelete.id));
        setFeedback({ type: 'success', message: 'Plano alimentar removido com sucesso.' });
      }
    } catch (err) {
      console.error('Erro ao excluir plano alimentar:', err);
      setFeedback({ type: 'error', message: 'Erro ao excluir plano alimentar.' });
    } finally {
      setDeletingPlano(false);
      setPlanoToDelete(null);
    }
  };

  // Abrir Plano Existente para Edição / Nova Versão
  const handleEditarPlano = (planoItem) => {
    const parsed =
      typeof planoItem.conteudo === 'string' ? JSON.parse(planoItem.conteudo) : planoItem.conteudo;
    setPlanoEmEdicao(parsed);
    setSelectedPlano(null);
  };

  // Copiar Conteúdo do Plano Formatado para o Visualizador
  const handleCopyVisualizerText = (planoItem) => {
    const conteudo =
      typeof planoItem.conteudo === 'string' ? JSON.parse(planoItem.conteudo) : planoItem.conteudo;

    let texto = `📋 *${conteudo.titulo || 'PLANO ALIMENTAR SEMANAL'}*\n👤 *Paciente:* ${paciente?.nome}\n`;
    if (conteudo.observacoes) {
      texto += `📝 *Orientações:* ${conteudo.observacoes}\n`;
    }
    texto += `\n${'='.repeat(35)}\n\n`;

    if (Array.isArray(conteudo.plano_semanal)) {
      conteudo.plano_semanal.forEach((diaObj) => {
        texto += `🗓️ *${diaObj.dia.toUpperCase()}*\n`;
        REFEICOES_CONFIG.forEach((ref) => {
          const opcoes = (diaObj.refeicoes?.[ref.key] || []).filter((o) => o && o.trim());
          if (opcoes.length > 0) {
            texto += `  🔸 *${ref.label}:*\n`;
            opcoes.forEach((op, idx) => {
              texto += `     ${idx + 1}. ${op}\n`;
            });
          }
        });
        texto += `\n`;
      });
    }

    navigator.clipboard.writeText(texto).then(() => {
      setCopiedVisualizerText(true);
      setTimeout(() => setCopiedVisualizerText(false), 3000);
    });
  };

  // Gerar e Baixar Relatório Completo do Plano em PDF
  const handleBaixarPdfPlano = async (planoItem) => {
    if (!planoItem) return;
    try {
      setDownloadingPdf(true);
      const pacienteCompleto = {
        nome: nome.trim() || paciente?.nome,
        idade: calculatedAge || paciente?.idade,
        sexo: sexo || paciente?.sexo,
        peso: pesoAtual ? Number(pesoAtual) : paciente?.peso_inicial,
        altura: altura ? Number(altura) : paciente?.altura,
        imc: calculatedIMC || paciente?.imc,
        objetivos,
        restricoes_alimentares: restricoes,
        alergias,
        litros_agua: litrosAgua ? Number(litrosAgua) : paciente?.litros_agua,
        nivel_atividade: nivelAtividade || paciente?.nivel_atividade,
        atividade_fisica: atividadeFisica,
      };
      await gerarPlanoAlimentarPdf(planoItem, pacienteCompleto);
    } catch (err) {
      console.error('Erro ao gerar relatório em PDF:', err);
      alert('Não foi possível gerar o arquivo PDF. Tente novamente.');
    } finally {
      setDownloadingPdf(false);
    }
  };


  // Preparação dos dados para o Gráfico de Evolução de Peso
  const chartData = useMemo(() => {
    if (!consultas || consultas.length === 0) {
      return [];
    }

    // Ordena do mais antigo para o mais recente para traçar o gráfico
    const sorted = [...consultas].sort(
      (a, b) => new Date(a.data_consulta) - new Date(b.data_consulta)
    );

    return sorted.map((c, idx) => {
      const dt = new Date(c.data_consulta);
      const dateLabel = !isNaN(dt.getTime())
        ? dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : c.data_consulta;

      const fullDate = !isNaN(dt.getTime())
        ? dt.toLocaleDateString('pt-BR')
        : c.data_consulta;

      const pesoVal = parseFloat(c.peso) || 0;
      const prevPeso = idx > 0 ? parseFloat(sorted[idx - 1].peso) || pesoVal : pesoVal;
      const delta = idx > 0 ? parseFloat((pesoVal - prevPeso).toFixed(1)) : 0;

      return {
        id: c.id,
        dateLabel,
        fullDate,
        peso: pesoVal,
        delta,
        cintura: c.cintura ? parseFloat(c.cintura) : null,
        percentual_gordura: c.percentual_gordura ? parseFloat(c.percentual_gordura) : null,
      };
    });
  }, [consultas]);

  // Estatísticas de evolução de peso
  const pesoStats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        pesoInicial: paciente?.peso_inicial ? parseFloat(paciente.peso_inicial) : null,
        pesoAtual: paciente?.peso_inicial ? parseFloat(paciente.peso_inicial) : null,
        deltaTotal: 0,
        minPeso: 0,
        maxPeso: 0,
      };
    }
    const pesoInicial = parseFloat(paciente?.peso_inicial) || chartData[0].peso;
    const pesoAtual = chartData[chartData.length - 1].peso;
    const deltaTotal = parseFloat((pesoAtual - pesoInicial).toFixed(1));
    const pesos = chartData.map((d) => d.peso);
    const minPeso = Math.min(...pesos);
    const maxPeso = Math.max(...pesos);

    return {
      pesoInicial,
      pesoAtual,
      deltaTotal,
      minPeso,
      maxPeso,
    };
  }, [chartData, paciente]);

  // Formatação de data
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const dt = new Date(dateString);
    return isNaN(dt.getTime()) ? dateString : dt.toLocaleDateString('pt-BR');
  };

  // WhatsApp Link
  const rawZap = (whatsapp || paciente?.whatsapp || '').replace(/\D/g, '');
  const zapUrl = rawZap ? `https://wa.me/55${rawZap}` : null;

  if (loading) {
    return (
      <div className="perfil-loading-container">
        <div className="loading-spinner" />
        <p>Carregando perfil do paciente...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="perfil-not-found-container">
        <AlertCircle size={48} className="icon-amber" />
        <h3>Paciente não encontrado</h3>
        <p>O paciente solicitado não existe ou foi removido do banco de dados.</p>
        <button type="button" className="btn-primary-action" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Voltar para Lista de Pacientes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="perfil-view-wrapper fade-in">
      {/* Topbar de Navegação e Ações */}
      <div className="perfil-topbar-nav">
        <button type="button" className="btn-back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Voltar para Pacientes</span>
        </button>

        <div className="perfil-actions-group">
          {onOpenAnalista && (
            <button
              type="button"
              className="btn-analista-shortcut"
              onClick={() => onOpenAnalista(paciente.id)}
              title="Abrir métricas e gráficos avançados no Analista"
            >
              <TrendingUp size={16} />
              <span>Ver no Analista</span>
            </button>
          )}

          <button
            type="button"
            className="btn-delete-action"
            onClick={() => setShowDeleteModal(true)}
            title="Excluir paciente permanentemente"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Banner de Feedback/Toast */}
      {feedback && (
        <div className={`form-alert-banner alert-${feedback.type} fade-in`}>
          <div className="alert-content-row">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>

          {feedback.isAiError && (
            <div className="alert-action-buttons">
              <button
                type="button"
                className="btn-alert-action btn-try-again"
                onClick={handleGerarPlanoIa}
                disabled={generatingIaPlan}
              >
                <Sparkles size={14} />
                <span>Tentar com IA Novamente</span>
              </button>
              <button
                type="button"
                className="btn-alert-action btn-manual-fallback"
                onClick={handleIniciarPlanoManual}
              >
                <Edit3 size={14} />
                <span>Criar Plano Manual</span>
              </button>
            </div>
          )}

          <button type="button" className="alert-close-btn" onClick={() => setFeedback(null)}>
            <X size={16} />
          </button>
        </div>
      )}


      {/* =======================================================================
          HERO CARD — CABEÇALHO DO PACIENTE COM MÉTRICAS RÁPIDAS
          ======================================================================= */}
      <div className="perfil-hero-card">
        <div className="perfil-hero-left">
          <div className="perfil-avatar-circle">
            {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="perfil-hero-info">
            <div className="perfil-name-row">
              <h2 className="perfil-patient-name">{paciente.nome}</h2>
              {calculatedAge !== null && (
                <span className="hero-age-pill">{calculatedAge} anos</span>
              )}
            </div>

            {/* Chips de Contato */}
            <div className="perfil-contact-chips">
              {paciente.email && (
                <a href={`mailto:${paciente.email}`} className="contact-chip-item">
                  <Mail size={14} />
                  <span>{paciente.email}</span>
                </a>
              )}
              {paciente.whatsapp && zapUrl && (
                <a
                  href={zapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-chip-item chip-whatsapp"
                  title="Conversar no WhatsApp"
                >
                  <MessageCircle size={14} />
                  <span>{paciente.whatsapp}</span>
                  <ExternalLink size={11} className="ext-icon" />
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

      {/* =======================================================================
          NAVEGAÇÃO DAS 3 SEÇÕES PRINCIPAIS (PROMPT 5)
          1. Dados do Paciente | 2. Consultas | 3. Planos Alimentares
          ======================================================================= */}
      <div className="perfil-main-sections-bar">
        <button
          type="button"
          className={`perfil-section-btn ${activeSection === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveSection('dados')}
        >
          <User size={18} />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          className={`perfil-section-btn ${activeSection === 'consultas' ? 'active' : ''}`}
          onClick={() => setActiveSection('consultas')}
        >
          <CalendarCheck size={18} />
          <span>2. Consultas</span>
          <span className="section-counter-pill">{consultas.length}</span>
        </button>

        <button
          type="button"
          className={`perfil-section-btn ${activeSection === 'planos' ? 'active' : ''}`}
          onClick={() => setActiveSection('planos')}
        >
          <Utensils size={18} />
          <span>3. Planos Alimentares</span>
          <span className="section-counter-pill">{planos.length}</span>
        </button>
      </div>

      {/* =======================================================================
          SEÇÃO 1 — DADOS DO PACIENTE (3 ABAS: PESSOAL, CLÍNICO E HÁBITOS)
          Editáveis diretamente com botão "Salvar alterações"
          ======================================================================= */}
      {activeSection === 'dados' && (
        <div className="perfil-section-content fade-in">
          {/* Sub-abas da Seção de Dados */}
          <div className="perfil-subtabs-nav">
            <button
              type="button"
              className={`subtab-pill-btn ${dadosSubTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setDadosSubTab('pessoal')}
            >
              <User size={15} />
              <span>Pessoal</span>
            </button>
            <button
              type="button"
              className={`subtab-pill-btn ${dadosSubTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setDadosSubTab('clinico')}
            >
              <HeartPulse size={15} />
              <span>Clínico</span>
            </button>
            <button
              type="button"
              className={`subtab-pill-btn ${dadosSubTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setDadosSubTab('habitos')}
            >
              <Coffee size={15} />
              <span>Hábitos</span>
            </button>

            {/* Botão de Salvar Alterações na Barra Superior de Sub-abas */}
            <div className="subtabs-action-right">
              <button
                type="button"
                className="btn-save-dados-action"
                onClick={handleSaveDados}
                disabled={savingDados}
              >
                {savingDados ? (
                  <>
                    <div className="btn-spinner" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Salvar alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveDados} className="perfil-card-content">
            {/* SUB-ABA 1: DADOS PESSOAIS */}
            {dadosSubTab === 'pessoal' && (
              <div className="tab-content-panel fade-in">
                <div className="tab-panel-header">
                  <div className="panel-title-group">
                    <User size={20} className="panel-icon icon-blue" />
                    <div>
                      <h3 className="panel-heading">Dados Pessoais</h3>
                      <p className="panel-subheading">Informações de contato e identificação do paciente (editável)</p>
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
                        onChange={(e) => {
                          setNome(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Nome completo do paciente"
                        required
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
                        onChange={(e) => {
                          setDataNascimento(e.target.value);
                          setIsDirty(true);
                        }}
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
                          onClick={() => {
                            setSexo(sexo === item ? '' : item);
                            setIsDirty(true);
                          }}
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
                        onChange={(e) => {
                          setTelefone(formatPhone(e.target.value));
                          setIsDirty(true);
                        }}
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
                        onChange={(e) => {
                          setWhatsapp(formatPhone(e.target.value));
                          setIsDirty(true);
                        }}
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
                        placeholder="paciente@email.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA 2: DADOS CLÍNICOS */}
            {dadosSubTab === 'clinico' && (
              <div className="tab-content-panel fade-in">
                <div className="tab-panel-header">
                  <div className="panel-title-group">
                    <HeartPulse size={20} className="panel-icon icon-emerald" />
                    <div>
                      <h3 className="panel-heading">Dados Clínicos e Antropométricos</h3>
                      <p className="panel-subheading">Métricas corporais, objetivos, patologias e alergias</p>
                    </div>
                  </div>
                </div>

                <div className="form-grid-layout">
                  {/* Peso */}
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="edit-peso">
                      Peso Inicial / Atual
                    </label>
                    <div className="field-input-wrapper suffix-wrapper">
                      <Weight size={16} className="input-prefix-icon" />
                      <input
                        id="edit-peso"
                        type="number"
                        step="0.1"
                        min="1"
                        max="500"
                        className="field-input with-icon with-suffix"
                        placeholder="Ex: 75.5"
                        value={pesoAtual}
                        onChange={(e) => {
                          setPesoAtual(e.target.value);
                          setIsDirty(true);
                        }}
                      />
                      <span className="input-suffix-tag">kg</span>
                    </div>
                  </div>

                  {/* Altura */}
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
                        min="30"
                        max="250"
                        className="field-input with-icon with-suffix"
                        placeholder="Ex: 175"
                        value={altura}
                        onChange={(e) => {
                          setAltura(e.target.value);
                          setIsDirty(true);
                        }}
                      />
                      <span className="input-suffix-tag">cm</span>
                    </div>
                  </div>

                  {/* IMC Calculado */}
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
                              setIsDirty(true);
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
                        placeholder="Outro objetivo ou observação adicional..."
                        value={objetivoTexto}
                        onChange={(e) => {
                          setObjetivoTexto(e.target.value);
                          setIsDirty(true);
                        }}
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
                            className={`activity-select-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setNivelAtividade(isSelected ? '' : lvl.id);
                              setIsDirty(true);
                            }}
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
                  </div>

                  {/* Restrições Alimentares */}
                  <div className="form-field-group col-span-2">
                    <label className="field-label">Restrições Alimentares</label>
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

                  {/* Alergias */}
                  <div className="form-field-group col-span-2">
                    <label className="field-label">Alergias Alimentares</label>
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
                  </div>

                  {/* Medicamentos */}
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="edit-med">
                      Medicamentos Contínuos
                    </label>
                    <div className="field-input-wrapper">
                      <textarea
                        id="edit-med"
                        rows={3}
                        className="field-textarea"
                        placeholder="Descreva medicamentos, dosagens e horários..."
                        value={medicamentos}
                        onChange={(e) => {
                          setMedicamentos(e.target.value);
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  </div>

                  {/* Suplementos */}
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="edit-sup">
                      Suplementos em Uso
                    </label>
                    <div className="field-input-wrapper">
                      <textarea
                        id="edit-sup"
                        rows={3}
                        className="field-textarea"
                        placeholder="Ex: Whey, Creatina, Vitaminas..."
                        value={suplementos}
                        onChange={(e) => {
                          setSuplementos(e.target.value);
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA 3: HÁBITOS */}
            {dadosSubTab === 'habitos' && (
              <div className="tab-content-panel fade-in">
                <div className="tab-panel-header">
                  <div className="panel-title-group">
                    <Coffee size={20} className="panel-icon icon-amber" />
                    <div>
                      <h3 className="panel-heading">Hábitos e Rotina</h3>
                      <p className="panel-subheading">Refeições, ingestão hídrica, horários de sono e atividade física</p>
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
                        min="1"
                        max="12"
                        className="field-input"
                        value={refeicoesPorDia}
                        onChange={(e) => {
                          setRefeicoesPorDia(e.target.value);
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  </div>

                  {/* Quantidade de Água com Cálculo Recomendado */}
                  <div className="form-field-group col-span-2">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="edit-agua">
                        Quantidade de água por dia
                      </label>
                      {calculatedWater && (
                        <span className="field-calc-badge-water">
                          <Droplets size={12} /> Meta recomendada: <strong>{atividadeFisica ? calculatedWater.formattedActive : calculatedWater.formatted}</strong> ({calculatedWater.rateMl} ml/kg)
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
                          onChange={(e) => {
                            setLitrosAgua(e.target.value);
                            setIsDirty(true);
                          }}
                        />
                        <span className="input-suffix-tag">litros</span>
                      </div>
                      {calculatedWater && (
                        <button
                          type="button"
                          className="btn-apply-water-auto"
                          onClick={() => {
                            setLitrosAgua(String(atividadeFisica ? calculatedWater.activeLiters : calculatedWater.baseLiters));
                            setIsDirty(true);
                          }}
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
                        {atividadeFisica && (
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
                      <span className="field-hint-chip">Ex: 6 → 06:00, 630 → 06:30</span>
                    </div>
                    <div className="field-input-wrapper">
                      <Clock size={16} className="input-prefix-icon" />
                      <input
                        id="edit-acorda"
                        type="text"
                        className="field-input with-icon"
                        value={horarioAcorda}
                        onChange={(e) => {
                          setHorarioAcorda(e.target.value);
                          setIsDirty(true);
                        }}
                        onBlur={(e) => setHorarioAcorda(formatSmartTime(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <div className="field-label-row">
                      <label className="field-label" htmlFor="edit-dorme">
                        Horário que dorme
                      </label>
                      <span className="field-hint-chip">Ex: 23 → 23:00, 2230 → 22:30</span>
                    </div>
                    <div className="field-input-wrapper">
                      <Clock size={16} className="input-prefix-icon" />
                      <input
                        id="edit-dorme"
                        type="text"
                        className="field-input with-icon"
                        value={horarioDorme}
                        onChange={(e) => {
                          setHorarioDorme(e.target.value);
                          setIsDirty(true);
                        }}
                        onBlur={(e) => setHorarioDorme(formatSmartTime(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-field-group col-span-2">
                    <label className="field-label">Pratica atividade física regularmente?</label>
                    <div className="toggle-selection-row">
                      <button
                        type="button"
                        className={`toggle-option-btn ${!atividadeFisica ? 'active' : ''}`}
                        onClick={() => {
                          setAtividadeFisica(false);
                          setIsDirty(true);
                        }}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        className={`toggle-option-btn ${atividadeFisica ? 'active' : ''}`}
                        onClick={() => {
                          setAtividadeFisica(true);
                          setIsDirty(true);
                        }}
                      >
                        Sim
                      </button>
                    </div>

                    {atividadeFisica && (
                      <div className="conditional-expand-box fade-in">
                        <label className="field-sublabel" htmlFor="edit-ativ-desc">
                          Qual atividade física e frequência semanal?
                        </label>
                        <input
                          id="edit-ativ-desc"
                          type="text"
                          className="field-input"
                          placeholder="Ex: Treino funcional 3x na semana e corrida aos domingos"
                          value={atividadeDescricao}
                          onChange={(e) => {
                            setAtividadeDescricao(e.target.value);
                            setIsDirty(true);
                          }}
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
                        rows={3}
                        className="field-textarea"
                        placeholder="Anotações adicionais, histórico familiar ou particularidades do paciente..."
                        value={observacoes}
                        onChange={(e) => {
                          setObservacoes(e.target.value);
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rodapé de Ação com Botão Salvar Alterações */}
            <div className="tab-panel-footer">
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => populateForm(paciente)}
                disabled={!isDirty || savingDados}
              >
                <RotateCcw size={15} />
                <span>Descartar Alterações</span>
              </button>

              <button
                type="submit"
                className="btn-primary-action"
                disabled={savingDados}
              >
                {savingDados ? (
                  <>
                    <div className="btn-spinner" />
                    <span>Salvando alterações...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Salvar alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =======================================================================
          SEÇÃO 2 — CONSULTAS (PROMPT 5)
          - Gráfico de evolução de peso sempre visível no topo
          - Lista de consultas em ordem decrescente
          - Botão "+ Nova Consulta" com Modal
          ======================================================================= */}
      {activeSection === 'consultas' && (
        <div className="perfil-section-content fade-in">
          {/* Gráfico de Evolução de Peso (Sempre Visível) */}
          <div className="consultas-chart-container">
            <div className="chart-header-row">
              <div className="chart-title-group">
                <TrendingUp size={20} className="icon-emerald" />
                <div>
                  <h3 className="chart-main-title">Evolução do Peso Corporal</h3>
                  <p className="chart-sub-title">Acompanhamento do peso registrado em cada atendimento ao longo do tempo</p>
                </div>
              </div>

              {/* Botão de Nova Consulta */}
              <button
                type="button"
                className="btn-primary-action btn-nova-consulta-header"
                onClick={handleOpenNovaConsulta}
              >
                <Plus size={16} />
                <span>Nova Consulta</span>
              </button>
            </div>

            {/* Renderização do Gráfico ou Estado Vazio */}
            {chartData.length > 0 ? (
              <div className="weight-evolution-chart-box">
                {/* Métricas Resumidas da Curva */}
                <div className="chart-stats-summary-bar">
                  <div className="chart-stat-item">
                    <span className="cs-label">Peso Inicial</span>
                    <strong className="cs-val">{pesoStats.pesoInicial} kg</strong>
                  </div>
                  <div className="chart-stat-item">
                    <span className="cs-label">Peso Atual</span>
                    <strong className="cs-val">{pesoStats.pesoAtual} kg</strong>
                  </div>
                  <div className="chart-stat-item">
                    <span className="cs-label">Variação Total</span>
                    <span className={`cs-delta ${pesoStats.deltaTotal <= 0 ? 'delta-neg' : 'delta-pos'}`}>
                      {pesoStats.deltaTotal <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                      {pesoStats.deltaTotal > 0 ? `+${pesoStats.deltaTotal}` : pesoStats.deltaTotal} kg
                    </span>
                  </div>
                  <div className="chart-stat-item">
                    <span className="cs-label">Total de Atendimentos</span>
                    <strong className="cs-val">{chartData.length}</strong>
                  </div>
                </div>

                {/* SVG Visual do Gráfico de Evolução */}
                <div className="chart-svg-wrapper">
                  <svg viewBox="0 0 700 240" className="weight-svg-chart" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Linhas de Grade Horizontal */}
                    <line x1="40" y1="40" x2="660" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <line x1="40" y1="95" x2="660" y2="95" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <line x1="40" y1="150" x2="660" y2="150" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <line x1="40" y1="200" x2="660" y2="200" stroke="rgba(255,255,255,0.12)" />

                    {/* Cálculo dos Pontos da Linha */}
                    {(() => {
                      const paddingX = 60;
                      const widthAvailable = 700 - paddingX * 2;
                      const minY = Math.max(0, pesoStats.minPeso - 5);
                      const maxY = pesoStats.maxPeso + 5;
                      const rangeY = maxY - minY || 1;

                      const points = chartData.map((pt, i) => {
                        const x = chartData.length === 1
                          ? 350
                          : paddingX + (i / (chartData.length - 1)) * widthAvailable;
                        const y = 200 - ((pt.peso - minY) / rangeY) * 150;
                        return { ...pt, x, y };
                      });

                      const pathD = points.length === 1
                        ? `M ${points[0].x - 40} ${points[0].y} L ${points[0].x + 40} ${points[0].y}`
                        : points.reduce((acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`), '');

                      const areaD = points.length > 1
                        ? `${pathD} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`
                        : '';

                      return (
                        <>
                          {areaD && <path d={areaD} fill="url(#weightAreaGrad)" />}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {points.map((pt) => (
                            <g key={pt.id} className="chart-node-group">
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="5.5"
                                fill="#09090b"
                                stroke="#34d399"
                                strokeWidth="2.5"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 12}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="12"
                                fontWeight="700"
                              >
                                {pt.peso} kg
                              </text>
                              <text
                                x={pt.x}
                                y="222"
                                textAnchor="middle"
                                fill="#a1a1aa"
                                fontSize="11"
                                fontWeight="500"
                              >
                                {pt.dateLabel}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            ) : (
              /* Gráfico Vazio com Mensagem do Prompt 5 */
              <div className="chart-empty-state-box">
                <div className="empty-chart-illustration">
                  <TrendingUp size={36} className="icon-muted" />
                  <div className="empty-pulse-line" />
                </div>
                <h4 className="empty-chart-msg">Nenhuma consulta registrada ainda</h4>
                <p className="empty-chart-sub">
                  Registre o primeiro atendimento do paciente para acompanhar o gráfico de evolução de peso e medidas corporais.
                </p>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={handleOpenNovaConsulta}
                >
                  <Plus size={16} />
                  <span>Registrar Primeira Consulta</span>
                </button>
              </div>
            )}
          </div>

          {/* Lista de Consultas em Ordem Cronológica Decrescente */}
          <div className="consultas-history-card">
            <div className="history-header-row">
              <div className="history-title-wrap">
                <CalendarCheck size={20} className="icon-blue" />
                <div>
                  <h3 className="history-main-heading">Histórico de Atendimentos</h3>
                  <p className="history-sub-heading">Registro cronológico detalhado das consultas realizadas</p>
                </div>
              </div>

              <span className="history-count-tag">{consultas.length} consulta(s)</span>
            </div>

            {consultas.length > 0 ? (
              <div className="consultas-timeline-list">
                {consultas.map((consulta, idx) => {
                  const pesoNum = parseFloat(consulta.peso) || 0;
                  const prevConsulta = idx < consultas.length - 1 ? consultas[idx + 1] : null;
                  const prevPeso = prevConsulta ? parseFloat(prevConsulta.peso) : null;
                  const delta = prevPeso !== null ? parseFloat((pesoNum - prevPeso).toFixed(1)) : null;

                  return (
                    <div key={consulta.id} className="consulta-timeline-item fade-in">
                      <div className="consulta-timeline-indicator">
                        <div className="timeline-node-dot" />
                        {idx < consultas.length - 1 && <div className="timeline-node-line" />}
                      </div>

                      <div className="consulta-card-body">
                        <div className="consulta-card-top-row">
                          <div className="consulta-date-box">
                            <Calendar size={16} className="icon-cyan" />
                            <strong className="consulta-date-text">{formatDate(consulta.data_consulta)}</strong>
                            {idx === 0 && <span className="latest-badge">Última Consulta</span>}
                          </div>

                          <button
                            type="button"
                            className="btn-delete-consulta-mini"
                            onClick={() => setConsultaToDelete(consulta)}
                            title="Remover esta consulta"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="consulta-metrics-grid">
                          {/* Peso */}
                          <div className="consulta-metric-tile">
                            <span className="cm-tile-label">Peso Registrado</span>
                            <div className="cm-tile-val-row">
                              <strong className="cm-tile-value">{pesoNum} kg</strong>
                              {delta !== null && (
                                <span className={`cm-delta-chip ${delta <= 0 ? 'delta-good' : 'delta-warn'}`}>
                                  {delta > 0 ? `+${delta}` : delta} kg
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Cintura */}
                          {consulta.cintura && (
                            <div className="consulta-metric-tile">
                              <span className="cm-tile-label">Cintura</span>
                              <strong className="cm-tile-value">{consulta.cintura} cm</strong>
                            </div>
                          )}

                          {/* Quadril */}
                          {consulta.quadril && (
                            <div className="consulta-metric-tile">
                              <span className="cm-tile-label">Quadril</span>
                              <strong className="cm-tile-value">{consulta.quadril} cm</strong>
                            </div>
                          )}

                          {/* % Gordura */}
                          {consulta.percentual_gordura && (
                            <div className="consulta-metric-tile">
                              <span className="cm-tile-label">% de Gordura</span>
                              <strong className="cm-tile-value">{consulta.percentual_gordura}%</strong>
                            </div>
                          )}

                          {/* Próximo Retorno */}
                          {consulta.proximo_retorno && (
                            <div className="consulta-metric-tile tile-retorno">
                              <span className="cm-tile-label">Próximo Retorno</span>
                              <div className="cm-retorno-row">
                                <Clock size={14} />
                                <strong className="cm-tile-value">{formatDate(consulta.proximo_retorno)}</strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Observações */}
                        {consulta.observacoes && (
                          <div className="consulta-obs-box">
                            <span className="obs-title">Observações do Atendimento:</span>
                            <p className="obs-content">{consulta.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-history-placeholder">
                <Calendar size={32} className="icon-muted" />
                <p>Nenhuma consulta registrada para este paciente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          SEÇÃO 3 — PLANOS ALIMENTARES (PROMPT 6)
          - Editor interativo em abas (7 dias × 5 refeições × 5 opções)
          - Geração com Inteligência Artificial (Google Gemini)
          - Histórico persistido no Neon PostgreSQL
          - Visualizador estruturado completo
          ======================================================================= */}
      {activeSection === 'planos' && (
        <div className="perfil-section-content fade-in">
          {planoEmEdicao ? (
            /* Modo de Edição Ativo (Plano Alimentar Editor) */
            <PlanoAlimentarEditor
              paciente={paciente}
              planoInicial={planoEmEdicao}
              onSave={handleSalvarPlano}
              onCancel={() => setPlanoEmEdicao(null)}
              saving={savingPlano}
            />
          ) : (
            /* Modo de Exibição / Histórico de Planos */
            <div className="planos-section-card">
              <div className="planos-section-header">
                <div className="planos-title-group">
                  <Utensils size={20} className="icon-amber" />
                  <div>
                    <h3 className="planos-main-title">Planos Alimentares Personalizados</h3>
                    <p className="planos-sub-title">
                      Prescrições dietéticas semanais com cardápios gerados por IA ou formulados manualmente
                    </p>
                  </div>
                </div>

                {/* Botões de Ação em Destaque */}
                <div className="planos-header-actions-group">
                  <button
                    type="button"
                    className="btn-manual-plano-secondary"
                    onClick={handleIniciarPlanoManual}
                    disabled={generatingIaPlan}
                    title="Criar um plano alimentar em branco manualmente"
                  >
                    <Plus size={16} />
                    <span>Plano Manual</span>
                  </button>

                  <button
                    type="button"
                    className="btn-gerar-plano-primary"
                    onClick={handleGerarPlanoIa}
                    disabled={generatingIaPlan}
                    title="Gerar cardápio semanal completo via Inteligência Artificial"
                  >
                    {generatingIaPlan ? (
                      <>
                        <div className="btn-spinner" />
                        <span>Gerando com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={17} />
                        <span>Gerar Plano com IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Overlay / Painel de Loading Dinâmico da IA */}
              {generatingIaPlan && (
                <div className="ai-generating-banner fade-in">
                  <div className="ai-generating-spinner-box">
                    <div className="ai-pulse-ring" />
                    <Sparkles size={28} className="ai-sparkle-spin" />
                  </div>
                  <div className="ai-generating-info">
                    <div className="ai-generating-tag">
                      <span className="live-dot" />
                      <span>Google Gemini IA em Execução</span>
                    </div>
                    <h4 className="ai-generating-msg">{aiProgressMessage}</h4>
                    <p className="ai-generating-sub">
                      Analisando peso ({pesoAtual || paciente.peso_inicial || '—'} kg), idade ({calculatedAge || '—'} anos),
                      objetivos ({objetivos.length > 0 ? objetivos.join(', ') : 'Saúde geral'}) e restrições para montar o cardápio dos 7 dias.
                    </p>
                  </div>
                </div>
              )}

              {/* Histórico de Planos Alimentares Salvos */}
              {planos.length > 0 ? (
                <div className="planos-history-grid">
                  {planos.map((plano, index) => {
                    const conteudo =
                      typeof plano.conteudo === 'string' ? JSON.parse(plano.conteudo) : plano.conteudo;
                    const dataCriacao = formatDate(plano.created_at);

                    // Contagem de dias e refeições presentes
                    const totalDias = Array.isArray(conteudo.plano_semanal)
                      ? conteudo.plano_semanal.length
                      : 7;

                    return (
                      <div key={plano.id || index} className="plano-history-card fade-in">
                        <div className="plano-card-header">
                          <div className="plano-tag-badge">
                            <Sparkles size={13} />
                            <span>Plano #{planos.length - index}</span>
                          </div>
                          <span className="plano-date-stamp">{dataCriacao}</span>
                        </div>

                        <div className="plano-card-preview">
                          <h4 className="plano-name-heading">
                            {conteudo.titulo || `Plano Alimentar — ${paciente.nome}`}
                          </h4>
                          <p className="plano-summary-snippet">
                            {conteudo.observacoes ||
                              `Prescrição dietética completa estruturada para ${totalDias} dias com 5 opções por refeição.`}
                          </p>
                        </div>

                        <div className="plano-card-badges-row">
                          <span className="plano-info-chip">
                            <Calendar size={12} />
                            {totalDias} dias da semana
                          </span>
                          <span className="plano-info-chip">
                            <Utensils size={12} />
                            5 refeições / dia
                          </span>
                        </div>

                        <div className="plano-card-footer">
                          <button
                            type="button"
                            className="btn-view-plano-full"
                            onClick={() => {
                              setSelectedPlano(plano);
                              setVisualizerDiaIndex(0);
                            }}
                          >
                            <Eye size={15} />
                            <span>Ver Plano</span>
                          </button>

                          <button
                            type="button"
                            className="btn-edit-plano-action"
                            onClick={() => handleEditarPlano(plano)}
                            title="Editar este plano ou salvar como nova versão"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            className="btn-delete-plano-action"
                            onClick={() => setPlanoToDelete(plano)}
                            title="Excluir este plano do histórico"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Mensagem quando não houver planos salvos */
                <div className="planos-empty-state-box">
                  <div className="empty-plano-icon-circle">
                    <Utensils size={36} className="icon-amber" />
                  </div>
                  <h4 className="empty-planos-msg">Nenhum plano alimentar gerado ainda</h4>
                  <p className="empty-planos-sub">
                    Utilize a inteligência artificial para criar automaticamente um cardápio semanal completo com base nos dados e metas de <strong>{paciente.nome}</strong> ou comece manualmente.
                  </p>
                  <div className="empty-planos-actions-row">
                    <button
                      type="button"
                      className="btn-manual-plano-secondary btn-lg"
                      onClick={handleIniciarPlanoManual}
                      disabled={generatingIaPlan}
                    >
                      <Plus size={18} />
                      <span>Criar Plano Manual</span>
                    </button>

                    <button
                      type="button"
                      className="btn-gerar-plano-primary btn-lg"
                      onClick={handleGerarPlanoIa}
                      disabled={generatingIaPlan}
                    >
                      <Sparkles size={18} />
                      <span>Gerar Plano com IA</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          MODAL: + NOVA CONSULTA (PROMPT 5)
          ======================================================================= */}
      {showNovaConsultaModal && (
        <div className="modal-backdrop fade-in" onClick={() => setShowNovaConsultaModal(false)}>
          <div className="modal-dialog-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div className="modal-header-icon bg-blue">
                <CalendarCheck size={20} />
              </div>
              <div className="modal-header-text">
                <h3>Nova Consulta</h3>
                <p>Registro de atendimento clínico para <strong>{paciente.nome}</strong></p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowNovaConsultaModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {consultaError && (
              <div className="form-alert-banner alert-error" style={{ margin: '1rem 1.5rem 0' }}>
                <AlertCircle size={16} />
                <span>{consultaError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNovaConsulta}>
              <div className="modal-dialog-body">
                <div className="form-grid-layout">
                  {/* Data da Consulta (Preenchida com hoje, editável) */}
                  <div className="form-field-group">
                    <label className="field-label required" htmlFor="modal-data-consulta">
                      Data da Consulta
                    </label>
                    <div className="field-input-wrapper">
                      <Calendar size={16} className="input-prefix-icon" />
                      <input
                        id="modal-data-consulta"
                        type="date"
                        className="field-input with-icon"
                        value={novaConsultaData.data_consulta}
                        onChange={(e) => setNovaConsultaData({ ...novaConsultaData, data_consulta: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Peso Atual (Obrigatório) */}
                  <div className="form-field-group">
                    <label className="field-label required" htmlFor="modal-peso">
                      Peso Atual (kg)
                    </label>
                    <div className="field-input-wrapper suffix-wrapper">
                      <Weight size={16} className="input-prefix-icon" />
                      <input
                        id="modal-peso"
                        type="number"
                        step="0.1"
                        min="1"
                        max="500"
                        className="field-input with-icon with-suffix"
                        placeholder="Ex: 73.2"
                        value={novaConsultaData.peso}
                        onChange={(e) => setNovaConsultaData({ ...novaConsultaData, peso: e.target.value })}
                        required
                        autoFocus
                      />
                      <span className="input-suffix-tag">kg</span>
                    </div>
                  </div>

                  {/* Cintura (Opcional) */}
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="modal-cintura">
                      Cintura em cm (opcional)
                    </label>
                    <div className="field-input-wrapper suffix-wrapper">
                      <Ruler size={16} className="input-prefix-icon" />
                      <input
                        id="modal-cintura"
                        type="number"
                        step="0.5"
                        min="20"
                        max="250"
                        className="field-input with-icon with-suffix"
                        placeholder="Ex: 82"
                        value={novaConsultaData.cintura}
                        onChange={(e) => setNovaConsultaData({ ...novaConsultaData, cintura: e.target.value })}
                      />
                      <span className="input-suffix-tag">cm</span>
                    </div>
                  </div>

                  {/* Quadril (Opcional) */}
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="modal-quadril">
                      Quadril em cm (opcional)
                    </label>
                    <div className="field-input-wrapper suffix-wrapper">
                      <Ruler size={16} className="input-prefix-icon" />
                      <input
                        id="modal-quadril"
                        type="number"
                        step="0.5"
                        min="20"
                        max="250"
                        className="field-input with-icon with-suffix"
                        placeholder="Ex: 98"
                        value={novaConsultaData.quadril}
                        onChange={(e) => setNovaConsultaData({ ...novaConsultaData, quadril: e.target.value })}
                      />
                      <span className="input-suffix-tag">cm</span>
                    </div>
                  </div>

                  {/* % de Gordura (Opcional) */}
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="modal-gordura">
                      % de Gordura Corporal (opcional)
                    </label>
                    <div className="field-input-wrapper suffix-wrapper">
                      <Percent size={16} className="input-prefix-icon" />
                      <input
                        id="modal-gordura"
                        type="number"
                        step="0.1"
                        min="1"
                        max="80"
                        className="field-input with-icon with-suffix"
                        placeholder="Ex: 19.5"
                        value={novaConsultaData.percentual_gordura}
                        onChange={(e) => setNovaConsultaData({ ...novaConsultaData, percentual_gordura: e.target.value })}
                      />
                      <span className="input-suffix-tag">%</span>
                    </div>
                  </div>

                  {/* Próximo Retorno */}
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="modal-retorno">
                      Próximo Retorno (opcional)
                    </label>
                    <div className="field-input-wrapper">
                      <Calendar size={16} className="input-prefix-icon" />
                      <input
                        id="modal-retorno"
                        type="date"
                        className="field-input with-icon"
                        value={novaConsultaData.proximo_retorno}
                        onChange={(e) => setNovaConsultaData({ ...novaConsultaData, proximo_retorno: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="form-field-group col-span-2">
                    <label className="field-label" htmlFor="modal-obs">
                      Observações Clínicas / Condutas da Consulta
                    </label>
                    <div className="field-input-wrapper">
                      <textarea
                        id="modal-obs"
                        rows={3}
                        className="field-textarea"
                        placeholder="Descreva sintomas relatados, adesão ao plano, novas metas ou alterações..."
                        value={novaConsultaData.observacoes}
                        onChange={(e) => setNovaConsultaData({ ...novaConsultaData, observacoes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-dialog-footer">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setShowNovaConsultaModal(false)}
                  disabled={savingConsulta}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={savingConsulta}
                >
                  {savingConsulta ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Salvando consulta...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Salvar Consulta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: EXCLUSÃO DE CONSULTA
          ======================================================================= */}
      {consultaToDelete && (
        <div className="modal-backdrop fade-in" onClick={() => setConsultaToDelete(null)}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div className="modal-header-icon bg-red">
                <Trash2 size={20} />
              </div>
              <div className="modal-header-text">
                <h3>Remover Consulta</h3>
                <p>Tem certeza que deseja remover a consulta de <strong>{formatDate(consultaToDelete.data_consulta)}</strong> ({consultaToDelete.peso} kg)?</p>
              </div>
            </div>
            <div className="modal-dialog-footer">
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setConsultaToDelete(null)}
                disabled={deletingConsulta}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger-action"
                onClick={handleDeleteConsultaConfirm}
                disabled={deletingConsulta}
              >
                {deletingConsulta ? 'Removendo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: VISUALIZADOR DE PLANO ALIMENTAR ESTRUTURADO (PROMPT 6)
          ======================================================================= */}
      {selectedPlano && (() => {
        let conteudo = {};
        try {
          conteudo =
            typeof selectedPlano.conteudo === 'string'
              ? JSON.parse(selectedPlano.conteudo)
              : (selectedPlano.conteudo || {});
        } catch {
          conteudo = {};
        }

        const diasList = Array.isArray(conteudo.plano_semanal) ? conteudo.plano_semanal : [];
        const diaAtualData =
          diasList[visualizerDiaIndex] ||
          diasList.find((d) => d?.dia?.toLowerCase().includes(DIAS_SEMANA[visualizerDiaIndex]?.toLowerCase().slice(0, 3))) ||
          diasList[0] ||
          { dia: DIAS_SEMANA[visualizerDiaIndex] || 'Segunda-feira', refeicoes: {} };

        return (
          <div className="modal-backdrop fade-in" onClick={() => setSelectedPlano(null)}>
            <div className="modal-dialog-card modal-xl modal-plano-visualizer" onClick={(e) => e.stopPropagation()}>
              <div className="modal-dialog-header">
                <div className="modal-header-icon bg-amber">
                  <Utensils size={20} />
                </div>
                <div className="modal-header-text">
                  <h3>{conteudo.titulo || `Plano Alimentar de ${paciente.nome}`}</h3>
                  <p>Prescrito em {formatDate(selectedPlano.created_at)}</p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedPlano(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-dialog-body visualizer-body">
                {/* Orientações Gerais */}
                {conteudo.observacoes && (
                  <div className="visualizer-obs-callout">
                    <Info size={18} className="icon-blue" />
                    <div>
                      <strong>Orientações e Recomendações:</strong>
                      <p>{conteudo.observacoes}</p>
                    </div>
                  </div>
                )}

                {/* Barra de Acesso Rápido aos Dias */}
                <div className="vis-quick-jump-bar">
                  <span className="vis-quick-jump-label">
                    <Calendar size={14} /> Dias da Semana:
                  </span>
                  <div className="vis-quick-pills-list">
                    {DIAS_SEMANA.map((nomeDia, idx) => (
                      <button
                        key={nomeDia}
                        type="button"
                        className="vis-quick-pill"
                        onClick={() => {
                          const el = document.getElementById(`vis-dia-section-${idx}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >
                        <span>{nomeDia}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista Completa dos 7 Dias Estruturados em Sequência Vertical */}
                <div className="vis-dias-vertical-stack">
                  {DIAS_SEMANA.map((nomeDia, diaIdx) => {
                    const diaObj =
                      diasList[diaIdx] ||
                      diasList.find((d) => d?.dia?.toLowerCase().includes(nomeDia.toLowerCase().slice(0, 3))) ||
                      { dia: nomeDia, refeicoes: {} };

                    const totalCaloriasDiaVisualizer = calcularTotalCaloriasDia(diaObj?.refeicoes);

                    return (
                      <div
                        key={nomeDia + diaIdx}
                        id={`vis-dia-section-${diaIdx}`}
                        className="vis-dia-section fade-in"
                      >
                        {/* Cabeçalho do Dia */}
                        <div className="vis-dia-header-card">
                          <div className="vis-dia-header-left">
                            <div className="vis-dia-badge">
                              <Calendar size={16} />
                              <span>{nomeDia}</span>
                            </div>
                            {totalCaloriasDiaVisualizer > 0 && (
                              <span className="vis-dia-total-kcal-badge" title="Soma estimada das 5 refeições do dia">
                                <Flame size={13} />
                                <span>Total do Dia: ~{totalCaloriasDiaVisualizer.toLocaleString('pt-BR')} kcal</span>
                              </span>
                            )}
                            <span className="vis-dia-sub">5 refeições estruturadas</span>
                          </div>
                          <span className="vis-dia-tag">Dia {diaIdx + 1} de 7</span>
                        </div>

                        {/* Grade das 5 Refeições deste Dia */}
                        <div className="visualizer-meals-grid">
                          {REFEICOES_CONFIG.map((refConfig) => {
                            const Icon = refConfig.icon;
                            const opcoes = (diaObj.refeicoes?.[refConfig.key] || []).filter(
                              (o) => o && o.trim()
                            );
                            const mediaCaloriasVisualizer = calcularMediaCaloriasRefeicao(opcoes);

                            return (
                              <div key={refConfig.key} className="vis-meal-card">
                                <div className="vis-meal-header">
                                  <div className={`meal-icon-pill ${refConfig.badgeColor}`}>
                                    <Icon size={16} />
                                  </div>
                                  <div className="vis-meal-title-group">
                                    <div className="vis-meal-heading-row">
                                      <h5>{refConfig.label}</h5>
                                      {mediaCaloriasVisualizer > 0 && (
                                        <span className="vis-meal-total-kcal-badge" title="Total calórico estimado para esta refeição">
                                          <Flame size={11} />
                                          <span>Total Refeição: ~{mediaCaloriasVisualizer} kcal</span>
                                        </span>
                                      )}
                                    </div>
                                    <span className="vis-meal-hint">{refConfig.hint}</span>
                                  </div>
                                </div>

                                <ul className="vis-options-list">
                                  {opcoes.length > 0 ? (
                                    opcoes.map((opcao, opIdx) => {
                                      const kcalMatch = opcao.match(/\((~?\s*\d+\s*k?cal)\)/i) || opcao.match(/\[(~?\s*\d+\s*k?cal)\]/i);
                                      const textoPrincipal = kcalMatch ? opcao.replace(kcalMatch[0], '').trim() : opcao;
                                      const kcalValor = kcalMatch ? kcalMatch[1].trim() : null;

                                      return (
                                        <li key={opIdx} className="vis-option-item">
                                          <span className="vis-op-num">Opção {opIdx + 1}:</span>
                                          <div className="vis-op-text-wrapper">
                                            <span className="vis-op-main">{textoPrincipal}</span>
                                            {kcalValor && (
                                              <span className="vis-kcal-badge" title="Calorias estimadas da refeição">
                                                🔥 {kcalValor}
                                              </span>
                                            )}
                                          </div>
                                        </li>
                                      );
                                    })
                                  ) : (
                                    <li className="vis-option-empty">Nenhum item definido para esta refeição.</li>
                                  )}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-dialog-footer visualizer-footer">
                <div className="footer-left-actions">
                  <button
                    type="button"
                    className="btn-editor-utility"
                    onClick={() => handleCopyVisualizerText(selectedPlano)}
                  >
                    {copiedVisualizerText ? (
                      <>
                        <CheckCircle2 size={16} className="icon-emerald" />
                        <span className="text-emerald">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copiar para WhatsApp</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-editor-utility"
                    onClick={() => handleBaixarPdfPlano(selectedPlano)}
                    disabled={downloadingPdf}
                    title="Baixar Relatório Completo em PDF com Logo e Dados Clínicos"
                  >
                    {downloadingPdf ? (
                      <>
                        <div className="btn-spinner" />
                        <span>Gerando PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Imprimir / Baixar PDF</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="footer-right-actions">
                  <button
                    type="button"
                    className="btn-secondary-action"
                    onClick={() => setSelectedPlano(null)}
                  >
                    Fechar
                  </button>

                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={() => handleEditarPlano(selectedPlano)}
                  >
                    <Edit3 size={16} />
                    <span>Editar este Plano</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =======================================================================
          MODAL: EXCLUSÃO DE PLANO ALIMENTAR
          ======================================================================= */}
      {planoToDelete && (
        <div className="modal-backdrop fade-in" onClick={() => setPlanoToDelete(null)}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div className="modal-header-icon bg-red">
                <Trash2 size={20} />
              </div>
              <div className="modal-header-text">
                <h3>Excluir Plano Alimentar</h3>
                <p>Tem certeza que deseja remover este plano alimentar do histórico de <strong>{paciente.nome}</strong>?</p>
              </div>
            </div>
            <div className="modal-dialog-footer">
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setPlanoToDelete(null)}
                disabled={deletingPlano}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger-action"
                onClick={handleDeletePlanoConfirm}
                disabled={deletingPlano}
              >
                {deletingPlano ? 'Excluindo...' : 'Sim, Excluir Plano'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE PACIENTE
          ======================================================================= */}
      {showDeleteModal && (
        <div className="modal-backdrop fade-in" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div className="modal-header-icon bg-red">
                <Trash2 size={20} />
              </div>
              <div className="modal-header-text">
                <h3>Excluir Paciente</h3>
                <p>Esta ação é irreversível e excluirá todo o histórico clínico.</p>
              </div>
            </div>
            <div className="modal-dialog-body" style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
              Tem certeza que deseja excluir <strong>{paciente.nome}</strong>? Todas as consultas e planos alimentares associados serão permanentemente removidos.
            </div>
            <div className="modal-dialog-footer">
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
                onClick={handleDeletePaciente}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir Paciente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

