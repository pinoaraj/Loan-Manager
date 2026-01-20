console.log('Process ExecPath:', process.execPath);
console.log('Process Versions:', process.versions);
try {
    const electron = require('electron');
    console.log('Electron require type:', typeof electron);
    if (typeof electron === 'string') {
        console.log('Electron require value:', electron);
    } else {
        console.log('Electron app defined:', !!electron.app);
    }
} catch (error) {
    console.error('Error:', error);
}
