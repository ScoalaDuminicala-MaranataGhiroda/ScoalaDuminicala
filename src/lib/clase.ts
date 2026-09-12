// Lista fixa de clase, oglindeste tabela clase_scolare din Supabase.
// Ordinea conteaza pentru increment/decrement an scolar.
export const CLASE_SCOLARE = [
  { cod: 'GM', nume_afisat: 'Grădinița - grupa mică', sort_order: 0 },
  { cod: 'GMj', nume_afisat: 'Grădinița - grupa mijlocie', sort_order: 1 },
  { cod: 'GMa', nume_afisat: 'Grădinița - grupa mare', sort_order: 2 },
  { cod: 'C0', nume_afisat: 'Clasa 0', sort_order: 3 },
  { cod: 'C1', nume_afisat: 'Clasa 1', sort_order: 4 },
  { cod: 'C2', nume_afisat: 'Clasa 2', sort_order: 5 },
  { cod: 'C3', nume_afisat: 'Clasa 3', sort_order: 6 },
  { cod: 'C4', nume_afisat: 'Clasa 4', sort_order: 7 },
  { cod: 'C5', nume_afisat: 'Clasa 5', sort_order: 8 },
  { cod: 'C6', nume_afisat: 'Clasa 6', sort_order: 9 },
  { cod: 'C7', nume_afisat: 'Clasa 7', sort_order: 10 },
  { cod: 'C8', nume_afisat: 'Clasa 8', sort_order: 11 },
  { cod: 'C9', nume_afisat: 'Clasa 9', sort_order: 12 },
  { cod: 'C10', nume_afisat: 'Clasa 10', sort_order: 13 },
  { cod: 'C11', nume_afisat: 'Clasa 11', sort_order: 14 },
  { cod: 'C12', nume_afisat: 'Clasa 12', sort_order: 15 },
  { cod: 'ABS', nume_afisat: 'Absolvent', sort_order: 16 },
] as const;

export function numeClasa(cod: string): string {
  return CLASE_SCOLARE.find((c) => c.cod === cod)?.nume_afisat ?? cod;
}

// Calculeaza varsta curenta pe baza datei nasterii (poate fi null)
export function calculeazaVarsta(dataNasterii: string | null): number | null {
  if (!dataNasterii) return null;
  const nastere = new Date(dataNasterii);
  const azi = new Date();
  let varsta = azi.getFullYear() - nastere.getFullYear();
  const mDelta = azi.getMonth() - nastere.getMonth();
  if (mDelta < 0 || (mDelta === 0 && azi.getDate() < nastere.getDate())) {
    varsta--;
  }
  return varsta;
}

export function formateazaData(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('ro-RO');
}

// Returneaza un galben/negru pentru text, in functie de luminozitatea culorii de fundal,
// ca numele grupei sa fie mereu lizibil pe badge-ul colorat.
export function culoareText(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminanta = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminanta > 0.6 ? '#1a1a1a' : '#ffffff';
}
