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
}

/**
 * Componente Modal reutilizável para confirmações e mensagens
 */
export default function Modal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'info',
  children,
}: ModalProps) {
  if (!isOpen) return null;

  const getColorClasses = () => {
    switch (type) {
      case 'warning':
        return {
          icon: 'bg-yellow-100 text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'success':
        return {
          icon: 'bg-green-100 text-green-600',
          button: 'bg-green-600 hover:bg-green-700',
        };
      default:
        return {
          icon: 'bg-blue-100 text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        {/* Ícone */}
        <div className={`${colors.icon} rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4`}>
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

        {/* Título */}
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {title}
        </h2>

        {/* Mensagem */}
        <p className="text-gray-600 text-center text-sm mb-6">
          {message}
        </p>

        {/* Conteúdo customizado */}
        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 ${colors.button} text-white rounded-lg transition-colors font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
