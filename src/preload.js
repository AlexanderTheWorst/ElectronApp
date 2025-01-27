const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping')
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('API', {
  toMain: (args) => ipcRenderer.invoke('toMain', args),

  onUpdate: (callback) => ipcRenderer.on('update', (_event, data) => callback(_event, data)),
})