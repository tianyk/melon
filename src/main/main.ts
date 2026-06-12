import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { ensureDataDirectories } from './settings';
import { registerIpcHandlers } from './bridge';
import { HarnessManager } from './harness-manager';
import { McpManager } from './mcp-manager';

let mainWindow: BrowserWindow | null = null;
let harnessManager: HarnessManager;

function createWindow(): void {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		title: '西瓜',
		webPreferences: {
			preload: join(__dirname, '../preload/preload.js'),
			sandbox: true,
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	// 初始化管理器
	harnessManager = new HarnessManager(mainWindow);
	const mcpManager = new McpManager();

	// 注册 IPC
	registerIpcHandlers(harnessManager, mcpManager);

	// 外部链接用系统浏览器打开
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith('https:') || url.startsWith('http:')) {
			shell.openExternal(url);
		}
		return { action: 'deny' };
	});

	// 加载页面
	if (process.env.ELECTRON_RENDERER_URL) {
		mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
	}

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

app.whenReady().then(() => {
	ensureDataDirectories();
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
