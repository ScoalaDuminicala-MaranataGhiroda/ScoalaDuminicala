import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LectieCopil } from '@/types';

interface LectieActualaState {
  seIncarca: boolean;
  areDrepturi: boolean;
  existaProgramareAzi: boolean;
  titlu: string;
  invatatorPrincipalNume: string;
  ajutoareNume: string[];
  copii: (LectieCopil & { nume_prenume: string })[];
}

// Verifica daca invatatorul curent are drept sa vada lectia actuala a unei grupe:
// e programat (principal sau ajutor) SAU programarea e "vizibil pentru toti".
// Daca lectia nu exista inca in lectii_parcurse, o creeaza (upsert) la accesare.
export function useLectiaActuala(grupaId: string, invatatorId: string) {
  const [stare, setStare] = useState<LectieActualaState>({
    seIncarca: true,
    areDrepturi: false,
    existaProgramareAzi: false,
    titlu: '',
    invatatorPrincipalNume: '',
    ajutoareNume: [],
    copii: [],
  });
  const [lectieId, setLectieId] = useState<string | null>(null);

  const incarca = useCallback(async () => {
    setStare((s) => ({ ...s, seIncarca: true }));
    const azi = new Date().toISOString().substring(0, 10);

    const { data: programare } = await supabase
      .from('programari')
      .select('*, programari_ajutoare(invatator_id)')
      .eq('grupa_id', grupaId)
      .eq('data_lectie', azi)
      .maybeSingle();

    if (!programare) {
      setStare({
        seIncarca: false,
        areDrepturi: false,
        existaProgramareAzi: false,
        titlu: '',
        invatatorPrincipalNume: '',
        ajutoareNume: [],
        copii: [],
      });
      return;
    }

    const ajutoareIds: string[] = (programare as any).programari_ajutoare.map((a: any) => a.invatator_id);
    const areDrepturi =
      programare.vizibil_pentru_toti ||
      programare.invatator_principal_id === invatatorId ||
      ajutoareIds.includes(invatatorId);

    if (!areDrepturi) {
      setStare({
        seIncarca: false,
        areDrepturi: false,
        existaProgramareAzi: true,
        titlu: programare.titlu,
        invatatorPrincipalNume: '',
        ajutoareNume: [],
        copii: [],
      });
      return;
    }

    // creeaza lectia parcursa daca nu exista (upsert pe programare_id, care e unique)
    let { data: lectie } = await supabase
      .from('lectii_parcurse')
      .select('*')
      .eq('programare_id', programare.id)
      .maybeSingle();

    if (!lectie) {
      const { data: lectieNoua } = await supabase
        .from('lectii_parcurse')
        .insert({
          programare_id: programare.id,
          grupa_id: grupaId,
          data_lectie: programare.data_lectie,
          titlu: programare.titlu,
          invatator_principal_id: programare.invatator_principal_id,
        })
        .select()
        .single();
      lectie = lectieNoua;

      if (lectie && ajutoareIds.length > 0) {
        await supabase
          .from('lectii_parcurse_ajutoare')
          .insert(ajutoareIds.map((invatator_id) => ({ lectie_id: lectie!.id, invatator_id })));
      }

      // creeaza randuri lectii_copii pt toti copiii grupei (initial toate false/0)
      const { data: copiiGrupa } = await supabase.from('copii').select('id').eq('grupa_id', grupaId);
      if (lectie && copiiGrupa && copiiGrupa.length > 0) {
        await supabase
          .from('lectii_copii')
          .insert(copiiGrupa.map((c) => ({ lectie_id: lectie!.id, copil_id: c.id })));
      }
    }

    setLectieId(lectie!.id);

    const { data: copiiData } = await supabase
      .from('lectii_copii')
      .select('*, copii(nume_prenume)')
      .eq('lectie_id', lectie!.id)
      .order('copii(nume_prenume)');

    const { data: numeInvatatori } = await supabase
      .from('app_users')
      .select('id, nume, prenume')
      .in('id', [programare.invatator_principal_id, ...ajutoareIds].filter(Boolean));

    const numeDupaId = (id: string | null) => {
      const u = (numeInvatatori ?? []).find((x) => x.id === id);
      return u ? `${u.prenume} ${u.nume}` : '';
    };

    setStare({
      seIncarca: false,
      areDrepturi: true,
      existaProgramareAzi: true,
      titlu: programare.titlu,
      invatatorPrincipalNume: numeDupaId(programare.invatator_principal_id),
      ajutoareNume: ajutoareIds.map(numeDupaId),
      copii: (copiiData ?? []).map((c: any) => ({ ...c, nume_prenume: c.copii.nume_prenume })),
    });
  }, [grupaId, invatatorId]);

  useEffect(() => {
    incarca();
  }, [incarca]);

  // Salvare live: fiecare modificare face imediat un update in DB (draft continuu, fara "final de zi")
  async function actualizeazaCopil(lectieCopilId: string, campuri: Partial<LectieCopil>) {
    // daca se bifeaza "prezent la fix", se bifeaza automat si "prezent"
    const campuriFinale = { ...campuri };
    if (campuri.prezent_fix === true) {
      campuriFinale.prezent = true;
    }
    const { total, id, lectie_id, copil_id, actualizat_la, ...permise } = campuriFinale as any;
    const { error } = await supabase
      .from('lectii_copii')
      .update({ ...permise, actualizat_la: new Date().toISOString() })
      .eq('id', lectieCopilId);
    if (error) throw new Error(error.message);

    setStare((s) => ({
      ...s,
      copii: s.copii.map((c) => (c.id === lectieCopilId ? { ...c, ...campuriFinale } : c)),
    }));
  }

  return { ...stare, lectieId, actualizeazaCopil };
}
