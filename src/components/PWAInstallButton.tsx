import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-[#E24C3B]" />
        <span>{compact ? 'Instalar app' : 'Añadir a inicio'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-[#141414] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#E24C3B]" />
          <span>Modo App</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-3xl bg-white border border-stone-200 p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="ios-install-title"
                    className="text-base font-extrabold text-[#141414]"
                  >
                    Instalar en iPhone / iPad
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Ábrela a pantalla completa como una app nativa en la mesa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Cerrar instrucciones"
                  className="min-h-[40px] min-w-[40px] rounded-xl text-stone-500 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ol className="space-y-2.5 text-sm text-[#141414] bg-[#F7F6F3] rounded-2xl p-4 border border-stone-200">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#141414] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Pulsa el botón <strong className="inline-flex items-center gap-1">Compartir <Share className="w-3.5 h-3.5 inline text-[#E24C3B]" /></strong> en la barra inferior de Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#141414] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Desliza hacia abajo y selecciona <strong>“Añadir a pantalla de inicio”</strong>.
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#141414] text-white text-sm font-bold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
