import React, { useState } from 'react';
import {
  Calendar,
  Coffee,
  Apple,
  UtensilsCrossed,
  Cookie,
  Soup,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Printer,
  Sparkles,
  CheckCircle2,
  FileText,
  Clock,
  Info,
  ChevronRight,
  Edit3,
} from 'lucide-react';

export const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export const REFEICOES_CONFIG = [
  {
    key: 'cafe_da_manha',
    label: 'Café da Manhã',
    icon: Coffee,
    badgeColor: 'badge-amber',
    hint: 'Primeira refeição do dia',
  },
  {
    key: 'lanche_manha',
    label: 'Lanche da Manhã',
    icon: Apple,
    badgeColor: 'badge-emerald',
    hint: 'Opção leve entre café e almoço',
  },
  {
    key: 'almoco',
    label: 'Almoço',
    icon: UtensilsCrossed,
    badgeColor: 'badge-blue',
    hint: 'Refeição principal rica em proteínas e fibras',
  },
  {
    key: 'lanche_tarde',
    label: 'Lanche da Tarde',
    icon: Cookie,
    badgeColor: 'badge-cyan',
    hint: 'Energia para o período da tarde',
  },
  {
    key: 'jantar',
    label: 'Jantar',
    icon: Soup,
    badgeColor: 'badge-purple',
    hint: 'Refeição noturna nutritiva e leve',
  },
];

/**
 * Cria a estrutura inicial padrão vazia para um plano de 7 dias com 5 refeições × 5 opções
 */
export function criarPlanoVazio(nomePaciente = '') {
  return {
    titulo: `Plano Alimentar Personalizado — ${nomePaciente || 'Paciente'}`,
    observacoes: '',
    plano_semanal: DIAS_SEMANA.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['', '', '', '', ''],
        lanche_manha: ['', '', '', '', ''],
        almoco: ['', '', '', '', ''],
        lanche_tarde: ['', '', '', '', ''],
        jantar: ['', '', '', '', ''],
      },
    })),
  };
}

