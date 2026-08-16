import { supabase } from '@/lib/supabase';
import type { Author } from '@/types/database';

export async function getAuthors(): Promise<Author[]> {
  const { data, error } = await supabase.from('authors').select('*').eq('active', true).order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const { data, error } = await supabase.from('authors').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}
