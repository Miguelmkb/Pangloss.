import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/database';

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}

export interface CategoryGroup {
  parent: Category;
  children: Category[];
}

/** Agrupa categorías de nivel superior con sus subcategorías, para /categorias. */
export function groupCategories(categories: Category[]): CategoryGroup[] {
  const parents = categories.filter((c) => !c.parent_id);
  return parents.map((parent) => ({
    parent,
    children: categories.filter((c) => c.parent_id === parent.id),
  }));
}
