// xlsx e o biblioteca mare (~700KB) - o incarcam dinamic doar cand e nevoie de export,
// ca sa nu incetineasca incarcarea initiala a aplicatiei pentru toti utilizatorii.

// Descarca un singur sheet ca fisier .xlsx
export async function descarcaExcel(numeFisier: string, foaie: string, randuri: Record<string, any>[]) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(randuri);
  XLSX.utils.book_append_sheet(wb, ws, foaie);
  XLSX.writeFile(wb, `${numeFisier}.xlsx`);
}

// Descarca mai multe sheet-uri intr-un singur fisier .xlsx
export async function descarcaExcelMultiSheet(numeFisier: string, foi: { nume: string; randuri: Record<string, any>[] }[]) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const foaie of foi) {
    const ws = XLSX.utils.json_to_sheet(foaie.randuri);
    // numele foii e limitat la 31 caractere de Excel
    XLSX.utils.book_append_sheet(wb, ws, foaie.nume.substring(0, 31));
  }
  XLSX.writeFile(wb, `${numeFisier}.xlsx`);
}
