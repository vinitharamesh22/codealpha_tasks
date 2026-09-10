import './style.css'
const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">+</span><span>MEDSCOPE</span></div>
      <div class="workspace-label">CLINICAL WORKSPACE</div>
      <nav>
        <button class="nav-item active"><span class="nav-icon">[]</span>Assessment</button>
        <button class="nav-item"><span class="nav-icon">~</span>Patient history</button>
        <button class="nav-item"><span class="nav-icon">#</span>Models</button>
        <button class="nav-item"><span class="nav-icon">i</span>Reference guide</button>
      </nav>
      <div class="sidebar-bottom"><div class="model-status"><span class="status-dot"></span><div><strong>Model online</strong><small>v2.4.1 / UCI-trained</small></div></div><div class="user"><span class="avatar">AR</span><div><strong>Dr. Alex Rivera</strong><small>Cardiology unit</small></div><button class="sign-out" id="sign-out" aria-label="Sign out">↗</button></div></div>
    </aside>
    <main class="main-content">
      <header class="topbar"><div><span class="eyebrow">MONDAY, 14 OCT 2024</span><h1>Good morning, Dr. Rivera</h1></div><div class="top-actions"><button class="icon-button" aria-label="Notifications">o</button><button class="help-button">? <span>Help center</span></button></div></header>
      <section class="intro"><div><p class="eyebrow lime">PREDICTION CONSOLE / 01</p><h2>Assess a patient</h2><p class="muted">Enter clinical markers to estimate disease likelihood using our validated classification models.</p></div><div class="accuracy"><span>MODEL ACCURACY</span><strong>94.8%</strong><small>Last validated 12 Oct 2024</small></div></section>
      <div class="dashboard-grid">
        <section class="panel form-panel"><div class="panel-heading"><div><span class="section-number">01</span><h3>Patient profile</h3></div><span class="required">* Required fields</span></div>
          <form id="assessment-form"><div class="form-grid"><label>Patient ID<input id="patient-id" value="PT-2048" required></label><label>Age <span class="unit">years</span><input id="age" type="number" value="54" min="1" max="120" required></label><label>Sex<select id="sex"><option>Female</option><option>Male</option><option>Other</option></select></label><label>Chest pain type<select id="chest-pain"><option>Typical angina</option><option>Atypical angina</option><option>Non-anginal pain</option><option>Asymptomatic</option></select></label></div>
            <div class="subheading"><span class="section-number">02</span><h3>Clinical markers</h3><span class="line"></span></div><div class="form-grid marker-grid"><label>Resting blood pressure <span class="unit">mmHg</span><div class="input-with-suffix"><input id="bp" type="number" value="142"><span>mmHg</span></div></label><label>Cholesterol <span class="unit">mg/dL</span><div class="input-with-suffix"><input id="cholesterol" type="number" value="238"><span>mg/dL</span></div></label><label>Fasting blood sugar<select id="sugar"><option>Normal (&lt; 120 mg/dL)</option><option>Elevated (&gt; 120 mg/dL)</option></select></label><label>Max heart rate <span class="unit">bpm</span><div class="input-with-suffix"><input id="heart-rate" type="number" value="145"><span>bpm</span></div></label></div>
            <div class="toggle-row"><label class="toggle-label"><input id="exercise" type="checkbox"><span class="toggle"></span>Exercise-induced angina</label><label class="toggle-label"><input id="ecg" type="checkbox" checked><span class="toggle"></span>Abnormal resting ECG</label></div><div class="form-footer"><span class="secure">[ ] Data is encrypted and stored securely</span><button class="primary-button" type="submit">Run prediction <span>-></span></button></div>
          </form>
        </section>
        <section class="panel result-panel"><div class="panel-heading"><div><span class="section-number">03</span><h3>Prediction result</h3></div><span class="live"><span class="status-dot"></span> Live model</span></div><div id="result-content" class="result-content"><div class="risk-badge">PRELIMINARY RESULT</div><div class="score-wrap"><div class="score" id="score">68<span>%</span></div><div><strong id="risk-label">Moderate risk</strong><p id="risk-copy">The model identifies several indicators<br>that warrant clinical review.</p></div></div><div class="meter"><span id="meter-fill"></span></div><div class="meter-labels"><span>Low risk</span><span>Moderate</span><span>High risk</span></div><div class="result-divider"></div><h4>Key contributing factors</h4><ul id="factors"><li><span>01</span><b>Age</b><em>54 years</em></li><li><span>02</span><b>Resting BP</b><em>142 mmHg</em></li><li><span>03</span><b>Cholesterol</b><em>238 mg/dL</em></li></ul><div class="disclaimer">This result is a decision-support estimate, not a diagnosis. Always interpret alongside clinical assessment.</div></div></section>
      </div>
      <section class="recent-section"><div class="section-header"><div><p class="eyebrow">RECENT ACTIVITY</p><h3>Previous screenings</h3></div><button class="text-button">View all <span>-></span></button></div><div class="screenings"><div class="screening"><span class="avatar pale">JM</span><div><strong>PT-2047 / James Miller</strong><small>Screened 18 min ago</small></div><span class="risk low">Low risk</span><span class="screening-arrow">-></span></div><div class="screening"><span class="avatar peach">SK</span><div><strong>PT-2046 / Sarah Kim</strong><small>Screened 42 min ago</small></div><span class="risk moderate">Moderate</span><span class="screening-arrow">-></span></div><div class="screening"><span class="avatar blue">RB</span><div><strong>PT-2045 / Robert Bell</strong><small>Screened yesterday</small></div><span class="risk high">High risk</span><span class="screening-arrow">-></span></div></div></section>
      <footer><span>MEDSCOPE HEALTH INTELLIGENCE</span><span>For professional use only &nbsp; | &nbsp; v2.4.1</span></footer>
    </main>
  </div>
