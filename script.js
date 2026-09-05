'use strict';

/* =========================================================
   Config
   ========================================================= */
const API_BASE = 'http://127.0.0.1:8000';
const PREDICT_URL = `${API_BASE}/predict`;
const STATUS_URL = `${API_BASE}/`;

const COUNTRIES = [
  'India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France',
  'Brazil', 'Japan', 'South Korea', 'China', 'Spain', 'Italy', 'Russia', 'Indonesia',
  'Pakistan', 'Bangladesh', 'Nigeria', 'South Africa', 'Netherlands', 'Sweden', 'Norway',
  'UAE', 'Egypt', 'Vietnam', 'Philippines', 'Thailand', 'Malaysia', 'Singapore', 'Other'
];

/* =========================================================
   State
   ========================================================= */
const state = {
  step: 1,
  totalSteps: 4,
  stressLevel: '',
  lastPayload: null,
  lastScore: null,
  isSubmitting: false,
};

/* =========================================================
   DOM refs
   ========================================================= */
const els = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheEls();
  populateCountryList();
  bindNav();
  bindWizard();
  bindRanges();
  bindStressSelector();
  bindForm();
  bindResultsActions();
  checkApiStatus();
  if (window.lucide) window.lucide.createIcons();
}

function cacheEls() {
  els.hamburger = document.getElementById('hamburger');
  els.mobileMenu = document.getElementById('mobileMenu');
  els.statusDot = document.getElementById('statusDot');
  els.statusText = document.getElementById('statusText');
  els.statusPill = document.getElementById('statusPill');

  els.form = document.getElementById('wellnessForm');
  els.progressTrack = document.getElementById('progressTrack');
  els.prevBtn = document.getElementById('prevBtn');
  els.nextBtn = document.getElementById('nextBtn');
  els.predictBtn = document.getElementById('predictBtn');
  els.reviewGrid = document.getElementById('reviewGrid');
  els.apiError = document.getElementById('apiError');
  els.apiErrorMessage = document.getElementById('apiErrorMessage');
  els.retryBtn = document.getElementById('retryBtn');
  els.countryList = document.getElementById('countryList');

  els.usage = document.getElementById('usage');
  els.usageOutput = document.getElementById('usageOutput');
  els.study = document.getElementById('study');
  els.studyOutput = document.getElementById('studyOutput');
  els.activity = document.getElementById('activity');
  els.activityOutput = document.getElementById('activityOutput');
  els.sleep = document.getElementById('sleep');
  els.sleepOutput = document.getElementById('sleepOutput');

  els.stressSelector = document.getElementById('stressSelector');
  els.stressLevelInput = document.getElementById('stressLevel');

  els.results = document.getElementById('results');
  els.gaugeProgress = document.getElementById('gaugeProgress');
  els.gaugeScore = document.getElementById('gaugeScore');
  els.snapshotGrid = document.getElementById('snapshotGrid');
  els.assessAgainBtn = document.getElementById('assessAgainBtn');
  els.downloadBtn = document.getElementById('downloadBtn');
  els.shareBtn = document.getElementById('shareBtn');
}

/* =========================================================
   Navbar
   ========================================================= */
