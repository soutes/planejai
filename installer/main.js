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
let shutdownStarted = false
// Enquanto true, a janela mostra splash.html e aceita setStatus/setFailed.
// Vira false ao carregar a aplicação — daí em diante essas funções não existem mais na página.
let splashAtivo = false

function resourcePath(...parts) {
  if (isDev) return path.join(__dirname, ...parts)
  return path.join(process.resourcesPath, ...parts)
}

// Rotação simples: o log é append-only e uma linha JSON por request faz o arquivo
// crescer sem limite (já passou de 5 MB em uso normal). Ao ultrapassar o teto, o
// atual vira .1 e um novo começa — mantém no máximo dois arquivos por serviço.
const LOG_MAX_BYTES = 5 * 1024 * 1024

function logFile(name) {
  const alvo = path.join(logsDir, name)
  try {
    if (fs.existsSync(alvo) && fs.statSync(alvo).size > LOG_MAX_BYTES) {
      fs.rmSync(`${alvo}.1`, { force: true })
      fs.renameSync(alvo, `${alvo}.1`)
    }
  } catch (_) {
    // Rotação é conveniência: se falhar (arquivo em uso, permissão), segue logando.
  }
  return fs.createWriteStream(alvo, { flags: 'a' })
}

function tagStream(stream, tag, onLine) {
  let buf = ''
  stream.on('data', (chunk) => {
    buf += chunk.toString()
    let nl
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl)
      buf = buf.slice(nl + 1)
      console.log(`[${tag}] ${line}`)
      if (onLine) onLine(line)
    }
  })
}

// Roda JS na página do splash. Silencioso se a janela já trocou pra aplicação
// ou foi fechada — chamada de status nunca deve derrubar o boot.
function splashExec(expr) {
  if (!splashAtivo || !mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.executeJavaScript(expr).catch(() => {})
}

function setStatus(texto, dica) {
  splashExec(`window.setStatus(${JSON.stringify(texto)}, ${JSON.stringify(dica ?? '')})`)
}

function setFailed(texto, detalhe) {
  if (!splashAtivo || !mainWindow || mainWindow.isDestroyed()) {
    dialog.showErrorBox('planejAÍ', `${texto}\n\n${detalhe}`)
    return
  }
  splashExec(`window.setFailed(${JSON.stringify(texto)}, ${JSON.stringify(detalhe)})`)
}

// O trecho lento do boot é a API: backup + migrations antes de escutar a porta.
// Ela já loga cada etapa — reaproveitamos essas linhas como progresso real em vez
// de deixar o usuário olhando uma mensagem genérica por 30s.
function progressoDaApi(line) {
  if (line.includes('[backup]')) {
    setStatus('Fazendo backup do banco…', 'Seus dados são copiados antes de qualquer alteração')
  } else if (line.includes('[migrate] aplicando')) {
    setStatus('Atualizando o banco de dados…', line.replace(/.*\[migrate\] aplicando\s*/, ''))
  } else if (line.includes('[migrate]') && line.includes('aplicada')) {
    setStatus('Banco atualizado', 'Subindo o servidor…')
  }
}

function startApi() {
  const apiDir = resourcePath('app', 'api')
  const entry = path.join(apiDir, 'dist', 'server.js')
  const dbTemplate = path.join(apiDir, 'prisma', 'template.db')

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NODE_ENV: 'production',
    HOST: '127.0.0.1',
    PORT: String(apiPort),
    PLANEJAI_DATA_DIR: userDataDir,
    PLANEJAI_DB_TEMPLATE: dbTemplate,
    CORS_ORIGIN: `http://127.0.0.1:${webPort}`,
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_DIST_DIR: path.join(userDataDir, 'next-cache'),
  }

  const child = spawn(process.execPath, [entry], {
    cwd: apiDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const out = logFile('api.log')
  child.stdout.pipe(out)
  child.stderr.pipe(out)
  tagStream(child.stdout, 'api', progressoDaApi)
  tagStream(child.stderr, 'api-err', progressoDaApi)

  child.on('exit', (code) => {
    console.log(`api exited with code ${code}`)
    if (shutdownStarted) return
    // Morreu durante o boot: o splash ainda está na tela, então a falha aparece nele.
    // Manter a janela aberta é melhor que fechar tudo — o usuário lê o motivo e o caminho do log.
    if (splashAtivo) {
      setFailed(
        'Não foi possível iniciar o banco de dados',
        `O serviço encerrou com código ${code}.\n\n${logsDir}\\api.log`,
      )
      return
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox('planejAÍ', `Backend encerrou inesperadamente (code ${code}). Veja ${logsDir}\\api.log`)
    }
    if (code !== 0) {
      shutdownStarted = true
      app.quit()
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
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_DIST_DIR: path.join(userDataDir, 'next-cache'),
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
    if (code === 0 || shutdownStarted) return
    if (splashAtivo) {
      setFailed(
        'Não foi possível carregar a interface',
        `O serviço encerrou com código ${code}.\n\n${logsDir}\\web.log`,
      )
      return
    }
    shutdownStarted = true
    if (mainWindow && !mainWindow.isDestroyed()) dialog.showErrorBox('planejAÍ', `Frontend encerrou inesperadamente (code ${code}). Veja ${logsDir}\\web.log`)
    app.quit()
  })

  return child
}

function waitForUrl(url, timeoutMs = 90000) {
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
    show: false,
    title: 'planejAÍ',
    backgroundColor: '#0F1014',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // Abre maximizado (preenche a tela). width/height ficam como tamanho ao restaurar.
  mainWindow.maximize()
  mainWindow.once('ready-to-show', () => mainWindow.show())

  Menu.setApplicationMenu(null)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null; splashAtivo = false })

  // splash.html vive dentro do asar, junto do main.js → __dirname resolve em dev e empacotado.
  // (resourcePath() aponta pra extraResources, que é outro lugar.)
  splashAtivo = true
  await mainWindow.loadFile(path.join(__dirname, 'splash.html'))
}

// Troca o splash pela aplicação. A janela é a mesma — sem piscar, sem segunda janela.
async function mostrarAplicacao() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  splashAtivo = false
  await mainWindow.loadURL(`http://127.0.0.1:${webPort}`)
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
  // Janela ANTES de subir os servidores: o boot leva dezenas de segundos (backup +
  // migrations + Next), e sem nada na tela o duplo-clique parece não ter funcionado.
  await createWindow()

  try {
    setStatus('Iniciando os serviços…', 'Isso pode levar alguns segundos na primeira vez')
    apiProc = startApi()
    webProc = startWeb()

    await waitForUrl(`http://127.0.0.1:${apiPort}/health`)
    setStatus('Carregando a interface…')
    await waitForUrl(`http://127.0.0.1:${webPort}`)

    setStatus('Tudo pronto')
    await mostrarAplicacao()
  } catch (err) {
    setFailed('Falha ao iniciar o planejAÍ', `${err.message}\n\n${logsDir}`)
  }
})
