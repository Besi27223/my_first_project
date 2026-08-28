// Bi-monthly VAT reporting period folder name, per א.2.1: "{שנת מס}/{טווח חודשי
// דו-חודשי לדיווח מע"מ: 1-2, 3-4, 5-6, 7-8, 9-10, 11-12}". Donations always get
// their own fixed folder regardless of month.

export function biMonthlyPeriod(month: number): string {
  const startMonth = month % 2 === 0 ? month - 1 : month;
  return `${startMonth}-${startMonth + 1}`;
}

export function dropboxFolder(taxYear: number, month: number, categoryShortName?: string): string {
  if (categoryShortName === "תרומות") {
    return `${taxYear}/תרומות`;
  }
  return `${taxYear}/${biMonthlyPeriod(month)}`;
}
