import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/common/Layout';
import Login from '@/components/common/Login';
import { Spinner } from '@/components/common/UI';

import GrupePage from '@/components/admin/GrupePage';
import InvatatoriPage from '@/components/admin/InvatatoriPage';
import CopiiPage from '@/components/admin/CopiiPage';
import AnScolarPage from '@/components/admin/AnScolarPage';
import ProgramariPage from '@/components/admin/ProgramariPage';
import MaterialePage from '@/components/admin/MaterialePage';
import StatisticiPage from '@/components/admin/StatisticiPage';

import InvatatorHome from '@/components/invatator/InvatatorHome';
import GrupaInvatatorPage from '@/components/invatator/GrupaInvatatorPage';
import LectiaActualaPage from '@/components/invatator/LectiaActualaPage';

// ----------------------------------------------------------------------------
// Rutele sunt grupate pe rol. Pentru un rol nou (ex 'dirijor'):
// 1. creeaza un folder src/components/<rol>/ cu paginile lui
// 2. adauga un <Route path="/<rol>/*"> aici, in interiorul <RuteProtejate>
// 3. adauga intrarile de navigare in Layout.tsx (NAV_PE_ROL)
// Nimic din codul existent (admin/invatator) nu trebuie modificat.
// ----------------------------------------------------------------------------

function RuteProtejate() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Login />;

  return (
    <Layout>
      <Routes>
        {user.rol === 'admin' && (
          <>
            <Route path="/admin/grupe" element={<GrupePage />} />
            <Route path="/admin/invatatori" element={<InvatatoriPage />} />
            <Route path="/admin/copii" element={<CopiiPage />} />
            <Route path="/admin/an-scolar" element={<AnScolarPage />} />
            <Route path="/admin/programari" element={<ProgramariPage />} />
            <Route path="/admin/materiale" element={<MaterialePage />} />
            <Route path="/admin/statistici" element={<StatisticiPage />} />
            <Route path="*" element={<Navigate to="/admin/grupe" replace />} />
          </>
        )}
        {user.rol === 'invatator' && (
          <>
            <Route path="/invatator" element={<InvatatorHome />} />
            <Route path="/invatator/grupa/:grupaId" element={<GrupaInvatatorPage />} />
            <Route path="/invatator/grupa/:grupaId/lectia-actuala" element={<LectiaActualaPage />} />
            <Route path="*" element={<Navigate to="/invatator" replace />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <RuteProtejate />
    </BrowserRouter>
  );
}
