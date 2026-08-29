import { neon } from '@neondatabase/serverless';

const DATABASE_URL =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_d8cJlDu0MEtK@ep-curly-king-acas4rmr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

/**
 * Obtém o perfil completo do usuário pelo e-mail (retorna se é Nutricionista ou Paciente)
 */
export async function fetchUserProfile(email) {
  if (!email) return null;
  try {
    const result = await sql`SELECT public.get_user_profile(${email.toLowerCase().trim()}) AS profile`;
    if (result && result.length > 0 && result[0].profile) {
      return result[0].profile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Neon:', error);
    return null;
  }
}

/**
 * Registra ou atualiza o papel do usuário no Neon (Nutricionista ou Paciente)
 */
export async function syncUserRole(email, role) {
  if (!email || !role) return false;
  try {
    await sql`SELECT public.set_user_role(${email.toLowerCase().trim()}, ${role.toLowerCase().trim()})`;
    return true;
  } catch (error) {
    console.error('Error setting user role in Neon:', error);
    return false;
  }
}

/**
 * Obtém os pacientes vinculados a um nutricionista com a data da última consulta e objetivos
 */
export async function getPacientesByNutri(nutricionistaId) {
  if (!nutricionistaId) return [];
  try {
    const rows = await sql`
      SELECT 
        p.*,
        MAX(c.data_consulta) AS ultima_data_consulta
      FROM public.pacientes p
      LEFT JOIN public.consultas c ON p.id = c.paciente_id
      WHERE p.nutricionista_id = ${nutricionistaId}
         OR p.nutricionista_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM public.pacientes WHERE nutricionista_id = ${nutricionistaId})
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching pacientes:', error);
    return [];
  }
}

/**
 * Cria um novo paciente vinculado à nutricionista logada
 */
export async function createPaciente(data) {
  if (!data.nome || !data.nutricionista_id) {
    throw new Error('Nome e Nutricionista são obrigatórios.');
  }

  const {
    nutricionista_id,
    nome,
    data_nascimento = null,
    sexo = null,
    telefone = null,
    whatsapp = null,
    email = null,
    peso_inicial = null,
    altura = null,
    objetivos = [],
    objetivo_texto = null,
    nivel_atividade = null,
    patologias = [],
    restricoes_alimentares = [],
    alergias = [],
    medicamentos = null,
    suplementos = null,
    refeicoes_por_dia = null,
    horario_acorda = null,
    horario_dorme = null,
    litros_agua = null,
    atividade_fisica = false,
    atividade_fisica_descricao = null,
    observacoes = null,
  } = data;

  try {
    const rows = await sql`
      INSERT INTO public.pacientes (
        nutricionista_id,
        nome,
        data_nascimento,
        sexo,
        telefone,
        whatsapp,
        email,
        peso_inicial,
        altura,
        objetivos,
        objetivo_texto,
        nivel_atividade,
        patologias,
        restricoes_alimentares,
        alergias,
        medicamentos,
        suplementos,
        refeicoes_por_dia,
        horario_acorda,
        horario_dorme,
        litros_agua,
        atividade_fisica,
        atividade_fisica_descricao,
        observacoes
      ) VALUES (
        ${nutricionista_id},
        ${nome.trim()},
        ${data_nascimento || null},
        ${sexo || null},
        ${telefone || null},
        ${whatsapp || null},
        ${email || null},
        ${peso_inicial ? Number(peso_inicial) : null},
        ${altura ? Number(altura) : null},
        ${objetivos && objetivos.length > 0 ? objetivos : null},
        ${objetivo_texto || null},
        ${nivel_atividade || null},
        ${patologias && patologias.length > 0 ? patologias : null},
        ${restricoes_alimentares && restricoes_alimentares.length > 0 ? restricoes_alimentares : null},
        ${alergias && alergias.length > 0 ? alergias : null},
        ${medicamentos || null},
        ${suplementos || null},
        ${refeicoes_por_dia ? parseInt(refeicoes_por_dia, 10) : null},
        ${horario_acorda || null},
        ${horario_dorme || null},
        ${litros_agua ? Number(litros_agua) : null},
        ${Boolean(atividade_fisica)},
        ${atividade_fisica_descricao || null},
        ${observacoes || null}
      )
      RETURNING *
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Error creating paciente:', error);
    throw error;
  }
}

/**
 * Atualiza todos os dados cadastrais do paciente (CRUD)
 */
export async function updatePacienteCompleto(pacienteId, data) {
  if (!pacienteId) throw new Error('ID do paciente é obrigatório.');

  const {
    nome,
    data_nascimento = null,
    sexo = null,
    telefone = null,
    whatsapp = null,
    email = null,
    peso_inicial = null,
    altura = null,
    objetivos = [],
    objetivo_texto = null,
    nivel_atividade = null,
    patologias = [],
    restricoes_alimentares = [],
    alergias = [],
    medicamentos = null,
    suplementos = null,
    refeicoes_por_dia = null,
    horario_acorda = null,
    horario_dorme = null,
    litros_agua = null,
    atividade_fisica = false,
    atividade_fisica_descricao = null,
    observacoes = null,
  } = data;

  try {
    const rows = await sql`
      UPDATE public.pacientes
      SET
        nome = ${nome ? nome.trim() : sql`nome`},
        data_nascimento = ${data_nascimento || null},
        sexo = ${sexo || null},
        telefone = ${telefone || null},
        whatsapp = ${whatsapp || null},
        email = ${email || null},
        peso_inicial = ${peso_inicial ? Number(peso_inicial) : null},
        altura = ${altura ? Number(altura) : null},
        objetivos = ${objetivos && objetivos.length > 0 ? objetivos : null},
        objetivo_texto = ${objetivo_texto || null},
        nivel_atividade = ${nivel_atividade || null},
        patologias = ${patologias && patologias.length > 0 ? patologias : null},
        restricoes_alimentares = ${restricoes_alimentares && restricoes_alimentares.length > 0 ? restricoes_alimentares : null},
        alergias = ${alergias && alergias.length > 0 ? alergias : null},
        medicamentos = ${medicamentos || null},
        suplementos = ${suplementos || null},
        refeicoes_por_dia = ${refeicoes_por_dia ? parseInt(refeicoes_por_dia, 10) : null},
        horario_acorda = ${horario_acorda || null},
        horario_dorme = ${horario_dorme || null},
        litros_agua = ${litros_agua ? Number(litros_agua) : null},
        atividade_fisica = ${Boolean(atividade_fisica)},
        atividade_fisica_descricao = ${atividade_fisica_descricao || null},
        observacoes = ${observacoes || null}
      WHERE id = ${pacienteId}
      RETURNING *
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Error updating paciente completo:', error);
    throw error;
  }
}

/**
 * Exclui um paciente do banco de dados (cascateia para consultas e planos)
 */
export async function deletePaciente(pacienteId) {
  if (!pacienteId) return false;
  try {
    await sql`DELETE FROM public.pacientes WHERE id = ${pacienteId}`;
    return true;
  } catch (error) {
    console.error('Error deleting paciente:', error);
    throw error;
  }
}

/**
 * Obtém as métricas em tempo real para o Dashboard do Nutricionista
 */
export async function getDashboardMetrics(nutricionistaId) {
  if (!nutricionistaId) {
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }

  try {
    // 1. Total de pacientes ativos
    const totalPacientesRes = await sql`
      SELECT COUNT(*)::int AS total
      FROM public.pacientes p
      WHERE p.nutricionista_id = ${nutricionistaId}
         OR p.nutricionista_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM public.pacientes WHERE nutricionista_id = ${nutricionistaId})
    `;
    const totalPacientes = totalPacientesRes[0]?.total || 0;

    // 2. Consultas da semana atual (segunda-feira a domingo)
    const consultasSemanaRes = await sql`
      SELECT COUNT(*)::int AS total
      FROM public.consultas c
      JOIN public.pacientes p ON c.paciente_id = p.id
      WHERE (p.nutricionista_id = ${nutricionistaId}
         OR p.nutricionista_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM public.pacientes WHERE nutricionista_id = ${nutricionistaId}))
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
        AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date
    `;
    const consultasSemana = consultasSemanaRes[0]?.total || 0;

    // 3. Pacientes sem retorno:
    // cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado
    const semRetornoRes = await sql`
      WITH ultimas_consultas AS (
        SELECT 
          paciente_id,
          MAX(data_consulta) AS ultima_data_consulta,
          MAX(proximo_retorno) AS ultimo_proximo_retorno
        FROM public.consultas
        GROUP BY paciente_id
      )
      SELECT 
        p.id,
        p.nome,
        p.email,
        p.whatsapp,
        p.objetivo_texto,
        p.peso_inicial,
        p.altura,
        uc.ultima_data_consulta,
        uc.ultimo_proximo_retorno,
        (CURRENT_DATE - uc.ultima_data_consulta)::int AS dias_sem_consulta
      FROM public.pacientes p
      JOIN ultimas_consultas uc ON p.id = uc.paciente_id
      WHERE (p.nutricionista_id = ${nutricionistaId}
         OR p.nutricionista_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM public.pacientes WHERE nutricionista_id = ${nutricionistaId}))
        AND uc.ultima_data_consulta < (CURRENT_DATE - INTERVAL '30 days')::date
        AND (uc.ultimo_proximo_retorno IS NULL OR uc.ultimo_proximo_retorno < CURRENT_DATE)
      ORDER BY uc.ultima_data_consulta ASC
    `;

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno: semRetornoRes || [],
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics from Neon:', error);
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }
}


/**
 * Obtém os dados completos de um paciente específico
 */
export async function getPacienteById(pacienteId) {
  if (!pacienteId) return null;
  try {
    const rows = await sql`
      SELECT *
      FROM public.pacientes
      WHERE id = ${pacienteId}
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching paciente by id:', error);
    return null;
  }
}

