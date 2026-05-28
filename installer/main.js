'use strict'

const { app, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const http = require('http')

// Single-instance lock: 2º duplo-clique foca janela existente em vez de subir novo backend
app.setName('planejAI')
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

const isDev = !app.isPackaged
const userDataDir = app.getPath('userData')
const logsDir = path.join(userDataDir, 'logs')
fs.mkdirSync(logsDir, { recursive: true })

const apiPort = 3001
const webPort = 3000

let apiProc = null
let webProc = null
let mainWindow = null

function resourcePath(...parts) {
  if (isDev) return path.join(__dirname, ...parts)
  return path.join(process.resourcesPath, ...parts)
}

function logFile(name) {
  return fs.createWriteStream(path.join(logsDir, name), { flags: 'a' })
}

function tagStream(stream, tag) {
  let buf = ''
  stream.on('data', (chunk) => {
    buf += chunk.toString()
    let nl
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl)
      buf = buf.slice(nl + 1)
      console.log(`[${tag}] ${line}`)
    }
  })
}

function startApi() {
  const apiDir = resourcePath('app', 'api')
  const entry = path.join(apiDir, 'dist', 'server.js')
  const dbTemplate = path.join(apiDir, 'prisma', 'template.db')

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NODE_ENV: 'production',
    PORT: String(apiPort),
    PLANEJAI_DATA_DIR: userDataDir,
    PLANEJAI_DB_TEMPLATE: dbTemplate,
    CORS_ORIGIN: `http://127.0.0.1:${webPort}`,
  }

  const child = spawn(process.execPath, [entry], {
    cwd: apiDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const out = logFile('api.log')
  child.stdout.pipe(out)
  child.stderr.pipe(out)
  tagStream(child.stdout, 'api')
  tagStream(child.stderr, 'api-err')

  child.on('exit', (code) => {
    console.log(`api exited with code ${code}`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox('planejAÍ', `Backend encerrou inesperadamente (code ${code}). Veja ${logsDir}\\api.log`)
    }
  })

  return child
}

function startWeb() {
  const webDir = resourcePath('app', 'web')
  const entry = path.join(webDir, 'server.js')

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NODE_ENV: 'production',
    PORT: String(webPort),
    HOSTNAME: '127.0.0.1',
    NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}`,
  }

  const child = spawn(process.execPath, [entry], {
    cwd: webDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const out = logFile('web.log')
  child.stdout.pipe(out)
  child.stderr.pipe(out)
  tagStream(child.stdout, 'web')
  tagStream(child.stderr, 'web-err')

  child.on('exit', (code) => {
    console.log(`web exited with code ${code}`)
  })

  return child
}

function waitForUrl(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) return resolve()
        retry()
      })
      req.on('error', retry)
      req.setTimeout(1000, () => { req.destroy(); retry() })
    }
    const retry = () => {
      if (Date.now() > deadline) return reject(new Error(`timeout esperando ${url}`))
      setTimeout(tryOnce, 300)
    }
    tryOnce()
  })
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'planejAÍ',
    backgroundColor: '#0F1014',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  Menu.setApplicationMenu(null)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.loadURL(`http://127.0.0.1:${webPort}`)

  mainWindow.on('closed', () => { mainWindow = null })
}

app.on('second-instance', () => {
  // Usuário tentou abrir 2ª vez → foca janela existente
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function killChildren() {
  for (const proc of [apiProc, webProc]) {
    if (!proc || proc.killed) continue
    try {
      if (process.platform === 'win32') {
        // Windows: taskkill /T mata árvore de processos (Next spawna sub-procs)
        spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { stdio: 'ignore' })
      } else {
        proc.kill('SIGTERM')
      }
    } catch (_) {}
  }
}

app.on('before-quit', killChildren)
app.on('will-quit', killChildren)
process.on('exit', killChildren)

app.whenReady().then(async () => {
  try {
    apiProc = startApi()
    webProc = startWeb()
    await waitForUrl(`http://127.0.0.1:${apiPort}/health`)
    await waitForUrl(`http://127.0.0.1:${webPort}`)
    await createWindow()
  } catch (err) {
    dialog.showErrorBox('planejAÍ', `Falha ao iniciar: ${err.message}\n\nLogs em: ${logsDir}`)
    app.quit()
  }
})
