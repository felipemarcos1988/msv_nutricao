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
