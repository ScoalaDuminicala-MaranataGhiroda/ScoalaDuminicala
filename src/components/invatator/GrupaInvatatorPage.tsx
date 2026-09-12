import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGrupe } from '@/hooks/useGrupe';
import { useCopiiGrupa } from '@/hooks/useCopiiGrupa';
import { useLectiiParcurse } from '@/hooks/useStatistici';
import { supabase } from '@/lib/supabase';
import { numeClasa, formateazaData } from '@/lib/clase';
import { Buton, Card, Input, Modal, Spinner, Badge } from '@/components/common/UI';
import { useEffect } from 'react';
import type { Material } from '@/types';

export default function GrupaInvatatorPage() {
  const { grupaId } = useParams<{ grupaId: string }>();
  const navigate = useNavigate();
  const { grupe, seIncarca: seIncarcaGrupe } = useGrupe();
  const { copii, seIncarca: seIncarcaCopii } = useCopiiGrupa(grupaId!);
  const { lectii } = useLectiiParcurse(grupaId!);

  const [materiale, setMateriale] = useState<Material[]>([]);
  const [numeMaterial, setNumeMaterial] = useState('');
  const [cantitateMaterial, setCantitateMaterial] = useState('');
  const [lectieDeschisa, setLectieDeschisa] = useState<(typeof lectii)[number] | null>(null);

  const grupa = grupe.find((g) => g.id === grupaId);

  async function incarcaMateriale() {
    const { data } = await supabase.from('materiale').select('*').eq('grupa_id', grupaId).order('creat_la');
    setMateriale(data ?? []);
  }

  useEffect(() => {
    incarcaMateriale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupaId]);

  async function adaugaMaterial() {
    if (!numeMaterial.trim() || !cantitateMaterial.trim()) return;
    await supabase.from('materiale').insert({ grupa_id: grupaId, denumire: numeMaterial.trim(), cantitate: cantitateMaterial.trim() });
    setNumeMaterial('');
    setCantitateMaterial('');
    await incarcaMateriale();
  }

  if (seIncarcaGrupe || seIncarcaCopii) return <Spinner />;
  if (!grupa) return <p>Grupa nu a fost găsită.</p>;

  return (
    <div>
      <Buton variant="text" onClick={() => navigate('/invatator')}>← Înapoi la pagina principală</Buton>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 20px' }}>
        <Badge texte={grupa.nume} culoareFundal={grupa.culoare_hex} culoareText="#fff" />
        {grupa.link_materiale && (
          <a href={grupa.link_materiale} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#2563eb' }}>
            Materiale lecții (Drive) →
          </a>
        )}
        <Buton onClick={() => navigate(`/invatator/grupa/${grupaId}/lectia-actuala`)} style={{ marginLeft: 'auto' }}>
          Lecția actuală
        </Buton>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Copii ({copii.length})</h2>
      <div style={{ overflowX: 'auto', marginBottom: 28 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12 }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              {['Nume', 'Clasă', 'Adeverință', 'Prezențe', 'La fix', 'Biblie', 'Caiet', 'Pix', 'Total'].map((h) => (
                <th key={h} style={{ padding: '8px 10px', fontSize: 12, color: '#4b5563' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copii.map((c) => (
              <tr key={c.copil_id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{c.nume_prenume}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{numeClasa(c.clasa_cod)}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>-</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{c.nr_prezente}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{c.nr_prezente_fix}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{c.nr_biblie}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{c.nr_caiet}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{c.nr_pix}</td>
                <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}>{c.total_general}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Materiale necesare</h2>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Input eticheta="Material" value={numeMaterial} onChange={(e) => setNumeMaterial(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <Input eticheta="Cantitate" value={cantitateMaterial} onChange={(e) => setCantitateMaterial(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Buton onClick={adaugaMaterial}>Adaugă</Buton>
          </div>
        </div>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
        {materiale.map((m) => (
          <Card key={m.id} style={{ padding: 12 }}>
            <span style={{ fontWeight: 500 }}>{m.denumire}</span>
            <span style={{ color: '#6b7280', marginLeft: 8, fontSize: 14 }}>({m.cantitate})</span>
          </Card>
        ))}
        {materiale.length === 0 && <p style={{ color: '#6b7280', fontSize: 14 }}>Nicio cerere de materiale momentan.</p>}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Lecții parcurse</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lectii.map((l) => (
          <Card key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500 }}>{l.titlu}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{formateazaData(l.data_lectie)}</p>
            </div>
            <Buton variant="secundar" onClick={() => setLectieDeschisa(l)}>Detalii</Buton>
          </Card>
        ))}
        {lectii.length === 0 && <p style={{ color: '#6b7280', fontSize: 14 }}>Nu există lecții parcurse încă.</p>}
      </div>

      {lectieDeschisa && (
        <Modal titlu={`${lectieDeschisa.titlu} — ${formateazaData(lectieDeschisa.data_lectie)}`} onClose={() => setLectieDeschisa(null)} latime={760}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'center' }}>
                  <th style={{ padding: 6, textAlign: 'left' }}>Copil</th>
                  <th style={{ padding: 6 }}>Fix</th>
                  <th style={{ padding: 6 }}>Prezent</th>
                  <th style={{ padding: 6 }}>Biblie</th>
                  <th style={{ padding: 6 }}>Caiet</th>
                  <th style={{ padding: 6 }}>Pix</th>
                  <th style={{ padding: 6 }}>P+</th>
                  <th style={{ padding: 6 }}>P-</th>
                  <th style={{ padding: 6 }}>Bonus</th>
                  <th style={{ padding: 6 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lectieDeschisa.copii.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <td style={{ padding: 6, textAlign: 'left' }}>{c.nume_prenume}</td>
                    <td style={{ padding: 6 }}>{c.prezent_fix ? '✓' : ''}</td>
                    <td style={{ padding: 6 }}>{c.prezent ? '✓' : ''}</td>
                    <td style={{ padding: 6 }}>{c.biblie ? '✓' : ''}</td>
                    <td style={{ padding: 6 }}>{c.caiet ? '✓' : ''}</td>
                    <td style={{ padding: 6 }}>{c.pix ? '✓' : ''}</td>
                    <td style={{ padding: 6 }}>{c.puncte_plus}</td>
                    <td style={{ padding: 6 }}>{c.puncte_minus}</td>
                    <td style={{ padding: 6 }}>{c.bonus}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
