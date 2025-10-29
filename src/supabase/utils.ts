import { supabase } from './client';

export async function uploadToStorage(file: File | Blob, path: string, bucket = 'event-images') {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: (file as File).type || 'application/octet-stream',
  });
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}


