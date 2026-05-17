'use client';

import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';

type ShareImageTexts = {
  elementNotFound: string;
  generateImageError: string;
  downloadImageError: string;
  browserNoShareError: string;
  browserNoFileShareError: string;
  shareImageError: string;
  browserNoClipboardError: string;
  clipboardPermissionError: string;
  copyImageError: string;
  nativeShareTitle: string;
  nativeShareText: string;
  defaultFileNameBase: string;
};

/**
 * Hook para gerenciar geração de imagem e compartilhamento
 */
export function useShareImage(texts: ShareImageTexts) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gera uma imagem do elemento especificado
   */
  const generateImage = useCallback(async (elementId: string): Promise<Blob | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(texts.elementNotFound);
      }

      // Aguarda renderização completa
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Alta qualidade (2x)
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error(texts.generateImageError));
            }
          },
          'image/png',
          1.0
        );
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : texts.generateImageError;
      setError(errorMessage);
      console.error('Failed to generate image:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [texts.elementNotFound, texts.generateImageError]);

  /**
   * Baixa a imagem
   */
  const downloadImage = useCallback(async (elementId: string, filename?: string) => {
    const blob = await generateImage(elementId);
    if (!blob) return false;

    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${texts.defaultFileNameBase}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      setError(texts.downloadImageError);
      return false;
    }
  }, [generateImage, texts.defaultFileNameBase, texts.downloadImageError]);

  /**
   * Compartilha usando a Web Share API (mobile)
   */
  const shareImage = useCallback(async (elementId: string) => {
    const blob = await generateImage(elementId);
    if (!blob) return false;

    try {
      // Verifica se o navegador suporta Web Share API
      if (!navigator.share) {
        setError(texts.browserNoShareError);
        return false;
      }

      const file = new File([blob], `${texts.defaultFileNameBase}.png`, { type: 'image/png' });

      // Verifica se pode compartilhar arquivos
      if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
        setError(texts.browserNoFileShareError);
        return false;
      }

      await navigator.share({
        title: texts.nativeShareTitle,
        text: texts.nativeShareText,
        files: [file],
      });

      return true;
    } catch (err) {
      // Usuário cancelou o compartilhamento
      if ((err as Error).name === 'AbortError') {
        return false;
      }
      setError(texts.shareImageError);
      console.error('Failed to share image:', err);
      return false;
    }
  }, [
    generateImage,
    texts.browserNoShareError,
    texts.defaultFileNameBase,
    texts.browserNoFileShareError,
    texts.nativeShareTitle,
    texts.nativeShareText,
    texts.shareImageError,
  ]);

  /**
   * Copia a imagem para a área de transferência
   */
  const copyImageToClipboard = useCallback(async (elementId: string) => {
    const blob = await generateImage(elementId);
    if (!blob) return false;

    try {
      // Verifica se o navegador suporta Clipboard API
      if (!navigator.clipboard || !navigator.clipboard.write) {
        setError(texts.browserNoClipboardError);
        return false;
      }

      // Tenta focar o documento antes de copiar
      window.focus();
      document.body.focus();
      
      // Aguarda um pouco para garantir o foco
      await new Promise(resolve => setTimeout(resolve, 100));

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      return true;
    } catch (err) {
      const error = err as Error;
      // Trata erros específicos
      if (error.name === 'NotAllowedError') {
        setError(texts.clipboardPermissionError);
      } else {
        setError(texts.copyImageError);
      }
      console.error('Failed to copy image:', err);
      return false;
    }
  }, [
    generateImage,
    texts.browserNoClipboardError,
    texts.clipboardPermissionError,
    texts.copyImageError,
  ]);

  return {
    generateImage,
    downloadImage,
    shareImage,
    copyImageToClipboard,
    isGenerating,
    error,
    clearError: () => setError(null),
  };
}
