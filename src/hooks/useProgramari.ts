import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Programare } from '@/types';

export function useProgramari(grupaId: string | null) {
  const [programari, setProgramari] = useState<Programare[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  const incarca = useCallback(async () => {
    if (!grupaId) {
      setProgramari([]);
      setSeIncarca(false);
      return;
    }
    setSeIncarca(true);
    const { data, error } = await supabase
      .from('programari')
      .select('*, programari_ajutoare(invatator_id)')
      .eq('grupa_id', grupaId)
      .order('data_lectie', { ascending: false });
    if (error) {
      setEroare(error.message);
    } else {
      setProgramari(
        (data ?? []).map((p: any) => ({ ...p, ajutoare: p.programari_ajutoare.map((a: any) => a.invatator_id) }))
      );
    }
    setSeIncarca(false);
  }, [grupaId]);

  useEffect(() => {
    incarca();
  }, [incarca]);

  async function creeazaProgramare(input: {
    grupa_id: string;
    data_lectie: string;
    titlu: string;
    invatator_principal_id: string | null;
    vizibil_pentru_toti: boolean;
    ajutoare: string[];
  }) {
    const { data, error } = await supabase
      .from('programari')
      .insert({
        grupa_id: input.grupa_id,
        data_lectie: input.data_lectie,
        titlu: input.titlu,
        invatator_principal_id: input.invatator_principal_id,
        vizibil_pentru_toti: input.vizibil_pentru_toti,
      })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Eroare la creare programare (poate exista deja o lecție în acea zi pentru grupă).');
    if (input.ajutoare.length > 0) {
      await supabase
        .from('programari_ajutoare')
        .insert(input.ajutoare.map((invatator_id) => ({ programare_id: data.id, invatator_id })));
    }
    await incarca();
  }

  async function actualizeazaProgramare(
    id: string,
    input: {
      data_lectie: string;
      titlu: string;
      invatator_principal_id: string | null;
      vizibil_pentru_toti: boolean;
      ajutoare: string[];
    }
  ) {
    const { error } = await supabase
      .from('programari')
      .update({
        data_lectie: input.data_lectie,
        titlu: input.titlu,
        invatator_principal_id: input.invatator_principal_id,
        vizibil_pentru_toti: input.vizibil_pentru_toti,
      })
      .eq('id', id);
    if (error) throw new Error(error.message);
    await supabase.from('programari_ajutoare').delete().eq('programare_id', id);
    if (input.ajutoare.length > 0) {
      await supabase
        .from('programari_ajutoare')
        .insert(input.ajutoare.map((invatator_id) => ({ programare_id: id, invatator_id })));
    }
    await incarca();
  }

  async function stergeProgramare(id: string) {
    const { error } = await supabase.from('programari').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await incarca();
  }

  return { programari, seIncarca, eroare, incarca, creeazaProgramare, actualizeazaProgramare, stergeProgramare };
}
