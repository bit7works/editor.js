const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const Store = require('electron-store');
const Config = require('electron-config');
const fs = require('fs');
const path = require('path');
const Notebook = require('./notebook');

const store = new Store();
const config = new Config();

const notes = new Notebook(store);

// Main Window.
let mainWindow = null;

const createWindow = () => {
  // Create the browser window.
  const winWidth = 800;
  const winHeight = 700;

  const winMinWidth = 380;
  const winMinHeight = 300;
  const options = {
    width: winWidth,
    height: winHeight,
    minHeight: winMinHeight,
    minWidth: winMinWidth,
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  };

  const winBounds = config.get('winBounds');
  if (winBounds) {
    if (winBounds.width < winMinWidth) {
      winBounds.width = winMinWidth;
    }
    if (winBounds.height < winMinHeight) {
      winBounds.height = winMinHeight;
    }
    Object.assign(options, winBounds);
  }

  mainWindow = new BrowserWindow(options);

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('close', () => {
    config.set('winBounds', mainWindow.getBounds());
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//
// Add event listeners...
//

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        createWindow();
      }
    });
  })
  .catch(console.log);

// IPC Commands
ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong) => `IPC test: ${pingPong}`;

  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// Toobar func.
ipcMain.on('toolbar-clicked', async () => {
  if (!mainWindow) {
    throw new Error('"windown - mainWindow" is not defined');
  }
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('open-default-document', () => {
  openFile(notes.getDefaultDocumentPath());
});

ipcMain.on('save-default-document', (event, note) => {
  const currentDocumentPath = notes.getCurrentDocumentPath();

  console.log('[CURRENT FILE] >> ', currentDocumentPath);
  fs.writeFile(currentDocumentPath, note.content, (error) => {
    if (error) {
      handleError();
    }
    console.log('[o] Save content to ', currentDocumentPath);

    mainWindow.webContents.send('local-document-updated', note);
  });
});

ipcMain.on('open-local-document', (filePath) => {
  if (filePath.length > 0) {
    openFile(filePath);
  } else {
    dialog
      .showOpenDialog({
        properties: [ 'openFile' ],
        filters: [ {
          name: 'text files',
          extensions: [ 'json' ],
        } ],
      })
      .then(({ filePaths }) => {
        filePath = filePaths[0];

        openFile(filePath);
      })
      .catch((e) => {
        console.log(e);
      });
  }
});

ipcMain.on('create-local-document', () => {
  dialog
    .showSaveDialog(mainWindow, {
      filters: [ {
        name: 'text files',
        extensions: [ 'json' ],
      } ],
    })
    .then(({ filePath }) => {
      fs.writeFile(filePath, '', (error) => {
        if (error) {
          handleError();
        } else {
          app.addRecentDocument(filePath);

          console.log(filePath);
          openFile(filePath);
        }
      });
    });
});

ipcMain.on('electron-store-get', async (event, val) => {
  console.log('== get| ', val, store.get(val));
  event.returnValue = store.get(val);
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  console.log('== set| ', key, val);
  store.set(key, val);
});

const openFile = (filePath) => {
  fs.readFile(filePath, 'utf8', (error, content) => {
    if (error) {
      handleError();
    } else {
      console.log('[o] OPEN FILE > ', filePath);
      app.addRecentDocument(filePath);
      openedFilePath = filePath;

      if (!filePath) {
        return;
      }
      // set current documrnt path.
      notes.setCurrentDocumentPath(filePath);
      mainWindow.webContents.send('local-document-opened', {
        filePath,
        content,
      });
    }
  });
};

const handleError = () => {
  new Notification({
    title: 'Error',
    body: 'Sorry, something went wrong :(',
  }).show();
};
