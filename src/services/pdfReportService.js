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
 * - Página 1: Identificação do Paciente, Parâmetros Clínicos, Orientações Gerais e Resumo
 * - Páginas 2 a 8: Um dia da semana por página, com símbolo MSV e 5 refeições completas
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
  const diasList = Array.isArray(conteudo?.plano_semanal) && conteudo.plano_semanal.length > 0
    ? conteudo.plano_semanal
    : [];

  // Tenta carregar o logo principal e o ícone do urso MSV
  const logoBearBase64 = (await carregarImagemBase64('/logo-bear.png')) || (await carregarImagemBase64('/logo.png'));
  const logoFullBase64 = (await carregarImagemBase64('/logo.png')) || logoBearBase64;

  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const nomePaciente = paciente.nome || 'Paciente';

  // =========================================================================
  // PÁGINA 1: DADOS CLÍNICOS DO PACIENTE & ORIENTAÇÕES NUTRICIONAIS GERAIS
  // =========================================================================

  // 1. Header Principal Institucional da Página 1
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Faixa decorativa dourada/âmbar (#f59e0b)
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  if (logoFullBase64) {
    try {
      doc.addImage(logoFullBase64, 'PNG', margin, 4.5, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('MSV NUTRIÇÃO', margin + 24, 13.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(226, 232, 240);
      doc.text('Clínica de Nutrição e Acompanhamento Personalizado', margin + 24, 19);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('MSV NUTRIÇÃO', margin, 13.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(226, 232, 240);
      doc.text('Clínica de Nutrição e Acompanhamento Personalizado', margin, 19);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('MSV NUTRIÇÃO', margin, 13.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(226, 232, 240);
    doc.text('Clínica de Nutrição e Acompanhamento Personalizado', margin, 19);
  }

  // Data de Emissão no canto superior direito
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emissão: ${dataHoje}`, pageWidth - margin, 16.5, { align: 'right' });

  let currentY = 36;

  // 2. Título do Relatório
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  const tituloDoc = (conteudo.titulo || `PLANO ALIMENTAR PERSONALIZADO — ${nomePaciente}`).toUpperCase();
  doc.text(tituloDoc, margin, currentY);

  currentY += 5;

  // 3. Tabela de Identificação do Paciente & Parâmetros Clínicos
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
        {
          content: 'IDENTIFICAÇÃO DO PACIENTE & PARÂMETROS CLÍNICOS',
          colSpan: 4,
          styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        },
      ],
    ],
    body: [
      [
        { content: 'Paciente:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
        { content: nomePaciente, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
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
        { content: formatList(paciente.objetivos, 'Reeducação alimentar e saúde'), colSpan: 3, styles: { textColor: [16, 185, 129], fontStyle: 'bold' } },
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
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 4. Orientações Gerais e Recomendações da Nutricionista
  const obsTexto = conteudo.observacoes && conteudo.observacoes.trim()
    ? conteudo.observacoes.trim()
    : 'Mantenha a ingestão hídrica diária conforme a meta calculada. Mastigue bem os alimentos e respeite os intervalos entre as refeições. Em caso de dúvidas sobre substituições, consulte seu plano ou entre em contato com a clínica.';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [
      [
        {
          content: 'ORIENTAÇÕES GERAIS & RECOMENDAÇÕES DA NUTRICIONISTA',
          styles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        },
      ],
    ],
    body: [
      [
        {
          content: obsTexto,
          styles: {
            fillColor: [240, 249, 255],
            textColor: [3, 105, 161],
            fontSize: 8,
            fontStyle: 'normal',
            cellPadding: 3.5,
          },
        },
      ],
    ],
    styles: {
      lineColor: [186, 230, 253],
      lineWidth: 0.2,
    },
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 5. Box de Apresentação e Instruções do Plano Semanal
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [
      [
        {
          content: 'COMO UTILIZAR O SEU PLANO ALIMENTAR SEMANAL',
          styles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
        },
      ],
    ],
    body: [
      [
        {
          content:
            '• Cada dia da semana (Segunda a Domingo) está detalhado individualmente nas páginas seguintes deste relatório.\n\n' +
            '• Para cada uma das 5 refeições diárias (Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde e Jantar), você possui entre 4 e 5 opções completas, balanceadas e equivalentes em nutrientes.\n\n' +
            '• Você pode escolher qualquer uma das opções disponíveis para a respectiva refeição, garantindo variedade e flexibilidade na sua rotina alimentar sem comprometer seus resultados.\n\n' +
            '• Os valores calóricos listados entre parênteses (~XXX kcal) representam a estimativa média da opção para auxílio no seu equilíbrio energético diário.',
          styles: {
            fillColor: [254, 243, 199],
            textColor: [120, 53, 15],
            fontSize: 7.8,
            cellPadding: 3.5,
          },
        },
      ],
    ],
    styles: {
      lineColor: [253, 230, 138],
      lineWidth: 0.2,
    },
  });

  // =========================================================================
  // PÁGINAS 2 A N: UM DIA DA SEMANA POR PÁGINA (PAGINAÇÃO DEDICADA)
  // =========================================================================
  diasList.forEach((diaObj, diaIndex) => {
    // Nova página dedicada para cada dia da semana
    doc.addPage();

    const nomeDia = diaObj.dia || `Dia ${diaIndex + 1}`;
    const totalCaloriasDia = calcularTotalCaloriasDia(diaObj?.refeicoes);
    const totalCaloriasFormatado = totalCaloriasDia > 0 ? totalCaloriasDia.toLocaleString('pt-BR') : '—';

    // 1. Mini-Header Superior Institucional em cada página de dia
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, pageWidth, 14, 'F');

    doc.setFillColor(245, 158, 11); // Faixa dourada #f59e0b
    doc.rect(0, 14, pageWidth, 1, 'F');

    // Logo pequeno no topo da página
    if (logoBearBase64) {
      try {
        doc.addImage(logoBearBase64, 'PNG', margin, 2.5, 9, 9);
      } catch (e) {
        console.warn('Erro ao desenhar logo:', e);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text('MSV NUTRIÇÃO • PLANO ALIMENTAR PERSONALIZADO', margin + 12, 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Paciente: ${nomePaciente}`, pageWidth - margin, 9, { align: 'right' });

    // 2. Monta as Linhas das 5 Refeições do Dia
    const bodyRows = [];

    REFEICOES_CONFIG.forEach((ref) => {
      const opcoes = (diaObj.refeicoes?.[ref.key] || []).filter((o) => o && o.trim());
      const mediaRefeicao = calcularMediaCaloriasRefeicao(opcoes);

      const opcoesFormatadas = opcoes.length > 0
        ? opcoes.map((op, idx) => `• Opção ${idx + 1}: ${op}`).join('\n\n')
        : 'Opções a serem definidas com a nutricionista.';

      const labelRefeicao = `${ref.label.toUpperCase()}${mediaRefeicao > 0 ? `\n\n(~${mediaRefeicao} kcal)` : ''}`;

      bodyRows.push([
        {
          content: labelRefeicao,
          styles: {
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            fillColor: [248, 250, 252],
            textColor: [15, 23, 42],
            fontSize: 8,
          },
        },
        {
          content: opcoesFormatadas,
          styles: {
            fontSize: 7.8,
            textColor: [30, 41, 59],
            cellPadding: 3,
            valign: 'middle',
          },
        },
      ]);
    });

    // 3. Tabela do Dia com Header contendo Símbolo MSV Pequeno e Título Limpo (Sem Emojis)
    autoTable(doc, {
      startY: 19,
      margin: { left: margin, right: margin, top: 19, bottom: 15 },
      theme: 'grid',
      head: [
        [
          {
            // Espaços iniciais para acomodar o símbolo pequeno da MSV desenhado via didDrawCell
            content: `         ${nomeDia.toUpperCase()}   —   TOTAL ESTIMADO DO DIA: ~${totalCaloriasFormatado} KCAL`,
            colSpan: 2,
            styles: {
              fillColor: [245, 158, 11],
              textColor: [15, 23, 42],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'left',
              valign: 'middle',
              cellPadding: 3.5,
            },
          },
        ],
      ],
      body: bodyRows,
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 'auto' },
      },
      styles: {
        lineColor: [203, 213, 225],
        lineWidth: 0.25,
      },
      pageBreak: 'avoid',
      rowPageBreak: 'avoid',
      didDrawCell: (data) => {
        // Desenha o símbolo pequeno da MSV no canto esquerdo da barra de cabeçalho do dia
        if (data.section === 'head' && data.column.index === 0) {
          if (logoBearBase64) {
            try {
              const imgSize = 6; // mm
              const imgX = data.cell.x + 3;
              const imgY = data.cell.y + (data.cell.height - imgSize) / 2;
              doc.addImage(logoBearBase64, 'PNG', imgX, imgY, imgSize, imgSize);
            } catch (e) {
              console.warn('Erro ao inserir símbolo MSV no header da tabela:', e);
            }
          }
        }
      },
    });
  });

  // =========================================================================
  // NUMERAÇÃO DE PÁGINAS E RODAPÉ INSTITUCIONAL EM TODAS AS PÁGINAS
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
  const nomeSanitizado = (nomePaciente || 'Paciente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_');

  const fileName = `Plano_Alimentar_${nomeSanitizado}_${dataHoje.replace(/\//g, '-')}.pdf`;

  // Realiza o download automático
  doc.save(fileName);
  return true;
}
