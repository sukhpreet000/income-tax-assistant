/**
 * Income Tax Filing Assistant - Core API & UI Helpers
 * Vanilla JavaScript (No frameworks)
 */

const API_BASE = 'api';

// Currency Formatter for Indian Rupees (Lakhs and Crores)
function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

// Format numbers without currency symbol
function formatNumber(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

// Toast Notification Manager
function showToast(message, type = 'info', title = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconMap = {
    success: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>',
    danger:  '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/></svg>',
    warning: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>',
    info:    '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/></svg>'
  };

  const defaultTitles = {
    success: 'Success',
    danger: 'Error',
    warning: 'Notice',
    info: 'Information'
  };

  toast.innerHTML = `
    <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title || defaultTitles[type]}</div>
      <div>${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 4500);
}

// Universal API Fetcher
async function apiRequest(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    ...options
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  // Handle FormData
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, config);
    const contentType = res.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(text || 'Server returned an invalid response.');
      }
    }

    if (!res.ok) {
      if (res.status === 401) {
        // Redirect to login if unauthorized and not already on auth page
        if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register') && !window.location.pathname.endsWith('/') && !window.location.pathname.endsWith('index.php')) {
          window.location.href = 'login.php';
        }
      }
      throw new Error(data.message || data.error || `HTTP error ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error('API Request failed:', err);
    throw err;
  }
}

// Modal Handlers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Global Financial Year State
function getSelectedFY() {
  const fySelector = document.getElementById('global-fy-selector');
  if (fySelector) {
    return fySelector.value;
  }
  return localStorage.getItem('selected_fy') || '2024-2025';
}

function setSelectedFY(fy) {
  localStorage.setItem('selected_fy', fy);
  const fySelector = document.getElementById('global-fy-selector');
  if (fySelector && fySelector.value !== fy) {
    fySelector.value = fy;
  }
}

// Session check for dashboard pages
async function checkAuthSession() {
  try {
    const res = await apiRequest('auth.php?action=check');
    if (!res.authenticated) {
      window.location.href = 'login.php';
      return null;
    }
    
    // Update user display in topbar and sidebar if present
    const userElements = document.querySelectorAll('.js-user-name');
    userElements.forEach(el => el.textContent = res.user.name || 'User');
    
    const userEmailElements = document.querySelectorAll('.js-user-email');
    userEmailElements.forEach(el => el.textContent = res.user.email || '');

    const userInitialElements = document.querySelectorAll('.js-user-initial');
    userInitialElements.forEach(el => {
      el.textContent = (res.user.name ? res.user.name.charAt(0) : 'U').toUpperCase();
    });

    if (res.user.default_fy) {
      setSelectedFY(res.user.default_fy);
    }

    return res.user;
  } catch (err) {
    console.warn('Session verification failed:', err);
    return null;
  }
}

// Logout handler
async function handleLogout() {
  try {
    await apiRequest('auth.php?action=logout', { method: 'POST' });
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
      window.location.href = 'login.php';
    }, 500);
  } catch (err) {
    window.location.href = 'login.php';
  }
}

// Attach event listeners for modal closes and FY changes
document.addEventListener('DOMContentLoaded', () => {
  // Close modals when clicking backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Close modals when clicking elements with data-dismiss="modal"
  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });
  }

  // FY Selector change event
  const fySelector = document.getElementById('global-fy-selector');
  if (fySelector) {
    const savedFY = localStorage.getItem('selected_fy');
    if (savedFY) {
      fySelector.value = savedFY;
    }
    fySelector.addEventListener('change', (e) => {
      setSelectedFY(e.target.value);
      window.dispatchEvent(new CustomEvent('fy-changed', { detail: { fy: e.target.value } }));
    });
  }
});
