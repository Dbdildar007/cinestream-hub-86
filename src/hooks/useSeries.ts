import { useQuery } from '@tanstack/react-query';
import { seriesService, type SeriesWithSeasons } from '@/services/seriesService';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export function useAllSeries() {
  const { data: allSeries = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['series'],
    queryFn: () => seriesService.getAllSeries(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('series-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'series' }, () => {
        seriesService.clearCache();
        refetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  return { allSeries, loading };
}

export function useSeriesDetail(seriesId: string | null) {
  const { data: series = null, isLoading: loading } = useQuery<SeriesWithSeasons | null>({
    queryKey: ['series', 'detail', seriesId],
    queryFn: () => seriesService.getSeriesWithSeasons(seriesId!),
    enabled: !!seriesId,
    staleTime: 5 * 60 * 1000,
  });

  return { series, loading };
}

export function useFeaturedSeries() {
  const { data: series = [], isLoading: loading } = useQuery({
    queryKey: ['series', 'featured'],
    queryFn: () => seriesService.getFeaturedSeries(),
    staleTime: 5 * 60 * 1000,
  });

  return { series, loading };
}
