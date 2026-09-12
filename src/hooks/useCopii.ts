import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Copil } from '@/types';

export interface CopilInput {
  nume_prenume: string;
  clasa_cod: string;
  scoala: string | null;
  adresa: string | null;
  data_nasterii: string | null;
  are_nevoie_adeverinta: boolean;
}

export function useCopii() {
  const [copii, setCopii] = useState<Copil[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  const incarca = useCallback(async () => {
    setSeIncarca(true);
    const { data, error } = await supabase.from('copii').select('*').order('nume_prenume');
    if (error) setEroare(error.message);
    else setCopii(data ?? []);
    setSeIncarca(false);
  }, []);

  useEffect(() => {
    incarca();
  }, [incarca]);

  async function creeazaCopil(input: CopilInput) {
    const { error } = await supabase.from('copii').insert(input);
    if (error) throw new Error(error.message);
    await incarca();
  }

  async function actualizeazaCopil(id: string, input: CopilInput) {
    const { error } = await supabase.from('copii').update(input).eq('id', id);
    if (error) throw new Error(error.message);
    await incarca();
  }

  async function stergeCopil(id: string) {
    const { error } = await supabase.from('copii').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await incarca();
  }

  return { copii, seIncarca, eroare, incarca, creeazaCopil, actualizeazaCopil, stergeCopil };
}
