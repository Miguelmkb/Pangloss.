import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { PageLoader } from '@/components/ui/PageLoader';
import { SetupScreen } from '@/components/ui/SetupScreen';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { AdminLayout } from '@/components/admin/AdminLayout';

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
import { LoginPage } from '@/pages/auth/LoginPage';

import { Dashboard } from '@/pages/admin/Dashboard';
import { AdminArticles } from '@/pages/admin/AdminArticles';
import { ArticleEditPage } from '@/pages/admin/ArticleEditPage';
import { AdminAuthors } from '@/pages/admin/AdminAuthors';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { SettingsPage } from '@/pages/admin/SettingsPage';

function PublicLayout() {
  const location = useLocation();
  return (
    <>
      <Header />
      {/* key=pathname: cada cambio de ruta pública remonta este div, lo que
          relanza la animación CSS de entrada — un fundido de ~180ms, nunca
          una salida ni un retraso a la navegación. Solo en el sitio
          público: el panel de administración se mantiene instantáneo. */}
      <main key={location.pathname} className="pt-24 page-fade-in">
        <Outlet />
      </main>
      <Footer />
    </>
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
        <ToastProvider>
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
                </Route>
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
