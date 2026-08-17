import { supabase } from '@/lib/supabase';
import type { Article, ArticleStatus } from '@/types/database';

const ADMIN_FIELDS = `
  id, title, subtitle, slug, status, featured, reading_time_minutes,
  published_at, created_at, updated_at, version, user_id, author_id, category_id,
  author:authors(id, name),
  category:categories(id, name)
`;

export async function getMyArticles(userId: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ADMIN_FIELDS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getAllArticlesAdmin(): Promise<Article[]> {
  const { data, error } = await supabase.from('articles').select(ADMIN_FIELDS).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getInReviewArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ADMIN_FIELDS)
    .eq('status', 'in_review')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function createDraftArticle(userId: string): Promise<Article> {
  const { data, error } = await supabase
    .from('articles')
    .insert({ user_id: userId, title: '', status: 'draft', content: {} })
    .select(ADMIN_FIELDS)
    .single();
  if (error) throw error;
  return data as unknown as Article;
}

/**
 * Cambia el estado editorial de un artículo. No usa `expected_version`
 * porque un cambio de estado (enviar a revisión, publicar, archivar) es una
 * acción explícita del usuario sobre la fila tal y como está en pantalla,
 * no una escritura de autoguardado en carrera con otras — la protección de
 * concurrencia de `version` es para el contenido del editor (Fase 6).
 */
/**
 * Devuelve la nueva `version` de la fila: este escritura pasa por el mismo
 * trigger que incrementa `version` en cada UPDATE, pero al hacerse fuera del
 * hook de autoguardado (deliberadamente, ver comentario más arriba), ese
 * hook no se entera por sí solo. Sin devolver la versión aquí para que la
 * llamante la sincronice, el siguiente autoguardado partiría de una versión
 * ya caducada y fallaría con un falso conflicto.
 *
 * No se toca `published_at` desde aquí: el trigger `articles_freeze_published_at`
 * (en la base de datos) es quien lo fija la primera vez que el estado pasa a
 * "published" y lo protege de cualquier reescritura después — incluida una
 * republicación tras despublicar. Es la fecha de publicación ORIGINAL, no la
 * de la última edición (esa es `updated_at`, gestionada aparte).
 */
export async function setArticleStatus(id: string, status: ArticleStatus): Promise<{ version: number }> {
  const { data, error } = await supabase.from('articles').update({ status }).eq('id', id).select('version').single();
  if (error) throw error;
  return data as { version: number };
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw error;
}

export async function updateArticleMeta(
  id: string,
  patch: Partial<Pick<Article, 'title' | 'subtitle' | 'slug' | 'excerpt' | 'category_id' | 'author_id' | 'featured' | 'seo_title' | 'seo_description'>>,
): Promise<void> {
  const { error } = await supabase.from('articles').update(patch).eq('id', id);
  if (error) throw error;
}

export async function getArticleByIdAdmin(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, author:authors(*), category:categories(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Article | null;
}

export interface DashboardCounts {
  draft: number;
  in_review: number;
  published: number;
  archived: number;
  authors: number;
  users: number;
  categories: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const [articles, authors, users, categories] = await Promise.all([
    supabase.from('articles').select('status'),
    supabase.from('authors').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
  ]);
  if (articles.error) throw articles.error;

  const counts: DashboardCounts = {
    draft: 0,
    in_review: 0,
    published: 0,
    archived: 0,
    authors: authors.count ?? 0,
    users: users.count ?? 0,
    categories: categories.count ?? 0,
  };
  for (const row of articles.data ?? []) {
    const status = (row as { status: ArticleStatus }).status;
    if (status in counts) counts[status as ArticleStatus] += 1;
  }
  return counts;
}

export async function getRecentActivity(limit = 6): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ADMIN_FIELDS)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}
