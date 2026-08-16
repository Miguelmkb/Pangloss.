import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { to: '/articulos', label: 'Artículos' },
  { to: '/categorias', label: 'Categorías' },
  { to: '/autores', label: 'Autores' },
  { to: '/sobre', label: 'Sobre' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const lastYRef = useRef(0);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    function handler() {
      const y = window.scrollY;
      const delta = y - lastYRef.current;
      setScrolled(y > 20);

      // Nunca oculto cerca del principio de la página, ni mientras el menú
      // móvil o el buscador están abiertos (quedaría flotando sin su
      // disparador). Se oculta al bajar de forma clara y reaparece con
      // solo un poco que se suba — sensible a la dirección, no a la
      // distancia total recorrida.
      if (menuOpen || searchOpen || y < 120) {
        setHidden(false);
      } else if (delta > 4) {
        setHidden(true);
      } else if (delta < -4) {
        setHidden(false);
      }
      lastYRef.current = y;
    }

    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [menuOpen, searchOpen]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/buscar?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery('');
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        } ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-[0_1px_0_0_#e5e5e5] transition-colors' : 'bg-white transition-colors'}`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-24">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="Pangloss" className="h-20 w-20 object-contain" />
              <span className="font-serif text-3xl font-bold tracking-[0.12em] uppercase text-text-primary">
                Pangloss
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-9">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `link-editorial text-base font-sans font-medium tracking-wide transition-colors ${
                      isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link
                to="/admin"
                className="hidden md:block text-sm font-sans font-medium uppercase tracking-widest text-text-muted hover:text-accent transition-colors border border-border px-3.5 py-2"
              >
                Acceso
              </Link>
              <button
                className="md:hidden p-2 text-text-secondary"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menú"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-border">
            <nav className="px-6 py-4 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-sm font-sans font-medium ${isActive ? 'text-accent' : 'text-text-secondary'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-sm font-sans text-text-muted">
                Acceso privado
              </Link>
            </nav>
          </div>
        )}
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm flex items-start justify-center pt-32 px-6">
          <button
            onClick={() => setSearchOpen(false)}
            className="absolute top-6 right-6 p-2 text-text-secondary hover:text-text-primary"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-full max-w-xl">
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-6 text-center">
              Buscar en Pangloss
            </p>
            <form onSubmit={handleSearch}>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="¿Qué buscas?"
                className="w-full font-serif text-2xl text-text-primary bg-transparent border-b-2 border-border focus:border-accent outline-none pb-3 placeholder:text-text-muted transition-colors"
              />
              <button
                type="submit"
                className="mt-6 w-full text-sm font-sans uppercase tracking-widest py-3 border border-text-primary hover:bg-text-primary hover:text-white transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
