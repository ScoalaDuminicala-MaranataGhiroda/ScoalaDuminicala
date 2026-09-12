import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLectiaActuala } from '@/hooks/useLectiaActuala';
import { useGrupe } from '@/hooks/useGrupe';
import { Buton, Card, Spinner, Badge, Alerta } from '@/components/common/UI';
import type { LectieCopil } from '@/types';

export default function LectiaActualaPage() {
  const { grupaId } = useParams<{ grupaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { grupe } = useGrupe();
  const { seIncarca, areDrepturi, existaProgramareAzi, titlu, invatatorPrincipalNume, ajutoareNume, copii, actualizeazaCopil } =
    useLectiaActuala(grupaId!, user!.id);

  const grupa = grupe.find((g) => g.id === grupaId);

  function handleCheckbox(c: LectieCopil, camp: keyof LectieCopil) {
    actualizeazaCopil(c.id, { [camp]: !c[camp] } as any);
  }

  function handleNumar(c: LectieCopil, camp: keyof LectieCopil, valoare: string) {
    const nr = parseInt(valoare, 10);
    actualizeazaCopil(c.id, { [camp]: Number.isNaN(nr) ? 0 : nr } as any);
  }

  if (seIncarca) return <Spinner />;

  return (
    <div>
      <Buton variant="text" onClick={() => navigate(`/invatator/grupa/${grupaId}`)}>← Înapoi la grupă</Buton>

      {!existaProgramareAzi && (
        <div style={{ marginTop: 16 }}>
          <Alerta tip="info" mesaj="Nu există nicio lecție programată azi pentru această grupă." />
        </div>
      )}

      {existaProgramareAzi && !areDrepturi && (
        <div style={{ marginTop: 16 }}>
          <Alerta tip="eroare" mesaj={`Lecția de azi ("${titlu}") nu este vizibilă pentru tine. Contactează administratorul dacă ar trebui să ai acces.`} />
        </div>
      )}

      {areDrepturi && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            {grupa && <Badge texte={grupa.nume} culoareFundal={grupa.culoare_hex} culoareText="#fff" />}
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{titlu}</h1>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>
                Principal: {invatatorPrincipalNume || '-'}
                {ajutoareNume.length > 0 && ` · Ajutor: ${ajutoareNume.join(', ')}`}
              </p>
            </div>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', textAlign: 'center' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Copil</th>
                    <th style={{ padding: '10px 12px' }}>La fix</th>
                    <th style={{ padding: '10px 12px' }}>Prezent</th>
                    <th style={{ padding: '10px 12px' }}>Biblie</th>
                    <th style={{ padding: '10px 12px' }}>Caiet</th>
                    <th style={{ padding: '10px 12px' }}>Pix</th>
                    <th style={{ padding: '10px 12px' }}>Puncte +</th>
                    <th style={{ padding: '10px 12px' }}>Puncte -</th>
                    <th style={{ padding: '10px 12px' }}>Bonus</th>
                    <th style={{ padding: '10px 12px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {copii.map((c) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>{c.nume_prenume}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <input type="checkbox" checked={c.prezent_fix} onChange={() => handleCheckbox(c, 'prezent_fix')} style={{ width: 18, height: 18 }} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <input type="checkbox" checked={c.prezent} onChange={() => handleCheckbox(c, 'prezent')} style={{ width: 18, height: 18 }} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <input type="checkbox" checked={c.biblie} onChange={() => handleCheckbox(c, 'biblie')} style={{ width: 18, height: 18 }} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <input type="checkbox" checked={c.caiet} onChange={() => handleCheckbox(c, 'caiet')} style={{ width: 18, height: 18 }} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <input type="checkbox" checked={c.pix} onChange={() => handleCheckbox(c, 'pix')} style={{ width: 18, height: 18 }} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <input
                          type="number"
                          value={c.puncte_plus}
                          onChange={(e) => handleNumar(c, 'puncte_plus', e.target.value)}
                          style={{ width: 56, textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 6, padding: 4 }}
                        />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <input
                          type="number"
                          value={c.puncte_minus}
                          onChange={(e) => handleNumar(c, 'puncte_minus', e.target.value)}
                          style={{ width: 56, textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 6, padding: 4 }}
                        />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <input
                          type="number"
                          value={c.bonus}
                          onChange={(e) => handleNumar(c, 'bonus', e.target.value)}
                          style={{ width: 56, textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 6, padding: 4 }}
                        />
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.total}</td>
                    </tr>
                  ))}
                  {copii.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                        Nu există copii în această grupă.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 10 }}>
            Modificările se salvează automat pe măsură ce le faci.
          </p>
        </>
      )}
    </div>
  );
}
