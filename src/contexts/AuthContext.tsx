import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/types';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  eroare: string | null;
  login: (username: string, password: string, tineMinte: boolean) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'sd_user_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  // La incarcarea aplicatiei, verifica daca exista o sesiune salvata
  // (localStorage = "tine-ma minte" persistent, sessionStorage = doar tab-ul curent)
  useEffect(() => {
    const salvat = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (salvat) {
      try {
        const userId = JSON.parse(salvat).id as string;
        // reverificam userul in DB (nu doar din storage) - poate a fost dezactivat/sters
        supabase
          .from('app_users')
          .select('*')
          .eq('id', userId)
          .eq('activ', true)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setUser(data as AppUser);
            else {
              localStorage.removeItem(STORAGE_KEY);
              sessionStorage.removeItem(STORAGE_KEY);
            }
            setLoading(false);
          });
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username: string, password: string, tineMinte: boolean): Promise<boolean> {
    setEroare(null);
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password)
      .eq('activ', true)
      .maybeSingle();

    if (error) {
      setEroare('Eroare de conexiune. Încearcă din nou.');
      return false;
    }
    if (!data) {
      setEroare('Utilizator sau parolă incorectă.');
      return false;
    }

    setUser(data as AppUser);
    const payload = JSON.stringify({ id: data.id });
    if (tineMinte) {
      localStorage.setItem(STORAGE_KEY, payload);
    } else {
      sessionStorage.setItem(STORAGE_KEY, payload);
    }
    return true;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, eroare, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth trebuie folosit in interiorul AuthProvider');
  return ctx;
}
