import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Buton, Input, Alerta } from './UI';

export default function Login() {
  const { login, eroare } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tineMinte, setTineMinte] = useState(true);
  const [seIncarca, setSeIncarca] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSeIncarca(true);
    await login(username, password, tineMinte);
    setSeIncarca(false);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Școala Duminicală</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>Maranata Ghiroda</p>
        </div>

        {eroare && <Alerta tip="eroare" mesaj={eroare} />}

        <Input
          eticheta="Utilizator"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoComplete="username"
        />
        <Input
          eticheta="Parolă"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#4b5563', cursor: 'pointer' }}>
          <input type="checkbox" checked={tineMinte} onChange={(e) => setTineMinte(e.target.checked)} />
          Ține-mă minte
        </label>

        <Buton type="submit" disabled={seIncarca} style={{ width: '100%' }}>
          {seIncarca ? 'Se conectează...' : 'Conectare'}
        </Buton>
      </form>
    </div>
  );
}
