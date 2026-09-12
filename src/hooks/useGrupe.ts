import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Grupa } from '@/types';

export function useGrupe() {
  const [grupe, setGrupe] = useState<Grupa[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  const incarca = useCallback(async () => {
    setSeIncarca(true);
    setEroare(null);
    const { data: grupeData, error: eroareGrupe } = await supabase
      .from('grupe')
      .select('*')
      .order('nume');

    if (eroareGrupe) {
      setEroare(eroareGrupe.message);
      setSeIncarca(false);
      return;
    }

    const { data: claseData } = await supabase.from('grupe_clase').select('grupa_id, clasa_cod');
    const { data: invData } = await supabase
      .from('grupe_invatatori')
      .select('grupa_id, app_users(*)');

    const rezultat: Grupa[] = (grupeData ?? []).map((g) => ({
      ...g,
      clase: (claseData ?? []).filter((c) => c.grupa_id === g.id).map((c) => c.clasa_cod),
      invatatori: (invData ?? [])
        .filter((i: any) => i.grupa_id === g.id)
        .map((i: any) => i.app_users),
    }));

    setGrupe(rezultat);
    setSeIncarca(false);
  }, []);

  useEffect(() => {
    incarca();
  }, [incarca]);

  async function creeazaGrupa(input: {
    nume: string;
    culoare_hex: string;
    link_materiale: string | null;
    clase: string[];
  }) {
    const { data, error } = await supabase
      .from('grupe')
      .insert({ nume: input.nume, culoare_hex: input.culoare_hex, link_materiale: input.link_materiale })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Eroare la creare grupă');

    if (input.clase.length > 0) {
      await supabase.from('grupe_clase').insert(input.clase.map((cod) => ({ grupa_id: data.id, clasa_cod: cod })));
    }
    await incarca();
  }

  async function actualizeazaGrupa(
    id: string,
    input: { nume: string; culoare_hex: string; link_materiale: string | null; clase: string[] }
  ) {
    const { error } = await supabase
      .from('grupe')
      .update({ nume: input.nume, culoare_hex: input.culoare_hex, link_materiale: input.link_materiale })
      .eq('id', id);
    if (error) throw new Error(error.message);

    await supabase.from('grupe_clase').delete().eq('grupa_id', id);
    if (input.clase.length > 0) {
      await supabase.from('grupe_clase').insert(input.clase.map((cod) => ({ grupa_id: id, clasa_cod: cod })));
    }
    await incarca();
  }

  async function stergeGrupa(id: string) {
    const { error } = await supabase.from('grupe').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await incarca();
  }

  async function asigneazaInvatatori(grupaId: string, invatatorIds: string[]) {
    await supabase.from('grupe_invatatori').delete().eq('grupa_id', grupaId);
    if (invatatorIds.length > 0) {
      await supabase
        .from('grupe_invatatori')
        .insert(invatatorIds.map((invatator_id) => ({ grupa_id: grupaId, invatator_id })));
    }
    await incarca();
  }

  return { grupe, seIncarca, eroare, incarca, creeazaGrupa, actualizeazaGrupa, stergeGrupa, asigneazaInvatatori };
}
