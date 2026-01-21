'use client';

import { useState, useEffect } from 'react';
import ShareCard from './ShareCard';
import { Place } from '@/types';
import { useShareImage } from '@/hooks/useShareImage';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
}

/**
 * Detecta se o usuário está em um dispositivo móvel
 */
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

/**
 * Modal para compartilhar card com mapa e estatísticas
 */
export default function ShareModal({ isOpen, onClose, places }: ShareModalProps) {
  const [format, setFormat] = useState<'square' | 'portrait'>('square');
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  
  // Detecta automaticamente o formato baseado no dispositivo
  useEffect(() => {
    if (isMobileDevice()) {
      setFormat('portrait');
    } else {
      setFormat('square');
    }
  }, []);
  
  const { 
    downloadImage, 
    shareImage, 
    copyImageToClipboard, 
    isGenerating, 
    error,
    clearError 
  } = useShareImage();

  const handleDownload = async () => {
    clearError();
    const success = await downloadImage('share-card-render', `meus-lugares-${format}.png`);
    if (success) {
      setShowSuccess('✅ Imagem baixada com sucesso!');
      setTimeout(() => setShowSuccess(null), 3000);
    }
  };

  const handleShare = async () => {
    clearError();
    const success = await shareImage('share-card-render');
    if (success) {
      setShowSuccess('✅ Compartilhado com sucesso!');
      setTimeout(() => setShowSuccess(null), 3000);
    }
  };

  const handleCopy = async () => {
    clearError();
    const success = await copyImageToClipboard('share-card-render');
    if (success) {
      setShowSuccess('✅ Imagem copiada! Cole no WhatsApp, Instagram, etc.');
      setTimeout(() => setShowSuccess(null), 3000);
    }
  };

  const handleClose = () => {
    clearError();
    setShowSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header fixo */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <h2 className="text-base sm:text-xl font-semibold text-gray-900">
            📤 Compartilhar
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content com scroll */}
        <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto">
        {/* Seletor de formato */}
        <div className="flex flex-col gap-2 sm:gap-3">
          <label className="text-xs sm:text-sm font-medium text-gray-700">
            Formato da imagem:
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setFormat('square')}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all ${
                format === 'square'
                  ? 'border-orange bg-orange/10 text-orange font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg sm:text-xl">📷</span>
              </div>
            </button>
            <button
              onClick={() => setFormat('portrait')}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all ${
                format === 'portrait'
                  ? 'border-orange bg-orange/10 text-orange font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg sm:text-xl">📱</span>
              </div>
            </button>
          </div>
        </div>

        {/* Preview do card */}
        <div className="bg-gray-50 rounded-lg p-1 sm:p-2 border-2 border-gray-200">
          <div className="text-xs sm:text-sm font-medium text-gray-700 mb-1 px-1 flex items-center justify-between">
            <span className="text-[10px] sm:text-xs">Preview:</span>
            <span className="text-[10px] sm:text-xs text-gray-500">
              {format === 'square' ? '1080x1080px' : '1080x1920px'}
            </span>
          </div>
          
          {/* Preview visual - mostra o card real em miniatura */}
          <div className="bg-white rounded-lg border border-gray-300 flex items-center justify-center" style={{
            height: format === 'square' ? '600px' : '720px',
            overflow: 'hidden',
          }}>
            <div 
              style={{
                transform: format === 'square' ? 'scale(0.555)' : 'scale(0.375)',
                transformOrigin: 'center center',
                width: '1080px',
                height: format === 'square' ? '1080px' : '1920px',
              }}
            >
              <ShareCard places={places} format={format} />
            </div>
          </div>
        </div>

        {/* Mensagens de feedback */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
            {showSuccess}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex flex-col gap-2 sm:gap-3">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full bg-orange hover:bg-orange-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs sm:text-base">Gerando...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Baixar Imagem</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={handleCopy}
              disabled={isGenerating}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2"
            >
              <span>📋</span>
              <span>Copiar</span>
            </button>

            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2"
            >
              <span>📱</span>
              <span>Compartilhar</span>
            </button>
          </div>

          <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-1 sm:mt-2">
            💡 Dica: Use &quot;Copiar&quot; para colar diretamente no WhatsApp ou Instagram!
          </p>
        </div>
      </div>
      </div>

      {/* Elemento invisível para geração da imagem - renderizado mas não visível */}
      <div 
        style={{ 
          position: 'fixed',
          left: '0',
          top: '0',
          opacity: 0,
          zIndex: -9999,
          pointerEvents: 'none',
        }}
      >
        <div id="share-card-render">
          <ShareCard places={places} format={format} />
        </div>
      </div>
    </div>
  );
}
