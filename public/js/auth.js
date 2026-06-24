const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const formTitle = document.getElementById('form-title');
const errorMsg = document.getElementById('error-msg');

function showLogin() {
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
  formTitle.textContent = 'Welcome Back';
  errorMsg.textContent = '';
}

function showSignup() {
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  signupForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  formTitle.textContent = 'Create Your Account';
  errorMsg.textContent = '';
}

tabLogin.addEventListener('click', showLogin);
tabSignup.addEventListener('click', showSignup);

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    await postJSON('/api/auth/login', { username, password });
    window.location.href = '/dashboard';
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  try {
    await postJSON('/api/auth/signup', { username, email, password });
    window.location.href = '/dashboard';
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});
