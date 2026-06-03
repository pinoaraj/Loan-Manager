try {
    const electron = require('electron');
    const crypto = require('crypto');
    const fs = require('fs');
    const path = require('path');
    const { fork, spawnSync } = require('child_process');
    const { app, BrowserWindow, dialog, shell } = electron;

    console.log('REQUIRED ELECTRON:', electron);

    const SERVER_PORT = 3011;
    const SERVER_HEALTH_URL = `http://127.0.0.1:${SERVER_PORT}/api/health`;
    const SERVER_READY_TIMEOUT_MS = 45000;

    function resolveLogPath() {
        try {
            const userDataPath = app.getPath('userData');
            return path.join(userDataPath, 'debug-log.txt');
        } catch (error) {
            console.error('Failed to resolve userData log path:', error);
            return path.join(process.cwd(), 'debug-log.txt');
        }
    }

    function log(message) {
        try {
            console.log(message);
            fs.appendFileSync(resolveLogPath(), `[${new Date().toISOString()}] ${message}\n`);
        } catch (error) {
            console.error('Failed to write to log:', error);
        }
    }

    function findTemplateDb(baseDir) {
        const candidates = [
            path.join(baseDir, 'prisma', 'dev.db'),
            path.join(baseDir, 'dev.db')
        ];

        return candidates.find((candidate) => fs.existsSync(candidate)) || null;
    }

    function resolveMigrationStatePath() {
        return path.join(app.getPath('userData'), 'migration-state.json');
    }

    function getLatestMigrationName(baseDir) {
        const migrationsDir = path.join(baseDir, 'prisma', 'migrations');

        try {
            const migrationNames = fs.readdirSync(migrationsDir, { withFileTypes: true })
                .filter((entry) => entry.isDirectory())
                .map((entry) => entry.name)
                .sort();

            return migrationNames.at(-1) || 'no-migrations';
        } catch (error) {
            log(`Unable to inspect migrations directory at ${migrationsDir}: ${error.message}`);
            return 'unknown-migration';
        }
    }

    function loadMigrationState() {
        const migrationStatePath = resolveMigrationStatePath();

        try {
            if (!fs.existsSync(migrationStatePath)) {
                return null;
            }

            return JSON.parse(fs.readFileSync(migrationStatePath, 'utf8'));
        } catch (error) {
            log(`Failed to read migration state: ${error.message}`);
            return null;
        }
    }

    function persistMigrationState(state) {
        const migrationStatePath = resolveMigrationStatePath();

        try {
            fs.writeFileSync(migrationStatePath, JSON.stringify(state, null, 2), 'utf8');
        } catch (error) {
            log(`Failed to persist migration state: ${error.message}`);
        }
    }

    function resolveAppIcon() {
        const candidates = app.isPackaged
            ? [
                path.join(process.resourcesPath, 'build', 'icons', 'app-icon.png'),
                path.join(process.resourcesPath, 'build', 'icons', 'app-icon.ico')
            ]
            : [
                path.join(__dirname, '../build/icons/app-icon.png'),
                path.join(__dirname, '../build/icons/app-icon.ico')
            ];

        return candidates.find((candidate) => fs.existsSync(candidate));
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function ensureDesktopJwtSecret() {
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
            return process.env.JWT_SECRET;
        }

        const secretPath = path.join(app.getPath('userData'), 'jwt-secret.txt');

        try {
            if (fs.existsSync(secretPath)) {
                const existingSecret = fs.readFileSync(secretPath, 'utf8').trim();
                if (existingSecret.length >= 32) {
                    log(`Using persisted desktop JWT secret from ${secretPath}`);
                    return existingSecret;
                }
            }

            const generatedSecret = crypto.randomBytes(48).toString('base64url');
            fs.writeFileSync(secretPath, generatedSecret, 'utf8');
            log(`Generated desktop JWT secret at ${secretPath}`);
            return generatedSecret;
        } catch (error) {
            log(`Failed to persist desktop JWT secret: ${error.message}`);
            return crypto.randomBytes(48).toString('base64url');
        }
    }

    async function waitForServerReady(timeoutMs = SERVER_READY_TIMEOUT_MS) {
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeoutMs) {
            try {
                const response = await fetch(SERVER_HEALTH_URL);
                if (response.ok) {
                    log('Server healthcheck passed.');
                    return true;
                }
            } catch (error) {
                log(`Server healthcheck pending: ${error.message}`);
            }

            await sleep(500);
        }

        return false;
    }

    function renderStatusPage(mainWindow, title, message) {
        const html = `
            <!doctype html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>${title}</title>
                    <style>
                        body {
                            margin: 0;
                            font-family: Segoe UI, sans-serif;
                            background: #0f172a;
                            color: #e2e8f0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                        }
                        .card {
                            max-width: 560px;
                            padding: 32px;
                            border-radius: 18px;
                            background: rgba(15, 23, 42, 0.88);
                            border: 1px solid rgba(148, 163, 184, 0.2);
                            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
                        }
                        h1 {
                            margin: 0 0 12px;
                            font-size: 24px;
                        }
                        p {
                            margin: 0;
                            line-height: 1.6;
                            color: #cbd5e1;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>${title}</h1>
                        <p>${message}</p>
                    </div>
                </body>
            </html>
        `;

        mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    }

    log('--- MAIN PROCESS STARTED ---');

    process.on('uncaughtException', (error) => {
        log(`UNCAUGHT EXCEPTION: ${error.stack}`);
        if (dialog) {
            dialog.showErrorBox('Uncaught Exception', error.stack);
        }
    });

    const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
    let serverProcess;

    async function startServer() {
        log('Starting startServer function...');
        if (isDev) {
            log('Dev mode: Server skipped.');
            return true;
        }

        let serverPath;
        let dbPath;
        let cwd;

        try {
            if (app.isPackaged) {
                cwd = path.join(process.resourcesPath, 'server');
                serverPath = path.join(cwd, 'index.js');

                const userDataPath = app.getPath('userData');
                dbPath = path.join(userDataPath, 'dev.db');

                if (!fs.existsSync(dbPath)) {
                    const templateDb = findTemplateDb(cwd);
                    if (templateDb) {
                        fs.copyFileSync(templateDb, dbPath);
                        log(`Database copied to userData from ${templateDb}`);
                    } else {
                        log('No packaged template database found. Server will create a fresh database if needed.');
                    }
                }
            } else {
                cwd = path.join(__dirname, '../server');
                serverPath = path.join(cwd, 'index.js');
                dbPath = path.join(cwd, 'prisma', 'dev.db');
            }

            log(`Server Config: Path=${serverPath}, CWD=${cwd}, DB=${dbPath}`);

            if (!fs.existsSync(serverPath)) {
                throw new Error(`Server file not found at: ${serverPath}`);
            }

            const migrationsReady = runPrismaMigrations(cwd, dbPath, app.isPackaged);
            if (!migrationsReady) {
                throw new Error('The local database could not be migrated to the required version.');
            }

            const jwtSecret = ensureDesktopJwtSecret();

            serverProcess = fork(serverPath, [], {
                cwd,
                env: {
                    ...process.env,
                    PORT: SERVER_PORT,
                    DATABASE_URL: `file:${dbPath}`,
                    JWT_SECRET: jwtSecret,
                    DESKTOP_APP: 'true'
                },
                stdio: 'pipe'
            });

            serverProcess.on('error', (error) => {
                log(`Server Process Error: ${error.message}`);
            });

            serverProcess.on('exit', (code, signal) => {
                log(`Server Process Exit: code=${code} signal=${signal}`);
            });

            if (serverProcess.stdout) {
                serverProcess.stdout.on('data', (data) => log(`[SERVER OUT]: ${data}`));
            }

            if (serverProcess.stderr) {
                serverProcess.stderr.on('data', (data) => log(`[SERVER ERR]: ${data}`));
            }

            log('Server process forked successfully.');

            const isReady = await waitForServerReady();
            if (!isReady) {
                throw new Error('The local backend did not become ready in time.');
            }

            return true;
        } catch (error) {
            log(`CRITICAL SERVER START ERROR: ${error.stack}`);
            dialog.showErrorBox('Server Start Error', error.message);
            return false;
        }
    }

    function createWindow() {
        log('Creating window...');

        const mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            icon: resolveAppIcon(),
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });

        mainWindow.webContents.on('will-navigate', (event, url) => {
            if (/^(https?:|mailto:)/i.test(url)) {
                event.preventDefault();
                shell.openExternal(url);
            }
        });

        mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            if (/^(https?:|mailto:)/i.test(url)) {
                shell.openExternal(url);
                return { action: 'deny' };
            }

            return { action: 'allow' };
        });

        if (isDev) {
            mainWindow.loadURL('http://localhost:5173');
            mainWindow.webContents.openDevTools();
            return mainWindow;
        }

        renderStatusPage(mainWindow, 'Starting Loan Manager', 'Preparing the local server and loading your data...');
        return mainWindow;
    }

    function loadProductionApp(mainWindow) {
        const indexPath = path.join(__dirname, '../dist/index.html');
        log(`Loading index from: ${indexPath}`);
        mainWindow.loadFile(indexPath);
    }

    function shouldSkipPackagedMigrations(cwd, dbPath) {
        if (!app.isPackaged || !fs.existsSync(dbPath)) {
            return false;
        }

        const latestMigration = getLatestMigrationName(cwd);
        const currentKey = `${app.getVersion()}::${latestMigration}`;
        const state = loadMigrationState();

        if (!state || state.key !== currentKey) {
            return false;
        }

        try {
            const dbStats = fs.statSync(dbPath);
            const dbMtimeMs = dbStats.mtimeMs;

            if (typeof state.dbMtimeMsAtSuccess !== 'number') {
                return false;
            }

            if (dbMtimeMs < state.dbMtimeMsAtSuccess) {
                log('Database timestamp predates the last successful migration state. Prisma migrate deploy will run again.');
                return false;
            }

            log(`Skipping Prisma migrations for packaged startup (cached state ${currentKey}).`);
            return true;
        } catch (error) {
            log(`Failed to inspect database before skipping migrations: ${error.message}`);
            return false;
        }
    }

    function runPrismaMigrations(cwd, dbPath, isPackagedBuild) {
        const prismaBinary = process.platform === 'win32'
            ? path.join(cwd, 'node_modules', '.bin', 'prisma.cmd')
            : path.join(cwd, 'node_modules', '.bin', 'prisma');

        if (shouldSkipPackagedMigrations(cwd, dbPath)) {
            return true;
        }

        if (!fs.existsSync(prismaBinary)) {
            log(`Prisma CLI not found at ${prismaBinary}.`);
            return !isPackagedBuild;
        }

        log(`Running Prisma migrations against ${dbPath} (${isPackagedBuild ? 'packaged' : 'development'})...`);
        const migrationStartedAt = Date.now();

        const command = process.platform === 'win32' ? 'cmd.exe' : prismaBinary;
        const args = process.platform === 'win32'
            ? ['/c', prismaBinary, 'migrate', 'deploy', '--schema', path.join(cwd, 'prisma', 'schema.prisma')]
            : ['migrate', 'deploy', '--schema', path.join(cwd, 'prisma', 'schema.prisma')];

        const migrationResult = spawnSync(command, args, {
            cwd,
            env: {
                ...process.env,
                DATABASE_URL: `file:${dbPath}`
            },
            encoding: 'utf8',
            timeout: 60000,
            windowsHide: true
        });

        if (migrationResult.error) {
            log(`Prisma migration error: ${migrationResult.error.message}`);
            return false;
        }

        if (migrationResult.stdout) {
            log(`[PRISMA OUT]: ${migrationResult.stdout}`);
        }

        if (migrationResult.stderr) {
            log(`[PRISMA ERR]: ${migrationResult.stderr}`);
        }

        if (migrationResult.status !== 0) {
            log(`Prisma migrate deploy failed: ${migrationResult.stderr || 'Unknown error'}`);
            return false;
        }

        const latestMigration = getLatestMigrationName(cwd);
        const migrationDurationMs = Date.now() - migrationStartedAt;

        try {
            const dbStats = fs.statSync(dbPath);
            persistMigrationState({
                key: `${app.getVersion()}::${latestMigration}`,
                appVersion: app.getVersion(),
                latestMigration,
                dbPath,
                dbMtimeMsAtSuccess: dbStats.mtimeMs,
                migratedAt: new Date().toISOString()
            });
        } catch (error) {
            log(`Migration state persistence skipped: ${error.message}`);
        }

        log(`Prisma migrations completed successfully in ${migrationDurationMs}ms.`);
        return true;
    }

    app.whenReady().then(async () => {
        log('App Ready');

        const mainWindow = createWindow();
        const serverReady = await startServer();

        if (!isDev) {
            if (serverReady) {
                loadProductionApp(mainWindow);
            } else {
                renderStatusPage(
                    mainWindow,
                    'Unable to Start Local Server',
                    'Loan Manager could not start its local backend. Please close the app and review debug-log.txt for details.'
                );
            }
        }

        app.on('activate', async () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                const nextWindow = createWindow();
                if (isDev || await startServer()) {
                    if (!isDev) {
                        loadProductionApp(nextWindow);
                    }
                } else {
                    renderStatusPage(
                        nextWindow,
                        'Unable to Start Local Server',
                        'Loan Manager could not start its local backend. Please close the app and review debug-log.txt for details.'
                    );
                }
            }
        });
    });

    app.on('before-quit', () => {
        if (serverProcess) {
            serverProcess.kill();
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
} catch (error) {
    const fs = require('fs');
    fs.appendFileSync('fatal-error.txt', error.stack);
}
