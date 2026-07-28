'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'info' | 'warning' | 'success';
  children?: ReactNode;
  hideButtons?: boolean;
  videoSrc?: string;
  videoClassName?: string;
  contentClassName?: string;
}

/**
 * Componente Modal reutilizável para confirmações e mensagens
 */
export default function Modal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = 'info',
  children,
  hideButtons = false,
  videoSrc,
  videoClassName,
  contentClassName,
}: ModalProps) {
  if (!isOpen) return null;

  const getColorClasses = () => {
    switch (type) {
      case 'warning':
        return {
          icon: 'bg-destructive/10 text-destructive',
          button: 'bg-destructive hover:opacity-90',
        };
      case 'success':
        return {
          icon: 'bg-secondary/10 text-secondary',
          button: 'bg-green hover:opacity-90',
        };
      default:
        return {
          icon: 'bg-primary/10 text-primary',
          button: 'bg-primary hover:opacity-90',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div
        className={`bg-card text-card-foreground border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${contentClassName || ''}`}
      >
        {/* Ícone ou Vídeo */}
        {title && (
          <div className="flex items-center justify-center mx-auto mb-4">
            {videoSrc ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                className={videoClassName || 'w-24 h-24 object-contain'}
              >
                <source src={videoSrc} type="video/mp4" />
              </video>
            ) : (
              <div className={`${colors.icon} rounded-full w-12 h-12 flex items-center justify-center`}>
                {type === 'warning' && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  </svg>
                )}
                {type === 'success' && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {type === 'info' && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            )}
          </div>
        )}

        {/* Título */}
        {title && (
          <h2 className="text-lg font-semibold text-card-foreground text-center mb-2">
            {title}
          </h2>
        )}

        {/* Mensagem */}
        <div className="text-muted-foreground text-center text-sm mb-6">
          {message}
        </div>

        {/* Conteúdo customizado */}
        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}

        {/* Botões */}
        {!hideButtons && (confirmText || cancelText) && (
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-center">
            {cancelText && (
              <button
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2 text-muted-foreground bg-muted rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
              >
                {cancelText}
              </button>
            )}
            {confirmText && (
              <button
                onClick={onConfirm}
                className={`w-full sm:w-auto px-4 py-2 ${colors.button} text-white rounded-lg transition-colors font-medium`}
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
