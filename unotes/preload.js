// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// const ipc = ipcRenderer;

contextBridge.exposeInMainWorld('electron', {
  // Browser usage.
  ipc: ipcRenderer,
  ipcRenderer: {
    myPing() {
      ipcRenderer.send('ipc-example', 'ping');
    },
    on(channel, func) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    once(channel, func) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    send(channel, arg) {
      ipcRenderer.send(channel, arg);
    },
  },
  store: {
    get(val) {
      return ipcRenderer.send('electron-store-get', val);
    },
    set(property, val) {
      ipcRenderer.send('electron-store-set', property, val);
    },
  },
});
