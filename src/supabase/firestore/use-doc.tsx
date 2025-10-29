'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: Error | null;
  exists: boolean | null;
}

export function useDoc<T = any>(
  table: string,
  id: string | null | undefined,
  query?: string
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setExists(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: result, error: fetchError } = await supabase
          .from(table)
          .select(query || '*')
          .eq('id', id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No rows returned
            setData(null);
            setExists(false);
          } else {
            setError(new Error(fetchError.message));
            setExists(null);
          }
        } else {
          setData((result as unknown) as WithId<T>);
          setExists(true);
        }
      } catch (err) {
        setError(err as Error);
        setExists(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`${table}_${id}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `id=eq.${id}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'DELETE') {
            setData(null);
            setExists(false);
          } else {
            fetchData(); // Refetch data on update/insert
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, id, query]);

  return { data, isLoading, error, exists };
}
