import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/types';

export function useInvatatori() {
  const [invatatori, setInvatatori] = useState<AppUser[]>([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  const incarca = useCallback(async () => {
    setSeIncarca(true);
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('rol', 'invatator')
      .order('nume');
    if (error) setEroare(error.message);
    else setInvatatori(data ?? []);
    setSeIncarca(false);
  }, []);

  useEffect(() => {
    incarca();
  }, [incarca]);

  async function creeazaInvatator(input: { nume: string; prenume: string; username: string; password: string }) {
    const { error } = await supabase.from('app_users').insert({
      nume: input.nume.trim(),
      prenume: input.prenume.trim(),
      username: input.username.trim(),
      password: input.password,
      rol: 'invatator',
    });
    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        throw new Error('Acest nume de utilizator este deja folosit.');
      }
      throw new Error(error.message);
    }
    await incarca();
  }

  async function actualizeazaInvatator(
    id: string,
    input: { nume: string; prenume: string; username: string; password: string }
  ) {
    const { error } = await supabase
      .from('app_users')
      .update({
        nume: input.nume.trim(),
        prenume: input.prenume.trim(),
        username: input.username.trim(),
        password: input.password,
      })
      .eq('id', id);
    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        throw new Error('Acest nume de utilizator este deja folosit.');
      }
      throw new Error(error.message);
    }
    await incarca();
  }

  async function stergeInvatator(id: string) {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await incarca();
  }

  return { invatatori, seIncarca, eroare, incarca, creeazaInvatator, actualizeazaInvatator, stergeInvatator };
}