function bindNav() {
  els.hamburger.addEventListener('click', () => {
    const isOpen = els.mobileMenu.classList.toggle('is-open');
    els.hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  els.mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      els.mobileMenu.classList.remove('is-open');
      els.hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

async function checkApiStatus() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(STATUS_URL, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      setStatus(true);
    } else {
      setStatus(false);
    }
  } catch (err) {
    setStatus(false);
  }
}

function setStatus(isOnline) {
  els.statusDot.classList.remove('is-online', 'is-offline');
  els.statusDot.classList.add(isOnline ? 'is-online' : 'is-offline');
  els.statusText.textContent = isOnline ? 'AI Model Online' : 'API Offline';
}

/* =========================================================
   Country list
   ========================================================= */
function populateCountryList() {
  els.countryList.innerHTML = COUNTRIES
    .map((c) => `<option value="${escapeHtml(c)}"></option>`)
    .join('');
}

/* =========================================================
   Range inputs
   ========================================================= */
function bindRanges() {
  linkRange(els.usage, els.usageOutput, 'hours/day');
  linkRange(els.study, els.studyOutput, 'hours/day');
  linkRange(els.activity, els.activityOutput, 'hours/day');
  linkRange(els.sleep, els.sleepOutput, 'hours/night');
}

function linkRange(input, output, suffix) {
  const update = () => {
    output.textContent = `${parseFloat(input.value).toFixed(1)} ${suffix}`;
  };
  input.addEventListener('input', update);
  update();
}

/* =========================================================
   Stress selector
   ========================================================= */
function bindStressSelector() {
  const options = els.stressSelector.querySelectorAll('.stress-option');
  options.forEach((btn) => {
    btn.addEventListener('click', () => {
      options.forEach((o) => o.setAttribute('aria-checked', 'false'));
      btn.setAttribute('aria-checked', 'true');
      state.stressLevel = btn.dataset.value;
      els.stressLevelInput.value = state.stressLevel;
      clearFieldError('stress');
    });
  });
}

/* =========================================================
   Wizard navigation
   ========================================================= */
function bindWizard() {
  els.nextBtn.addEventListener('click', handleNext);
  els.prevBtn.addEventListener('click', handlePrev);
  updateWizardUI();
}

function handleNext() {
  if (!validateStep(state.step)) return;
  if (state.step < state.totalSteps) {
    hideApiError();
    state.step += 1;
    if (state.step === state.totalSteps) buildReview();
    updateWizardUI();
  }
}

function handlePrev() {
  if (state.step > 1) {
    hideApiError();
    state.step -= 1;
    updateWizardUI();
  }
}

function updateWizardUI() {
  document.querySelectorAll('.form-step').forEach((section) => {
    section.classList.toggle('is-active', Number(section.dataset.step) === state.step);
  });

  document.querySelectorAll('.progress-step').forEach((li) => {
    const stepNum = Number(li.dataset.step);
    li.classList.toggle('is-active', stepNum === state.step);
    li.classList.toggle('is-done', stepNum < state.step);
  });

  els.prevBtn.style.visibility = state.step === 1 ? 'hidden' : 'visible';
  els.nextBtn.hidden = state.step === state.totalSteps;
  els.predictBtn.hidden = state.step !== state.totalSteps;

  window.scrollTo({ top: document.getElementById('assessment').offsetTop - 90, behavior: 'smooth' });
}

/* =========================================================
   Validation
   ========================================================= */
const STEP_FIELDS = {
  1: ['age', 'gender', 'country', 'academicLevel'],
  2: ['platform', 'purpose', 'usage', 'unlocks'],
  3: ['study', 'activity', 'sleep', 'stress'],
};

function validateStep(step) {
  const fields = STEP_FIELDS[step] || [];
  let valid = true;
  fields.forEach((name) => {
    if (!validateField(name)) valid = false;
  });
  return valid;
}

function validateField(name) {
  switch (name) {
    case 'age': {
      const val = Number(document.getElementById('age').value);
      if (!document.getElementById('age').value) return setFieldError('age', 'Age is required.');
      if (val < 10 || val > 100) return setFieldError('age', 'Age must be between 10 and 100.');
      return clearFieldError('age');
    }
    case 'gender': {
      if (!document.getElementById('gender').value) return setFieldError('gender', 'Please select a gender.');
      return clearFieldError('gender');
    }
    case 'country': {
      if (!document.getElementById('country').value.trim()) return setFieldError('country', 'Country is required.');
      return clearFieldError('country');
    }
    case 'academicLevel': {
      if (!document.getElementById('academicLevel').value) return setFieldError('academicLevel', 'Please select an academic level.');
      return clearFieldError('academicLevel');
    }
    case 'platform': {
      if (!document.getElementById('platform').value) return setFieldError('platform', 'Please select a platform.');
      return clearFieldError('platform');
    }
    case 'purpose': {
      if (!document.getElementById('purpose').value) return setFieldError('purpose', 'Please select a purpose.');
      return clearFieldError('purpose');
    }
    case 'usage': {
      const val = Number(els.usage.value);
      if (val < 0 || val > 24) return setFieldError('usage', 'Daily usage cannot exceed 24 hours.');
      return clearFieldError('usage');
    }
    case 'unlocks': {
      const raw = document.getElementById('unlocks').value;
      if (raw === '') return setFieldError('unlocks', 'Daily unlocks is required.');
      if (Number(raw) < 0) return setFieldError('unlocks', 'Daily unlocks cannot be negative.');
      return clearFieldError('unlocks');
    }
    case 'study': {
      const val = Number(els.study.value);
      if (val < 0 || val > 24) return setFieldError('study', 'Study hours must be between 0 and 24.');
      return clearFieldError('study');
    }
    case 'activity': {
      const val = Number(els.activity.value);
      if (val < 0 || val > 24) return setFieldError('activity', 'Activity hours must be between 0 and 24.');
      return clearFieldError('activity');
    }
    case 'sleep': {
      const val = Number(els.sleep.value);
      if (val < 0 || val > 24) return setFieldError('sleep', 'Sleep hours must be between 0 and 24.');
      return clearFieldError('sleep');
    }
    case 'stress': {
      if (!state.stressLevel) return setFieldError('stress', 'Please select a stress level.');
      return clearFieldError('stress');
    }
    default:
      return true;
  }
}

function setFieldError(name, message) {
  const errorEl = document.getElementById(`${name}-error`);
  const field = errorEl ? errorEl.closest('.field') : null;
  if (errorEl) errorEl.textContent = message;
  if (field) field.classList.add('has-error');
  return false;
}

function clearFieldError(name) {
  const errorEl = document.getElementById(`${name}-error`);
  const field = errorEl ? errorEl.closest('.field') : null;
  if (errorEl) errorEl.textContent = '';
  if (field) field.classList.remove('has-error');
  return true;
}

/* =========================================================
   Review step
   ========================================================= */
function buildReview() {
  const payload = collectPayload();
  const rows = [
    ['Age', payload.Age],
    ['Gender', payload.Gender],
    ['Country', payload.Country],
    ['Academic level', payload.Academic_Level],
    ['Platform', payload.Most_Used_Platform],
    ['Purpose', payload.Purpose_Of_Use],
    ['Social media usage', `${payload.Avg_Daily_Usage_Hours.toFixed(1)} h/day`],
    ['Daily unlocks', payload.Daily_Unlocks],
    ['Study hours', `${payload.Study_Hours.toFixed(1)} h/day`],
    ['Physical activity', `${payload.Physical_Activity_Hours.toFixed(1)} h/day`],
    ['Sleep', `${payload.Sleep_Hours_Per_Night.toFixed(1)} h/night`],
    ['Stress level', payload.Stress_Level],
  ];

  els.reviewGrid.innerHTML = rows
    .map(
      ([label, value]) => `
      <div class="review-item">
        <span class="ri-label">${escapeHtml(label)}</span>
        <span class="ri-value">${escapeHtml(String(value))}</span>
      </div>`
    )
    .join('');
}

function collectPayload() {
  return {
    Age: Number(document.getElementById('age').value),
    Gender: document.getElementById('gender').value,
    Country: document.getElementById('country').value.trim(),
    Academic_Level: document.getElementById('academicLevel').value,
    Most_Used_Platform: document.getElementById('platform').value,
    Purpose_Of_Use: document.getElementById('purpose').value,
    Avg_Daily_Usage_Hours: Number(els.usage.value),
    Daily_Unlocks: Number(document.getElementById('unlocks').value),
    Study_Hours: Number(els.study.value),
    Physical_Activity_Hours: Number(els.activity.value),
    Sleep_Hours_Per_Night: Number(els.sleep.value),
    Stress_Level: state.stressLevel,
  };
}

/* =========================================================
   Form submit
   ========================================================= */
function bindForm() {
  els.form.addEventListener('submit', handleSubmit);
  els.retryBtn.addEventListener('click', () => {
    hideApiError();
    handleSubmit(new Event('submit'));
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  if (state.isSubmitting) return;
  if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
    // jump back to first invalid step
    for (let s = 1; s <= 3; s += 1) {
      if (!validateStep(s)) {
        state.step = s;
        updateWizardUI();
        break;
      }
    }
    return;
  }

  hideApiError();
  const payload = collectPayload();
  state.lastPayload = payload;
  setSubmitting(true);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(PREDICT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 422) {
      showApiError('Some of the submitted details were rejected by the server. Please review your answers and try again.');
      setSubmitting(false);
      return;
    }
    if (res.status >= 500) {
      showApiError('The prediction service encountered an internal error. Please try again in a moment.');
      setSubmitting(false);
      return;
    }
    if (!res.ok) {
      showApiError('Unable to complete the prediction request. Please try again.');
      setSubmitting(false);
      return;
    }

    const data = await res.json();
    if (typeof data.predicted_mental_health_score !== 'number') {
      showApiError('Received an unexpected response from the prediction service.');
      setSubmitting(false);
      return;
    }

    state.lastScore = data.predicted_mental_health_score;
    setStatus(true);
    renderResults(payload, state.lastScore);
    setSubmitting(false);
  } catch (err) {
    setSubmitting(false);
    if (err.name === 'AbortError') {
      showApiError('The request took too long to respond. Please try again.');
    } else {
      showApiError('Unable to connect to the AI prediction service. Please make sure the FastAPI server is running at http://127.0.0.1:8000.');
      setStatus(false);
    }
  }
}

function setSubmitting(isSubmitting) {
  state.isSubmitting = isSubmitting;
  els.predictBtn.disabled = isSubmitting;
  els.predictBtn.querySelector('.btn-label').hidden = isSubmitting;
  els.predictBtn.querySelector('.btn-loader').hidden = !isSubmitting;
  els.prevBtn.disabled = isSubmitting;
}

function showApiError(message) {
  els.apiErrorMessage.textContent = message;
  els.apiError.hidden = false;
}

function hideApiError() {
  els.apiError.hidden = true;
  els.apiErrorMessage.textContent = '';
}

/* =========================================================
   Results rendering
   ========================================================= */
let lifestyleChartInstance = null;

function renderResults(payload, score) {
  document.getElementById('assessment').hidden = false;
  els.results.hidden = false;

  animateGauge(score);
  renderSnapshot(payload);
  renderLifestyleChart(payload);

  els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function animateGauge(score) {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 94; // r=94
  const offset = circumference - (clamped / 100) * circumference;

  els.gaugeProgress.style.strokeDasharray = `${circumference}`;
  els.gaugeProgress.style.strokeDashoffset = `${circumference}`;

  // color by rough band (visual only, no clinical claim)
  let color = 'var(--accent-cyan)';
  if (clamped < 40) color = 'var(--danger)';
  else if (clamped < 65) color = 'var(--warning)';
  els.gaugeProgress.style.stroke = color;

  requestAnimationFrame(() => {
    els.gaugeProgress.style.strokeDashoffset = String(offset);
  });

  animateCounter(els.gaugeScore, 0, score, 1100);
}

function animateCounter(el, from, to, duration) {
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * eased;
    el.textContent = current.toFixed(2);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = to.toFixed(2);
  }
  requestAnimationFrame(tick);
}

const SNAPSHOT_ICONS = {
  age: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/>',
  academic: '<path d="M22 10 12 4 2 10l10 6 10-6Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
  usage: '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
  study: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/>',
  activity: '<path d="M22 12h-4l-3 9-6-18-3 9H2"/>',
  sleep: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>',
  stress: '<path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 2v10l7 4"/>',
  platform: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12h8M12 8v8"/>',
};

function renderSnapshot(payload) {
  const items = [
    { icon: 'age', label: 'Age', value: `${payload.Age} yrs` },
    { icon: 'academic', label: 'Academic Level', value: payload.Academic_Level },
    { icon: 'usage', label: 'Social Media Usage', value: `${payload.Avg_Daily_Usage_Hours.toFixed(1)} h/day` },
    { icon: 'study', label: 'Study Hours', value: `${payload.Study_Hours.toFixed(1)} h/day` },
    { icon: 'activity', label: 'Physical Activity', value: `${payload.Physical_Activity_Hours.toFixed(1)} h/day` },
    { icon: 'sleep', label: 'Sleep', value: `${payload.Sleep_Hours_Per_Night.toFixed(1)} h/night` },
    { icon: 'stress', label: 'Stress Level', value: payload.Stress_Level },
    { icon: 'platform', label: 'Most Used Platform', value: payload.Most_Used_Platform },
  ];

  els.snapshotGrid.innerHTML = items
    .map(
      (item) => `
      <div class="snapshot-card">
        <span class="snapshot-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SNAPSHOT_ICONS[item.icon]}</svg>
        </span>
        <span class="snapshot-label">${escapeHtml(item.label)}</span>
        <span class="snapshot-value">${escapeHtml(String(item.value))}</span>
      </div>`
    )
    .join('');
}

function renderLifestyleChart(payload) {
  const ctx = document.getElementById('lifestyleChart');
  if (!ctx || !window.Chart) return;

  const dataValues = [
    payload.Study_Hours,
    payload.Sleep_Hours_Per_Night,
    payload.Physical_Activity_Hours,
    payload.Avg_Daily_Usage_Hours,
  ];

  if (lifestyleChartInstance) lifestyleChartInstance.destroy();

  lifestyleChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Study', 'Sleep', 'Physical Activity', 'Social Media Usage'],
      datasets: [
        {
          label: 'Hours per day (submitted)',
          data: dataValues,
          backgroundColor: 'rgba(94, 230, 208, 0.16)',
          borderColor: '#5EE6D0',
          pointBackgroundColor: '#8B7CF6',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0,
          max: 24,
          angleLines: { color: 'rgba(255,255,255,0.08)' },
          grid: { color: 'rgba(255,255,255,0.08)' },
          pointLabels: { color: '#9BA6BC', font: { family: 'Inter', size: 12 } },
          ticks: { display: false, backdropColor: 'transparent' },
        },
      },
      plugins: {
        legend: { labels: { color: '#EAEEF6' } },
      },
    },
  });
}

