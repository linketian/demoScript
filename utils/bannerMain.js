const { app, Tray, BrowserWindow, Menu, ipcMain, globalShortcut, screen, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');


const winURL = isDev
    ? `http://localhost:${getVitePort()}`
    : `file://${path.join(__dirname, '../build/index.html')}`;
// 保持对window对象的全局引用，否则窗口会被自动关闭
let mainWindow, sonWindow;

function createWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            contextIsolation: true, // 安全设置
            nodeIntegration: false,
            preload: path.join(__dirname, 'electron-preload.js') // 预加载脚本路径
        }
    });

    // 加载应用
    mainWindow.loadURL(winURL);
    // 开发环境打开开发者工具
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // 窗口关闭时触发
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    autoUpdateInit(mainWindow)
}

function createSonWindow(parms) {
    if (sonWindow) {
        sonWindow.close();
        sonWindow = null
    }
    sonWindow = new BrowserWindow({
        width: parms.width,
        height: parms.height,
        frame: parms.frame, // 去掉边框
        maximizable: false, // 去掉最大化按钮
        webPreferences: {
            // highDpiSupport: true,
            nodeIntegration: true, // Electron 5.0.0 版本之后它将被默认false
            // 是否在独立 JavaScript 环境中运行 Electron API和指定的preload 脚本.默认为 true
            contextIsolation: false,  // Electron 12 版本之后它将被默认true 
            enableRemoteModule: true,
            preload: path.join(__dirname, '../static/js/preload.js') // preload.js
        }
    })
    sonWindow.on('close', (event) => {
        sonWindow = null
    });
    // require('electron').dialog.showMessageBoxSync(mainWindow, {
    //   type: 'question',
    //   title: '提示',
    //   message: JSON.stringify(parms.router ? winURL + '#' + parms.url : parms.url)
    // });
    console.log('打开地址====>', parms.router ? winURL + '#' + parms.url : parms.url)
    sonWindow.loadURL(parms.router ? winURL + '#' + parms.url : parms.url)
}

function quitApp() {
    app.quit();
}


// 应用就绪时创建窗口
app.on('ready', () => {
    createWindow()
    createSonWindow({
        width: 400, // 宽度
        height: 300, // 高度
        url: path.join(__dirname, `/view/loading.html`),
        router: false, // 是否使用项目中路由进行窗口地址加载
        frame: false,
    })
    // 创建任务栏图标
    let tray = null;
    tray = new Tray(path.join(__dirname, '/img/logo.png'));
    const contextMenu = Menu.buildFromTemplate([
        // { label: 'Item 1', type: 'normal',click: () => console.log('Item 1====>', )},
        // { label: 'Item 2', type: 'normal' },
        // { type: 'separator' },
        {
            label: '退出', type: 'normal', click: function () {
                quitApp()
            }
        }
    ]);
    // 设置托盘菜单
    tray.setContextMenu(contextMenu);

    // 设置托盘工具提示
    tray.setToolTip('');

    // 托盘图标被点击时的事件
    tray.on('click', () => {
        // 处理点击事件，可以执行你想要的操作
        console.log('托盘图标被点击');
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });


    mainWindow.webContents.on('dom-ready', () => {
        const uaArr = mainWindow.webContents.getUserAgent().split(" ");
        const newUaArr = uaArr.filter((uar => !uar.startsWith('Electron')));
        mainWindow.webContents.setUserAgent(newUaArr.join(" "));
        if (sonWindow) {
            sonWindow.close();
            sonWindow = null
        }
        mainWindow.show();
    })
});

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
    // macOS特殊处理
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 应用激活时（macOS Dock点击）
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
app.on('browser-window-focus', () => {
    globalShortcut.register('F5', () => {
        mainWindow.reload();
    });
});
app.on('browser-window-blur', () => {
    globalShortcut.unregister('F5');
});

// ipcMain.on('fromVueMessages', (event, args) => {
//     switch (args.type) {
//         case 'getScaleFactor':
//             const primaryDisplay = screen.getPrimaryDisplay();
//             const scaleFactor = 1 / primaryDisplay.scaleFactor;
//             sendVueMain({ type: 'getScaleFactor', val: scaleFactor })
//             break;
//         default:
//             break;
//     }
// })






// 检查更新
// 软件检查更新 fn
async function autoUpdateInit(mainWindow) {
    autoUpdater.checkForUpdates()
    autoUpdater.disableWebInstaller = false
    autoUpdater.autoDownload = false //这个必须写成false，写成true时，我这会报没权限更新，也没清楚什么原因
    //  发生错误时
    autoUpdater.on('error', (error) => {
        // let errStr = JSON.stringify(error).toString()
        // dialog.showMessageBox({
        //   title: '错误！',
        //   message: errStr,
        // })
    })
    // 发现可更新数据时
    autoUpdater.on('update-available', (info) => {
        const { version } = info
        autoUpdater.downloadUpdate()
    })
    // 没有可更新数据时
    autoUpdater.on('update-not-available', (event, arg) => {
        // dialog.showMessageBox({
        //   title: '没有可更新数据',
        //   message: '',
        // })
    })
    // 下载监听
    autoUpdater.on('download-progress', (progress) => {
        console.log('触发下载,', progress, '%')
        mainWindow.webContents.send('downloadEvent', progress)
    })
    // 下载完成
    autoUpdater.on('update-downloaded', () => {
        mainWindowHandleClose = true
        isSeparateClose = true;
        autoUpdater.quitAndInstall()
    })
}
