import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Lipsesc variabilele de mediu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Copiaza .env.example in .env si completeaza-le (vezi supabase/CONFIGURARE.md).'
  );
}

export const supabase = createClient(url, anonKey);
