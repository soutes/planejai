import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const SECRET_PATH = join(__dirname, '..', '..', 'data', '.secret')
const ALGORITHM = 'aes-256-gcm'

function loadOrCreateKey(): Buffer {
  if (existsSync(SECRET_PATH)) {
    return Buffer.from(readFileSync(SECRET_PATH, 'utf-8').trim(), 'hex')
  }
  mkdirSync(dirname(SECRET_PATH), { recursive: true })
  const key = randomBytes(32)
  writeFileSync(SECRET_PATH, key.toString('hex'), { mode: 0o600 })
  return key
}

const KEY = loadOrCreateKey()

export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':')
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''
  const [ivHex, tagHex, encHex] = ciphertext.split(':')
  if (!ivHex || !tagHex || !encHex) return ''
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return decipher.update(Buffer.from(encHex, 'hex')).toString('utf-8') + decipher.final('utf-8')
}

export function maskKey(plaintext: string): string {
  if (!plaintext || plaintext.length < 8) return '••••••••••••••••'
  return plaintext.slice(0, 8) + '•'.repeat(Math.min(plaintext.length - 8, 24))
}
