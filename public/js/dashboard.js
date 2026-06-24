const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logout-btn');
const aiText = document.getElementById('ai-text');
const aiSubmitBtn = document.getElementById('ai-submit-btn');
const manualToggle = document.getElementById('manual-toggle');
const manualForm = document.getElementById('manual-form');
const statusMsg = document.getElementById('status-msg');
const eventsList = document.getElementById('events-list');

function setStatus(message, type) {
  statusMsg.textContent = message;
  statusMsg.className = `status-msg ${type || ''}`;
}

async function checkAuth() {
  const res = await fetch('/api/auth/me');
  if (!res.ok) {
    window.location.href = '/';
    return;
  }
  const data = await res.json();
  welcomeMsg.textContent = `Hi, ${data.username}`;
}

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
});

manualToggle.addEventListener('click', () => {
  manualForm.classList.toggle('hidden');
});

function formatEventMeta(ev) {
  return ev.time ? `${ev.date} at ${ev.time}` : ev.date;
}

function renderEvents(events) {
  eventsList.innerHTML = '';
  if (!events.length) {
    eventsList.innerHTML = '<div class="empty-state">No events yet. Add one above!</div>';
    return;
  }
  events.forEach((ev) => {
    const item = document.createElement('div');
    item.className = 'event-item';
    item.innerHTML = `
      <div class="event-info">
        <strong>${ev.title}</strong>
        <span>${formatEventMeta(ev)}${ev.description ? ' · ' + ev.description : ''}</span>
      </div>
      <div class="event-actions">
        <button class="delete-btn" data-id="${ev._id}">Delete</button>
      </div>
    `;
    eventsList.appendChild(item);
  });

  eventsList.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/events/${btn.dataset.id}`, { method: 'DELETE' });
      loadEvents();
    });
  });
}

async function loadEvents() {
  const res = await fetch('/api/events');
  if (!res.ok) return;
  const events = await res.json();
  renderEvents(events);
}

aiSubmitBtn.addEventListener('click', async () => {
  const text = aiText.value.trim();
  if (!text) return;
  aiSubmitBtn.disabled = true;
  setStatus('Thinking...', '');
  try {
    const res = await fetch('/api/events/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add event');
    setStatus(`Added "${data.title}" on ${data.date}${data.time ? ' at ' + data.time : ''}`, 'success');
    aiText.value = '';
    loadEvents();
  } catch (err) {
    setStatus(err.message, 'error');
  } finally {
    aiSubmitBtn.disabled = false;
  }
});

manualForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('manual-title').value.trim();
  const date = document.getElementById('manual-date').value;
  const time = document.getElementById('manual-time').value;
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, time })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add event');
    setStatus(`Added "${data.title}"`, 'success');
    manualForm.reset();
    manualForm.classList.add('hidden');
    loadEvents();
  } catch (err) {
    setStatus(err.message, 'error');
  }
});

checkAuth();
loadEvents();
