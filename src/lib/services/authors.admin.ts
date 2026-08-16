import { supabase } from '@/lib/supabase';
import type { Author, AuthorLink } from '@/types/database';

export async function getAllAuthorsAdmin(): Promise<Author[]> {
  const { data, error } = await supabase.from('authors').select('*').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export interface AuthorInput {
  name: string;
  slug: string;
  bio?: string | null;
  photo_url?: string | null;
  areas_of_interest?: string[] | null;
  links?: AuthorLink[];
  user_id?: string | null;
}

export async function createAuthor(input: AuthorInput): Promise<Author> {
  const { data, error } = await supabase.from('authors').insert(input).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateAuthor(id: string, patch: Partial<AuthorInput & { active: boolean }>): Promise<void> {
  const { error } = await supabase.from('authors').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteAuthor(id: string): Promise<void> {
  const { error } = await supabase.from('authors').delete().eq('id', id);
  if (error) throw error;
}
