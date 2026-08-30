import { ipcMain, dialog } from 'electron';
import { getDb } from '../../core/db/client';
import * as schema from '../../core/db/schema';
import { IDbStatus } from '../../shared/types';

export function registerIpcHandlers(): void {
  ipcMain.handle('db:getStatus', async (): Promise<IDbStatus> => {
    try {
      getDb();
      return {
        connected: true,
        version: 'SQLite 3 via better-sqlite3',
        path: 'payroll.db'
      };
    } catch {
      return {
        connected: false,
        version: 'Unknown',
        path: ''
      };
    }
  });

  ipcMain.handle('db:getEmployees', async () => {
    const db = getDb();
    return db.select().from(schema.employees).all();
  });

  ipcMain.handle('db:getWorkCenters', async () => {
    const db = getDb();
    return db.select().from(schema.workCenters).all();
  });

  ipcMain.handle('db:getPayrollPeriods', async () => {
    const db = getDb();
    return db.select().from(schema.payrollPeriods).all();
  });

  ipcMain.handle('dialog:openFile', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: options?.filters || [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}
