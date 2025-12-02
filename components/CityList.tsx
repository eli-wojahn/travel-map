'use client';

import { useState } from 'react';
import { Place } from '@/types';
import { getCountryFlag } from '@/lib/countryFlags';
import * as Collapsible from '@radix-ui/react-collapsible';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CityListProps {
  places: Place[];
  onRemovePlace: (id: string) => void;
  onReorderPlaces: (startIndex: number, endIndex: number) => void;
}

/**
 * Item individual sortável com numeração
 */
function SortableCityItem({
  place,
  index,
  onRemovePlace,
}: {
  place: Place;
  index: number;
  onRemovePlace: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0" {...attributes} {...listeners}>
        <div className="flex-1 min-w-0 cursor-grab active:cursor-grabbing">
          {/* NÚMERO + NOME */}
          <p className="font-medium text-gray-900 truncate">
            {index + 1}. {place.name}
            {place.state && (
              <span className="text-gray-500 font-normal">
                {`, ${place.state}`}
              </span>
            )}
          </p>

          {(place.country || place.state) && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              {place.country && <span>{getCountryFlag(place.country)}</span>}
              <span>
                {[place.state, place.country].filter(Boolean).join(', ')}
              </span>
            </p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            {new Date(place.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <button
        onClick={() => onRemovePlace(place.id)}
        className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        aria-label={`Remover ${place.name}`}
        title={`Remover ${place.name}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 5h14M8 9v6m4-6v6M5 5v12c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V5m-2 0V4c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1v1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * Lista de cidades visitadas com drag and drop
 */
export default function CityList({
  places,
  onRemovePlace,
  onReorderPlaces,
}: CityListProps) {
  const [open, setOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = places.findIndex((place) => place.id === active.id);
      const newIndex = places.findIndex((place) => place.id === over.id);
      onReorderPlaces(oldIndex, newIndex);
    }
  };

  if (places.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Nenhuma cidade adicionada ainda.</p>
        <p className="text-sm mt-2">Digite uma cidade ou clique no mapa para começar!</p>
      </div>
    );
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Cidades Visitadas</h3>
        {places.length > 6 && (
          <Collapsible.Trigger asChild>
            <button
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={open ? 'Recolher' : 'Expandir'}
              title={open ? 'Recolher' : 'Expandir'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
          </Collapsible.Trigger>
        )}
      </div>
      <Collapsible.Content forceMount>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={places.map((place) => place.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {(open || places.length <= 6
                ? places
                : places.slice(0, 6)
              ).map((place, index) => (
                <SortableCityItem
                  key={place.id}
                  place={place}
                  index={index}
                  onRemovePlace={onRemovePlace}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Collapsible.Content>
      {!open && places.length > 6 && (
        <Collapsible.Trigger asChild>
          <button
            onClick={() => setOpen(true)}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors font-medium"
          >
            Ver mais ({places.length - 6} restantes)
          </button>
        </Collapsible.Trigger>
      )}
    </Collapsible.Root>
  );
}
