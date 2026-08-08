/**
 * Neon Auth Integration Service
 * Base URL: https://ep-curly-king-acas4rmr.neonauth.sa-east-1.aws.neon.tech/neondb/auth
 */

const NEON_AUTH_BASE_URL = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-curly-king-acas4rmr.neonauth.sa-east-1.aws.neon.tech/neondb/auth';

/**
 * Cadastrar nova nutricionista
 */
export async function signUp({ name, email, password }) {
  try {
    const res = await fetch(`${NEON_AUTH_BASE_URL}/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = parseErrorMessage(data, 'Erro ao realizar cadastro. Tente novamente.');
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error('SignUp Error:', error);
    throw error;
  }
}

/**
 * Entrar com email e senha
 */
export async function signIn({ email, password }) {
  try {
    const res = await fetch(`${NEON_AUTH_BASE_URL}/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = parseErrorMessage(data, 'E-mail ou senha incorretos.');
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error('SignIn Error:', error);
    throw error;
  }
}

/**
 * Obter a sessão ativa atual
 */
export async function getSession() {
  try {
    const res = await fetch(`${NEON_AUTH_BASE_URL}/get-session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json().catch(() => null);
    return data;
  } catch (error) {
    console.error('GetSession Error:', error);
    return null;
  }
}

/**
 * Encerrar a sessão
 */
export async function signOut() {
  try {
    const res = await fetch(`${NEON_AUTH_BASE_URL}/sign-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });

    return res.ok;
  } catch (error) {
    console.error('SignOut Error:', error);
    return false;
  }
}

/**
 * Auxiliar para formatar mensagens de erro amigáveis em português
 */
function parseErrorMessage(data, defaultMsg) {
  if (data?.message) {
    const msg = data.message.toLowerCase();
    if (msg.includes('user already exists') || msg.includes('already registered')) {
      return 'Este e-mail já está cadastrado no sistema.';
    }
    if (msg.includes('invalid email') || msg.includes('invalid credentials')) {
      return 'E-mail ou senha incorretos.';
    }
    if (msg.includes('password') && msg.includes('short')) {
      return 'A senha deve ter no mínimo 9 caracteres.';
    }
    return data.message;
  }
  return defaultMsg;
}
