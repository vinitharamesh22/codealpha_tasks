const form = document.querySelector('#score-form');
const metricsBody = document.querySelector('#metrics-body');
const sampleNote = document.querySelector('#sample-note');
const resultPlaceholder = document.querySelector('#result-placeholder');
const resultContent = document.querySelector('#result-content');
const resultTitle = document.querySelector('#result-title');

const percent = value => `${(value * 100).toFixed(1)}%`;

async function loadMetrics() {
  try {
    const response = await fetch('/api/metrics');
    const data = await response.json();
    sampleNote.textContent = `${data.sample_size.toLocaleString()} synthetic applicants / held-out test set`;
    metricsBody.innerHTML = data.metrics.map(row => `<tr><td>${row.model}</td><td>${percent(row.accuracy)}</td><td>${percent(row.precision)}</td><td>${percent(row.recall)}</td><td>${percent(row.f1_score)}</td><td>${percent(row.roc_auc)}</td></tr>`).join('');
  } catch (error) {
    metricsBody.innerHTML = '<tr><td colspan="6" class="error">Metrics unavailable. Is the server running?</td></tr>';
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  button.firstChild.textContent = 'Scoring... ';
  const payload = Object.fromEntries(new FormData(form).entries());
  ['annual_income', 'debt_amount', 'credit_utilization', 'payment_delays_12m', 'credit_history_years', 'open_accounts'].forEach(field => { payload[field] = Number(payload[field]); });
  try {
    const response = await fetch('/api/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    resultPlaceholder.classList.add('hidden');
    resultContent.classList.remove('hidden');
    resultTitle.textContent = data.decision;
    document.querySelector('#probability').textContent = percent(data.default_probability);
    document.querySelector('#decision').textContent = data.decision;
    document.querySelector('#model-used').textContent = data.model;
    document.querySelector('#model-detail').textContent = data.model;
    document.querySelector('#dti').textContent = percent(data.debt_to_income);
    document.querySelector('#decision-dot').style.background = data.prediction ? 'var(--coral)' : '#4caa76';
  } catch (error) {
    resultPlaceholder.classList.remove('hidden');
    resultContent.classList.add('hidden');
    resultTitle.textContent = 'Could not score';
    resultPlaceholder.querySelector('p').innerHTML = error.message;
  } finally {
    button.disabled = false;
    button.firstChild.textContent = 'Calculate risk ';
  }
});

loadMetrics();
