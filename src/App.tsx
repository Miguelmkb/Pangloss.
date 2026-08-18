import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { SiteContentProvider } from '@/context/SiteContentContext';
import { SearchOverlayProvider } from '@/context/SearchOverlayContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { PageLoader } from '@/components/ui/PageLoader';
import { SetupScreen } from '@/components/ui/SetupScreen';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';

import { HomePage } from '@/pages/public/Home';
import { ArticlesPage } from '@/pages/public/Articles';
import { ArticlePage } from '@/pages/public/ArticlePage';
import { CategoriesPage } from '@/pages/public/CategoriesPage';
import { CategoryPage } from '@/pages/public/CategoryPage';
import { AuthorsPage } from '@/pages/public/AuthorsPage';
import { AuthorPage } from '@/pages/public/AuthorPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { CollaboratePage } from '@/pages/public/CollaboratePage';
import { SubscribePage } from '@/pages/public/SubscribePage';
import { ConfirmSubscriptionPage } from '@/pages/public/ConfirmSubscriptionPage';
import { UnsubscribePage } from '@/pages/public/UnsubscribePage';
import { SearchPage } from '@/pages/public/SearchPage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';

/**
 * Todo lo que vive detrás de /login y /admin — incluido el editor Tiptap
 * completo, con todas sus extensiones — se separa en su propio chunk,
 * cargado bajo demanda. Un lector anónimo (la inmensa mayoría de las
 * visitas) nunca necesita descargar el editor de artículos; antes de este
 * cambio, el bundle público principal incluía igualmente ese código
 * (~930KB minificados en un único chunk). `PageLoader` (ya usado para los
 * estados de carga de autenticación) sirve también de `fallback` aquí — el
 * lector público jamás lo ve, solo quien entra en /login o /admin/*.
 */
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard').then((m) => ({ default: m.Dashboard })));
const AdminArticles = lazy(() => import('@/pages/admin/AdminArticles').then((m) => ({ default: m.AdminArticles })));
const ArticleEditPage = lazy(() => import('@/pages/admin/ArticleEditPage').then((m) => ({ default: m.ArticleEditPage })));
const AdminAuthors = lazy(() => import('@/pages/admin/AdminAuthors').then((m) => ({ default: m.AdminAuthors })));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminContentPage = lazy(() => import('@/pages/admin/AdminContentPage').then((m) => ({ default: m.AdminContentPage })));

function PublicLayout() {
  const location = useLocation();
  useScrollRestoration();

  return (
    <SearchOverlayProvider>
      {/* Invisible hasta que recibe foco por teclado (Tab) — deja saltar
          toda la navegación de cabecera sin tener que recorrerla cada vez. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-text-primary focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-sans"
      >
        Saltar al contenido
      </a>
      <Header />
      {/* key=pathname: cada cambio de ruta pública remonta este div, lo que
          relanza la animación CSS de entrada — un fundido de ~180ms, nunca
          una salida ni un retraso a la navegación. Solo en el sitio
          público: el panel de administración se mantiene instantáneo. */}
      <main id="main-content" key={location.pathname} className="pt-24 page-fade-in">
        <Outlet />
      </main>
      <Footer />
    </SearchOverlayProvider>
  );
}

/**
 * Falla cerrado: mientras no exista Supabase Auth (Fase 3), `user` es
 * siempre `null`, así que cualquier ruta /admin/* redirige a /login.
 * Es el comportamiento correcto — no hay backend contra el que autenticar.
 */
function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function RoleRoute({ editor = false, admin = false }: { editor?: boolean; admin?: boolean }) {
  const { role, loading } = useAuth();
  if (loading) return <PageLoader />;
  const allowed = admin ? role === 'admin' : editor ? role === 'admin' || role === 'editor' : Boolean(role);
  return allowed ? <Outlet /> : <Navigate to="/admin" replace />;
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupScreen />;

  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteContentProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/articulos" element={<ArticlesPage />} />
                  <Route path="/articulo/:slug" element={<ArticlePage />} />
                  <Route path="/categorias" element={<CategoriesPage />} />
                  <Route path="/categoria/:slug" element={<CategoryPage />} />
                  <Route path="/autores" element={<AuthorsPage />} />
                  <Route path="/autor/:slug" element={<AuthorPage />} />
                  <Route path="/sobre" element={<AboutPage />} />
                  <Route path="/colabora" element={<CollaboratePage />} />
                  <Route path="/suscribete" element={<SubscribePage />} />
                  <Route path="/confirmar-suscripcion" element={<ConfirmSubscriptionPage />} />
                  <Route path="/darse-de-baja" element={<UnsubscribePage />} />
                  <Route path="/buscar" element={<SearchPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Dashboard />} />
                    <Route path="/admin/mis-articulos" element={<AdminArticles onlyMine />} />
                    <Route path="/admin/articulos/nuevo" element={<ArticleEditPage />} />
                    <Route path="/admin/articulos/:id/editar" element={<ArticleEditPage />} />
                    <Route element={<RoleRoute editor />}>
                      <Route path="/admin/articulos" element={<AdminArticles />} />
                      <Route path="/admin/revision" element={<AdminArticles reviewMode />} />
                      <Route path="/admin/autores" element={<AdminAuthors />} />
                      <Route path="/admin/categorias" element={<AdminCategories />} />
                    </Route>
                    <Route element={<RoleRoute admin />}>
                      <Route path="/admin/usuarios" element={<AdminUsers />} />
                      <Route path="/admin/configuracion" element={<SettingsPage />} />
                      <Route path="/admin/contenido" element={<AdminContentPage />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </ToastProvider>
        </SiteContentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
