import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

mkdirSync('data', { recursive: true })
const db = new DatabaseSync('data/medscope.sqlite')
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, password TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS reset_tokens (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS screenings (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id TEXT NOT NULL, patient_name TEXT NOT NULL, initials TEXT NOT NULL, disease TEXT NOT NULL, score INTEGER NOT NULL, risk TEXT NOT NULL, created_at INTEGER NOT NULL);
`)

db.prepare('INSERT OR IGNORE INTO users (id, email, name, role, password) VALUES (?, ?, ?, ?, ?)').run('user-1', 'doctor@medscope.demo', 'Dr. Alex Rivera', 'Cardiology unit', 'medscope')

export const findUser = (email, password) => db.prepare('SELECT id, email, name, role FROM users WHERE email = ? AND password = ?').get(email, password)
export const findUserByEmail = (email) => db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(email)
export const createSession = (token, userId, expiresAt) => db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt)
export const deleteSession = (token) => db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
export const findSessionUser = (token) => db.prepare(`SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`).get(token, Date.now())
export const createResetToken = (token, userId, expiresAt) => db.prepare('INSERT INTO reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt)
export const consumeResetToken = (token) => db.prepare('SELECT user_id FROM reset_tokens WHERE token = ? AND expires_at > ? AND used = 0').get(token, Date.now())
export const updatePassword = (userId, password, token) => { db.prepare('UPDATE users SET password = ? WHERE id = ?').run(password, userId); db.prepare('UPDATE reset_tokens SET used = 1 WHERE token = ?').run(token) }
export const addScreening = ({ patientId, disease, score, risk }) => db.prepare('INSERT INTO screenings (patient_id, patient_name, initials, disease, score, risk, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(patientId, 'Current patient', 'CP', disease, score, risk, Date.now())
export const listScreenings = () => db.prepare('SELECT patient_id AS id, patient_name AS name, initials, risk, disease, created_at FROM screenings ORDER BY created_at DESC LIMIT 10').all()

if (listScreenings().length === 0) {
  const seed = db.prepare('INSERT INTO screenings (patient_id, patient_name, initials, disease, score, risk, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
  seed.run('PT-2047', 'James Miller', 'JM', 'Heart disease', 24, 'Low risk', Date.now() - 18 * 60 * 1000)
  seed.run('PT-2046', 'Sarah Kim', 'SK', 'Heart disease', 52, 'Moderate', Date.now() - 42 * 60 * 1000)
  seed.run('PT-2045', 'Robert Bell', 'RB', 'Heart disease', 81, 'High risk', Date.now() - 24 * 60 * 60 * 1000)
}
