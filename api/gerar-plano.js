import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

/**
 * Serverless function para geração de plano alimentar semanal via Gemini AI
 * Suporta deploy na Vercel e execução via Vite Dev Server Middleware.
 */
export default async function handler(req, res) {
  // Configuração de CORS para requisições seguras
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }));
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Chave de API do Google Gemini (GOOGLE_API_KEY) não configurada no servidor.',
      })
    );
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const paciente = body?.paciente || {};
    const dadosFormatados = formatarDadosPaciente(paciente);

    const genAI = new GoogleGenerativeAI(apiKey);

    // Schema estruturado estrito para garantir formato 100% válido
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        plano_semanal: {
          type: SchemaType.ARRAY,
          description: 'Lista de planos diários para os 7 dias da semana (Segunda a Domingo)',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              dia: {
                type: SchemaType.STRING,
                description: 'Nome do dia da semana (ex: Segunda-feira, Terça-feira, etc.)',
              },
              refeicoes: {
                type: SchemaType.OBJECT,
                properties: {
                  cafe_da_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Lista com pelo menos 4 a 5 opções completas, variadas e reais para o café da manhã',
                  },
                  lanche_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Lista com pelo menos 4 a 5 opções completas, variadas e reais para o lanche da manhã',
                  },
                  almoco: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Lista com pelo menos 4 a 5 opções completas, variadas e reais para o almoço',
                  },
                  lanche_tarde: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Lista com pelo menos 4 a 5 opções completas, variadas e reais para o lanche da tarde',
                  },
                  jantar: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Lista com pelo menos 4 a 5 opções completas, variadas e reais para o jantar',
                  },
                },
                required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
              },
            },
            required: ['dia', 'refeicoes'],
          },
        },
      },
      required: ['plano_semanal'],
    };

    const promptText = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.
