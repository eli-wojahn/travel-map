'use client';

import { ReactNode, useState } from 'react';

interface DrawerProps {
  title: string;
  children: ReactNode;
  maxItemsVisible?: number;
  itemsCount?: number;
}

/**
 * Componente Drawer para expandir/recolher listas
 * Mostra apenas maxItemsVisible itens por padrão, expande ao clicar
 */
export default function Drawer({
  title,
  children,
  maxItemsVisible = 6,
  itemsCount = 0,
}: DrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shouldShowDrawer = itemsCount > maxItemsVisible;

  // Se tem mais itens que o máximo, mostra apenas os primeiros quando fechado
  const displayStyle = !shouldShowDrawer 
    ? {} 
    : isOpen 
    ? {} 
    : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))', gap: '0.5rem' };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          {title}
        </h3>
        {shouldShowDrawer && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label={isOpen ? 'Recolher' : 'Expandir'}
            title={isOpen ? 'Recolher' : 'Expandir'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Container com altura animada */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen || !shouldShowDrawer ? '' : 'max-h-[350px] overflow-hidden'
        }`}
      >
        {children}
      </div>

      {/* Indicador de mais itens (quando fechado) */}
      {shouldShowDrawer && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors font-medium"
        >
          Ver mais ({itemsCount - maxItemsVisible} restantes)
        </button>
      )}
    </div>
  );
}
