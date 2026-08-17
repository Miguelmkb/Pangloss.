import { createContext, useContext, useState, type ReactNode } from 'react';

interface SearchOverlayContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SearchOverlayContext = createContext<SearchOverlayContextValue | null>(null);

/**
 * El overlay de búsqueda vive dentro de `Header` (siempre montado en el
 * layout público), pero cualquier otro enlace "Buscar" del sitio — el del
 * footer, por ejemplo — debe abrir exactamente ese mismo overlay en vez de
 * llevar a /buscar y decirle al usuario que vaya a la lupa de la cabecera.
 * Este contexto es la única pieza compartida entre ambos: el estado sigue
 * viviendo en Header, esto solo expone cómo abrirlo desde fuera.
 */
export function SearchOverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <SearchOverlayContext.Provider value={{ open, setOpen }}>{children}</SearchOverlayContext.Provider>;
}

export function useSearchOverlay() {
  const ctx = useContext(SearchOverlayContext);
  if (!ctx) throw new Error('useSearchOverlay debe usarse dentro de <SearchOverlayProvider>');
  return ctx;
}
