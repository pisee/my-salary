export interface IDbStatus {
  connected: boolean;
  version: string;
  path: string;
}

export interface IElectronAPI {
  getDbStatus: () => Promise<IDbStatus>;
  getEmployees: () => Promise<any[]>;
  getWorkCenters: () => Promise<any[]>;
  getPayrollPeriods: () => Promise<any[]>;
  createPayrollPeriod: (yearMonth: string) => Promise<any>;
  openFileDialog: (options?: { filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

export {};
