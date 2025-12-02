# Copilot Instructions - Lugares do Mundo

## Project Overview
**Lugares do Mundo** is an interactive map application built with Next.js 14 (App Router) that lets users mark and visualize visited cities worldwide. It uses OpenStreetMap/Nominatim for geocoding, React-Leaflet for mapping, and localStorage for persistence.

**Key Tech**: Next.js 14 • React 18 • TypeScript • React-Leaflet • Tailwind CSS • @dnd-kit (drag-and-drop)

---

## Architecture & Data Flow

### Core Data Model
```typescript
// types/index.ts
interface Place {
  id: string;           // Generated: place-${Date.now()}-${random}
  name: string;         // City name from Nominatim
  state?: string;       // Region/state (optional)
  country?: string;     // Country (optional)
  latitude: number;
  longitude: number;
  createdAt: string;    // ISO date string
}
```

### Critical Component Relationships
1. **State Management via usePlaces Hook** (`hooks/usePlaces.ts`):
   - Single source of truth for `places[]` array
   - Auto-loads from localStorage on mount
   - Auto-saves to localStorage on every change
   - Provides: `addPlace()`, `removePlace()`, `clearPlaces()`, `reorderPlaces()`
   - Duplicate detection: compares name + country + state (case-insensitive)

2. **Page.tsx** - Orchestrates all components:
   - Manages error state globally
   - Calls `usePlaces()` hook
   - Implements reverse geocoding via map clicks (Nominatim reverse API)
   - Passes callbacks to child components

3. **Components Tree**:
   - `Map` (dynamic, SSR=false) → displays all places, handles click-to-add
   - `CityInput` → geocodes city names via Nominatim
   - `CityList` → displays places with drag-reorder via @dnd-kit
   - `Statistics` → counts unique countries/cities

### External API Integration
- **Nominatim (OpenStreetMap)**: Free geocoding API
  - Forward: `/search?format=json&q={city}&limit=1&addressdetails=1`
  - Reverse: `/reverse?format=json&lat={lat}&lon={lng}&addressdetails=1`
  - **Rate limit**: 1 request/second
  - **Required**: User-Agent header: `"LugaresDoMundo/1.0"`
  - Address parsing: Nominatim returns complex nested `address` object; extract `state` from: `state || state_district || region`

---

## Critical Patterns & Conventions

### 1. SSR / Client-Side Considerations
- **Leaflet doesn't support SSR**: Always use dynamic import with `ssr: false`
  ```typescript
  const Map = dynamic(() => import('@/components/Map'), { ssr: false });
  ```
- **localStorage only in browser**: Guard with `typeof window !== 'undefined'`
- **All interactive components must be `'use client'`** (they interact with Nominatim or localStorage)

### 2. Geocoding Error Handling
- Nominatim returns `[]` if city not found
- Error messages should be user-friendly
- Always use `encodeURIComponent()` for query strings
- Parse `display_name` as fallback to `name`

### 3. Duplicate Detection Logic
```typescript
// Compare all three fields normalized (trim + lowercase)
const isDuplicate = places.some((existing) => {
  const sameName = existing.name.trim().toLowerCase() === place.name.trim().toLowerCase();
  const sameCountry = (existing.country || '').trim().toLowerCase() === (place.country || '').trim().toLowerCase();
  const sameState = (existing.state || '').trim().toLowerCase() === (place.state || '').trim().toLowerCase();
  return sameName && sameCountry && sameState;
});
```

### 4. Country Flag Mapping
- `lib/countryFlags.ts` maintains a mapping of country names (PT + EN) → emoji flags
- Fallback is `🗺️` if not found
- Used in both `CityList` and `Statistics` components
- **When adding countries**: Add both Portuguese and English variants

### 5. Drag-and-Drop Pattern (@dnd-kit)
- `CityList` wraps items in `DndContext` + `SortableContext`
- Uses `verticalListSortingStrategy`
- `useSortable()` hook provides `transform` and `transition` styles via CSS.Transform
- Calls parent's `onReorderPlaces(oldIndex, newIndex)` which manually reorders array

### 6. Date Formatting
- Store as ISO: `new Date().toISOString()`
- Display as localized: `new Date(place.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })`

---

## Development Workflows

### Setup & Running
```bash
npm install
npm run dev    # Run on http://localhost:3000
npm run build  # Production build
npm run lint   # Run ESLint
```

### Common Tasks
- **Add a city**: Type in input → auto-geocodes → adds to map + list
- **Add by clicking map**: Click map → reverse geocodes coordinates → adds
- **Reorder cities**: Drag handle icon in city list
- **Remove city**: Click "Remover" button per city

### Testing Patterns
- No automated tests currently; manual testing essential
- Test geocoding with real city names (e.g., "São Paulo", "Tokyo")
- Verify localStorage persists after refresh
- Check Nominatim rate limiting (1 req/sec)

---

## Project-Specific Conventions

1. **Naming**: PascalCase for components, camelCase for hooks/utils, kebab-case for filenames
2. **Styling**: Tailwind classes only (no CSS modules); responsive via Tailwind's `lg:` breakpoint
3. **Error Messages**: User-friendly in Portuguese
4. **TypeScript**: Strict mode enabled; all types in `types/index.ts`
5. **Path Aliases**: `@/*` resolves to workspace root
6. **Comments**: JSDoc-style for public functions/components

---

## Future Considerations

- **Planned features** (in README): user auth, DB sync, export/import, statistics
- **Rate limiting**: Nominatim's 1 req/sec limit may need debouncing for frequent searches
- **Offline capability**: Could cache city data locally
- **Performance**: Map re-renders on every place change; `useMemo` in Statistics already optimizes recalcs
