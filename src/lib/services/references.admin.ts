import { supabase } from '@/lib/supabase';
import type { ArticleReference, ReferenceType } from '@/types/database';

export async function getReferences(articleId: string): Promise<ArticleReference[]> {
  const { data, error } = await supabase.from('article_references').select('*').eq('article_id', articleId).order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export interface ReferenceInput {
  type: ReferenceType;
  title: string;
  authors?: string | null;
  year?: number | null;
  url?: string | null;
}

export async function createReference(articleId: string, input: ReferenceInput): Promise<ArticleReference> {
  const { data, error } = await supabase
    .from('article_references')
    .insert({ article_id: articleId, ...input })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReference(id: string): Promise<void> {
  const { error } = await supabase.from('article_references').delete().eq('id', id);
  if (error) throw error;
}
