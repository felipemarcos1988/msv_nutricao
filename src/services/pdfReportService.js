import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  REFEICOES_CONFIG,
  extrairCalorias,
  calcularMediaCaloriasRefeicao,
  calcularTotalCaloriasDia,
} from '../components/PlanoAlimentarEditor';

/**
 * Carrega uma imagem de URL relativa para Data URL Base64
 */
async function carregarImagemBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Formata listas para exibição textual limpa
 */
function formatList(arr, fallback = 'Nenhum(a)') {
  if (!arr || !Array.isArray(arr) || arr.length === 0 || (arr.length === 1 && arr[0] === 'Nenhum')) {
    return fallback;
  }
  return arr.join(', ');
}

/**
 * Gera e realiza o download do relatório completo do Plano Alimentar em PDF
 */
export async function gerarPlanoAlimentarPdf(plano, paciente = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Normaliza o conteúdo do plano alimentar
  const conteudo = typeof plano?.conteudo === 'string' ? JSON.parse(plano.conteudo) : (plano?.conteudo || plano || {});
  const diasList = Array.isArray(conteudo?.plano_semanal) ? conteudo.plano_semanal : [];

  // Tenta carregar o logo da MSV Nutrição
  const logoBase64 = (await carregarImagemBase64('/logo.png')) || (await carregarImagemBase64('/logo-bear.png'));

  // =========================================================================
  // 1. CABEÇALHO DO DOCUMENTO (HEADER INSTITUCIONAL)
  // =========================================================================
  doc.setFillColor(15, 23, 42); // Fundo azul escuro / grafite premium (#0f172a)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Faixa dourada/âmbar decorativa
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  let currentY = 8;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 5, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('MSV NUTRIÇÃO', margin + 24, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(226, 232, 240);
      doc.text('Clínica de Nutrição e Acompanhamento Personalizado', margin + 24, 19.5);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('MSV NUTRIÇÃO', margin, 14);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('MSV NUTRIÇÃO', margin, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(226, 232, 240);
    doc.text('Clínica de Nutrição e Acompanhamento Personalizado', margin, 19.5);
  }

  // Data de Emissão no canto direito
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emissão: ${dataHoje}`, pageWidth - margin, 17, { align: 'right' });

  currentY = 36;

  // =========================================================================
  // 2. TÍTULO DO RELATÓRIO
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(conteudo.titulo || `PLANO ALIMENTAR PERSONALIZADO — ${paciente.nome || 'PACIENTE'}`, margin, currentY);

  currentY += 5;

  // =========================================================================
  // 3. DADOS DO PACIENTE E INFORMAÇÕES CLÍNICAS (TABELA ESTRUTURADA)
  // =========================================================================
  const imcVal = paciente.imc || (paciente.peso_inicial && paciente.altura ? (paciente.peso_inicial / Math.pow(paciente.altura / 100, 2)).toFixed(1) : '—');
  const idadeVal = paciente.idade ? `${paciente.idade} anos` : '—';
  const pesoVal = paciente.peso || paciente.peso_inicial ? `${paciente.peso || paciente.peso_inicial} kg` : '—';
  const alturaVal = paciente.altura ? `${paciente.altura} cm` : '—';
  const aguaVal = paciente.litros_agua ? `${paciente.litros_agua} L/dia` : '—';
  const atividadeVal = paciente.nivel_atividade || (paciente.atividade_fisica ? 'Ativo' : 'Não informado');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [
      [
        { content: 'IDENTIFICAÇÃO DO PACIENTE & PARÂMETROS CLÍNICOS', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 } },
      ],
    ],
    body: [
      [
        { content: 'Paciente:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: paciente.nome || 'Não informado', styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
        { content: 'Idade / Sexo:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `${idadeVal} • ${paciente.sexo || 'Não informado'}` },
      ],
      [
        { content: 'Peso Atual:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: pesoVal },
        { content: 'Altura / IMC:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `${alturaVal} (IMC: ${imcVal} kg/m²)` },
      ],
      [
        { content: 'Objetivos:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: formatList(paciente.objetivos, 'Reeducação alimentar'), colSpan: 3, styles: { textColor: [16, 185, 129], fontStyle: 'bold' } },
      ],
      [
        { content: 'Restrições / Alergias:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        {
          content: `Restrições: ${formatList(paciente.restricoes_alimentares || paciente.restricoes, 'Nenhuma')} | Alergias: ${formatList(paciente.alergias, 'Nenhuma')}`,
          colSpan: 3,
          styles: { textColor: [180, 83, 9] },
        },
      ],
      [
        { content: 'Hidratação / Atividade:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: `Meta de Água: ${aguaVal} | Atividade Física: ${atividadeVal}`, colSpan: 3 },
      ],
    ],
    styles: {
      fontSize: 7.8,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
  });

  currentY = doc.lastAutoTable.finalY + 4;

  // =========================================================================
  // 4. ORIENTAÇÕES GERAIS E CONDUTAS DA NUTRICIONISTA (SE HOUVER)
  // =========================================================================
  if (conteudo.observacoes && conteudo.observacoes.trim()) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'plain',
      body: [
        [
          {
            content: `ORIENTAÇÕES & RECOMENDAÇÕES DA NUTRICIONISTA:\n${conteudo.observacoes}`,
            styles: {
              fillColor: [240, 249, 255],
              textColor: [3, 105, 161],
              fontSize: 7.8,
              fontStyle: 'normal',
              cellPadding: 3,
              lineColor: [186, 230, 253],
              lineWidth: 0.3,
            },
          },
        ],
      ],
    });
    currentY = doc.lastAutoTable.finalY + 4;
  }

  // =========================================================================
  // 5. PLANO ALIMENTAR SEMANAL (DIAS E SUAS 5 REFEIÇÕES COM CALORIAS)
  // =========================================================================
  diasList.forEach((diaObj, diaIndex) => {
    const nomeDia = diaObj.dia || `Dia ${diaIndex + 1}`;
    const totalCaloriasDia = calcularTotalCaloriasDia(diaObj?.refeicoes);

    // Linhas da tabela de refeições do dia
    const bodyRows = [];

    REFEICOES_CONFIG.forEach((ref) => {
      const opcoes = (diaObj.refeicoes?.[ref.key] || []).filter((o) => o && o.trim());
      const mediaRefeicao = calcularMediaCaloriasRefeicao(opcoes);

      const opcoesFormatadas = opcoes.length > 0
        ? opcoes.map((op, idx) => `• Opção ${idx + 1}: ${op}`).join('\n\n')
        : 'Opções não definidas.';

      bodyRows.push([
        {
          content: `${ref.label.toUpperCase()}\n${mediaRefeicao > 0 ? `(~${mediaRefeicao} kcal)` : ''}`,
          styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [248, 250, 252], textColor: [15, 23, 42], fontSize: 7.5 },
        },
        {
          content: opcoesFormatadas,
          styles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2.5 },
        },
      ]);
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [
        [
          {
            content: `🗓️  ${nomeDia.toUpperCase()}  —  TOTAL ESTIMADO DO DIA: ~${totalCaloriasDia > 0 ? totalCaloriasDia.toLocaleString('pt-BR') : '—'} KCAL`,
            colSpan: 2,
            styles: {
              fillColor: [245, 158, 11],
              textColor: [15, 23, 42],
              fontStyle: 'bold',
              fontSize: 8.5,
              halign: 'left',
              cellPadding: 2.5,
            },
          },
        ],
      ],
      body: bodyRows,
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 'auto' },
      },
      styles: {
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
      },
      pageBreak: 'auto',
    });

    currentY = doc.lastAutoTable.finalY + 4;
  });

  // =========================================================================
  // 6. NUMERAÇÃO DE PÁGINAS E RODAPÉ INSTITUCIONAL EM TODAS AS PÁGINAS
  // =========================================================================
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Linha divisória do rodapé
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    // Texto institucional
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('MSV Nutrição — Gestão Clínica & Acompanhamento Nutricional Personalizado', margin, pageHeight - 6.5);

    // Numeração de página
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  // Gera o nome do arquivo sanitizado para download
  const nomeSanitizado = (paciente.nome || 'Paciente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_');

  const fileName = `Plano_Alimentar_${nomeSanitizado}_${dataHoje.replace(/\//g, '-')}.pdf`;

  // Realiza o download automático
  doc.save(fileName);
  return true;
}
