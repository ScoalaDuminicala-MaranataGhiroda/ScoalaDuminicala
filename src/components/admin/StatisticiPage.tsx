import { useState } from 'react';
import { useGrupe } from '@/hooks/useGrupe';
import { useStatisticiAgregate, useLectiiParcurse } from '@/hooks/useStatistici';
import { numeClasa, formateazaData } from '@/lib/clase';
import { descarcaExcelMultiSheet } from '@/lib/excel';
import { Buton, Card, Select, Modal, Spinner, Badge } from '@/components/common/UI';
import type { LectieCuDetalii } from '@/hooks/useStatistici';

export default function StatisticiPage() {
  const { grupe } = useGrupe();
  const { statistici, seIncarca: seIncarcaAgregate } = useStatisticiAgregate();
  const [grupaFiltru, setGrupaFiltru] = useState<string>('toate');
  const { lectii, seIncarca: seIncarcaLectii, actualizeazaValoareCopil } = useLectiiParcurse(
    grupaFiltru === 'toate' ? null : grupaFiltru
  );
  const [lectieDeschisa, setLectieDeschisa] = useState<LectieCuDetalii | null>(null);

  const statisticiFiltrate =
    grupaFiltru === 'toate' ? statistici : statistici.filter((s) => s.grupa_id === grupaFiltru);

  function grupaDupaId(id: string | null) {
    return grupe.find((g) => g.id === id) ?? null;
  }

  function exportaExcel() {
    const foaieTotal = statisticiFiltrate.map((s) => ({
      'Nume și prenume': s.nume_prenume,
      Clasă: numeClasa(s.clasa_cod),
      Grupă: grupaDupaId(s.grupa_id)?.nume ?? '',
      'Nr. lecții': s.nr_lectii,
      'Nr. prezențe': s.nr_prezente,
      'Nr. prezențe la fix': s.nr_prezente_fix,
      'Nr. Biblie': s.nr_biblie,
      'Nr. Caiet': s.nr_caiet,
      'Nr. Pix': s.nr_pix,
      'Total puncte +': s.total_puncte_plus,
      'Total puncte -': s.total_puncte_minus,
      'Total bonus': s.total_bonus,
      'Total general': s.total_general,
    }));

    const foi: { nume: string; randuri: Record<string, any>[] }[] = [{ nume: 'Total', randuri: foaieTotal }];
    for (const l of lectii) {
      foi.push({
        nume: `${formateazaData(l.data_lectie)} ${l.titlu}`.substring(0, 31),
        randuri: l.copii.map((c) => ({
          'Nume și prenume': c.nume_prenume,
          'Prezent la fix': c.prezent_fix ? 'Da' : 'Nu',
          Prezent: c.prezent ? 'Da' : 'Nu',
          Biblie: c.biblie ? 'Da' : 'Nu',
          Caiet: c.caiet ? 'Da' : 'Nu',
          Pix: c.pix ? 'Da' : 'Nu',
          'Puncte +': c.puncte_plus,
          'Puncte -': c.puncte_minus,
          Bonus: c.bonus,
          Total: c.total,
        })),
      });
    }
    void descarcaExcelMultiSheet('statistici_scoala_duminicala', foi);
  }

  async function salveazaCampCopil(id: string, camp: string, valoare: number | boolean) {
    await actualizeazaValoareCopil(id, { [camp]: valoare } as any);
    // sincronizeaza si modalul deschis daca e cazul
    if (lectieDeschisa) {
      setLectieDeschisa({
        ...lectieDeschisa,
        copii: lectieDeschisa.copii.map((c) => (c.id === id ? { ...c, [camp]: valoare } : c)),
      });
    }
  }

  if (seIncarcaAgregate) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Statistici</h1>
        <Buton variant="secundar" onClick={exportaExcel}>Descarcă Excel</Buton>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Select eticheta="Filtrează după grupă" value={grupaFiltru} onChange={(e) => setGrupaFiltru(e.target.value)}>
          <option value="toate">Toate grupele</option>
          {grupe.map((g) => (
            <option key={g.id} value={g.id}>{g.nume}</option>
          ))}
        </Select>
      </Card>

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '20px 0 10px' }}>Total pe fiecare copil</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12 }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              {['Nume', 'Grupă', 'Lecții', 'Prezențe', 'La fix', 'Biblie', 'Caiet', 'Pix', 'Total'].map((h) => (
                <th key={h} style={{ padding: '8px 10px', fontSize: 12, color: '#4b5563' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statisticiFiltrate.map((s) => (
              <tr key={s.copil_id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{s.nume_prenume}</td>
                <td style={{ padding: '8px 10px' }}>
                  {grupaDupaId(s.grupa_id) && (
                    <Badge texte={grupaDupaId(s.grupa_id)!.nume} culoareFundal={grupaDupaId(s.grupa_id)!.culoare_hex} culoareText="#fff" />
                  )}
                </td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{s.nr_lectii}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{s.nr_prezente}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{s.nr_prezente_fix}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{s.nr_biblie}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{s.nr_caiet}</td>
                <td style={{ padding: '8px 10px', fontSize: 13 }}>{s.nr_pix}</td>
                <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}>{s.total_general}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '28px 0 10px' }}>Lecții parcurse</h2>
      {grupaFiltru === 'toate' && <p style={{ color: '#6b7280', fontSize: 14 }}>Selectează o grupă pentru a vedea lecțiile parcurse în detaliu.</p>}
      {grupaFiltru !== 'toate' && (seIncarcaLectii ? <Spinner /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lectii.map((l) => (
            <Card key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>{l.titlu}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{formateazaData(l.data_lectie)}</p>
              </div>
              <Buton variant="secundar" onClick={() => setLectieDeschisa(l)}>Vezi detalii</Buton>
            </Card>
          ))}
          {lectii.length === 0 && <p style={{ color: '#6b7280' }}>Nu există lecții parcurse pentru această grupă.</p>}
        </div>
      ))}

      {lectieDeschisa && (
        <Modal titlu={`${lectieDeschisa.titlu} — ${formateazaData(lectieDeschisa.data_lectie)}`} onClose={() => setLectieDeschisa(null)} latime={800}>
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
                    {(['prezent_fix', 'prezent', 'biblie', 'caiet', 'pix'] as const).map((camp) => (
                      <td key={camp} style={{ padding: 6 }}>
                        <input
                          type="checkbox"
                          checked={c[camp] as boolean}
                          onChange={(e) => salveazaCampCopil(c.id, camp, e.target.checked)}
                        />
                      </td>
                    ))}
                    {(['puncte_plus', 'puncte_minus', 'bonus'] as const).map((camp) => (
                      <td key={camp} style={{ padding: 6 }}>
                        <input
                          type="number"
                          value={c[camp] as number}
                          onChange={(e) => salveazaCampCopil(c.id, camp, Number(e.target.value))}
                          style={{ width: 48, textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 4 }}
                        />
                      </td>
                    ))}
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
