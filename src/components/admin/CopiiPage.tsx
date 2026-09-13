import { useMemo, useState } from 'react';
import { useCopii, CopilInput } from '@/hooks/useCopii';
import { useGrupe } from '@/hooks/useGrupe';
import { CLASE_SCOLARE, numeClasa, calculeazaVarsta, formateazaData } from '@/lib/clase';
import { descarcaExcel } from '@/lib/excel';
import { Buton, Card, Input, Select, Modal, Confirmare, Spinner, Alerta, Badge } from '@/components/common/UI';
import type { Copil } from '@/types';

const FORM_GOL: CopilInput = {
  nume_prenume: '',
  clasa_cod: CLASE_SCOLARE[0].cod,
  scoala: '',
  adresa: '',
  data_nasterii: '',
  are_nevoie_adeverinta: false,
};

type Sortare = 'nume' | 'clasa' | 'varsta';

export default function CopiiPage() {
  const { copii, seIncarca, eroare, creeazaCopil, actualizeazaCopil, stergeCopil } = useCopii();
  const { grupe } = useGrupe();

  const [modalDeschis, setModalDeschis] = useState(false);
  const [editat, setEditat] = useState<Copil | null>(null);
  const [form, setForm] = useState<CopilInput>(FORM_GOL);
  const [deSters, setDeSters] = useState<Copil | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroareForm, setEroareForm] = useState<string | null>(null);

  const [filtruText, setFiltruText] = useState('');
  const [filtruGrupa, setFiltruGrupa] = useState<string>('toate');
  const [filtruAdeverinta, setFiltruAdeverinta] = useState<string>('toti');
  const [sortare, setSortare] = useState<Sortare>('nume');

  function deschideAdaugare() {
    setEditat(null);
    setForm(FORM_GOL);
    setEroareForm(null);
    setModalDeschis(true);
  }

  function deschideEditare(c: Copil) {
    setEditat(c);
    setForm({
      nume_prenume: c.nume_prenume,
      clasa_cod: c.clasa_cod,
      scoala: c.scoala ?? '',
      adresa: c.adresa ?? '',
      data_nasterii: c.data_nasterii ?? '',
      are_nevoie_adeverinta: c.are_nevoie_adeverinta,
    });
    setEroareForm(null);
    setModalDeschis(true);
  }

  async function salveaza() {
    if (!form.nume_prenume.trim()) {
      setEroareForm('Numele și prenumele sunt obligatorii.');
      return;
    }
    setSeSalveaza(true);
    setEroareForm(null);
    try {
      const input: CopilInput = {
        ...form,
        nume_prenume: form.nume_prenume.trim(),
        scoala: form.scoala?.trim() || null,
        adresa: form.adresa?.trim() || null,
        data_nasterii: form.data_nasterii || null,
      };
      if (editat) await actualizeazaCopil(editat.id, input);
      else await creeazaCopil(input);
      setModalDeschis(false);
    } catch (e: any) {
      setEroareForm(e.message ?? 'A apărut o eroare.');
    } finally {
      setSeSalveaza(false);
    }
  }

  async function confirmaStergere() {
    if (!deSters) return;
    await stergeCopil(deSters.id);
    setDeSters(null);
  }

  function grupaDupaId(id: string | null) {
    return grupe.find((g) => g.id === id) ?? null;
  }

  const copiiFiltrati = useMemo(() => {
    let rezultat = copii.filter((c) => c.nume_prenume.toLowerCase().includes(filtruText.toLowerCase()));
    if (filtruGrupa !== 'toate') {
      rezultat = rezultat.filter((c) => c.grupa_id === filtruGrupa);
    }
    if (filtruAdeverinta !== 'toti') {
      rezultat = rezultat.filter((c) => (filtruAdeverinta === 'da' ? c.are_nevoie_adeverinta : !c.are_nevoie_adeverinta));
    }
    rezultat = [...rezultat].sort((a, b) => {
      if (sortare === 'nume') return a.nume_prenume.localeCompare(b.nume_prenume);
      if (sortare === 'clasa') {
        const oa = CLASE_SCOLARE.find((c) => c.cod === a.clasa_cod)?.sort_order ?? 0;
        const ob = CLASE_SCOLARE.find((c) => c.cod === b.clasa_cod)?.sort_order ?? 0;
        return oa - ob;
      }
      // varsta: cei fara data nasterii la final
      const va = calculeazaVarsta(a.data_nasterii) ?? 999;
      const vb = calculeazaVarsta(b.data_nasterii) ?? 999;
      return va - vb;
    });
    return rezultat;
  }, [copii, filtruText, filtruGrupa, filtruAdeverinta, sortare]);

  function randPentruExcel(c: Copil) {
    return {
      'Nume și prenume': c.nume_prenume,
      Clasă: numeClasa(c.clasa_cod),
      Grupă: grupaDupaId(c.grupa_id)?.nume ?? '',
      Școală: c.scoala ?? '',
      Adresă: c.adresa ?? '',
      'Data nașterii': c.data_nasterii ? formateazaData(c.data_nasterii) : '',
      Vârstă: calculeazaVarsta(c.data_nasterii) ?? '',
      'Are nevoie de adeverință': c.are_nevoie_adeverinta ? 'Da' : 'Nu',
    };
  }

  function exportaToti() {
    void descarcaExcel('copii_toti', 'Copii', copii.map(randPentruExcel));
  }

  function exportaFiltrati() {
    void descarcaExcel('copii_filtrati', 'Copii', copiiFiltrati.map(randPentruExcel));
  }

  if (seIncarca) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Copii</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Buton variant="secundar" onClick={exportaFiltrati}>Excel (filtrați)</Buton>
          <Buton variant="secundar" onClick={exportaToti}>Excel (toți)</Buton>
          <Buton onClick={deschideAdaugare}>+ Adaugă copil</Buton>
        </div>
      </div>

      {eroare && <Alerta tip="eroare" mesaj={eroare} />}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <Input eticheta="Caută după nume" value={filtruText} onChange={(e) => setFiltruText(e.target.value)} />
          <Select eticheta="Grupă" value={filtruGrupa} onChange={(e) => setFiltruGrupa(e.target.value)}>
            <option value="toate">Toate grupele</option>
            {grupe.map((g) => (
              <option key={g.id} value={g.id}>{g.nume}</option>
            ))}
          </Select>
          <Select eticheta="Adeverință" value={filtruAdeverinta} onChange={(e) => setFiltruAdeverinta(e.target.value)}>
            <option value="toti">Toți</option>
            <option value="da">Are nevoie</option>
            <option value="nu">Nu are nevoie</option>
          </Select>
          <Select eticheta="Sortează după" value={sortare} onChange={(e) => setSortare(e.target.value as Sortare)}>
            <option value="nume">Nume</option>
            <option value="clasa">Clasă</option>
            <option value="varsta">Vârstă</option>
          </Select>
        </div>
      </Card>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              {['Nume', 'Clasă', 'Grupă', 'Vârstă', 'Data nașterii', 'Școală', 'Adresă', 'Adeverință', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 13, color: '#4b5563', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copiiFiltrati.map((c) => {
              const grupa = grupaDupaId(c.grupa_id);
              return (
                <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 12px', fontSize: 14, whiteSpace: 'nowrap' }}>{c.nume_prenume}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, whiteSpace: 'nowrap' }}>{numeClasa(c.clasa_cod)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {grupa ? <Badge texte={grupa.nume} culoareFundal={grupa.culoare_hex} culoareText="#fff" /> : <span style={{ color: '#9ca3af', fontSize: 13 }}>-</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{calculeazaVarsta(c.data_nasterii) ?? '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, whiteSpace: 'nowrap' }}>{c.data_nasterii ? formateazaData(c.data_nasterii) : '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{c.scoala || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, maxWidth: 220 }}>{c.adresa || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, whiteSpace: 'nowrap' }}>{c.are_nevoie_adeverinta ? 'Da' : 'Nu'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Buton variant="text" onClick={() => deschideEditare(c)}>Editează</Buton>
                    <Buton variant="text" onClick={() => setDeSters(c)} style={{ color: '#dc2626' }}>Șterge</Buton>
                  </td>
                </tr>
              );
            })}
            {copiiFiltrati.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                  Niciun copil nu corespunde filtrelor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalDeschis && (
        <Modal titlu={editat ? 'Editează copil' : 'Adaugă copil'} onClose={() => setModalDeschis(false)} latime={520}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {eroareForm && <Alerta tip="eroare" mesaj={eroareForm} />}
            <Input eticheta="Nume și prenume *" value={form.nume_prenume} onChange={(e) => setForm({ ...form, nume_prenume: e.target.value })} />
            <Select eticheta="Clasă *" value={form.clasa_cod} onChange={(e) => setForm({ ...form, clasa_cod: e.target.value })}>
              {CLASE_SCOLARE.map((c) => (
                <option key={c.cod} value={c.cod}>{c.nume_afisat}</option>
              ))}
            </Select>
            <Input eticheta="Școală (opțional)" value={form.scoala ?? ''} onChange={(e) => setForm({ ...form, scoala: e.target.value })} />
            <Input eticheta="Adresă (opțional)" value={form.adresa ?? ''} onChange={(e) => setForm({ ...form, adresa: e.target.value })} />
            <Input
              eticheta="Data nașterii (opțional)"
              type="date"
              value={form.data_nasterii ?? ''}
              onChange={(e) => setForm({ ...form, data_nasterii: e.target.value })}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.are_nevoie_adeverinta}
                onChange={(e) => setForm({ ...form, are_nevoie_adeverinta: e.target.checked })}
              />
              Are nevoie de adeverință la școală
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
          titlu="Șterge copil"
          mesaj={`Sigur vrei să ștergi pe ${deSters.nume_prenume}? Se vor șterge și toate statisticile lui de la lecții.`}
          onConfirma={confirmaStergere}
          onAnuleaza={() => setDeSters(null)}
          pericol
        />
      )}
    </div>
  );
}
