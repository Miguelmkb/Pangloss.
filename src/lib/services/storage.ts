import { supabase } from '@/lib/supabase';

function extensionOf(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split('/').pop() ?? 'bin';
}

/**
 * Sube una imagen a un bucket público y devuelve su URL servida por CDN.
 * `folderId` es el id de la entidad dueña (article_id o author_id) — es lo
 * que las políticas de Storage usan para decidir quién puede escribir ahí.
 */
export async function uploadPublicImage(
  bucket: 'article-images' | 'author-photos',
  folderId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const path = `${folderId}/${crypto.randomUUID()}.${extensionOf(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deletePublicImage(bucket: 'article-images' | 'author-photos', path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
