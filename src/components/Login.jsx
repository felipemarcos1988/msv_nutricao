import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, UserCheck, Stethoscope, User, AlertCircle } from 'lucide-react';

export function Login({ onSwitchToCadastro }) {
  const { login } = useAuth();
  const [role, setRole] = useState('nutricionista'); // 'nutricionista' | 'paciente'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setSubmitting(true);
      await login(email.trim(), password, role);
    } catch (err) {
      setError(err.message || 'Falha ao realizar login. Verifique seus dados.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-wrapper">
            <img src="/logo.png" alt="MSV Nutri Logo" className="auth-logo" />
          </div>

          {/* Seletor de Perfil (Nutricionista vs Paciente) */}
          <div className="role-selector" role="tablist" aria-label="Selecione o tipo de login">
            <button
              type="button"
              role="tab"
              aria-selected={role === 'nutricionista'}
              className={`role-tab ${role === 'nutricionista' ? 'active' : ''}`}
              onClick={() => { setRole('nutricionista'); setError(''); }}
            >
              <Stethoscope size={16} />
              <span>Nutricionista</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === 'paciente'}
              className={`role-tab ${role === 'paciente' ? 'active' : ''}`}
              onClick={() => { setRole('paciente'); setError(''); }}
            >
              <User size={16} />
              <span>Paciente</span>
            </button>
          </div>

          <h1 className="auth-title">
            {role === 'nutricionista' ? 'Acesse sua conta' : 'Portal do Paciente'}
          </h1>
          <p className="auth-subtitle">
            {role === 'nutricionista'
              ? 'Sistema de Gestão para Nutricionistas'
              : 'Acesse suas orientações e acompanhamento nutricional'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              {role === 'nutricionista' ? 'E-mail Profissional' : 'E-mail do Paciente'}
            </label>
            <div className="input-wrapper">
              <input
                id="email-input"
                type="email"
                className="form-input"
                placeholder={role === 'nutricionista' ? 'nutri@exemplo.com' : 'seu.email@exemplo.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Senha</label>
            <div className="input-wrapper">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner" />
                <span>Entrando...</span>
              </>
            ) : (
              `Entrar como ${role === 'nutricionista' ? 'Nutricionista' : 'Paciente'}`
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Não tem conta? </span>
          <button
            type="button"
            className="auth-link"
            style={{ background: 'none', border: 'none', font: 'inherit', padding: 0 }}
            onClick={onSwitchToCadastro}
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}
