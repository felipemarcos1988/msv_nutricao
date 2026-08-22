import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPacientesByNutri, getEvolucaoPaciente } from '../services/neonDb';
import {
  TrendingUp,
  TrendingDown,
  User,
  Users,
  Weight,
  Activity,
  Ruler,
  Calendar,
  Phone,
  Mail,
  ChevronDown,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

export function AnalistaView({ initialPacienteId = null }) {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState(initialPacienteId);
  const [evolucao, setEvolucao] = useState(null);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingEvolucao, setLoadingEvolucao] = useState(false);
  const [activeTabChart, setActiveTabChart] = useState('peso'); // 'peso' | 'imc' | 'medidas'

  // Carrega lista de pacientes do nutricionista
  useEffect(() => {
    async function loadPacientes() {
      if (!user?.id) return;
      try {
        setLoadingPacientes(true);
        const data = await getPacientesByNutri(user.id);
        setPacientes(data || []);
        if (data && data.length > 0 && !selectedPacienteId) {
          setSelectedPacienteId(data[0].id);
        }
      } catch (err) {
        console.error('Erro ao buscar pacientes:', err);
      } finally {
        setLoadingPacientes(false);
      }
    }
    loadPacientes();
  }, [user?.id]);

  // Carrega evolução do paciente selecionado
  useEffect(() => {
    async function loadEvolucao() {
      if (!selectedPacienteId) {
        setEvolucao(null);
        return;
      }
      try {
        setLoadingEvolucao(true);
        const data = await getEvolucaoPaciente(selectedPacienteId);
        setEvolucao(data);
      } catch (err) {
        console.error('Erro ao buscar evolução do paciente:', err);
      } finally {
        setLoadingEvolucao(false);
      }
    }
    loadEvolucao();
  }, [selectedPacienteId]);

  // Classificação do IMC pela OMS
  const getImcClassification = (imc) => {
    if (!imc || isNaN(imc)) return { text: 'N/A', color: 'gray', badgeClass: 'imc-gray' };
    const val = parseFloat(imc);
    if (val < 18.5) return { text: 'Abaixo do peso', color: '#60a5fa', badgeClass: 'imc-blue' };
    if (val < 25.0) return { text: 'Peso Normal', color: '#34d399', badgeClass: 'imc-emerald' };
    if (val < 30.0) return { text: 'Sobrepeso', color: '#fbbf24', badgeClass: 'imc-amber' };
    if (val < 35.0) return { text: 'Obesidade Grau I', color: '#f87171', badgeClass: 'imc-red' };
    if (val < 40.0) return { text: 'Obesidade Grau II', color: '#ef4444', badgeClass: 'imc-red' };
    return { text: 'Obesidade Grau III', color: '#dc2626', badgeClass: 'imc-red' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  // Prepara série histórica combinando peso inicial e consultas
  const timelineData = useMemo(() => {
    if (!evolucao) return [];
    const { paciente, historico, alturaMetros } = evolucao;
    const items = [];

    // Ponto zero: Cadastro inicial (se houver peso inicial e não houver consulta na mesma data)
    if (paciente?.peso_inicial && paciente?.created_at) {
      const pIni = parseFloat(paciente.peso_inicial);
      const imcIni = alturaMetros > 0 ? parseFloat((pIni / (alturaMetros * alturaMetros)).toFixed(1)) : null;
      items.push({
        isInitial: true,
        data_consulta: paciente.created_at,
        label: 'Início',
        pesoNum: pIni,
        imc: imcIni,
        cintura: null,
        quadril: null,
        percentual_gordura: null,
        observacoes: 'Cadastro inicial do paciente',
      });
    }

    // Consultas posteriores
    if (historico && historico.length > 0) {
      historico.forEach((c) => {
        items.push({
          isInitial: false,
          ...c,
          label: formatShortDate(c.data_consulta),
        });
      });
    }

    return items;
  }, [evolucao]);

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    if (!evolucao) {
      return {
        pesoAtual: 0,
        pesoInicial: 0,
        deltaPeso: 0,
        deltaPesoPct: 0,
        imcAtual: null,
        imcClass: { text: 'N/A', badgeClass: 'imc-gray' },
        ultGordura: null,
        ultCintura: null,
        ultQuadril: null,
      };
    }

    const { pesoInicial, pesoAtual, imcAtual, historico } = evolucao;
    const deltaPeso = pesoInicial > 0 ? parseFloat((pesoAtual - pesoInicial).toFixed(1)) : 0;
    const deltaPesoPct = pesoInicial > 0 ? parseFloat(((deltaPeso / pesoInicial) * 100).toFixed(1)) : 0;
    const imcClass = getImcClassification(imcAtual);

    const ultConsulta = historico && historico.length > 0 ? historico[historico.length - 1] : null;

    return {
      pesoAtual,
      pesoInicial,
      deltaPeso,
      deltaPesoPct,
      imcAtual,
      imcClass,
      ultGordura: ultConsulta?.percentual_gordura || null,
      ultCintura: ultConsulta?.cintura || null,
      ultQuadril: ultConsulta?.quadril || null,
    };
  }, [evolucao]);

  // Renderizador de Gráficos SVG Nativos e Responsivos
  const renderSvgChart = (metricKey, unit, colorHex, gradientId) => {
    const validPoints = timelineData.filter((d) => d[metricKey] !== null && !isNaN(d[metricKey]) && d[metricKey] > 0);

    if (validPoints.length < 2) {
      return (
        <div className="chart-empty-state">
          <Info size={24} className="info-icon" />
          <h4>Dados insuficientes para gerar a curva temporal</h4>
          <p>
            É necessário registrar ao menos <strong>2 consultas ou o peso inicial + 1 consulta</strong> para traçar o gráfico de evolução de {unit}.
          </p>
        </div>
      );
    }

    const width = 760;
    const height = 280;
    const padX = 60;
    const padTop = 30;
    const padBottom = 45;

    const values = validPoints.map((d) => parseFloat(d[metricKey]));
    const minVal = Math.floor(Math.min(...values) * 0.95);
    const maxVal = Math.ceil(Math.max(...values) * 1.05);
    const valRange = maxVal - minVal || 1;

    const chartW = width - padX * 2;
    const chartH = height - padTop - padBottom;

    // Converte dados em coordenadas SVG
    const points = validPoints.map((d, idx) => {
      const x = padX + (idx / (validPoints.length - 1)) * chartW;
      const y = padTop + chartH - ((parseFloat(d[metricKey]) - minVal) / valRange) * chartH;
      return { x, y, data: d, val: parseFloat(d[metricKey]) };
    });

    // Caminho da Linha (SVG Path)
    const linePath = points.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x},${pt.y}`;
      // Curva Bezier suave
      const prev = points[idx - 1];
      const cpX1 = prev.x + (pt.x - prev.x) / 2;
      const cpX2 = prev.x + (pt.x - prev.x) / 2;
      return `${acc} C ${cpX1},${prev.y} ${cpX2},${pt.y} ${pt.x},${pt.y}`;
    }, '');

    // Área sob a curva para preenchimento
    const firstPt = points[0];
    const lastPt = points[points.length - 1];
    const areaPath = `${linePath} L ${lastPt.x},${padTop + chartH} L ${firstPt.x},${padTop + chartH} Z`;

    // Linhas de Grade Horizontais (Grid lines)
    const gridCount = 4;
    const gridLines = [];
    for (let i = 0; i <= gridCount; i++) {
      const gVal = minVal + (i / gridCount) * valRange;
      const gY = padTop + chartH - (i / gridCount) * chartH;
      gridLines.push({ val: gVal.toFixed(1), y: gY });
    }

    return (
      <div className="chart-responsive-box">
        <svg viewBox={`0 0 ${width} ${height}`} className="svg-evolution-chart">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorHex} stopOpacity="0.38" />
              <stop offset="100%" stopColor={colorHex} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade */}
          {gridLines.map((g, idx) => (
            <g key={idx}>
              <line
                x1={padX}
                y1={g.y}
                x2={width - padX}
                y2={g.y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />
              <text
                x={padX - 10}
                y={g.y + 4}
                fill="#71717a"
                fontSize="11"
                textAnchor="end"
                fontFamily="inherit"
              >
                {g.val}
              </text>
            </g>
          ))}

          {/* Área Gradiente */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Linha Principal */}
          <path
            d={linePath}
            fill="none"
            stroke={colorHex}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Pontos de Dados */}
          {points.map((pt, idx) => (
            <g key={idx} className="chart-data-point-group">
              {/* Círculo com halo */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="6"
                fill="#121215"
                stroke={colorHex}
                strokeWidth="3"
              />
              {/* Valor numérico no ponto */}
              <text
                x={pt.x}
                y={pt.y - 12}
                fill="#ffffff"
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="inherit"
                className="point-val-label"
              >
                {pt.val} {unit}
              </text>
              {/* Data no eixo X */}
              <text
                x={pt.x}
                y={height - 12}
                fill="#a1a1aa"
                fontSize="11"
                textAnchor="middle"
                fontFamily="inherit"
              >
                {formatShortDate(pt.data.data_consulta)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="analista-view-container">
      {/* Cabeçalho da Página */}
      <div className="analista-header-hero">
        <div className="hero-greeting">
          <Sparkles size={16} className="sparkle-icon" />
          <span>Métricas & Evolução</span>
        </div>
        <h1 className="analista-title">Perfil Analista</h1>
        <p className="analista-subtitle">
          Análise gráfica e biométrica detalhada da evolução clínica dos seus pacientes.
        </p>
      </div>

      {/* Seletor de Paciente */}
      <div className="analista-selector-bar">
        <div className="selector-control-group">
          <label className="selector-label" htmlFor="paciente-select">
            <User size={16} /> Selecionar Paciente:
          </label>
          {loadingPacientes ? (
            <div className="selector-loading-box">Carregando lista de pacientes...</div>
          ) : pacientes.length === 0 ? (
            <div className="selector-empty-box">Nenhum paciente cadastrado no seu consultório.</div>
          ) : (
            <div className="select-wrapper">
              <select
                id="paciente-select"
                className="analista-patient-select"
                value={selectedPacienteId || ''}
                onChange={(e) => setSelectedPacienteId(e.target.value)}
              >
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.email ? `(${p.email})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="select-arrow-icon" />
            </div>
          )}
        </div>

        {evolucao?.paciente && (
          <div className="selected-patient-badge-row">
            <div className="patient-quick-chip">
              <Ruler size={14} />
              <span>Altura: <strong>{evolucao.alturaMetros > 0 ? `${evolucao.alturaMetros.toFixed(2)} m` : 'N/A'}</strong></span>
            </div>
            <div className="patient-quick-chip">
              <Weight size={14} />
              <span>Peso Inicial: <strong>{evolucao.pesoInicial ? `${evolucao.pesoInicial} kg` : 'N/A'}</strong></span>
            </div>
            <div className="patient-quick-chip">
              <Calendar size={14} />
              <span>Consultas: <strong>{evolucao.totalConsultas}</strong></span>
            </div>
          </div>
        )}
      </div>

      {loadingEvolucao ? (
        <div className="analista-loading-state">
          <div className="spinner" />
          <span>Calculando métricas e histórico biométrico no Neon PostgreSQL...</span>
        </div>
      ) : !evolucao?.paciente ? (
        <div className="analista-empty-patient-card">
          <Users size={36} />
          <h3>Nenhum paciente selecionado</h3>
          <p>Selecione um paciente no menu acima para carregar o histórico de evolução.</p>
        </div>
      ) : (
        <>
          {/* Grid de 4 Indicadores KPIs */}
          <div className="analista-kpis-grid">
            {/* KPI 1 — Peso Atual e Evolução */}
            <div className="analista-kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Peso Atual</span>
                <div className="kpi-icon-box bg-emerald">
                  <Weight size={20} />
                </div>
              </div>
              <div className="kpi-val-row">
                <span className="kpi-main-val">
                  {kpis.pesoAtual > 0 ? `${kpis.pesoAtual} kg` : 'N/A'}
                </span>
                {kpis.deltaPeso !== 0 && (
                  <span className={`kpi-trend-pill ${kpis.deltaPeso < 0 ? 'trend-down' : 'trend-up'}`}>
                    {kpis.deltaPeso < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    {kpis.deltaPeso > 0 ? `+${kpis.deltaPeso}` : kpis.deltaPeso} kg ({kpis.deltaPesoPct}%)
                  </span>
                )}
              </div>
              <p className="kpi-footer-note">
                {kpis.pesoInicial > 0 ? `Início: ${kpis.pesoInicial} kg` : 'Primeira pesagem'}
              </p>
            </div>

            {/* KPI 2 — IMC Atual e Classificação OMS */}
            <div className="analista-kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">IMC Atual (kg/m²)</span>
                <div className="kpi-icon-box bg-blue">
                  <Activity size={20} />
                </div>
              </div>
              <div className="kpi-val-row">
                <span className="kpi-main-val">{kpis.imcAtual || 'N/A'}</span>
                <span className={`imc-status-badge ${kpis.imcClass.badgeClass}`}>
                  {kpis.imcClass.text}
                </span>
              </div>
              <p className="kpi-footer-note">
                Referência OMS para adultos (18.5 a 24.9 Normal)
              </p>
            </div>

            {/* KPI 3 — % de Gordura Corporal */}
            <div className="analista-kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">% Gordura Corporal</span>
                <div className="kpi-icon-box bg-amber">
                  <Layers size={20} />
                </div>
              </div>
              <div className="kpi-val-row">
                <span className="kpi-main-val">
                  {kpis.ultGordura ? `${kpis.ultGordura}%` : 'Não medido'}
                </span>
              </div>
              <p className="kpi-footer-note">
                Última medição registrada em consulta
              </p>
            </div>

            {/* KPI 4 — Circunferências (Cintura / Quadril) */}
            <div className="analista-kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Medidas Corporais</span>
                <div className="kpi-icon-box bg-purple">
                  <Ruler size={20} />
                </div>
              </div>
              <div className="kpi-val-row">
                <span className="kpi-main-val">
                  {kpis.ultCintura ? `${kpis.ultCintura} cm` : '--'} / {kpis.ultQuadril ? `${kpis.ultQuadril} cm` : '--'}
                </span>
              </div>
              <p className="kpi-footer-note">Cintura / Quadril na última consulta</p>
            </div>
          </div>

          {/* Seção dos Gráficos de Evolução */}
          <div className="analista-charts-section">
            <div className="charts-card-wrapper">
              <div className="charts-card-header">
                <div>
                  <h3 className="charts-title">Curvas de Evolução Temporal</h3>
                  <p className="charts-subtitle">
                    Progressão clínica ao longo das consultas realizadas
                  </p>
                </div>

                {/* Abas de Gráficos */}
                <div className="chart-tabs-bar">
                  <button
                    type="button"
                    className={`chart-tab-btn ${activeTabChart === 'peso' ? 'active' : ''}`}
                    onClick={() => setActiveTabChart('peso')}
                  >
                    <Weight size={16} />
                    <span>Evolução de Peso</span>
                  </button>
                  <button
                    type="button"
                    className={`chart-tab-btn ${activeTabChart === 'imc' ? 'active' : ''}`}
                    onClick={() => setActiveTabChart('imc')}
                  >
                    <Activity size={16} />
                    <span>Evolução do IMC</span>
                  </button>
                  <button
                    type="button"
                    className={`chart-tab-btn ${activeTabChart === 'medidas' ? 'active' : ''}`}
                    onClick={() => setActiveTabChart('medidas')}
                  >
                    <Ruler size={16} />
                    <span>Circunferência / Gordura</span>
                  </button>
                </div>
              </div>

              {/* Área do Gráfico Ativo */}
              <div className="chart-render-body">
                {activeTabChart === 'peso' && (
                  <div className="chart-item-box">
                    <div className="chart-legend-row">
                      <span className="legend-dot bg-emerald" />
                      <strong>Peso Corporal (kg)</strong>
                      <span className="legend-hint">— Curva de pesagem por consulta</span>
                    </div>
                    {renderSvgChart('pesoNum', 'kg', '#34d399', 'gradWeight')}
                  </div>
                )}

                {activeTabChart === 'imc' && (
                  <div className="chart-item-box">
                    <div className="chart-legend-row">
                      <span className="legend-dot bg-blue" />
                      <strong>Índice de Massa Corporal (IMC)</strong>
                      <span className="legend-hint">— Faixa Ideal OMS: 18.5 a 24.9</span>
                    </div>
                    {renderSvgChart('imc', '', '#60a5fa', 'gradImc')}

                    {/* Tabela de Referência OMS */}
                    <div className="imc-reference-guide">
                      <div className="guide-item guide-blue">
                        <span>Abaixo do peso</span> &lt; 18.5
                      </div>
                      <div className="guide-item guide-green">
                        <span>Normal (Ideal)</span> 18.5 – 24.9
                      </div>
                      <div className="guide-item guide-amber">
                        <span>Sobrepeso</span> 25.0 – 29.9
                      </div>
                      <div className="guide-item guide-red">
                        <span>Obesidade</span> ≥ 30.0
                      </div>
                    </div>
                  </div>
                )}

                {activeTabChart === 'medidas' && (
                  <div className="chart-item-box">
                    <div className="chart-legend-row">
                      <span className="legend-dot bg-amber" />
                      <strong>Circunferência da Cintura (cm)</strong>
                      <span className="legend-hint">— Medidas registradas nas consultas</span>
                    </div>
                    {renderSvgChart('cintura', 'cm', '#fbbf24', 'gradCintura')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabela Histórica Detalhada */}
          <div className="analista-history-card">
            <div className="history-header">
              <div>
                <h3 className="charts-title">Histórico Completo de Consultas</h3>
                <p className="charts-subtitle">
                  Registro cronológico de todas as medições e anotações clínicas
                </p>
              </div>
              <span className="history-count-badge">
                {timelineData.length} {timelineData.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {timelineData.length === 0 ? (
              <div className="history-empty-box">
                <AlertCircle size={20} />
                <span>Nenhuma consulta registrada para este paciente ainda.</span>
              </div>
            ) : (
              <div className="history-table-wrapper">
                <table className="analista-history-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Peso</th>
                      <th>Variação</th>
                      <th>IMC</th>
                      <th>Classificação</th>
                      <th>Cintura</th>
                      <th>Quadril</th>
                      <th>% Gordura</th>
                      <th>Próximo Retorno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineData.map((row, idx) => {
                      const imcClass = getImcClassification(row.imc);
                      return (
                        <tr key={idx} className={row.isInitial ? 'initial-row' : ''}>
                          <td>
                            <strong>{formatDate(row.data_consulta)}</strong>
                            {row.isInitial && <span className="initial-tag">Cadastro</span>}
                          </td>
                          <td>
                            <span className="weight-cell">
                              {row.pesoNum ? `${row.pesoNum} kg` : '--'}
                            </span>
                          </td>
                          <td>
                            {row.deltaPesoInicial !== undefined && !row.isInitial ? (
                              <span className={`delta-cell ${row.deltaPesoInicial < 0 ? 'text-green' : row.deltaPesoInicial > 0 ? 'text-red' : ''}`}>
                                {row.deltaPesoInicial > 0 ? `+${row.deltaPesoInicial}` : row.deltaPesoInicial} kg
                              </span>
                            ) : (
                              <span className="text-muted">--</span>
                            )}
                          </td>
                          <td>
                            <strong>{row.imc || '--'}</strong>
                          </td>
                          <td>
                            {row.imc ? (
                              <span className={`imc-pill-mini ${imcClass.badgeClass}`}>
                                {imcClass.text}
                              </span>
                            ) : (
                              '--'
                            )}
                          </td>
                          <td>{row.cintura ? `${row.cintura} cm` : '--'}</td>
                          <td>{row.quadril ? `${row.quadril} cm` : '--'}</td>
                          <td>{row.percentual_gordura ? `${row.percentual_gordura}%` : '--'}</td>
                          <td>{formatDate(row.proximo_retorno) || '--'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
