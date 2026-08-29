// Net-salary formulas — א.2.2 / א.3.2 (decisions #1, #2, #3).

export const BITUACH_LEUMI_MONTHLY = 1626;
export const PENSION_CEILING_MONTHLY = 3000;
export const GEMEL_INVESTMENT_MONTHLY = 3500;
export const KEREN_HISHTALMUT_ANNUAL_NOTE = 1714;

export interface SalaryInputs {
  hourlyRate: number;
  hoursPerMonth: number;
  additionalIncome: number;
  creditPoints: number;
}

export const DEFAULT_SALARY_INPUTS: SalaryInputs = {
  hourlyRate: 200,
  hoursPerMonth: 182,
  additionalIncome: 0,
  creditPoints: 8.75,
};

export interface SalaryResult {
  grossMonthly: number;
  bituachLeumi: number;
  incomeTax: number;
  pensionCeiling: number;
  gemelInvestment: number;
  netMonthlyExpected: number;
  kerenHishtalmutAnnualNote: number;
}

export function calculateSalary(inputs: SalaryInputs): SalaryResult {
  const grossMonthly = inputs.hourlyRate * inputs.hoursPerMonth + inputs.additionalIncome;
  const incomeTax = Math.max(0, grossMonthly * 12 * 0.2 - inputs.creditPoints * 242 * 12) / 12;
  const netMonthlyExpected =
    grossMonthly - BITUACH_LEUMI_MONTHLY - incomeTax - PENSION_CEILING_MONTHLY - GEMEL_INVESTMENT_MONTHLY;

  return {
    grossMonthly,
    bituachLeumi: BITUACH_LEUMI_MONTHLY,
    incomeTax,
    pensionCeiling: PENSION_CEILING_MONTHLY,
    gemelInvestment: GEMEL_INVESTMENT_MONTHLY,
    netMonthlyExpected,
    kerenHishtalmutAnnualNote: KEREN_HISHTALMUT_ANNUAL_NOTE,
  };
}
