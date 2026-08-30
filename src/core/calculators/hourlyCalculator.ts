export interface IHourlyCalculationInput {
  baseHourlyRate: number;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
  mealAllowance: number;
  totalDeductions: number;
}

export interface IHourlyCalculationResult {
  grossPay: number;
  basePay: number;
  overtimeAllowance: number;
  mealAllowance: number;
  totalDeductions: number;
  netPay: number;
}

export function calculateHourlyPay(input: IHourlyCalculationInput): IHourlyCalculationResult {
  const basePay = input.baseHourlyRate * input.regularHours;
  const overtimePay = input.baseHourlyRate * input.overtimeHours * 1.5;
  const nightPay = input.baseHourlyRate * input.nightHours * 0.5;
  const holidayPay = input.baseHourlyRate * input.holidayHours * 1.5;
  const overtimeAllowance = overtimePay + nightPay + holidayPay;

  const grossPay = basePay + overtimeAllowance + input.mealAllowance;
  const netPay = grossPay - input.totalDeductions;

  return {
    grossPay,
    basePay,
    overtimeAllowance,
    mealAllowance: input.mealAllowance,
    totalDeductions: input.totalDeductions,
    netPay
  };
}
