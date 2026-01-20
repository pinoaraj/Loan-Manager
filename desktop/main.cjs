try {
    const electron = require('electron');
    const fs = require('fs'); // Add fs
    console.log('REQUIRED ELECTRON:', electron);
    const { app, BrowserWindow, dialog } = electron; // Add dialog
    const path = require('path');
    const { fork } = require('child_process');

    // LOGGING SETUP
    const logPath = path.join(__dirname, '../debug-log.txt');
    function log(message) {
        try {
            console.log(message); // Ensure it goes to console too
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
        } catch (e) {
            console.error('Failed to write to log:', e);
        }
    }

    log('--- MAIN PROCESS STARTED ---');

    // Global Error Handlers
    process.on('uncaughtException', (error) => {
        log(`UNCAUGHT EXCEPTION: ${error.stack}`);
        if (dialog) dialog.showErrorBox('Uncaught Exception', error.stack);
    });


// Determine dev mode
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
let serverProcess;

function startServer() {
    log('Starting startServer function...');
    if (!isDev) {
        let serverPath, dbPath, cwd;

        try {
            if (app.isPackaged) {
                serverPath = path.join(process.resourcesPath, 'server/index.js');
                cwd = path.join(process.resourcesPath, 'server');
                dbPath = path.join(process.resourcesPath, 'server/prisma/dev.db');
            } else {
                serverPath = path.join(__dirname, '../server/index.js');
                cwd = path.join(__dirname, '../server');
                dbPath = path.join(__dirname, '../server/prisma/dev.db');
            }
            
            log(`Server Config: Path=${serverPath}, CWD=${cwd}, DB=${dbPath}`);
            
            if (!fs.existsSync(serverPath)) {
                throw new Error(`Server file not found at: ${serverPath}`);
            }

            serverProcess = fork(serverPath, [], {
                cwd: cwd,
                env: { 
                    ...process.env, 
                    PORT: 3001, 
                    DATABASE_URL: `file:${dbPath}`
                },
                stdio: 'pipe'
            });

            serverProcess.on('error', (err) => {
                log(`Server Process Error: ${err.message}`);
            });
            
            if (serverProcess.stdout) {
                serverProcess.stdout.on('data', (data) => log(`[SERVER OUT]: ${data}`));
            }
            if (serverProcess.stderr) {
                serverProcess.stderr.on('data', (data) => log(`[SERVER ERR]: ${data}`));
            }

            log('Server process forked successfully.');

        } catch (e) {
            log(`CRITICAL SERVER START ERROR: ${e.stack}`);
            dialog.showErrorBox('Server Start Error', e.message);
        }
    } else {
        log('Dev mode: Server skipped.');
    }
}

function createWindow() {
    log('Creating window...');
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        setTimeout(() => {
            const indexPath = path.join(__dirname, '../dist/index.html');
            log(`Loading index from: ${indexPath}`);
            mainWindow.loadFile(indexPath);
        }, 1000);
    }
}

app.whenReady().then(() => {
    log('App Ready');
    startServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
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
} catch (err) {
    const fs = require('fs');
    fs.appendFileSync('fatal-error.txt', err.stack);
}