- REGRA OBRIGATÓRIA DE QUANTIDADE DE OPÇÕES: Para CADA uma das 5 refeições (Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde e Jantar) em CADA um dos 7 dias da semana, você DEVE gerar OBRIGATORIAMENTE entre 4 e 5 opções COMPLETAS, VARIADAS, REAIS E NUTRITIVAS de alimentos/refeições.
- NUNCA deixe menos de 4 opções e NUNCA responda com textos genéricos ou placeholders (como "Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"). Cada item deve ser uma opção alimentar real e prática para o paciente.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": [
          "2 ovos mexidos com tomate e orégano + 1 fatia de pão 100% integral + café preto sem açúcar",
          "Crepioca de 1 ovo com 1 colher de sopa de goma de tapioca recheada com queijo branco + chá sem açúcar",
          "1 pote de iogurte desnatado com 1 colher de sopa de sementes de chia e morangos picados",
          "Mingau de aveia feito com água ou leite desnatado, canela e rodelas de banana",
          "1 fatia de pão integral com pasta de ricota + 1 fatia de mamão com sementes de linhaça"
        ],
        "lanche_manha": [
          "1 maçã pequena com casca + 3 castanhas-do-pará",
          "1 fatia média de melão com sementes de abóbora tostadas",
          "1 pera média + 4 nozes",
          "1 copo de água de coco + 1 fatia de queijo branco",
          "1 cumbuca pequena de salada de frutas com aveia em flocos"
        ],
        "almoco": [
          "Peito de frango grelhado (120g) + 3 colheres de sopa de arroz integral + 1 concha de feijão carioca + salada de alface, tomate e pepino",
          "Filé de tilápia grelhada (130g) + purê de mandioquinha + brócolis ao vapor + salada verde",
          "Carne moída magra refogada com abobrinha e cenoura + 2 colheres de arroz integral + salada de rúcula",
          "Sobrecoxa de frango sem pele assada com ervas + 1 concha de feijão preto + couve refogada no alho",
          "Omelete de legumes com espinafre e tomate + 1 batata doce média assada + salada de folhas"
        ],
        "lanche_tarde": [
          "1 tapioca pequena com ovo mexido ou queijo magro + café sem açúcar",
          "1 fatia de pão integral com pasta de amendoim ou homus + chá verde",
          "Iogurte natural sem açúcar com 1 colher de farinha de aveia e morangos",
          "Mix de castanhas (3 castanhas de caju + 2 castanhas-do-pará) + 1 fruta da estação",
          "Vitamina de leite desnatado ou vegetal batido com mamão e sementes de chia"
        ],
        "jantar": [
          "Sopa nutritiva de legumes com frango desfiado e folhas verdes",
          "Filé de peixe assado com legumes grelhados (abobrinha, berinjela e tomate) + salada de alface",
          "Salada colorida completa com folhas, tomate, pepino, palmito e atum sólido em água",
          "Omelete de 2 ovos com espinafre e queijo branco + salada de folhas verdes com azeite",
          "Peito de frango em cubos grelhado com mix de legumes refogados no azeite"
        ]
      }
    }
  ]
}`;


    // Modelos suportados e disponíveis para a chave do Google Generative AI
    const modelsToTry = [
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3.6-flash',
      'gemini-pro-latest',
      'gemini-2.5-pro',
    ];

    let lastError = null;
    let planoJson = null;

    for (const modelName of modelsToTry) {
      // Até 2 tentativas por modelo com backoff
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: schema,
              temperature: 0.4,
            },
          });

          const result = await model.generateContent(promptText);
          const response = await result.response;
          let responseText = response.text();

          // Limpeza de possíveis blocos de código markdown caso o modelo retorne
          responseText = responseText.trim();
          if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
          } else if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```\s*/i, '').replace(/```$/i, '').trim();
          }

          planoJson = JSON.parse(responseText);

          // Validação da estrutura retornada
          if (planoJson && Array.isArray(planoJson.plano_semanal) && planoJson.plano_semanal.length > 0) {
            break; // Sucesso na geração
          }
        } catch (err) {
          console.warn(`[Tentativa ${attempt}] Modelo ${modelName} falhou:`, err.message);
          lastError = err;

          // Se for erro temporário de alta demanda (503/429), aguarda antes de tentar novamente
          if (attempt === 1 && (err.message?.includes('503') || err.message?.includes('429') || err.message?.includes('high demand'))) {
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            break; // Passa para o próximo modelo da lista
          }
        }
      }

      if (planoJson && Array.isArray(planoJson.plano_semanal) && planoJson.plano_semanal.length > 0) {
        break; // Sucesso com um dos modelos
      }
    }


    if (!planoJson || !Array.isArray(planoJson.plano_semanal)) {
      throw lastError || new Error('Não foi possível gerar a estrutura válida do plano semanal.');
    }

    // Garante que cada dia e refeição tenha arrays preenchidos
    const planoNormalizado = normalizarPlanoSemanal(planoJson);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        data: planoNormalizado,
      })
    );
  } catch (error) {
    console.error('Erro na função /api/gerar-plano:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno ao processar geração de plano com IA.',
      })
    );
  }
}

/**
 * Formata os dados do paciente em texto claro para a IA
 */
function formatarDadosPaciente(p) {
  const formatList = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0 || (arr.length === 1 && arr[0] === 'Nenhum')) {
      return 'Nenhum(a) relatado(a)';
    }
    return arr.join(', ');
  };

  const linhas = [
    `- Nome: ${p.nome || 'Paciente'}`,
    `- Sexo: ${p.sexo || 'Não informado'}`,
    `- Idade: ${p.idade ? `${p.idade} anos` : 'Não informada'}`,
    `- Peso Atual: ${p.peso || p.peso_inicial ? `${p.peso || p.peso_inicial} kg` : 'Não informado'}`,
    `- Altura: ${p.altura ? `${p.altura} cm` : 'Não informada'}`,
    `- IMC: ${p.imc ? `${p.imc} kg/m²` : 'Não calculado'}`,
    `- Objetivos Nutricionais: ${formatList(p.objetivos)}${p.objetivo_texto ? ` (${p.objetivo_texto})` : ''}`,
    `- Nível de Atividade Física: ${p.nivel_atividade || 'Não informado'}`,
    `- Prática de Atividade: ${p.atividade_fisica ? `Sim (${p.atividade_fisica_descricao || 'Regular'})` : 'Não pratica'}`,
    `- Patologias Clínicas: ${formatList(p.patologias)}`,
    `- Restrições Alimentares: ${formatList(p.restricoes_alimentares || p.restricoes)}`,
    `- Alergias e Intolerâncias: ${formatList(p.alergias)}`,
    `- Medicamentos em Uso: ${p.medicamentos || 'Nenhum'}`,
    `- Suplementos em Uso: ${p.suplementos || 'Nenhum'}`,
    `- Refeições por Dia: ${p.refeicoes_por_dia || 5}`,
    `- Horário de Acordar / Dormir: Acorda ${p.horario_acorda || '07:00'}, Dorme ${p.horario_dorme || '23:00'}`,
    `- Consumo de Água: ${p.litros_agua ? `${p.litros_agua} litros/dia` : 'Não informado'}`,
    `- Observações Adicionais: ${p.observacoes || 'Nenhuma'}`,
  ];

  if (p.historico_consultas && Array.isArray(p.historico_consultas) && p.historico_consultas.length > 0) {
    const ultimas = p.historico_consultas.slice(0, 3).map(
      (c) => `Data: ${c.data_consulta}, Peso: ${c.peso}kg${c.observacoes ? `, Obs: ${c.observacoes}` : ''}`
    );
    linhas.push(`- Histórico Recente de Consultas: ${ultimas.join(' | ')}`);
  }

  return linhas.join('\n');
}

/**
 * Normaliza o plano semanal garantindo todos os 7 dias e as 5 refeições com strings limpas
 */
function normalizarPlanoSemanal(json) {
  const diasPadrao = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
  ];

  const refeicoesPadrao = ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'];

  const mapaDias = new Map();
  if (Array.isArray(json.plano_semanal)) {
    for (const item of json.plano_semanal) {
      if (item && item.dia) {
        mapaDias.set(item.dia.toLowerCase().trim(), item.refeicoes || {});
      }
    }
  }

  const planoSemanalCompleto = diasPadrao.map((nomeDia) => {
    // Busca dia equivalente no mapa
    const diaEncontradoKey = Array.from(mapaDias.keys()).find((k) =>
      k.includes(nomeDia.toLowerCase().slice(0, 3))
    );
    const refeicoesRecebidas = diaEncontradoKey ? mapaDias.get(diaEncontradoKey) : {};

    const refeicoesNormalizadas = {};
    for (const ref of refeicoesPadrao) {
      let opcoes = refeicoesRecebidas[ref];
      if (!Array.isArray(opcoes)) {
        opcoes = [];
      }
      // Limpa strings vazias, nulas ou placeholders genéricos como "Opção 3", "Opção 4"
      opcoes = opcoes
        .map((o) => (typeof o === 'string' ? o.trim() : String(o)))
        .filter((o) => o && !/^opção\s*\d+$/i.test(o) && !/^opcao\s*\d+$/i.test(o));

      // Limita ao máximo de 5 opções
      if (opcoes.length > 5) {
        opcoes = opcoes.slice(0, 5);
      }

      // Se por algum motivo o modelo tiver retornado menos de 4, complementa com sugestões práticas e reais
      if (opcoes.length < 4) {
        const sugestoesPorRefeicao = {
          cafe_da_manha: [
            '2 ovos mexidos com orégano e 1 fatia de pão integral',
            'Crepioca de 1 ovo com queijo branco e chia',
            'Iogurte natural sem açúcar com frutas picadas e aveia',
            'Mingau de aveia com canela e rodelas de banana',
          ],
          lanche_manha: [
            '1 maçã média com 3 castanhas-do-pará',
            '1 fatia de melão ou mamão com sementes de chia',
            '1 pote de iogurte desnatado',
            '1 pera fresca com 4 nozes',
          ],
          almoco: [
            'Peito de frango grelhado + 3 colheres de arroz integral + feijão + salada verde',
            'Filé de peixe assado + purê de mandioquinha + legumes no vapor',
            'Carne moída magra refogada com abobrinha + arroz integral + salada colorida',
            'Omelete de forno com legumes + batata doce cozida + folhas verdes',
          ],
          lanche_tarde: [
            '1 tapioca pequena com ovo ou queijo branco + chá',
            'Vitamina de frutas com leite desnatado ou vegetal e chia',
            'Mix de castanhas e nozes + 1 fruta da estação',
            '1 fatia de pão integral com pasta de ricota e café',
          ],
          jantar: [
            'Sopa nutritiva de legumes com frango desfiado',
            'Filé de tilápia grelhada com salada de folhas e tomate',
            'Salada completa com atum sólido, palmito e azeite',
            'Omelete de claras e legumes refogados no azeite',
          ],
        };

        const fallbackList = sugestoesPorRefeicao[ref] || [];
        for (const sug of fallbackList) {
          if (opcoes.length >= 4) break;
          if (!opcoes.includes(sug)) {
            opcoes.push(sug);
          }
        }
      }

      refeicoesNormalizadas[ref] = opcoes;
    }

    return {
      dia: nomeDia,
      refeicoes: refeicoesNormalizadas,
    };
  });

  return {
    plano_semanal: planoSemanalCompleto,
  };
}

