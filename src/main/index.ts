// @ts-nocheck
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import initSqlJs from 'sql.js';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow = null;
let sqliteInstance = null;
let dbPathStr = '';

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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  console.log('[Main] App ready. Initializing database...');
  await initDatabase(path.join(app.getPath('userData'), 'payroll.db'));
  console.log('[Main] Database initialized.');
  registerIpcHandlers();
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

async function initDatabase(dbPath = 'payroll.db') {
  dbPathStr = dbPath;

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '../node_modules/sql.js/dist/', file)
  });

  // Load existing DB from file or create new
  let dbData;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    dbData = new Uint8Array(buffer);
  }

  sqliteInstance = new SQL.Database(dbData);

  // Run migrations manually (sql.js has no built-in migrator)
  const migrationsFolder = path.join(__dirname, './migrations');
  if (fs.existsSync(migrationsFolder)) {
    // Create migration tracking table
    sqliteInstance.run(`
      CREATE TABLE IF NOT EXISTS _drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    // Get already applied migrations
    const result = sqliteInstance.exec('SELECT name FROM _drizzle_migrations');
    const applied = new Set();
    if (result && result.length > 0 && result[0].values) {
      for (const row of result[0].values) {
        applied.add(row[0]);
      }
    }

    const migrationFiles = fs.readdirSync(migrationsFolder)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Baseline DBs created before migration tracking existed: the schema is
    // already in place, so record the migrations instead of re-running them.
    if (applied.size === 0 && hasUserTables()) {
      console.log('[Main] Existing schema without migration history. Baselining.');
      for (const file of migrationFiles) {
        const migrationName = file.replace('.sql', '');
        sqliteInstance.run('INSERT INTO _drizzle_migrations (name) VALUES (?)', [migrationName]);
        applied.add(migrationName);
      }
    }

    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', '');
      if (applied.has(migrationName)) continue;

      console.log(`[Main] Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsFolder, file), 'utf8');
      const statements = sql.split('--> statement-breakpoint').filter(s => s.trim());
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (trimmed) {
          sqliteInstance.run(trimmed);
        }
      }
      sqliteInstance.run(`INSERT INTO _drizzle_migrations (name) VALUES ('${migrationName}')`);
    }
  }

  saveDb();
}

function hasUserTables() {
  const result = sqliteInstance.exec(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_drizzle_migrations' LIMIT 1"
  );
  return result.length > 0;
}

function saveDb() {
  if (!sqliteInstance) return;
  const data = sqliteInstance.export();
  fs.writeFileSync(dbPathStr, Buffer.from(data));
}

function registerIpcHandlers() {
  ipcMain.handle('db:getStatus', async () => {
    try {
      sqliteInstance.exec('SELECT 1');
      return {
        connected: true,
        version: 'SQLite 3 via sql.js',
        path: dbPathStr
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
    const rows = sqliteInstance.exec('SELECT * FROM employees');
    if (!rows || rows.length === 0 || !rows[0].values) return [];
    return rows[0].values.map(row => {
      const cols = rows[0].columns;
      const obj = {};
      cols.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  });

  ipcMain.handle('db:getWorkCenters', async () => {
    const rows = sqliteInstance.exec('SELECT * FROM work_centers');
    if (!rows || rows.length === 0 || !rows[0].values) return [];
    return rows[0].values.map(row => {
      const cols = rows[0].columns;
      const obj = {};
      cols.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  });

  ipcMain.handle('db:getPayrollPeriods', async () => {
    const rows = sqliteInstance.exec('SELECT * FROM payroll_periods');
    if (!rows || rows.length === 0 || !rows[0].values) return [];
    return rows[0].values.map(row => {
      const cols = rows[0].columns;
      const obj = {};
      cols.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  });

  ipcMain.handle('dialog:openFile', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: (options && options.filters) || [{ name: 'Excel Files', extensions: ['xlsx', 'csv'] }]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}
