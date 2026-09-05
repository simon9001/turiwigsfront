'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Subscribes to Supabase Realtime INSERT/UPDATE/DELETE on the given tables.
 * Debounces rapid-fire changes so onRefresh is called at most once per 1.5 s.
 *
 * Usage:
 *   useRealtimeRefresh(['orders', 'service_bookings'], () => loadData());
 */
export function useRealtimeRefresh(tables: string[], onRefresh: () => void) {
  // Keep the latest callback without making it a subscription dependency.
  // Assigning in an effect keeps the write out of render.
  const cbRef = useRef(onRefresh);
  useEffect(() => {
    cbRef.current = onRefresh;
  });

  const key = tables.slice().sort().join(',');

  useEffect(() => {
    if (!tables.length || !supabase) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => cbRef.current(), 1500);
    };

    const channel = supabase.channel(`rt:${key}`);

    for (const table of tables) {
      channel.on(
        'postgres_changes' as Parameters<typeof channel.on>[0],
        { event: '*', schema: 'public', table },
        trigger,
      );
    }

    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}
