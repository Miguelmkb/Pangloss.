/**
 * Tipos alineados con el esquema de Supabase (ver supabase/migrations en Fase 3).
 * Se definen a mano ahora, como contrato estable para el resto de la app;
 * en Fase 3 se contrastarán contra el esquema SQL real.
 */

export type UserRole = 'admin' | 'editor' | 'collaborator';

export type ArticleStatus = 'draft' | 'in_review' | 'published' | 'archived';

export type ReferenceType = 'book' | 'article' | 'report' | 'document' | 'website' | 'other';

export interface Profile {
  id: string;
  role: UserRole;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface AuthorLink {
  label: string;
  url: string;
}

export interface Author {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  bio: string | null;
  photo_url: string | null;
  areas_of_interest: string[] | null;
  links: AuthorLink[];
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ArticleReference {
  id: string;
  article_id: string;
  type: ReferenceType;
  title: string;
  authors: string | null;
  year: number | null;
  publisher: string | null;
  journal: string | null;
  url: string | null;
  pages: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface Article {
  id: string;
  user_id: string;
  author_id: string | null;
  category_id: string | null;
  title: string;
  subtitle: string | null;
  slug: string | null;
  content: Record<string, unknown>;
  excerpt: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_caption: string | null;
  status: ArticleStatus;
  featured: boolean;
  reading_time_minutes: number;
  reading_time_auto: boolean;
  pdf_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  // relaciones (joins)
  author?: Author | null;
  category?: Category | null;
  tags?: Tag[];
  references?: ArticleReference[];
}

export interface ArticleImage {
  id: string;
  article_id: string;
  storage_path: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  created_at: string;
}

export type RevisionLabel = 'autosave' | 'publish' | 'manual';

export interface ArticleRevision {
  id: string;
  article_id: string;
  content: Record<string, unknown>;
  version: number;
  label: RevisionLabel;
  created_by: string | null;
  created_at: string;
}

export interface ArticleTagRow {
  article_id: string;
  tag_id: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  collaborator: 'Colaborador',
};

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Borrador',
  in_review: 'En revisión',
  published: 'Publicado',
  archived: 'Archivado',
};
