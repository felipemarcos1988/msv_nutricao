import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está rodando como PWA instalado
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(inStandalone);

    if (inStandalone) return;

    // Detecta iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Captura o evento nativo do Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="pwa-install-banner">
      <div className="pwa-install-icon">
        <Smartphone size={20} />
      </div>
      <div className="pwa-install-info">
        <strong>Instalar Aplicativo MSV Nutrição</strong>
        <span>Acesse mais rápido direto da sua tela inicial</span>
      </div>
      <div className="pwa-install-actions">
        <button
          type="button"
          className="btn-pwa-install"
          onClick={handleInstallClick}
        >
          <Download size={15} />
          <span>Instalar</span>
        </button>
        <button
          type="button"
          className="btn-pwa-dismiss"
          onClick={() => setShowPrompt(false)}
          title="Fechar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
