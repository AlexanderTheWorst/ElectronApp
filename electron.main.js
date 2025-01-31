const { Vibrant } = require('node-vibrant/node');
const { ipcRenderer, globalShortcut, webContents } = require('electron');
const { app, BrowserWindow, ipcMain } = require('electron/main');
const { spawn, exec } = require('node:child_process');
const { windows__getInstalledSteamGames, getSteamInstallDir } = require('./steam.functions');
const path = require('node:path');
const fs = require('fs');
const Monitor = require('./monitor.main');

const processMonitor = new Monitor();
const openProcesses = [];

// Create window and handle basic window operations
const createWindow = async () => {
  const win = new BrowserWindow({
    skipTaskbar: false,
    fullscreen: true,
    hasShadow: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, '/src/preload.js'),
      contextIsolation: true,
      backgroundThrottling: false, // Ensures smooth video playback
    },
  });

  let games = await getGames();
  win.loadFile('src/index.html');

  win.on('close', (event) => event.preventDefault());

  ipcMain.handle('loaded', () => {
    console.log('Has loaded!');
    win.webContents.send('loaded', { games });
  });

  ipcMain.handle('launchProcess', async (_event, appid) => {
    let gameDat = games.find((game) => game.appid === appid);
    if (!gameDat) return;
    let { name, exe, installdir, accent } = gameDat;

    const steamPath = `${await getSteamInstallDir()}\\steam.exe`;
    const launchCommand = `"${steamPath}" -silent -applaunch ${appid}`;

    const child = exec(launchCommand, {
      stdio: 'pipe',
      cwd: installdir,
    })

    getPid(exe).then(pid => {
      const process = { name, pid }
      openProcesses.push(process)
      console.log(process)
      win.webContents.send('processLaunched', gameDat, process)
    }).catch(err => console.log(err))
  });

  processMonitor.on('processClosed', (closed) => {
    const index = openProcesses.findIndex((process) => process.pid === closed.pid);
    if (index !== -1) {
      const openProcess = openProcesses[index];
      openProcesses.splice(index, 1);
      console.log(openProcess.name, 'was closed!');
    }
  });

  return win;
};

// Handle app readiness
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Function to get the process PID
async function getPid(exeName) {
  return new Promise((resolve, reject) => {
    try {
      getSteamInstallDir();

      function processStarted(process) {
        if (process.name === exeName) {
          clearTimeout(timeout)
          processMonitor.removeListener('processStarted', processStarted);
          resolve(process.pid);
        }
      }

      let timeout = setTimeout(() => {
        processMonitor.removeListener('processStarted', processStarted);
        clearTimeout(timeout)
        reject("Timeout!")
      }, 30 * 1000)

      processMonitor.on('processStarted', processStarted);
    } catch (err) {
      console.log(err.message)
      reject('Is steam installed?')
    }
  });
}

// Scan folder for main game executable
function findMainGameExe(gameFolder) {
  const excludeList = [
    'anticheat',
    'crashhandler',
    'updater',
    'install',
    'uninstall',
    'vc_redist',
    'vcredist',
    'dxsetup',
    'godotworkshop',
  ];
  const exeFiles = [];

  const scanFolder = (folder) => {
    const files = fs.readdirSync(folder);
    files.forEach((file) => {
      const fullPath = path.join(folder, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanFolder(fullPath);
      } else if (file.toLowerCase().endsWith('.exe')) {
        exeFiles.push({ path: fullPath, file, size: stat.size });
      }
    });
  };

  scanFolder(gameFolder);

  if (exeFiles.length === 0) {
    console.log('No .exe files found.');
    return null;
  }

  const filtered = exeFiles.filter(
    (file) => !excludeList.some((exclude) => file.path.toLowerCase().includes(exclude))
  );

  if (filtered.length === 0) {
    console.log('No suitable .exe files found after filtering.');
    return null;
  }

  filtered.sort((a, b) => b.size - a.size);

  return filtered[0].file;
}

// Get installed Steam games
async function getGames() {
  let steamGames = await windows__getInstalledSteamGames();
  let sorted = [];

  for (const game of steamGames) {
    const { appid, name, installdir } = game;
    let exe = findMainGameExe(installdir);
    console.log(installdir, exe)
    if (!exe) continue;

    let icon = path.join('assets', 'icons', `${appid}.png`);
    let srcIcon = path.join(__dirname, 'src', icon);

    if (!fs.existsSync(srcIcon)) continue;

    let accent = (await new Vibrant(srcIcon).getPalette()).Vibrant;
    sorted.push({ name, appid, installdir, exe, accent, icon });
  }

  return sorted;
}