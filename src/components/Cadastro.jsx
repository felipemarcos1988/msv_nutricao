import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export function Cadastro({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nome.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 9) {
      setError('A senha deve conter no mínimo 9 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    try {
      setSubmitting(true);
      await register(nome.trim(), email.trim(), password);
    } catch (err) {
      setError(err.message || 'Falha ao criar conta. Tente novamente.');
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
          <h1 className="auth-title">Criar Conta</h1>
          <p className="auth-subtitle">Cadastre-se como Nutricionista no MSV Nutrição</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="nome-input">Nome Completo</label>
            <input
              id="nome-input"
              type="text"
              className="form-input"
              placeholder="Dra. Maria Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cad-email-input">E-mail Profissional</label>
            <input
              id="cad-email-input"
              type="email"
              className="form-input"
              placeholder="nutri@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cad-password-input">Senha (mínimo 9 caracteres)</label>
            <div className="input-wrapper">
              <input
                id="cad-password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Mínimo 9 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
                minLength={9}
                autoComplete="new-password"
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

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password-input">Confirmar Senha</label>
            <input
              id="confirm-password-input"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner" />
                <span>Criando conta...</span>
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Já tem conta? </span>
          <button
            type="button"
            className="auth-link"
            style={{ background: 'none', border: 'none', font: 'inherit', padding: 0 }}
            onClick={onSwitchToLogin}
          >
            Faça login
          </button>
        </div>
      </div>
    </div>
  );
}
