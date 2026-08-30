export interface IAttendanceValidationInput {
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
}

export interface IAttendanceValidationResult {
  isAnomalous: boolean;
  reason?: string;
}

export function validateAttendanceRecord(input: IAttendanceValidationInput): IAttendanceValidationResult {
  if (input.overtimeHours > 52) {
    return {
      isAnomalous: true,
      reason: '월간 연장근무 한도 초과 (52시간 이상)'
    };
  }
  if (input.regularHours < 0 || input.overtimeHours < 0) {
    return {
      isAnomalous: true,
      reason: '근무 시간에 음수값이 포함되어 있습니다.'
    };
  }
  return {
    isAnomalous: false
  };
}
