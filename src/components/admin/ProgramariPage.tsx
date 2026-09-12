import { useState } from 'react';
import { useGrupe } from '@/hooks/useGrupe';
import { useProgramari } from '@/hooks/useProgramari';
import { formateazaData } from '@/lib/clase';
import { Buton, Card, Input, Select, Modal, Confirmare, Spinner, Alerta, Badge } from '@/components/common/UI';
import type { Programare } from '@/types';

interface Form {
  data_lectie: string;
  titlu: string;
  invatator_principal_id: string;
  ajutoare: string[];
  vizibil_pentru_toti: boolean;
}
const FORM_GOL: Form = { data_lectie: '', titlu: '', invatator_principal_id: '', ajutoare: [], vizibil_pentru_toti: true };

export default function ProgramariPage() {
  const { grupe, seIncarca: seIncarcaGrupe } = useGrupe();
  const [grupaId, setGrupaId] = useState<string | null>(null);
  const { programari, seIncarca, eroare, creeazaProgramare, actualizeazaProgramare, stergeProgramare } = useProgramari(grupaId);

  const [modalDeschis, setModalDeschis] = useState(false);
  const [editat, setEditat] = useState<Programare | null>(null);
  const [form, setForm] = useState<Form>(FORM_GOL);
  const [deSters, setDeSters] = useState<Programare | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroareForm, setEroareForm] = useState<string | null>(null);

  const grupaSelectata = grupe.find((g) => g.id === grupaId) ?? null;
  const invatatoriGrupei = grupaSelectata?.invatatori ?? [];

  function deschideAdaugare() {
    setEditat(null);
    setForm(FORM_GOL);
    setEroareForm(null);
    setModalDeschis(true);
  }

  function deschideEditare(p: Programare) {
    setEditat(p);
    setForm({
      data_lectie: p.data_lectie,
      titlu: p.titlu,
      invatator_principal_id: p.invatator_principal_id ?? '',
      ajutoare: p.ajutoare ?? [],
      vizibil_pentru_toti: p.vizibil_pentru_toti,
    });
    setEroareForm(null);
    setModalDeschis(true);
  }

  function toggleAjutor(id: string) {
    setForm((f) => ({ ...f, ajutoare: f.ajutoare.includes(id) ? f.ajutoare.filter((a) => a !== id) : [...f.ajutoare, id] }));
  }

  async function salveaza() {
    if (!grupaId) return;
    if (!form.data_lectie || !form.titlu.trim()) {
      setEroareForm('Data și titlul lecției sunt obligatorii.');
      return;
    }
    setSeSalveaza(true);
    setEroareForm(null);
    try {
      const input = {
        grupa_id: grupaId,
        data_lectie: form.data_lectie,
        titlu: form.titlu.trim(),
        invatator_principal_id: form.invatator_principal_id || null,
        vizibil_pentru_toti: form.vizibil_pentru_toti,
        ajutoare: form.ajutoare,
      };
      if (editat) await actualizeazaProgramare(editat.id, input);
      else await creeazaProgramare(input);
      setModalDeschis(false);
    } catch (e: any) {
      setEroareForm(e.message ?? 'A apărut o eroare.');
    } finally {
      setSeSalveaza(false);
    }
  }

  async function confirmaStergere() {
    if (!deSters) return;
    await stergeProgramare(deSters.id);
    setDeSters(null);
  }

  function numeInvatator(id: string | null) {
    if (!id) return '-';
    const i = invatatoriGrupei.find((x) => x.id === id);
    return i ? `${i.prenume} ${i.nume}` : '-';
  }

  if (seIncarcaGrupe) return <Spinner />;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Programări</h1>

      <Card style={{ marginBottom: 16 }}>
        <Select eticheta="Alege grupa" value={grupaId ?? ''} onChange={(e) => setGrupaId(e.target.value || null)}>
          <option value="">— selectează o grupă —</option>
          {grupe.map((g) => (
            <option key={g.id} value={g.id}>{g.nume}</option>
          ))}
        </Select>
      </Card>

      {!grupaId && <p style={{ color: '#6b7280' }}>Selectează o grupă pentru a vedea și adăuga programări.</p>}

      {grupaId && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Buton onClick={deschideAdaugare} disabled={invatatoriGrupei.length === 0}>+ Adaugă programare</Buton>
          </div>
          {invatatoriGrupei.length === 0 && (
            <Alerta tip="info" mesaj="Această grupă nu are încă învățători asignați. Asignează cel puțin un învățător înainte de a face programări." />
          )}

          {eroare && <Alerta tip="eroare" mesaj={eroare} />}
          {seIncarca ? (
            <Spinner />
          ) : (
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              {programari.map((p) => (
                <Card key={p.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{p.titlu}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{formateazaData(p.data_lectie)}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                        Principal: {numeInvatator(p.invatator_principal_id)}
                        {p.ajutoare && p.ajutoare.length > 0 && ` · Ajutor: ${p.ajutoare.map(numeInvatator).join(', ')}`}
                      </p>
                      {p.vizibil_pentru_toti && <Badge texte="Vizibil pentru toți" culoareFundal="#eff6ff" culoareText="#1e40af" />}
                    </div>
                    <div>
                      <Buton variant="text" onClick={() => deschideEditare(p)}>Editează</Buton>
                      <Buton variant="text" onClick={() => setDeSters(p)} style={{ color: '#dc2626' }}>Șterge</Buton>
                    </div>
                  </div>
                </Card>
              ))}
              {programari.length === 0 && <p style={{ color: '#6b7280' }}>Nu există programări pentru această grupă.</p>}
            </div>
          )}
        </>
      )}

      {modalDeschis && (
        <Modal titlu={editat ? 'Editează programare' : 'Adaugă programare'} onClose={() => setModalDeschis(false)} latime={520}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {eroareForm && <Alerta tip="eroare" mesaj={eroareForm} />}
            <Input eticheta="Data lecției" type="date" value={form.data_lectie} onChange={(e) => setForm({ ...form, data_lectie: e.target.value })} />
            <Input eticheta="Titlul lecției" value={form.titlu} onChange={(e) => setForm({ ...form, titlu: e.target.value })} />
            <Select
              eticheta="Învățător principal"
              value={form.invatator_principal_id}
              onChange={(e) => setForm({ ...form, invatator_principal_id: e.target.value })}
            >
              <option value="">— niciunul —</option>
              {invatatoriGrupei.map((i) => (
                <option key={i.id} value={i.id}>{i.prenume} {i.nume}</option>
              ))}
            </Select>
            <div>
              <span style={{ fontSize: 13, color: '#4b5563' }}>Învățători ajutor</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {invatatoriGrupei
                  .filter((i) => i.id !== form.invatator_principal_id)
                  .map((i) => (
                    <label key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.ajutoare.includes(i.id)} onChange={() => toggleAjutor(i.id)} />
                      {i.prenume} {i.nume}
                    </label>
                  ))}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.vizibil_pentru_toti}
                onChange={(e) => setForm({ ...form, vizibil_pentru_toti: e.target.checked })}
              />
              Vizibil pentru toți învățătorii grupei (la "lecția actuală")
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <Buton variant="secundar" onClick={() => setModalDeschis(false)}>Anulează</Buton>
              <Buton onClick={salveaza} disabled={seSalveaza}>{seSalveaza ? 'Se salvează...' : 'Salvează'}</Buton>
            </div>
          </div>
        </Modal>
      )}

      {deSters && (
        <Confirmare
          titlu="Șterge programare"
          mesaj={`Sigur vrei să ștergi programarea "${deSters.titlu}" din ${formateazaData(deSters.data_lectie)}?`}
          onConfirma={confirmaStergere}
          onAnuleaza={() => setDeSters(null)}
          pericol
        />
      )}
    </div>
  );
}