`

const authKey = 'medscope-session'
const authToken = localStorage.getItem(authKey)
const isAuthenticated = false
const authMarkup = `
  <div class="auth-screen" id="auth-screen" aria-hidden="${isAuthenticated}">
    <div class="auth-card">
      <div class="auth-brand"><span class="brand-mark">+</span><strong>MEDSCOPE</strong></div>
      <p class="eyebrow lime">CLINICAL WORKSPACE</p>
      <h1>Welcome back</h1>
      <p class="auth-copy">Sign in to access patient assessments and prediction tools.</p>
      <form id="login-form" class="login-form">
        <label>Work email<input id="login-email" type="email" value="doctor@medscope.demo" required></label>
        <label>Password<input id="login-password" type="password" value="medscope" required></label>
        <div class="login-options"><label class="remember"><input type="checkbox" checked> Remember me</label><button type="button" class="forgot">Forgot password?</button></div>
        <p class="login-error" id="login-error" role="alert"></p>
        <button class="primary-button login-button" type="submit">Sign in <span>-></span></button>
      </form>
      <p class="demo-note">Demo access: doctor@medscope.demo / medscope</p>
      <p class="auth-footer">Protected clinical decision-support workspace</p>
    </div>
  </div>
`
app.insertAdjacentHTML('beforeend', authMarkup)
const shell = document.querySelector<HTMLElement>('.shell')!
const authScreen = document.querySelector<HTMLElement>('#auth-screen')!
const setAuthenticated = (value: boolean) => {
  shell.classList.toggle('auth-locked', !value)
  authScreen.setAttribute('aria-hidden', String(value))
}
setAuthenticated(isAuthenticated)

if (authToken) {
  void fetch('/api/auth/me', { headers: { Authorization: `Bearer ${authToken}` } })
    .then((response) => {
      if (response.ok) {
        setAuthenticated(true)
        return
      }
      localStorage.removeItem(authKey)
      setAuthenticated(false)
    })
    .catch(() => {
      localStorage.removeItem(authKey)
      setAuthenticated(false)
    })
}

document.querySelector<HTMLFormElement>('#login-form')!.addEventListener('submit', (event) => {
  event.preventDefault()
  void (async () => {
    const email = document.querySelector<HTMLInputElement>('#login-email')!.value.trim()
    const password = document.querySelector<HTMLInputElement>('#login-password')!.value
    const error = document.querySelector<HTMLElement>('#login-error')!
    let response: Response
    try {
      response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    } catch {
      error.textContent = 'Cannot connect to the Medscope server. Start the backend and try again.'
      return
    }
    if (!response.ok) {
      error.textContent = 'Invalid email or password.'
      return
    }
    const result = await response.json() as { token: string }
    localStorage.setItem(authKey, result.token)
    error.textContent = ''
    setAuthenticated(true)
  })()
})

document.querySelector<HTMLButtonElement>('.forgot')!.addEventListener('click', () => {
  const card = document.querySelector<HTMLElement>('.auth-card')!
  card.innerHTML = `
    <div class="auth-brand"><span class="brand-mark">+</span><strong>MEDSCOPE</strong></div>
    <p class="eyebrow lime">ACCOUNT RECOVERY</p>
    <h1>Reset your password</h1>
    <p class="auth-copy">Enter your work email and we will queue reset instructions for your account.</p>
    <form id="reset-form" class="login-form">
      <label>Work email<input id="reset-email" type="email" value="doctor@medscope.demo" required></label>
      <p class="login-error" id="reset-error" role="alert"></p>
      <button class="primary-button login-button" type="submit">Send reset link <span>-></span></button>
      <button class="back-login" id="back-login" type="button">Back to sign in</button>
    </form>
    <p class="auth-footer">For security, we never reveal whether an email is registered.</p>
  `
  document.querySelector<HTMLFormElement>('#reset-form')!.addEventListener('submit', (event) => {
    event.preventDefault()
    void (async () => {
      const email = document.querySelector<HTMLInputElement>('#reset-email')!.value.trim()
      const error = document.querySelector<HTMLElement>('#reset-error')!
      const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!response.ok) {
        error.textContent = 'Enter a valid work email.'
        return
      }
      card.innerHTML = `<div class="auth-brand"><span class="brand-mark">+</span><strong>MEDSCOPE</strong></div><p class="eyebrow lime">REQUEST RECEIVED</p><h1>Check your inbox</h1><p class="auth-copy">If an account exists for <strong>${email}</strong>, reset instructions have been queued.</p><button class="primary-button login-button" id="back-login-success" type="button">Back to sign in <span>-></span></button><p class="auth-footer">Demo mode: no email is sent.</p>`
      document.querySelector<HTMLButtonElement>('#back-login-success')!.addEventListener('click', () => window.location.reload())
    })()
  })
  document.querySelector<HTMLButtonElement>('#back-login')!.addEventListener('click', () => window.location.reload())
})

document.querySelector<HTMLButtonElement>('#sign-out')!.addEventListener('click', () => {
  void fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem(authKey) ?? ''}` } })
  localStorage.removeItem(authKey)
  setAuthenticated(false)
})

