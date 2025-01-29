const { ipcRenderer, globalShortcut, webContents } = require('electron');
const { app, BrowserWindow, ipcMain } = require('electron/main');
const path = require('node:path');
const fs = require('fs');
const { spawn } = require('node:child_process');

const createWindow = () => {
  const win = new BrowserWindow({
    skipTaskbar: false,
    fullscreen: true,
    hasShadow: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, '/src/preload.js'),
      contextIsolation: true,
      backgroundThrottling: false // Ensures the video keeps running smoothly
    }
  });

  let games = getGames()

  win.loadFile('src/index.html');

  win.on('close', (event) => {
    event.preventDefault();
  });

  ipcMain.handle('loaded', () => {
    console.log("Has loaded!");
    win.webContents.send("loaded", { games: games });
  });

  ipcMain.handle('launchProcess', (_event, processName) => {
    let gameDat = games.filter(game => game.game === processName);
    if (gameDat.length == 0) return;
    gameDat = gameDat[0];
    let child = spawn(gameDat.exe, {
      stdio: "pipe",
      cwd: gameDat.dir,
    })
    child.on("close", () => console.log("Process closed."));
    child.on("spawn", () => console.log("Process spawned."));
    child.on("error", (err) => console.log(err));
  });

  return win;
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

let gNames = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'names.json'), { encoding: 'utf-8', flag: 'r' })
);

function findMainGameExe(gameFolder) {
  const excludeList = [
    'anticheat',
    'crashhandler',
    'updater',
    'install',
    'uninstall',
    'vc_redist',
    'vcredist',
    'dxsetup'
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
        exeFiles.push({ path: fullPath, size: stat.size });
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

  return filtered[0].path;
}

function recurse(...paths) {
  const recursiveList = [];

  paths.forEach((glPath) => {
    const files = fs.readdirSync(glPath, { encoding: 'utf-8', recursive: false });

    files.forEach((file) => {
      const gamePath = path.join(glPath, file);
      let exe = findMainGameExe(gamePath)
      if (!exe || !fs.existsSync(exe)) return;

      recursiveList.push({
        dir: gamePath,
        exe,
        game: file,
        icon: `./assets/icons/${file.replaceAll(' ', '').toLowerCase()}.png`
      });
    });
  });

  return recursiveList;
}

function getGames() {
  const steamPath = 'C:\\Program Files (x86)\\Steam\\steamapps\\common';
  const extraSteamPath = 'D:\\SteamLibrary\\steamapps\\common';
  return recurse(steamPath);
}

// Example of launching a game executable (uncomment to use)
// const gameProcess = spawn(recurse(steamPath)[0].exe, { stdio: 'pipe' });
// gameProcess.on('message', () => console.log);
// gameProcess.on('close', () => console.log('Process closed'));
