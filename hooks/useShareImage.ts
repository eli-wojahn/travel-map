'use client';

import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';

/**
 * Hook para gerenciar geração de imagem e compartilhamento
 */
export function useShareImage() {
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
        throw new Error('Elemento não encontrado');
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

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              throw new Error('Erro ao gerar imagem');
            }
          },
          'image/png',
          1.0
        );
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar imagem';
      setError(errorMessage);
      console.error('Erro ao gerar imagem:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Baixa a imagem
   */
  const downloadImage = useCallback(async (elementId: string, filename: string = 'meus-lugares.png') => {
    const blob = await generateImage(elementId);
    if (!blob) return false;

    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      setError('Erro ao baixar imagem');
      return false;
    }
  }, [generateImage]);

  /**
   * Compartilha usando a Web Share API (mobile)
   */
  const shareImage = useCallback(async (elementId: string) => {
    const blob = await generateImage(elementId);
    if (!blob) return false;

    try {
      // Verifica se o navegador suporta Web Share API
      if (!navigator.share) {
        setError('Seu navegador não suporta compartilhamento direto. Use o botão de download.');
        return false;
      }

      const file = new File([blob], 'meus-lugares.png', { type: 'image/png' });

      // Verifica se pode compartilhar arquivos
      if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
        setError('Seu navegador não pode compartilhar imagens. Use o botão de download.');
        return false;
      }

      await navigator.share({
        title: 'Meus Lugares no Mundo',
        text: 'Veja os lugares que já visitei pelo mundo! 🌍',
        files: [file],
      });

      return true;
    } catch (err) {
      // Usuário cancelou o compartilhamento
      if ((err as Error).name === 'AbortError') {
        return false;
      }
      setError('Erro ao compartilhar imagem');
      console.error('Erro ao compartilhar:', err);
      return false;
    }
  }, [generateImage]);

  /**
   * Copia a imagem para a área de transferência
   */
  const copyImageToClipboard = useCallback(async (elementId: string) => {
    const blob = await generateImage(elementId);
    if (!blob) return false;

    try {
      // Verifica se o navegador suporta Clipboard API
      if (!navigator.clipboard || !navigator.clipboard.write) {
        setError('Seu navegador não suporta copiar imagens. Use o botão de download.');
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
        setError('Não foi possível copiar. Clique na janela primeiro e tente novamente, ou use o botão Baixar.');
      } else {
        setError('Erro ao copiar imagem. Use o botão Baixar como alternativa.');
      }
      console.error('Erro ao copiar:', err);
      return false;
    }
  }, [generateImage]);

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
