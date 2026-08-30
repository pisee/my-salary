import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from '../shared/types';

const api: IElectronAPI = {
  getDbStatus: () => ipcRenderer.invoke('db:getStatus'),
  getEmployees: () => ipcRenderer.invoke('db:getEmployees'),
  getWorkCenters: () => ipcRenderer.invoke('db:getWorkCenters'),
  getPayrollPeriods: () => ipcRenderer.invoke('db:getPayrollPeriods'),
  createPayrollPeriod: (yearMonth: string) => ipcRenderer.invoke('db:createPayrollPeriod', yearMonth),
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options)
};

contextBridge.exposeInMainWorld('electronAPI', api);
