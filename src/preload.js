const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping')
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('API', {
  hasLoaded: () => ipcRenderer.invoke('loaded'),
  launchProcess: (processName, processDir) => ipcRenderer.invoke('launchProcess', processName, processDir),

  onLoaded: (callback) => ipcRenderer.on('loaded', (_event, data) => callback(_event, data)),
  processLaunched: (callback) => ipcRenderer.on('processLaunched', (_event, gameData, processData) => callback(gameData, processData)),
})