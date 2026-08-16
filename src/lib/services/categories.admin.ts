import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/database';

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
}

/**
 * Las categorías nuevas se añaden al final del orden existente dentro de su
 * mismo nivel (categorías padre entre sí, o subcategorías de un mismo padre
 * entre sí) — sin esto, `sort_order` caía siempre al valor por defecto (0)
 * y una categoría recién creada se colaba delante de todas las demás en vez
 * de aparecer al final, donde se espera.
 */
export async function createCategory(input: CategoryInput): Promise<Category> {
  let lastQuery = supabase.from('categories').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  lastQuery = input.parent_id ? lastQuery.eq('parent_id', input.parent_id) : lastQuery.is('parent_id', null);
  const { data: last } = await lastQuery.maybeSingle();
  const nextSortOrder = ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, sort_order: nextSortOrder })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<void> {
  const { error } = await supabase.from('categories').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
