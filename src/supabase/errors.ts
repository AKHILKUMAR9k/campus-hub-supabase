'use client';

import { AuthError } from '@supabase/supabase-js';

export class SupabaseAuthError extends Error {
  constructor(error: AuthError) {
    super(error.message);
    this.name = 'SupabaseAuthError';
  }
}

export class SupabasePermissionError extends Error {
  public readonly details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'SupabasePermissionError';
    this.details = details;
  }
}
