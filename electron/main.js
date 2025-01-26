const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../public/images/liberchat-logo.png'),
        title: 'Liberchat'
    });

    // Charger l'URL de production
    mainWindow.loadURL('https://liberchat-3-0-1.onrender.com');

    // Enlever le menu par défaut
    mainWindow.setMenu(null);

    // Gérer la fermeture
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

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

// Vérifier les mises à jour
autoUpdater.checkForUpdatesAndNotify();
