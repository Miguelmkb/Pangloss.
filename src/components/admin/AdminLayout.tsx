import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BookOpen, PenSquare, CheckSquare,
  Users, Tag, Type, Settings, LogOut, ChevronLeft, Menu, X, ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/types/database';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/mis-articulos': 'Mis artículos',
  '/admin/articulos': 'Todos los artículos',
  '/admin/articulos/nuevo': 'Nuevo artículo',
  '/admin/revision': 'Revisión',
  '/admin/autores': 'Autores',
  '/admin/usuarios': 'Usuarios',
  '/admin/categorias': 'Categorías',
  '/admin/configuracion': 'Configuración',
  '/admin/contenido': 'Contenido del sitio',
};

export function AdminLayout() {
  const { profile, signOut, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useScrollRestoration();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  // `end: true` en todos: son enlaces "de hoja" cuyas rutas tienen sub-rutas
  // reales (p. ej. /admin/articulos/nuevo redirige a
  // /admin/articulos/{id}/editar). Sin `end`, NavLink los marca activos por
  // coincidencia de prefijo — así "Todos los artículos" se quedaba resaltado
  // en granate mientras se editaba cualquier artículo, incluido uno recién
  // creado desde "Nuevo artículo".
  const groups: NavGroup[] = [
    {
      label: 'Trabajo',
      items: [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/admin/mis-articulos', label: 'Mis artículos', icon: FileText, end: true },
        ...(isEditor ? [{ to: '/admin/articulos', label: 'Todos los artículos', icon: BookOpen, end: true }] : []),
        { to: '/admin/articulos/nuevo', label: 'Nuevo artículo', icon: PenSquare, end: true },
        ...(isEditor ? [{ to: '/admin/revision', label: 'Revisión', icon: CheckSquare, end: true }] : []),
      ],
    },
    {
      label: 'Personas',
      items: [
        ...(isEditor ? [{ to: '/admin/autores', label: 'Autores', icon: Users, end: true }] : []),
        ...(isAdmin ? [{ to: '/admin/usuarios', label: 'Usuarios', icon: Users, end: true }] : []),
      ],
    },
    {
      label: 'Contenido',
      items: [
        ...(isEditor ? [{ to: '/admin/categorias', label: 'Categorías', icon: Tag, end: true }] : []),
        ...(isAdmin ? [{ to: '/admin/contenido', label: 'Contenido del sitio', icon: Type, end: true }] : []),
      ],
    },
    {
      label: 'Sistema',
      items: [...(isAdmin ? [{ to: '/admin/configuracion', label: 'Configuración', icon: Settings, end: true }] : [])],
    },
  ].filter((g) => g.items.length > 0);

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';
  const sidebarMargin = collapsed ? 'md:ml-16' : 'md:ml-60';
  const userInitial = (profile?.display_name ?? 'U')[0]?.toUpperCase() ?? 'U';

  let pageTitle = 'Panel editorial';
  for (const [route, label] of Object.entries(PAGE_TITLES)) {
    if (location.pathname === route) {
      pageTitle = label;
      break;
    }
  }
  if (/\/admin\/articulos\/[^/]+\/editar/.test(location.pathname)) pageTitle = 'Editar artículo';

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className={`fixed top-0 left-0 h-full ${sidebarWidth} bg-white border-r border-border z-50 flex-col hidden md:flex`}>
        <SidebarContent groups={groups} collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} onSignOut={handleSignOut} />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-border flex flex-col">
            <SidebarContent groups={groups} collapsed={false} onToggleCollapse={() => setSidebarOpen(false)} onSignOut={handleSignOut} isMobile />
          </aside>
        </div>
      )}

      <div className={`flex-1 ${sidebarMargin} min-w-0`}>
        <header className="sticky top-0 z-30 bg-white border-b border-border h-14 flex items-center px-4 md:px-6 gap-3">
          <button
            className="md:hidden p-1.5 -ml-1.5 text-text-secondary hover:text-text-primary transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Panel editorial</span>
            <span className="text-text-muted">/</span>
            <span className="text-xs font-sans font-medium text-text-primary">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="hidden sm:flex items-center gap-1.5 text-xs font-sans text-text-muted hover:text-accent transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Ver sitio
            </Link>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1 hover:bg-surface rounded transition-colors"
                aria-label="Menú de usuario"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center font-sans text-xs font-medium flex-shrink-0">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-sans font-medium text-text-primary leading-tight">{profile?.display_name ?? 'Usuario'}</p>
                  <p className="text-[10px] font-sans text-text-muted leading-tight">{profile ? ROLE_LABELS[profile.role] : ''}</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border shadow-sm py-1">
                  <div className="px-4 py-2 border-b border-border-light">
                    <p className="text-xs font-sans font-medium text-text-primary truncate">{profile?.display_name ?? 'Usuario'}</p>
                    <p className="text-[10px] font-sans text-text-muted">{profile ? ROLE_LABELS[profile.role] : ''}</p>
                  </div>
                  <Link to="/" className="flex items-center gap-2 px-4 py-2 text-xs font-sans text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver sitio público
                  </Link>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-2 text-xs font-sans text-text-secondary hover:bg-surface hover:text-accent transition-colors">
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-wide mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  groups,
  collapsed,
  onToggleCollapse,
  onSignOut,
  isMobile,
}: {
  groups: NavGroup[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
  isMobile?: boolean;
}) {
  return (
    <>
      <div className={`px-4 py-5 border-b border-border flex items-center gap-2.5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link to="/admin" className="flex items-center gap-2.5 group min-w-0">
          <img src="/logo.svg" alt="Pangloss" className="h-7 w-7 object-contain flex-shrink-0" />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block font-serif text-base font-bold tracking-[0.06em] uppercase text-text-primary group-hover:text-accent transition-colors truncate">
                Pangloss
              </span>
              <span className="block text-[10px] font-sans text-text-muted uppercase tracking-widest">Panel editorial</span>
            </span>
          )}
        </Link>
        {isMobile ? (
          <button onClick={onToggleCollapse} className="p-1 text-text-muted hover:text-text-primary flex-shrink-0" aria-label="Cerrar menú">
            <X className="w-4 h-4" />
          </button>
        ) : (
          !collapsed && (
            <button onClick={onToggleCollapse} className="p-1 text-text-muted hover:text-text-primary transition-colors flex-shrink-0" aria-label="Colapsar">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {collapsed && !isMobile && (
        <button onClick={onToggleCollapse} className="px-4 py-3 text-text-muted hover:text-text-primary transition-colors border-b border-border" aria-label="Expandir">
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        {groups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-6' : ''}>
            {!collapsed && <p className="px-3 mb-2 text-[10px] font-sans uppercase tracking-widest text-text-muted font-medium">{group.label}</p>}
            {collapsed && gi > 0 && <div className="mx-3 my-3 border-t border-border-light" />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 text-sm font-sans rounded transition-colors ${collapsed ? 'justify-center' : ''} ${
                      isActive ? 'bg-accent-light text-accent font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-2">
        <Link
          to="/"
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-sans text-text-muted hover:text-text-primary transition-colors rounded ${collapsed ? 'justify-center' : ''}`}
          title="Ver sitio público"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {!collapsed && 'Ver sitio público'}
        </Link>
        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-sans text-text-muted hover:text-accent transition-colors rounded ${collapsed ? 'justify-center' : ''}`}
          title="Cerrar sesión"
        >
          <LogOut className="w-3.5 h-3.5" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </>
  );
}
