<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In - Income Tax Filing Assistant</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body class="auth-page">

  <div class="auth-container">
    <!-- Left Hero Sidebar -->
    <div class="auth-sidebar">
      <div>
        <a href="index.php" class="auth-sidebar-brand">
          <div class="brand-icon" style="width: 36px; height: 36px;">
            <svg viewBox="0 0 24 24"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z"/></svg>
          </div>
          TaxAssist India
        </a>

        <ul class="auth-sidebar-features">
          <li>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
            <span>Live comparison between Old and New Tax Regimes</span>
          </li>
          <li>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
            <span>Deductions optimizer under Section 80C, 80D, 80CCD</span>
          </li>
          <li>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
            <span>Pre-filing ITR checklist and readiness tracker</span>
          </li>
          <li>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
            <span>Multi-year calculation history & printable tax statement</span>
          </li>
        </ul>
      </div>

      <div>
        <p class="auth-sidebar-quote">
          "The hardest thing in the world to understand is the income tax." &mdash; Albert Einstein
        </p>
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.75rem;">
          College Capstone Project Demonstration
        </div>
      </div>
    </div>

    <!-- Right Login Form -->
    <div class="auth-main">
      <h2 class="auth-title">Welcome back</h2>
      <p class="auth-subtitle">Sign in to manage your income, deductions, and tax computations</p>

      <!-- Quick Demo Account Fill Button -->
      <div class="auth-demo-box">
        <div class="auth-demo-text">
          <strong>College Demo Account</strong><br>
          <span style="font-family: var(--font-mono); font-size: 0.8rem;">demo@taxassistant.local / Demo@1234</span>
        </div>
        <button type="button" class="auth-demo-btn" onclick="fillDemoCredentials()">Use Demo</button>
      </div>

      <!-- Alert Container -->
      <div id="auth-alert" style="display: none; margin-bottom: 1.25rem; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem;"></div>

      <form id="login-form" onsubmit="handleLoginSubmit(event)">
        <div class="form-group">
          <label class="form-label" for="login-email">Email Address <span class="required">*</span></label>
          <input type="email" id="login-email" class="form-control" placeholder="name@example.com" required autocomplete="email">
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <label class="form-label" for="login-password" style="margin-bottom: 0;">Password <span class="required">*</span></label>
            <a href="#" onclick="showToast('For college demo, use Demo@1234 or reset via SQLite/MySQL', 'info'); return false;" style="font-size: 0.8rem;">Forgot Password?</a>
          </div>
          <input type="password" id="login-password" class="form-control" placeholder="••••••••" required autocomplete="current-password">
        </div>

        <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
          <input type="checkbox" id="remember-me" checked>
          <label for="remember-me" style="font-size: 0.875rem; color: var(--gray-700); cursor: pointer;">Stay signed in for 30 days</label>
        </div>

        <button type="submit" id="login-btn" class="btn btn-primary btn-block btn-lg">
          <span id="btn-text">Sign In to Dashboard</span>
          <span id="btn-spinner" class="spinner" style="display: none;"></span>
        </button>
      </form>

      <div class="auth-footer">
        Don't have an account yet? <a href="register.php">Create Free Account</a>
      </div>
      <div style="text-align: center; margin-top: 1rem;">
        <a href="index.php" style="font-size: 0.85rem; color: var(--gray-500); text-decoration: none;">&larr; Back to Home Page</a>
      </div>
    </div>
  </div>

  <div id="toast-container"></div>
  <script src="assets/js/api.js"></script>
  <script>
    function fillDemoCredentials() {
      document.getElementById('login-email').value = 'demo@taxassistant.local';
      document.getElementById('login-password').value = 'Demo@1234';
      showToast('Demo credentials pre-filled!', 'info');
    }

    async function handleLoginSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      const btnText = document.getElementById('btn-text');
      const btnSpinner = document.getElementById('btn-spinner');
      const alertBox = document.getElementById('auth-alert');

      if (!email || !password) {
        showAlert('Please fill in both email and password.', 'danger');
        return;
      }

      // UI Loading state
      btn.disabled = true;
      btnText.style.display = 'none';
      btnSpinner.style.display = 'inline-block';
      alertBox.style.display = 'none';

      try {
        const res = await apiRequest('auth.php?action=login', {
          method: 'POST',
          body: { email, password }
        });

        showAlert('Authentication successful! Redirecting to dashboard...', 'success');
        showToast('Welcome back, ' + (res.user ? res.user.name : ''), 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.php';
        }, 600);
      } catch (err) {
        showAlert(err.message || 'Login failed. Please verify your credentials.', 'danger');
        showToast(err.message || 'Invalid email or password', 'danger');
      } finally {
        btn.disabled = false;
        btnText.style.display = 'inline-block';
        btnSpinner.style.display = 'none';
      }
    }

    function showAlert(msg, type) {
      const alertBox = document.getElementById('auth-alert');
      alertBox.textContent = msg;
      alertBox.className = `badge-${type}`;
      alertBox.style.display = 'block';
      if (type === 'danger') {
        alertBox.style.backgroundColor = 'var(--danger-bg)';
        alertBox.style.color = 'var(--danger)';
        alertBox.style.border = '1px solid var(--danger-border)';
      } else {
        alertBox.style.backgroundColor = 'var(--success-bg)';
        alertBox.style.color = 'var(--success)';
        alertBox.style.border = '1px solid var(--success-border)';
      }
    }
  </script>
</body>
</html>
