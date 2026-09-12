import { useState } from 'react';
import { useGrupe } from '@/hooks/useGrupe';
import { CLASE_SCOLARE } from '@/lib/clase';
import { Buton, Card, Input, Modal, Confirmare, Badge, Spinner, Alerta } from '@/components/common/UI';
import type { Grupa } from '@/types';

interface FormGrupa {
  nume: string;
  culoare_hex: string;
  link_materiale: string;
  clase: string[];
}

const FORM_GOL: FormGrupa = { nume: '', culoare_hex: '#4A90D9', link_materiale: '', clase: [] };

export default function GrupePage() {
  const { grupe, seIncarca, eroare, creeazaGrupa, actualizeazaGrupa, stergeGrupa } = useGrupe();
  const [modalDeschis, setModalDeschis] = useState(false);
  const [grupaEditata, setGrupaEditata] = useState<Grupa | null>(null);
  const [form, setForm] = useState<FormGrupa>(FORM_GOL);
  const [deSters, setDeSters] = useState<Grupa | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroareForm, setEroareForm] = useState<string | null>(null);

  function deschideAdaugare() {
    setGrupaEditata(null);
    setForm(FORM_GOL);
    setEroareForm(null);
    setModalDeschis(true);
  }

  function deschideEditare(g: Grupa) {
    setGrupaEditata(g);
    setForm({
      nume: g.nume,
      culoare_hex: g.culoare_hex,
      link_materiale: g.link_materiale ?? '',
      clase: g.clase ?? [],
    });
    setEroareForm(null);
    setModalDeschis(true);
  }

  function toggleClasa(cod: string) {
    setForm((f) => ({
      ...f,
      clase: f.clase.includes(cod) ? f.clase.filter((c) => c !== cod) : [...f.clase, cod],
    }));
  }

  async function salveaza() {
    if (!form.nume.trim()) {
      setEroareForm('Numele grupei este obligatoriu.');
      return;
    }
    if (form.clase.length === 0) {
      setEroareForm('Selectează cel puțin o clasă.');
      return;
    }
    setSeSalveaza(true);
    setEroareForm(null);
    try {
      const input = {
        nume: form.nume.trim(),
        culoare_hex: form.culoare_hex,
        link_materiale: form.link_materiale.trim() || null,
        clase: form.clase,
      };
      if (grupaEditata) {
        await actualizeazaGrupa(grupaEditata.id, input);
      } else {
        await creeazaGrupa(input);
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
    await stergeGrupa(deSters.id);
    setDeSters(null);
  }

  if (seIncarca) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Grupe</h1>
        <Buton onClick={deschideAdaugare}>+ Adaugă grupă</Buton>
      </div>

      {eroare && <Alerta tip="eroare" mesaj={eroare} />}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {grupe.map((g) => (
          <Card key={g.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <Badge texte={g.nume} culoareFundal={g.culoare_hex} culoareText="#fff" />
              <div style={{ display: 'flex', gap: 4 }}>
                <Buton variant="text" onClick={() => deschideEditare(g)}>Editează</Buton>
                <Buton variant="text" onClick={() => setDeSters(g)} style={{ color: '#dc2626' }}>Șterge</Buton>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '10px 0 4px' }}>
              Clase: {(g.clase ?? []).map((c) => CLASE_SCOLARE.find((cs) => cs.cod === c)?.nume_afisat ?? c).join(', ')}
            </p>
            {g.link_materiale && (
              <a href={g.link_materiale} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb' }}>
                Materiale (Drive) →
              </a>
            )}
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>
              Învățători: {(g.invatatori ?? []).map((i) => `${i.prenume} ${i.nume}`).join(', ') || 'niciunul asignat'}
            </p>
          </Card>
        ))}
        {grupe.length === 0 && <p style={{ color: '#6b7280' }}>Nu există grupe create încă.</p>}
      </div>

      {modalDeschis && (
        <Modal titlu={grupaEditata ? 'Editează grupa' : 'Adaugă grupă'} onClose={() => setModalDeschis(false)} latime={560}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {eroareForm && <Alerta tip="eroare" mesaj={eroareForm} />}
            <Input eticheta="Nume grupă" value={form.nume} onChange={(e) => setForm({ ...form, nume: e.target.value })} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: '#4b5563' }}>Culoare</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.culoare_hex}
                  onChange={(e) => setForm({ ...form, culoare_hex: e.target.value })}
                  style={{ width: 44, height: 36, border: 'none', padding: 0, background: 'none', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, color: '#6b7280' }}>{form.culoare_hex}</span>
              </div>
            </label>
            <Input
              eticheta="Link materiale (Google Drive)"
              value={form.link_materiale}
              onChange={(e) => setForm({ ...form, link_materiale: e.target.value })}
              placeholder="https://drive.google.com/..."
            />
            <div>
              <span style={{ fontSize: 13, color: '#4b5563' }}>Clase componente</span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 6,
                  marginTop: 6,
                  maxHeight: 220,
                  overflowY: 'auto',
                  padding: 8,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                }}
              >
                {CLASE_SCOLARE.map((c) => (
                  <label key={c.cod} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.clase.includes(c.cod)} onChange={() => toggleClasa(c.cod)} />
                    {c.nume_afisat}
                  </label>
                ))}
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
          titlu="Șterge grupa"
          mesaj={`Sigur vrei să ștergi grupa "${deSters.nume}"? Copiii asignați vor rămâne fără grupă.`}
          onConfirma={confirmaStergere}
          onAnuleaza={() => setDeSters(null)}
          pericol
        />
      )}
    </div>
  );
}
