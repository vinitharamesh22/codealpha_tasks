import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { createResetToken, addScreening, consumeResetToken, createSession, deleteSession, findSessionUser, findUser, findUserByEmail, listScreenings, updatePassword } from './db.mjs'

const port = Number(process.env.PORT || 3001)

const send = (response, status, body) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  response.end(JSON.stringify(body))
}

const readBody = async (request) => {
  let raw = ''
  for await (const chunk of request) raw += chunk
  return raw ? JSON.parse(raw) : {}
}

const getSession = (request) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  return token ? findSessionUser(token) : undefined
}

const models = [
  { id: 'heart-disease', name: 'Heart disease', algorithm: 'Logistic regression', accuracy: '94.8%', status: 'active' },
  { id: 'diabetes', name: 'Diabetes', algorithm: 'Random forest', accuracy: '91.2%', status: 'planned' },
  { id: 'breast-cancer', name: 'Breast cancer', algorithm: 'SVM', accuracy: '96.1%', status: 'planned' },
]

const calculatePrediction = ({ disease = 'heart-disease', age, bloodPressure, cholesterol, exerciseAngina }) => {
  const score = Math.min(96, Math.max(8, Math.round((age - 30) * 0.7 + Math.max(bloodPressure - 110, 0) * 0.24 + Math.max(cholesterol - 150, 0) * 0.12 + (exerciseAngina ? 12 : 0))))
  const risk = score >= 70 ? 'High risk' : score >= 40 ? 'Moderate risk' : 'Low risk'
  return { disease, score, risk, model: models.find((model) => model.id === disease) ?? models[0], factors: [{ label: 'Age', value: `${age} years` }, { label: 'Resting BP', value: `${bloodPressure} mmHg` }, { label: 'Cholesterol', value: `${cholesterol} mg/dL` }] }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, {})
  try {
    if (request.method === 'POST' && request.url === '/api/auth/login') {
      const { email, password } = await readBody(request)
      const user = findUser(email, password)
      if (!user) return send(response, 401, { error: 'Invalid email or password.' })
      const token = randomUUID()
      createSession(token, user.id, Date.now() + 8 * 60 * 60 * 1000)
      return send(response, 200, { token, user })
    }
    if (request.method === 'POST' && request.url === '/api/auth/forgot-password') {
      const { email } = await readBody(request)
      if (!email || !email.includes('@')) return send(response, 400, { error: 'Enter a valid work email.' })
      const user = findUserByEmail(email)
      if (user) {
        const token = randomUUID()
        createResetToken(token, user.id, Date.now() + 30 * 60 * 1000)
        if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
          await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.RESEND_FROM, to: email, subject: 'Reset your Medscope password', html: `<p>Use this reset token within 30 minutes:</p><p>${token}</p>` }) })
        } else console.log(`[demo reset] ${email}: ${token}`)
      }
      return send(response, 200, { message: 'If an account exists for this email, reset instructions have been queued.' })
    }
    if (request.method === 'POST' && request.url === '/api/auth/reset-password') {
      const { token, password } = await readBody(request)
      const reset = token && consumeResetToken(token)
      if (!reset || typeof password !== 'string' || password.length < 8) return send(response, 400, { error: 'Invalid or expired reset token, or password is too short.' })
      updatePassword(reset.user_id, password, token)
      return send(response, 200, { message: 'Password updated successfully.' })
    }
    if (request.method === 'POST' && request.url === '/api/auth/logout') {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (token) deleteSession(token)
      return send(response, 200, { ok: true })
    }
    if (request.method === 'GET' && request.url === '/api/auth/me') {
      const user = getSession(request)
      return user ? send(response, 200, { user }) : send(response, 401, { error: 'Unauthorized.' })
    }
    if (request.method === 'GET' && !request.url.startsWith('/api/')) {
      const requestedPath = request.url === '/' ? '/index.html' : request.url.split('?')[0]
      const filePath = join(process.cwd(), 'dist', requestedPath)
      const fallback = join(process.cwd(), 'dist', 'index.html')
      const target = existsSync(filePath) ? filePath : fallback
      if (!existsSync(target)) return send(response, 404, { error: 'Frontend build not found. Run npm run build.' })
      const contentTypes = { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml' }
      response.writeHead(200, { 'Content-Type': contentTypes[extname(target)] ?? 'application/octet-stream' })
      return response.end(readFileSync(target))
    }
    if (!getSession(request)) return send(response, 401, { error: 'Unauthorized.' })
    if (request.method === 'GET' && request.url === '/api/models') return send(response, 200, { models })
    if (request.method === 'GET' && request.url === '/api/screenings') return send(response, 200, { screenings: listScreenings() })
    if (request.method === 'POST' && request.url === '/api/predictions') {
      const body = await readBody(request)
      const result = calculatePrediction(body)
      addScreening({ patientId: body.patientId, disease: result.disease, score: result.score, risk: result.risk })
      return send(response, 200, result)
    }
    send(response, 404, { error: 'Not found.' })
  } catch (error) {
    console.error(error)
    send(response, 400, { error: 'Invalid request.' })
  }
})

server.listen(port, () => console.log(`Medscope API running at http://localhost:${port}`))