/**
 * Obtém o histórico de consultas de um paciente
 */
export async function getConsultasByPaciente(pacienteId) {
  if (!pacienteId) return [];
  try {
    const rows = await sql`
      SELECT id, paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno, created_at
      FROM public.consultas
      WHERE paciente_id = ${pacienteId}
      ORDER BY data_consulta DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching consultas:', error);
    return [];
  }
}

/**
 * Atualiza dados do perfil do paciente
 */
export async function updatePacienteProfile(pacienteId, data) {
  if (!pacienteId) return null;
  try {
    const rows = await sql`
      UPDATE public.pacientes
      SET 
        whatsapp = COALESCE(${data.whatsapp || null}, whatsapp),
        peso_inicial = COALESCE(${data.peso || null}, peso_inicial),
        altura = COALESCE(${data.altura || null}, altura),
        litros_agua = COALESCE(${data.litros_agua || null}, litros_agua)
      WHERE id = ${pacienteId}
      RETURNING *
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Error updating paciente profile:', error);
    return null;
  }
}

/**
 * Obtém os dados completos de evolução clínica e biométrica de um paciente
 */
export async function getEvolucaoPaciente(pacienteId) {
  if (!pacienteId) return null;
  try {
    const paciente = await getPacienteById(pacienteId);
    if (!paciente) return null;

    const consultas = await sql`
      SELECT id, paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno, created_at
      FROM public.consultas
      WHERE paciente_id = ${pacienteId}
      ORDER BY data_consulta ASC
    `;

    // Altura em metros (trata casos onde foi cadastrado em cm como 170 ou m como 1.70)
    let alturaMetros = parseFloat(paciente.altura) || 0;
    if (alturaMetros > 3) {
      alturaMetros = alturaMetros / 100;
    }

    const pesoInicial = parseFloat(paciente.peso_inicial) || (consultas.length > 0 ? parseFloat(consultas[0].peso) : 0);

    const historico = consultas.map((c, index) => {
      const pesoNum = parseFloat(c.peso) || 0;
      let imc = null;
      if (alturaMetros > 0 && pesoNum > 0) {
        imc = parseFloat((pesoNum / (alturaMetros * alturaMetros)).toFixed(1));
      }

      const deltaPesoInicial = pesoInicial > 0 ? parseFloat((pesoNum - pesoInicial).toFixed(1)) : 0;
      const deltaPesoAnterior = index > 0 && consultas[index - 1].peso ? parseFloat((pesoNum - parseFloat(consultas[index - 1].peso)).toFixed(1)) : 0;

      return {
        ...c,
        pesoNum,
        imc,
        deltaPesoInicial,
        deltaPesoAnterior,
      };
    });

    const ultimaConsulta = historico.length > 0 ? historico[historico.length - 1] : null;
    const pesoAtual = ultimaConsulta ? ultimaConsulta.pesoNum : pesoInicial;
    const imcAtual = ultimaConsulta ? ultimaConsulta.imc : (alturaMetros > 0 && pesoInicial > 0 ? parseFloat((pesoInicial / (alturaMetros * alturaMetros)).toFixed(1)) : null);

    return {
      paciente,
      alturaMetros,
      pesoInicial,
      pesoAtual,
      imcAtual,
      totalConsultas: historico.length,
      historico,
    };
  } catch (error) {
    console.error('Error fetching evolucao do paciente:', error);
    return null;
  }
}


