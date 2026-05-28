import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { getSecretFile } from './paths.js'

const ALGORITHM = 'aes-256-gcm'

function loadOrCreateKey(): Buffer {
  const secretPath = getSecretFile()
  if (existsSync(secretPath)) {
    return Buffer.from(readFileSync(secretPath, 'utf-8').trim(), 'hex')
  }
  mkdirSync(dirname(secretPath), { recursive: true })
  const key = randomBytes(32)
  writeFileSync(secretPath, key.toString('hex'), { mode: 0o600 })
  return key
}

let cachedKey: Buffer | null = null
function key(): Buffer {
  if (!cachedKey) cachedKey = loadOrCreateKey()
  return cachedKey
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':')
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''
  const [ivHex, tagHex, encHex] = ciphertext.split(':')
  if (!ivHex || !tagHex || !encHex) return ''
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return decipher.update(Buffer.from(encHex, 'hex')).toString('utf-8') + decipher.final('utf-8')
}

export function maskKey(plaintext: string): string {
  if (!plaintext || plaintext.length < 8) return '••••••••••••••••'
  return plaintext.slice(0, 8) + '•'.repeat(Math.min(plaintext.length - 8, 24))
}
