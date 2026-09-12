import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { StatisticiCopil } from '@/types';

export function useCopiiGrupa(grupaId: string) {
  const [copii, setCopii] = useState<StatisticiCopil[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);

  const incarca = useCallback(async () => {
    setSeIncarca(true);
    const { data } = await supabase.from('v_statistici_copii').select('*').eq('grupa_id', grupaId).order('nume_prenume');
    setCopii(data ?? []);
    setSeIncarca(false);
  }, [grupaId]);

  useEffect(() => {
    incarca();
  }, [incarca]);

  return { copii, seIncarca, incarca };
}
