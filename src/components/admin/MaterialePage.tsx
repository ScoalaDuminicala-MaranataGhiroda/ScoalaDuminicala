import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useGrupe } from '@/hooks/useGrupe';
import { Buton, Card, Select, Spinner, Alerta } from '@/components/common/UI';
import type { Material } from '@/types';

export default function MaterialePage() {
  const { grupe, seIncarca: seIncarcaGrupe } = useGrupe();
  const [grupaId, setGrupaId] = useState<string | null>(null);
  const [materiale, setMateriale] = useState<Material[]>([]);
  const [seIncarca, setSeIncarca] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  const incarca = useCallback(async () => {
    if (!grupaId) {
      setMateriale([]);
      return;
    }
    setSeIncarca(true);
    const { data, error } = await supabase.from('materiale').select('*').eq('grupa_id', grupaId).order('creat_la');
    if (error) setEroare(error.message);
    else setMateriale(data ?? []);
    setSeIncarca(false);
  }, [grupaId]);

  useEffect(() => {
    incarca();
  }, [incarca]);

  async function bifeazaLuat(id: string) {
    await supabase.from('materiale').delete().eq('id', id);
    await incarca();
  }

  if (seIncarcaGrupe) return <Spinner />;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Materiale necesare</h1>

      <Card style={{ marginBottom: 16 }}>
        <Select eticheta="Alege grupa" value={grupaId ?? ''} onChange={(e) => setGrupaId(e.target.value || null)}>
          <option value="">— selectează o grupă —</option>
          {grupe.map((g) => (
            <option key={g.id} value={g.id}>{g.nume}</option>
          ))}
        </Select>
      </Card>

      {eroare && <Alerta tip="eroare" mesaj={eroare} />}

      {grupaId && (seIncarca ? (
        <Spinner />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {materiale.map((m) => (
            <Card key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
              <div>
                <span style={{ fontWeight: 500 }}>{m.denumire}</span>
                <span style={{ color: '#6b7280', marginLeft: 8, fontSize: 14 }}>({m.cantitate})</span>
              </div>
              <Buton variant="secundar" onClick={() => bifeazaLuat(m.id)}>Am luat</Buton>
            </Card>
          ))}
          {materiale.length === 0 && <p style={{ color: '#6b7280' }}>Nu există materiale cerute de această grupă momentan.</p>}
        </div>
      ))}
    </div>
  );
}