const form = document.querySelector<HTMLFormElement>('#assessment-form')!
form.addEventListener('submit', (event) => {
  event.preventDefault()
  void (async () => {
    const body = { patientId: document.querySelector<HTMLInputElement>('#patient-id')!.value, age: Number(document.querySelector<HTMLInputElement>('#age')!.value), bloodPressure: Number(document.querySelector<HTMLInputElement>('#bp')!.value), cholesterol: Number(document.querySelector<HTMLInputElement>('#cholesterol')!.value), exerciseAngina: document.querySelector<HTMLInputElement>('#exercise')!.checked }
    const response = await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(authKey) ?? ''}` }, body: JSON.stringify(body) })
    if (response.status === 401) return setAuthenticated(false)
    const result = await response.json() as { score: number; risk: string }
    document.querySelector('#score')!.innerHTML = `${result.score}<span>%</span>`
    document.querySelector('#risk-label')!.textContent = result.risk
    document.querySelector('#risk-copy')!.innerHTML = result.risk === 'High risk' ? 'Multiple elevated indicators<br>require prompt clinical review.' : 'The model identifies several indicators<br>that warrant clinical review.'
    document.querySelector<HTMLElement>('#meter-fill')!.style.width = `${result.score}%`
    document.querySelector('#result-content')!.classList.add('updated')
  })()
})