export function PlanoAlimentarEditor({
  paciente,
  planoInicial,
  onSave,
  onCancel,
  saving = false,
}) {
  const [plano, setPlano] = useState(() => {
    if (planoInicial) {
      // Normaliza dados recebidos
      const base = typeof planoInicial === 'string' ? JSON.parse(planoInicial) : planoInicial;
      return {
        titulo: base.titulo || `Plano Alimentar Semanal — ${paciente?.nome || 'Paciente'}`,
        observacoes: base.observacoes || '',
        plano_semanal: Array.isArray(base.plano_semanal)
          ? base.plano_semanal
          : criarPlanoVazio(paciente?.nome).plano_semanal,
      };
    }
    return criarPlanoVazio(paciente?.nome);
  });

  const [activeDiaIndex, setActiveDiaIndex] = useState(0);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const activeDiaData =
    plano.plano_semanal[activeDiaIndex] || plano.plano_semanal[0] || { dia: 'Segunda-feira', refeicoes: {} };

  // Atualiza campo de uma opção específica de refeição
  const handleUpdateOption = (refeicaoKey, optionIndex, newValue) => {
    setPlano((prev) => {
      const novosDias = [...prev.plano_semanal];
      const diaObj = { ...novosDias[activeDiaIndex] };
      const novasRefeicoes = { ...diaObj.refeicoes };
      const opcoesAtuais = Array.isArray(novasRefeicoes[refeicaoKey])
        ? [...novasRefeicoes[refeicaoKey]]
        : ['', '', '', '', ''];

      opcoesAtuais[optionIndex] = newValue;
      novasRefeicoes[refeicaoKey] = opcoesAtuais;
      diaObj.refeicoes = novasRefeicoes;
      novosDias[activeDiaIndex] = diaObj;

      return {
        ...prev,
        plano_semanal: novosDias,
      };
    });
  };

  // Adiciona mais uma opção em uma refeição
  const handleAddOption = (refeicaoKey) => {
    setPlano((prev) => {
      const novosDias = [...prev.plano_semanal];
      const diaObj = { ...novosDias[activeDiaIndex] };
      const novasRefeicoes = { ...diaObj.refeicoes };
      const opcoesAtuais = Array.isArray(novasRefeicoes[refeicaoKey])
        ? [...novasRefeicoes[refeicaoKey]]
        : [];

      opcoesAtuais.push('');
      novasRefeicoes[refeicaoKey] = opcoesAtuais;
      diaObj.refeicoes = novasRefeicoes;
      novosDias[activeDiaIndex] = diaObj;

      return {
        ...prev,
        plano_semanal: novosDias,
      };
    });
  };

  // Remove uma opção específica de refeição
  const handleRemoveOption = (refeicaoKey, optionIndex) => {
    setPlano((prev) => {
      const novosDias = [...prev.plano_semanal];
      const diaObj = { ...novosDias[activeDiaIndex] };
      const novasRefeicoes = { ...diaObj.refeicoes };
      const opcoesAtuais = Array.isArray(novasRefeicoes[refeicaoKey])
        ? [...novasRefeicoes[refeicaoKey]]
        : [];

      if (opcoesAtuais.length <= 1) {
        opcoesAtuais[0] = '';
      } else {
        opcoesAtuais.splice(optionIndex, 1);
      }

      novasRefeicoes[refeicaoKey] = opcoesAtuais;
      diaObj.refeicoes = novasRefeicoes;
      novosDias[activeDiaIndex] = diaObj;

      return {
        ...prev,
        plano_semanal: novosDias,
      };
    });
  };

  // Copia o cardápio do dia atual para todos os outros dias
  const handleCopyDayToAll = () => {
    const confirmCopy = window.confirm(
      `Deseja replicar as refeições de "${activeDiaData.dia}" para todos os outros 6 dias da semana?`
    );
    if (!confirmCopy) return;

    setPlano((prev) => {
      const cardapioFonte = JSON.parse(JSON.stringify(activeDiaData.refeicoes));
      const novosDias = prev.plano_semanal.map((d) => ({
        ...d,
        refeicoes: JSON.parse(JSON.stringify(cardapioFonte)),
      }));

      return {
        ...prev,
        plano_semanal: novosDias,
      };
    });
  };

  // Copiar cardápio formatado em texto para WhatsApp / Clipboard
  const handleCopyAsText = () => {
    let texto = `📋 *PLANO ALIMENTAR SEMANAL*\n👤 *Paciente:* ${paciente?.nome || 'Paciente'}\n`;
    if (plano.observacoes) {
      texto += `📝 *Orientações:* ${plano.observacoes}\n`;
    }
    texto += `\n${'='.repeat(35)}\n\n`;

    plano.plano_semanal.forEach((diaObj) => {
      texto += `🗓️ *${diaObj.dia.toUpperCase()}*\n`;
      REFEICOES_CONFIG.forEach((ref) => {
        const opcoes = (diaObj.refeicoes[ref.key] || []).filter((o) => o && o.trim());
        if (opcoes.length > 0) {
          texto += `  🔸 *${ref.label}:*\n`;
          opcoes.forEach((op, idx) => {
            texto += `     ${idx + 1}. ${op}\n`;
          });
        }
      });
      texto += `\n`;
    });

    navigator.clipboard.writeText(texto).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    });
  };

  // Imprimir ou gerar PDF
  const handlePrint = () => {
    window.print();
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(plano);
    }
  };

  return (
    <div className="plano-editor-container fade-in">
      {/* Barra de Título e Ações Rápidas */}
      <div className="plano-editor-topbar">
        <div className="plano-editor-title-wrap">
          <div className="plano-badge-ia">
            <Sparkles size={16} />
            <span>Plano Alimentar Semanal</span>
          </div>
          <input
            type="text"
            className="plano-title-input"
            value={plano.titulo}
            onChange={(e) => setPlano({ ...plano, titulo: e.target.value })}
            placeholder="Título do plano alimentar..."
          />
        </div>

        <div className="plano-topbar-actions">
          <button
            type="button"
            className="btn-editor-utility"
            onClick={handleCopyAsText}
            title="Copiar texto formatado para WhatsApp"
          >
            {copiedNotification ? (
              <>
                <CheckCircle2 size={16} className="icon-emerald" />
                <span className="text-emerald">Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copiar Cardápio</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-editor-utility"
            onClick={handlePrint}
            title="Imprimir ou Salvar em PDF"
          >
            <Printer size={16} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Resumo do Perfil Clínico para Consulta Rápida da Nutricionista */}
      {paciente && (
        <div className="paciente-quick-context-bar">
          <div className="context-item">
            <span className="context-label">Paciente:</span>
            <strong>{paciente.nome}</strong>
          </div>
          {paciente.objetivos && paciente.objetivos.length > 0 && (
            <div className="context-item">
              <span className="context-label">Objetivos:</span>
              <span className="context-tags">{paciente.objetivos.join(', ')}</span>
            </div>
          )}
          {paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 && (
            <div className="context-item">
              <span className="context-label">Restrições:</span>
              <span className="context-tags tag-amber">{paciente.restricoes_alimentares.join(', ')}</span>
            </div>
          )}
          {paciente.alergias && paciente.alergias.length > 0 && (
            <div className="context-item">
              <span className="context-label">Alergias:</span>
              <span className="context-tags tag-red">{paciente.alergias.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Navegação por Abas dos 7 Dias da Semana */}
      <div className="plano-days-nav-wrapper">
        <div className="plano-days-nav">
          {DIAS_SEMANA.map((nomeDia, idx) => {
            const isActive = activeDiaIndex === idx;
            // Contagem de opções preenchidas no dia
            const diaObj = plano.plano_semanal[idx];
            let totalOpcoesPreenchidas = 0;
            if (diaObj && diaObj.refeicoes) {
              Object.values(diaObj.refeicoes).forEach((arr) => {
                if (Array.isArray(arr)) {
                  totalOpcoesPreenchidas += arr.filter((o) => o && o.trim()).length;
                }
              });
            }

            return (
              <button
                key={nomeDia}
                type="button"
                className={`plano-day-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveDiaIndex(idx)}
              >
                <div className="day-tab-icon">
                  <Calendar size={15} />
                </div>
                <div className="day-tab-text">
                  <span className="day-name-label">{nomeDia}</span>
                  <span className="day-options-count">{totalOpcoesPreenchidas} opções</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel do Dia Ativo */}
      <div className="plano-active-day-panel">
        <div className="active-day-header-row">
          <div className="active-day-title">
            <h3>{activeDiaData.dia}</h3>
            <p>5 refeições estruturadas com 4 a 5 opções completas de alimentos por refeição</p>
          </div>

          <button
            type="button"
            className="btn-replicate-day"
            onClick={handleCopyDayToAll}
            title="Replicar este cardápio para todos os outros dias da semana"
          >
            <Copy size={14} />
            <span>Replicar {activeDiaData.dia} para Todos os Dias</span>
          </button>
        </div>

        {/* Grade das 5 Refeições */}
        <div className="meals-grid-container">
          {REFEICOES_CONFIG.map((refConfig) => {
            const Icon = refConfig.icon;
            const opcoes = Array.isArray(activeDiaData.refeicoes[refConfig.key])
              ? activeDiaData.refeicoes[refConfig.key]
              : ['', '', '', '', ''];

            return (
              <div key={refConfig.key} className="meal-card-block fade-in">
                {/* Cabeçalho da Refeição */}
                <div className="meal-card-header">
                  <div className="meal-title-group">
                    <div className={`meal-icon-pill ${refConfig.badgeColor}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="meal-heading">{refConfig.label}</h4>
                      <span className="meal-sub-hint">{refConfig.hint}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-add-meal-option"
                    onClick={() => handleAddOption(refConfig.key)}
                    title="Adicionar outra opção a esta refeição"
                  >
                    <Plus size={14} />
                    <span>Opção</span>
                  </button>
                </div>

                {/* Lista de Inputs das Opções */}
                <div className="meal-options-inputs-list">
                  {opcoes.map((opcaoTexto, opIdx) => (
                    <div key={opIdx} className="meal-option-row">
                      <span className="option-badge-number">Opção {opIdx + 1}</span>
                      <input
                        type="text"
                        className="field-input meal-input-field"
                        value={opcaoTexto}
                        onChange={(e) => handleUpdateOption(refConfig.key, opIdx, e.target.value)}
                        placeholder={`Descreva o item da opção ${opIdx + 1} (ex: 2 fatias de pão integral + 2 ovos mexidos + 1 xícara de café)`}
                      />
                      {opcoes.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-option"
                          onClick={() => handleRemoveOption(refConfig.key, opIdx)}
                          title="Remover esta opção"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campo de Orientações Nutricionais Gerais */}
      <div className="plano-general-obs-card">
        <label className="field-label" htmlFor="plano-obs-geral">
          <Info size={16} className="icon-blue" />
          <span>Orientações Nutricionais e Recomendações Gerais</span>
        </label>
        <textarea
          id="plano-obs-geral"
          rows={3}
          className="field-textarea"
          value={plano.observacoes}
          onChange={(e) => setPlano({ ...plano, observacoes: e.target.value })}
          placeholder="Orientações sobre hidratação, substituições inteligentes, mastigação, horários de ingestão de suplementos e dicas práticas para o paciente..."
        />
      </div>

      {/* Rodapé Fixo de Ações de Salvamento */}
      <div className="plano-editor-footer">
        <button
          type="button"
          className="btn-secondary-action"
          onClick={onCancel}
          disabled={saving}
        >
          <RotateCcw size={16} />
          <span>Voltar ao Histórico</span>
        </button>

        <button
          type="button"
          className="btn-primary-action btn-save-plano"
          onClick={handleFormSubmit}
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="btn-spinner" />
              <span>Salvando Plano no Neon...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Salvar Plano Alimentar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
