import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Buton, Card, Input, Confirmare, Spinner, Alerta } from '@/components/common/UI';

export default function AnScolarPage() {
  const [anCurent, setAnCurent] = useState('');
  const [anNou, setAnNou] = useState('');
  const [seIncarca, setSeIncarca] = useState(true);
  const [confirmare, setConfirmare] = useState<'incrementeaza' | 'decrementeaza' | null>(null);
  const [seProceseaza, setSeProceseaza] = useState(false);
  const [mesaj, setMesaj] = useState<{ tip: 'eroare' | 'succes'; text: string } | null>(null);

  useEffect(() => {
    supabase
      .from('setari_an_scolar')
      .select('an_scolar')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setAnCurent(data.an_scolar);
          setAnNou(data.an_scolar);
        }
        setSeIncarca(false);
      });
  }, []);

  async function executa() {
    if (!confirmare) return;
    setSeProceseaza(true);
    setMesaj(null);
    const { error } = await supabase.rpc('schimba_an_scolar', {
      p_an_nou: anNou.trim(),
      p_directie: confirmare,
    });
    setSeProceseaza(false);
    setConfirmare(null);
    if (error) {
      setMesaj({ tip: 'eroare', text: error.message });
    } else {
      setAnCurent(anNou.trim());
      setMesaj({
        tip: 'succes',
        text:
          confirmare === 'incrementeaza'
            ? 'Anul școlar a fost actualizat și toți copiii au fost trecuți în clasa următoare.'
            : 'Anul școlar a fost actualizat și toți copiii au fost trecuți în clasa anterioară.',
      });
    }
  }

  if (seIncarca) return <Spinner />;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>An școlar</h1>

      {mesaj && <div style={{ marginBottom: 16 }}><Alerta tip={mesaj.tip} mesaj={mesaj.text} /></div>}

      <Card style={{ maxWidth: 480 }}>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 0 }}>
          Anul școlar curent este <strong>{anCurent}</strong>.
        </p>
        <Input eticheta="Nume an școlar nou" value={anNou} onChange={(e) => setAnNou(e.target.value)} placeholder="ex: 2027-2028" />
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '12px 0' }}>
          Incrementarea trece fiecare copil în clasa următoare (ex: clasa 3 → clasa 4) și
          recalculează automat grupele. Copiii din clasa 12 trec în starea "Absolvent".
          Decrementarea face inversul (inclusiv din "Absolvent" înapoi în clasa 12).
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Buton variant="secundar" onClick={() => setConfirmare('decrementeaza')} disabled={!anNou.trim()}>
            ← Decrementează clasa
          </Buton>
          <Buton onClick={() => setConfirmare('incrementeaza')} disabled={!anNou.trim()}>
            Incrementează clasa →
          </Buton>
        </div>
      </Card>

      {confirmare && (
        <Confirmare
          titlu="Confirmă schimbarea anului școlar"
          mesaj={
            confirmare === 'incrementeaza'
              ? `Toți copiii vor avansa cu o clasă și anul școlar va deveni "${anNou}". Această acțiune nu poate fi anulată automat. Continui?`
              : `Toți copiii vor coborî cu o clasă și anul școlar va deveni "${anNou}". Această acțiune nu poate fi anulată automat. Continui?`
          }
          onConfirma={executa}
          onAnuleaza={() => setConfirmare(null)}
          pericol
        />
      )}
      {seProceseaza && <Spinner />}
    </div>
  );
}
