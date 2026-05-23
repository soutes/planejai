import { buildApp } from './app.js'

const PORT = Number(process.env.PORT ?? 3001)

void (async () => {
  const app = await buildApp()
  try {
    await app.listen({ port: PORT, host: '127.0.0.1' })
    console.log(`planejAÍ API running on http://127.0.0.1:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
})()
