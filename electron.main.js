const { Vibrant } = require('node-vibrant/node');
const { ipcRenderer, globalShortcut, webContents } = require('electron');
const { app, BrowserWindow, ipcMain } = require('electron/main');
const { spawn, exec } = require('node:child_process');
const path = require('node:path');
const fs = require('fs');
const acfParser = require('steam-acf2json');
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

    const steamPath = 'C:\\Program Files (x86)\\Steam\\steam.exe';
    const launchCommand = `"${steamPath}" -silent -applaunch ${appid}`;

    const child = exec(launchCommand, {
      stdio: 'pipe',
      cwd: installdir,
    })

    const pid = await getPid(exe);
    const process = { name, pid }
    openProcesses.push(process)
    console.log(process)
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
    processMonitor.on('processStarted', function processStarted(process) {
      if (process.name === exeName) {
        resolve(process.pid);
        processMonitor.removeListener('processStarted', processStarted);
      }
    });
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
    if (!exe) continue;

    let icon = path.join('assets', 'icons', `${appid}.png`);
    let srcIcon = path.join(__dirname, 'src', icon);

    if (!fs.existsSync(srcIcon)) continue;

    let accent = (await new Vibrant(srcIcon).getPalette()).Vibrant;
    sorted.push({ name, appid, installdir, exe, accent, icon });
  }

  return sorted;
}

// Fetch installed Steam games using PowerShell
function windows__getInstalledSteamGames() {
  return new Promise((resolve, reject) => {
    let steamPath = 'C:\\Program Files (x86)\\Steam\\steamapps';
    exec(
      `powershell.exe -Command "Get-ChildItem -Path '${steamPath}' -Filter '*.acf' | Select-Object -ExpandProperty Name"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(error);
        }

        let games = [];
        let manifests = stdout.trim().split('\r\n');
        manifests.forEach((file) => {
          let appstate = acfParser.decode(
            fs.readFileSync(path.join(steamPath, file), { flag: 'r', encoding: 'utf-8' })
          ).AppState;
          let { name, appid, installdir } = appstate;
          installdir = path.join(steamPath, 'common', installdir);
          games.push({ name, appid, installdir });
        });
        resolve(games);
      }
    );
  });
}