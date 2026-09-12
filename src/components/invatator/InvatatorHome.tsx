import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProgramarileMele } from '@/hooks/useProgramarileMele';
import { useGrupe } from '@/hooks/useGrupe';
import { formateazaData } from '@/lib/clase';
import { Card, Badge, Spinner, Buton } from '@/components/common/UI';

export default function InvatatorHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { programari, seIncarca: seIncarcaProgramari } = useProgramarileMele(user!.id);
  const { grupe, seIncarca: seIncarcaGrupe } = useGrupe();

  // grupele in care invatatorul e arondat (din relatia grupe_invatatori)
  const grupeleMele = grupe.filter((g) => (g.invatatori ?? []).some((i) => i.id === user!.id));

  const azi = new Date().toISOString().substring(0, 10);

  if (seIncarcaProgramari || seIncarcaGrupe) return <Spinner />;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Bine ai venit, {user?.prenume}</h1>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Grupele mele</h2>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        {grupeleMele.map((g) => (
          <Buton key={g.id} onClick={() => navigate(`/invatator/grupa/${g.id}`)}>
            {g.nume}
          </Buton>
        ))}
        {grupeleMele.length === 0 && <p style={{ color: '#6b7280' }}>Nu ești asignat la nicio grupă momentan.</p>}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Programările mele</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {programari.map((p) => (
          <Card key={`${p.id}-${p.rol}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge texte={p.grupa_nume} culoareFundal={p.grupa_culoare} culoareText="#fff" />
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>{p.titlu}</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
                  {formateazaData(p.data_lectie)} · {p.rol === 'principal' ? 'Învățător principal' : 'Ajutor'}
                </p>
              </div>
            </div>
            {p.data_lectie === azi && (
              <Buton onClick={() => navigate(`/invatator/grupa/${p.grupa_id}/lectia-actuala`)}>Intră la lecție</Buton>
            )}
          </Card>
        ))}
        {programari.length === 0 && <p style={{ color: '#6b7280' }}>Nu ai programări viitoare.</p>}
      </div>
    </div>
  );
}
