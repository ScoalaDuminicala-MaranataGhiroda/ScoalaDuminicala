import { useState } from 'react';
import { useInvatatori } from '@/hooks/useInvatatori';
import { useGrupe } from '@/hooks/useGrupe';
import { supabase } from '@/lib/supabase';
import { Buton, Card, Input, Modal, Confirmare, Spinner, Alerta, Badge } from '@/components/common/UI';
import type { AppUser } from '@/types';

interface Form {
  nume: string;
  prenume: string;
  username: string;
  password: string;
}
const FORM_GOL: Form = { nume: '', prenume: '', username: '', password: '' };

export default function InvatatoriPage() {
  const { invatatori, seIncarca, eroare, creeazaInvatator, actualizeazaInvatator, stergeInvatator } = useInvatatori();
  const { grupe, asigneazaInvatatori } = useGrupe();

  const [modalDeschis, setModalDeschis] = useState(false);
  const [editat, setEditat] = useState<AppUser | null>(null);
  const [form, setForm] = useState<Form>(FORM_GOL);
  const [grupeSelectate, setGrupeSelectate] = useState<string[]>([]);
  const [deSters, setDeSters] = useState<AppUser | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroareForm, setEroareForm] = useState<string | null>(null);

  function deschideAdaugare() {
    setEditat(null);
    setForm(FORM_GOL);
    setGrupeSelectate([]);
    setEroareForm(null);
    setModalDeschis(true);
  }

  function deschideEditare(inv: AppUser) {
    setEditat(inv);
    setForm({ nume: inv.nume ?? '', prenume: inv.prenume ?? '', username: inv.username, password: inv.password });
    setGrupeSelectate(grupe.filter((g) => (g.invatatori ?? []).some((i) => i.id === inv.id)).map((g) => g.id));
    setEroareForm(null);
    setModalDeschis(true);
  }

  function toggleGrupa(id: string) {
    setGrupeSelectate((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  async function salveaza() {
    if (!form.nume.trim() || !form.prenume.trim() || !form.username.trim() || !form.password) {
      setEroareForm('Toate câmpurile sunt obligatorii.');
      return;
    }
    setSeSalveaza(true);
    setEroareForm(null);
    try {
      let invatatorId = editat?.id;
      if (editat) {
        await actualizeazaInvatator(editat.id, form);
      } else {
        await creeazaInvatator(form);
      }
      // pentru a asigna grupele imediat dupa creare, reincarcam lista si gasim id-ul nou
      if (!invatatorId) {
        // mic hack simplu: cautam dupa username, unic
        const { data } = await supabase.from('app_users').select('id').eq('username', form.username.trim()).single();
        invatatorId = data?.id;
      }
      // actualizeaza apartenenta la grupe: scoate invatatorul din toate, apoi adauga-l unde trebuie
      for (const g of grupe) {
        const eSelectata = grupeSelectate.includes(g.id);
        const eraDeja = (g.invatatori ?? []).some((i) => i.id === invatatorId);
        if (eSelectata !== eraDeja) {
          const idActuale = (g.invatatori ?? []).map((i) => i.id);
          const noiIdActuale = eSelectata
            ? [...idActuale, invatatorId!]
            : idActuale.filter((id) => id !== invatatorId);
          await asigneazaInvatatori(g.id, noiIdActuale);
        }
      }
      setModalDeschis(false);
    } catch (e: any) {
      setEroareForm(e.message ?? 'A apărut o eroare.');
    } finally {
      setSeSalveaza(false);
    }
  }

  async function confirmaStergere() {
    if (!deSters) return;
    await stergeInvatator(deSters.id);
    setDeSters(null);
  }

  if (seIncarca) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Învățători</h1>
        <Buton onClick={deschideAdaugare}>+ Adaugă învățător</Buton>
      </div>

      {eroare && <Alerta tip="eroare" mesaj={eroare} />}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {invatatori.map((inv) => {
          const grupeleLui = grupe.filter((g) => (g.invatatori ?? []).some((i) => i.id === inv.id));
          return (
            <Card key={inv.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 500, margin: 0 }}>{inv.prenume} {inv.nume}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>user: {inv.username}</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Buton variant="text" onClick={() => deschideEditare(inv)}>Editează</Buton>
                  <Buton variant="text" onClick={() => setDeSters(inv)} style={{ color: '#dc2626' }}>Șterge</Buton>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {grupeleLui.length === 0 && <span style={{ fontSize: 13, color: '#9ca3af' }}>fără grupe asignate</span>}
                {grupeleLui.map((g) => (
                  <Badge key={g.id} texte={g.nume} culoareFundal={g.culoare_hex} culoareText="#fff" />
                ))}
              </div>
            </Card>
          );
        })}
        {invatatori.length === 0 && <p style={{ color: '#6b7280' }}>Nu există învățători adăugați încă.</p>}
      </div>

      {modalDeschis && (
        <Modal titlu={editat ? 'Editează învățător' : 'Adaugă învățător'} onClose={() => setModalDeschis(false)} latime={520}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {eroareForm && <Alerta tip="eroare" mesaj={eroareForm} />}
            <div style={{ display: 'flex', gap: 10 }}>
              <Input eticheta="Prenume" value={form.prenume} onChange={(e) => setForm({ ...form, prenume: e.target.value })} />
              <Input eticheta="Nume" value={form.nume} onChange={(e) => setForm({ ...form, nume: e.target.value })} />
            </div>
            <Input eticheta="Nume utilizator" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <Input eticheta="Parolă" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <div>
              <span style={{ fontSize: 13, color: '#4b5563' }}>Grupe asignate</span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  marginTop: 6,
                  maxHeight: 180,
                  overflowY: 'auto',
                  padding: 8,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                }}
              >
                {grupe.map((g) => (
                  <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={grupeSelectate.includes(g.id)} onChange={() => toggleGrupa(g.id)} />
                    {g.nume}
                  </label>
                ))}
                {grupe.length === 0 && <span style={{ fontSize: 13, color: '#9ca3af' }}>Nu există grupe create încă.</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <Buton variant="secundar" onClick={() => setModalDeschis(false)}>Anulează</Buton>
              <Buton onClick={salveaza} disabled={seSalveaza}>{seSalveaza ? 'Se salvează...' : 'Salvează'}</Buton>
            </div>
          </div>
        </Modal>
      )}

      {deSters && (
        <Confirmare
          titlu="Șterge învățător"
          mesaj={`Sigur vrei să ștergi pe ${deSters.prenume} ${deSters.nume}?`}
          onConfirma={confirmaStergere}
          onAnuleaza={() => setDeSters(null)}
          pericol
        />
      )}
    </div>
  );
}
