// @ts-nocheck
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const { app, BrowserWindow, ipcMain, dialog } = require('electron');

let mainWindow = null;

function createWindow() {
  const preloadPath = fs.existsSync(path.join(__dirname, 'preload/index.mjs'))
    ? path.join(__dirname, 'preload/index.mjs')
    : path.join(__dirname, 'preload/index.js');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'MySalary - 급여 및 근태 자동화 시스템',
    backgroundColor: '#020617',
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // DevTools 닫기 (터미널 잡음 제거)
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  console.log('[Main] App ready. Initializing database...');
  const db = await initDatabase(path.join(app.getPath('userData'), 'payroll.db'));
  console.log('[Main] Database initialized.');
  registerIpcHandlers(db);
  console.log('[Main] IPC handlers registered.');
  createWindow();
  console.log('[Main] Window created.');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function initDatabase(dbPath = 'payroll.db') {
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
  const schema = require(path.join(__dirname, './schema/index.cjs'));

  const sqliteInstance = new Database(dbPath);
  sqliteInstance.pragma('journal_mode = WAL');
  sqliteInstance.pragma('foreign_keys = ON');

  // Run migrations from bundled SQL files
  const migrationsFolder = path.join(__dirname, './migrations');
  if (fs.existsSync(migrationsFolder)) {
    migrate(drizzle(sqliteInstance), { migrationsFolder });
  }

  return drizzle(sqliteInstance, { schema });
}

function registerIpcHandlers(db) {
  const schema = require(path.join(__dirname, './schema/index.cjs'));

  ipcMain.handle('db:getStatus', async () => {
    try {
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
    return db.select().from(schema.employees).all();
  });

  ipcMain.handle('db:getWorkCenters', async () => {
    return db.select().from(schema.workCenters).all();
  });

  ipcMain.handle('db:getPayrollPeriods', async () => {
    return db.select().from(schema.payrollPeriods).all();
  });

  ipcMain.handle('dialog:openFile', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: (options && options.filters) || [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}
