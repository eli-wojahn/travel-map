'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ShareCard from './ShareCard';
import CanvasPreview from './CanvasPreview';
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
  const t = useTranslations('share');
  const [format, setFormat] = useState<'square' | 'portrait'>('square');
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const shareTexts = {
    elementNotFound: t('errorElementNotFound'),
    generateImageError: t('errorGenerateImage'),
    downloadImageError: t('errorDownloadImage'),
    browserNoShareError: t('errorBrowserNoShare'),
    browserNoFileShareError: t('errorBrowserNoFileShare'),
    shareImageError: t('errorShareImage'),
    browserNoClipboardError: t('errorBrowserNoClipboard'),
    clipboardPermissionError: t('errorClipboardPermission'),
    copyImageError: t('errorCopyImage'),
    nativeShareTitle: t('nativeShareTitle'),
    nativeShareText: t('nativeShareText'),
    defaultFileNameBase: t('fileNameBase'),
  };
  
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
  } = useShareImage(shareTexts);

  const handleDownload = async () => {
    clearError();
    const success = await downloadImage('share-card-render', `${t('fileNameBase')}-${format}.png`);
    if (success) {
      setShowSuccess(t('successDownload'));
      setTimeout(() => setShowSuccess(null), 3000);
    }
  };

  const handleShare = async () => {
    clearError();
    const success = await shareImage('share-card-render');
    if (success) {
      setShowSuccess(t('successShare'));
      setTimeout(() => setShowSuccess(null), 3000);
    }
  };

  const handleCopy = async () => {
    clearError();
    const success = await copyImageToClipboard('share-card-render');
    if (success) {
      setShowSuccess(t('successCopy'));
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
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 border border-border">
        {/* Header fixo */}
        <div className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <h2 className="text-base sm:text-xl font-semibold text-card-foreground">
            📤 {t('title')}
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label={t('title')}
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
          <label className="text-xs sm:text-sm font-medium text-muted-foreground">
            {t('format')}
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setFormat('square')}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all ${
                format === 'square'
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg sm:text-xl">📷</span>
                <span className="text-sm sm:text-base">{t('squareFormat')}</span>
              </div>
            </button>
            <button
              onClick={() => setFormat('portrait')}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all ${
                format === 'portrait'
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg sm:text-xl">📱</span>
                <span className="text-sm sm:text-base">{t('portraitFormat')}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Preview do card - Professional print-style preview */}
          <div 
            className="bg-muted rounded-lg border-2 border-border overflow-hidden"
            style={{
              height: format === 'square' ? '60vh' : '65vh',
              minHeight: '300px',
              maxHeight: format === 'square' ? '600px' : '800px',
            }}
          >
            <CanvasPreview
              canvasWidth={1080}
              canvasHeight={format === 'square' ? 1080 : 1920}
              className="p-4"
            >
              <ShareCard places={places} format={format} />
            </CanvasPreview>
          </div>


        {/* Mensagens de feedback */}
        {showSuccess && (
          <div className="bg-secondary/10 border border-secondary/30 text-secondary px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
            {showSuccess}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
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
                <span className="text-xs sm:text-base">{t('generating')}</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>{t('download')}</span>
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
              <span>{t('copy')}</span>
            </button>

            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2"
            >
              <span>📱</span>
              <span>{t('shareButton')}</span>
            </button>
          </div>

          <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1 sm:mt-2">
            {t('tipCopy')}
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
