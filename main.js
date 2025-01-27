const { ipcRenderer, globalShortcut } = require('electron')
const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const fs = require("fs")
const { ChildProcess, spawn, execFile } = require('node:child_process')

const createWindow = () => {
  const win = new BrowserWindow({
    skipTaskbar: false,
    fullscreen: true,
    hasShadow: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, '/src/preload.js'),
      contextIsolation: true,
      backgroundThrottling: false // Ensures the video keeps running smoothly,
    }
  })

  win.loadFile('src/index.html');

  win.on('close', (event) => {
    event.preventDefault();
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

let gNames = fs.readFileSync(path.join(__dirname, "names.json"), { encoding: "utf-8", flag: "r" })
gNames = JSON.parse(gNames)


const steamPath = "C:\\Program Files (x86)\\Steam\\steamapps\\common"
const extraSteamPath = "D:\\SteamLibrary\\steamapps\\common"
function recurse(...paths) {
  let recursiveList = []

  paths.forEach(glPath => {
    let files = fs.readdirSync(glPath, {
      encoding: "utf-8",
      recursive: false
    })

    files.forEach(file => {
      if (!gNames[file]) return;
      recursiveList.push({
        dir: path.join(glPath, file),
        exe: path.join(glPath, file, gNames[file]),
        game: file
      })
    })
  })

  return recursiveList
}

const exe = recurse(steamPath)[0].exe
const child = execFile(exe, [], (err, out, stderr) => {
  if (err || stderr) {
    console.error('Error:', err || stderr);
  }
});
child.on('exit', (code) => {
  console.log(`Game exited with code ${code}`);
});