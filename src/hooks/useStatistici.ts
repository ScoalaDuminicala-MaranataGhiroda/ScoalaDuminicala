import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LectieCopil, LectieParcursa, StatisticiCopil } from '@/types';

export function useStatisticiAgregate() {
  const [statistici, setStatistici] = useState<StatisticiCopil[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);

  const incarca = useCallback(async () => {
    setSeIncarca(true);
    const { data } = await supabase.from('v_statistici_copii').select('*');
    setStatistici(data ?? []);
    setSeIncarca(false);
  }, []);

  useEffect(() => {
    incarca();
  }, [incarca]);

  return { statistici, seIncarca, incarca };
}

export interface LectieCuDetalii extends LectieParcursa {
  copii: (LectieCopil & { nume_prenume: string })[];
}

export function useLectiiParcurse(grupaId: string | null) {
  const [lectii, setLectii] = useState<LectieCuDetalii[]>([]);
  const [seIncarca, setSeIncarca] = useState(false);

  const incarca = useCallback(async () => {
    if (!grupaId) {
      setLectii([]);
      return;
    }
    setSeIncarca(true);
    const { data: lectiiData } = await supabase
      .from('lectii_parcurse')
      .select('*, lectii_parcurse_ajutoare(invatator_id)')
      .eq('grupa_id', grupaId)
      .order('data_lectie', { ascending: false });

    const rezultat: LectieCuDetalii[] = [];
    for (const l of lectiiData ?? []) {
      const { data: copiiData } = await supabase
        .from('lectii_copii')
        .select('*, copii(nume_prenume)')
        .eq('lectie_id', l.id);
      rezultat.push({
        ...l,
        ajutoare: (l as any).lectii_parcurse_ajutoare.map((a: any) => a.invatator_id),
        copii: (copiiData ?? []).map((c: any) => ({ ...c, nume_prenume: c.copii.nume_prenume })),
      });
    }
    setLectii(rezultat);
    setSeIncarca(false);
  }, [grupaId]);

  useEffect(() => {
    incarca();
  }, [incarca]);

  async function actualizeazaValoareCopil(lectieCopilId: string, campuri: Partial<LectieCopil>) {
    const { total, ...restCampuri } = campuri as any; // total e generat de DB, nu se trimite
    const { error } = await supabase.from('lectii_copii').update(restCampuri).eq('id', lectieCopilId);
    if (error) throw new Error(error.message);
    await incarca();
  }

  return { lectii, seIncarca, incarca, actualizeazaValoareCopil };
}
