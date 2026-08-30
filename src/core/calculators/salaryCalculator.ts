export interface ISalaryCalculationInput {
  baseSalary: number;
  mealAllowance: number;
  totalDeductions: number;
}

export interface ISalaryCalculationResult {
  grossPay: number;
  basePay: number;
  mealAllowance: number;
  totalDeductions: number;
  netPay: number;
}

export function calculateSalaryPay(input: ISalaryCalculationInput): ISalaryCalculationResult {
  const grossPay = input.baseSalary + input.mealAllowance;
  const netPay = grossPay - input.totalDeductions;
  return {
    grossPay,
    basePay: input.baseSalary,
    mealAllowance: input.mealAllowance,
    totalDeductions: input.totalDeductions,
    netPay
  };
}
