'use client';

import { supabase } from './client';

export async function setDocumentNonBlocking(table: string, data: any, id?: string) {
  try {
    const result = id
      ? await supabase.from(table).update(data).eq('id', id)
      : await supabase.from(table).insert(data);
    return result;
  } catch (error: any) {
    console.error('Supabase operation failed:', error);
    throw error;
  }
}

export async function addDocumentNonBlocking(table: string, data: any) {
  try {
    const result = await supabase.from(table).insert(data);
    return result;
  } catch (error: any) {
    console.error('Supabase insert failed:', error);
    throw error;
  }
}

export async function updateDocumentNonBlocking(table: string, data: any, id: string) {
  try {
    const result = await supabase.from(table).update(data).eq('id', id);
    return result;
  } catch (error: any) {
    console.error('Supabase update failed:', error);
    throw error;
  }
}

export async function deleteDocumentNonBlocking(table: string, id: string) {
  try {
    const result = await supabase.from(table).delete().eq('id', id);
    return result;
  } catch (error: any) {
    console.error('Supabase delete failed:', error);
    throw error;
  }
}
