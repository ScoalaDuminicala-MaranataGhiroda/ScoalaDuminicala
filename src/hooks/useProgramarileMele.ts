import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProgramareProprie {
  id: string;
  data_lectie: string;
  titlu: string;
  grupa_id: string;
  grupa_nume: string;
  grupa_culoare: string;
  rol: 'principal' | 'ajutor';
}

// Aduna programarile in care invatatorul apare fie ca principal, fie ca
// ajutor, indiferent de grupa - DOAR cele de azi sau din viitor (cele din
// trecut nu mai apar pe pagina principala, ca sa nu se umple cu istoric).
export function useProgramarileMele(invatatorId: string) {
  const [programari, setProgramari] = useState<ProgramareProprie[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);

  useEffect(() => {
    async function incarca() {
      setSeIncarca(true);
      const azi = new Date().toISOString().substring(0, 10); // YYYY-MM-DD, ora locala a dispozitivului

      const { data: caPrincipal } = await supabase
        .from('programari')
        .select('id, data_lectie, titlu, grupa_id, grupe(nume, culoare_hex)')
        .eq('invatator_principal_id', invatatorId)
        .gte('data_lectie', azi);

      const { data: caAjutorLinks } = await supabase
        .from('programari_ajutoare')
        .select('programare_id')
        .eq('invatator_id', invatatorId);

      const idAjutor = (caAjutorLinks ?? []).map((l) => l.programare_id);
      let caAjutor: any[] = [];
      if (idAjutor.length > 0) {
        const { data } = await supabase
          .from('programari')
          .select('id, data_lectie, titlu, grupa_id, grupe(nume, culoare_hex)')
          .in('id', idAjutor)
          .gte('data_lectie', azi);
        caAjutor = data ?? [];
      }

      const toate: ProgramareProprie[] = [
        ...(caPrincipal ?? []).map((p: any) => ({
          id: p.id,
          data_lectie: p.data_lectie,
          titlu: p.titlu,
          grupa_id: p.grupa_id,
          grupa_nume: p.grupe?.nume ?? '',
          grupa_culoare: p.grupe?.culoare_hex ?? '#999',
          rol: 'principal' as const,
        })),
        ...caAjutor.map((p: any) => ({
          id: p.id,
          data_lectie: p.data_lectie,
          titlu: p.titlu,
          grupa_id: p.grupa_id,
          grupa_nume: p.grupe?.nume ?? '',
          grupa_culoare: p.grupe?.culoare_hex ?? '#999',
          rol: 'ajutor' as const,
        })),
      ].sort((a, b) => a.data_lectie.localeCompare(b.data_lectie));

      setProgramari(toate);
      setSeIncarca(false);
    }
    incarca();
  }, [invatatorId]);

  return { programari, seIncarca };
}