/* =========================================================
   Results actions
   ========================================================= */
function bindResultsActions() {
  els.assessAgainBtn.addEventListener('click', resetAssessment);
  els.downloadBtn.addEventListener('click', downloadResult);
  els.shareBtn.addEventListener('click', shareResult);
}

function resetAssessment() {
  els.form.reset();
  state.step = 1;
  state.stressLevel = '';
  els.stressLevelInput.value = '';
  els.stressSelector.querySelectorAll('.stress-option').forEach((btn) => btn.setAttribute('aria-checked', 'false'));
  document.querySelectorAll('.field-error').forEach((e) => (e.textContent = ''));
  document.querySelectorAll('.field.has-error').forEach((f) => f.classList.remove('has-error'));

  linkRange(els.usage, els.usageOutput, 'hours/day');
  linkRange(els.study, els.studyOutput, 'hours/day');
  linkRange(els.activity, els.activityOutput, 'hours/day');
  linkRange(els.sleep, els.sleepOutput, 'hours/night');

  els.results.hidden = true;
  updateWizardUI();
  document.getElementById('assessment').scrollIntoView({ behavior: 'smooth' });
}

function downloadResult() {
  if (!state.lastPayload || state.lastScore == null) return;
  const p = state.lastPayload;
  const now = new Date();

  const content = `MindScore AI — Wellness Report
Generated: ${now.toLocaleString()}

PREDICTED MENTAL HEALTH SCORE: ${state.lastScore.toFixed(2)} / 100

--- Submitted Profile ---
Age: ${p.Age}
Gender: ${p.Gender}
Country: ${p.Country}
Academic Level: ${p.Academic_Level}
Most Used Platform: ${p.Most_Used_Platform}
Purpose of Use: ${p.Purpose_Of_Use}
Avg Daily Social Media Usage: ${p.Avg_Daily_Usage_Hours.toFixed(1)} hours/day
Daily Unlocks: ${p.Daily_Unlocks}
Study Hours: ${p.Study_Hours.toFixed(1)} hours/day
Physical Activity: ${p.Physical_Activity_Hours.toFixed(1)} hours/day
Sleep: ${p.Sleep_Hours_Per_Night.toFixed(1)} hours/night
Stress Level: ${p.Stress_Level}

--- Disclaimer ---
This prediction is for educational and informational purposes only and is not
a medical diagnosis. It should not replace professional mental health advice
or evaluation.
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindscore-ai-report-${now.getTime()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function shareResult() {
  if (state.lastScore == null) return;
  const text = `My MindScore AI predicted wellness score is ${state.lastScore.toFixed(2)}/100. This is an AI-generated educational prediction, not a medical diagnosis.`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'MindScore AI Result', text });
    } catch (err) {
      // user cancelled share — no action needed
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    flashShareFeedback('Copied to clipboard');
  } catch (err) {
    flashShareFeedback('Could not copy automatically');
  }
}

function flashShareFeedback(message) {
  const original = els.shareBtn.textContent;
  els.shareBtn.textContent = message;
  els.shareBtn.disabled = true;
  setTimeout(() => {
    els.shareBtn.textContent = original;
    els.shareBtn.disabled = false;
  }, 1800);
}

/* =========================================================
   Utils
   ========================================================= */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
