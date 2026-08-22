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
 * Obtém os pacientes vinculados a um nutricionista
 */
export async function getPacientesByNutri(nutricionistaId) {
  if (!nutricionistaId) return [];
  try {
    const rows = await sql`
      SELECT id, nome, email, whatsapp, peso_inicial, altura, created_at
      FROM public.pacientes
      WHERE nutricionista_id = ${nutricionistaId}
      ORDER BY created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching pacientes:', error);
    return [];
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
    // 1. Total de pacientes ativos do nutricionista
    const totalPacientesRes = await sql`
      SELECT COUNT(*)::int AS total
      FROM public.pacientes
      WHERE nutricionista_id = ${nutricionistaId}
    `;
    const totalPacientes = totalPacientesRes[0]?.total || 0;

    // 2. Consultas da semana atual (segunda-feira a domingo)
    const consultasSemanaRes = await sql`
      SELECT COUNT(*)::int AS total
      FROM public.consultas c
      JOIN public.pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
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
      WHERE p.nutricionista_id = ${nutricionistaId}
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


