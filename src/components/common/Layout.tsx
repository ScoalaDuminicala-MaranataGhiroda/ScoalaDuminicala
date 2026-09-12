import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  to: string;
  eticheta: string;
}

// Fiecare rol isi defineste propriul set de tab-uri de navigare.
// Pentru un rol nou, adauga o intrare noua aici — restul layout-ului nu se schimba.
const NAV_PE_ROL: Record<string, NavItem[]> = {
  admin: [
    { to: '/admin/grupe', eticheta: 'Grupe' },
    { to: '/admin/invatatori', eticheta: 'Învățători' },
    { to: '/admin/copii', eticheta: 'Copii' },
    { to: '/admin/an-scolar', eticheta: 'An școlar' },
    { to: '/admin/programari', eticheta: 'Programări' },
    { to: '/admin/materiale', eticheta: 'Materiale' },
    { to: '/admin/statistici', eticheta: 'Statistici' },
  ],
  invatator: [{ to: '/invatator', eticheta: 'Programul meu' }],
};

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <>{children}</>;

  const itemi = NAV_PE_ROL[user.rol] ?? [];
  const numeAfisat = user.rol === 'admin' ? 'Administrator' : `${user.prenume ?? ''} ${user.nume ?? ''}`.trim();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '12px 0',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 16 }}>Școala Duminicală</div>
          <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap', overflowX: 'auto' }}>
            {itemi.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: isActive ? '#1d4ed8' : '#4b5563',
                  background: isActive ? '#eff6ff' : 'transparent',
                  whiteSpace: 'nowrap',
                })}
              >
                {item.eticheta}
              </NavLink>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>{numeAfisat}</span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 13,
                cursor: 'pointer',
                color: '#4b5563',
              }}
            >
              Deconectare
            </button>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>{children}</main>
    </div>
  );
}
