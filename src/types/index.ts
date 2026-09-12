// ============================================================================
// Tipuri de domeniu — oglindesc schema din supabase/schema.sql
// ============================================================================

// Rolurile disponibile azi. Pentru un rol nou (ex 'dirijor', 'parinte'):
// 1. adauga-l aici in union
// 2. adauga constrangerea in schema SQL (check constraint pe app_users.rol)
// 3. adauga un case nou in src/router pentru paginile lui
export type Rol = 'admin' | 'invatator';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  rol: Rol;
  nume: string | null;
  prenume: string | null;
  activ: boolean;
  creat_la: string;
}

export interface ClasaScolara {
  cod: string;
  nume_afisat: string;
  sort_order: number;
}

export interface SetariAnScolar {
  id: 1;
  an_scolar: string;
}

export interface Grupa {
  id: string;
  nume: string;
  culoare_hex: string;
  link_materiale: string | null;
  creat_la: string;
  // campuri populate suplimentar in UI (nu exista ca atare in tabel)
  clase?: string[];           // coduri clase
  invatatori?: AppUser[];
}

export interface Copil {
  id: string;
  nume_prenume: string;
  clasa_cod: string;
  scoala: string | null;
  adresa: string | null;
  data_nasterii: string | null;
  are_nevoie_adeverinta: boolean;
  grupa_id: string | null;
  creat_la: string;
  actualizat_la: string;
}

export interface Material {
  id: string;
  grupa_id: string;
  denumire: string;
  cantitate: string;
  creat_la: string;
}

export interface Programare {
  id: string;
  grupa_id: string;
  data_lectie: string; // YYYY-MM-DD
  titlu: string;
  invatator_principal_id: string | null;
  vizibil_pentru_toti: boolean;
  creat_la: string;
  // populate suplimentar
  ajutoare?: string[]; // id-uri invatatori
}

export interface LectieParcursa {
  id: string;
  programare_id: string;
  grupa_id: string;
  data_lectie: string;
  titlu: string;
  invatator_principal_id: string | null;
  creat_la: string;
  actualizat_la: string;
  ajutoare?: string[];
}

export interface LectieCopil {
  id: string;
  lectie_id: string;
  copil_id: string;
  prezent_fix: boolean;
  prezent: boolean;
  biblie: boolean;
  caiet: boolean;
  pix: boolean;
  puncte_plus: number;
  puncte_minus: number;
  bonus: number;
  total: number; // generat de DB, needitabil
  actualizat_la: string;
}

export interface StatisticiCopil {
  copil_id: string;
  nume_prenume: string;
  clasa_cod: string;
  grupa_id: string | null;
  nr_lectii: number;
  nr_prezente: number;
  nr_prezente_fix: number;
  nr_biblie: number;
  nr_caiet: number;
  nr_pix: number;
  total_puncte_plus: number;
  total_puncte_minus: number;
  total_bonus: number;
  total_general: number;
}
