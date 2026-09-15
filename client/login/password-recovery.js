(() => {
  const reset = document.body.dataset.mode === 'reset';
  // Fragment tokens do not travel in HTTP requests or server access logs.
  const token = new URLSearchParams(location.hash.slice(1)).get('token');
  if (reset) history.replaceState(null, '', location.pathname);
  const form = document.getElementById('recoveryForm');
  const button = document.getElementById('submit');
  const message = document.getElementById('message');
  const report = (text, error = false) => { message.textContent = text; message.className = error ? 'error' : ''; };
  if (reset && !/^[a-f0-9]{64}$/.test(token || '')) {
    form.hidden = true;
    report('This reset link is missing or invalid. Request a new link below.', true);
    return;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    let payload;
    if (reset) {
      const password = document.getElementById('password').value;
      if (password !== document.getElementById('confirm').value) { report('Your passwords do not match.', true); return; }
      if (new TextEncoder().encode(password).length > 72) { report('Your password is too long. Use fewer characters.', true); return; }
      payload = { token, password };
    } else payload = { email: document.getElementById('email').value.trim() };
    const label = button.textContent;
    button.disabled = true; button.textContent = reset ? 'Updating…' : 'Sending…'; report('');
    try {
      const response = await fetch('/api/' + (reset ? 'reset-password' : 'forgot-password'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please try again.');
      report(data.message);
      if (reset) {
        form.hidden = true;
        const link = document.querySelector('main .back'); link.href = '/login/landing.html'; link.textContent = 'Log in with your new password';
      }
    } catch (err) { report(err.message || 'Could not connect. Please try again.', true); }
    finally { button.disabled = false; button.textContent = label; }
  });
})();