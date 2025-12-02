import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lugares do Mundo - Mapa de Cidades Visitadas',
  description: 'Marque e visualize todos os lugares que você já visitou no mundo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-foreground min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}

