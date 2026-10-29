/**
 * Income Tax Filing Assistant - Profile Module
 * Vanilla JavaScript (No frameworks)
 */

async function loadUserProfile() {
  try {
    const res = await apiRequest('profile.php');
    const u = res.user;

    document.getElementById('prof-name').value = u.name || '';
    document.getElementById('prof-email').value = u.email || '';
    document.getElementById('prof-pan').value = u.pan_number || '';
    document.getElementById('prof-dob').value = u.dob || '';
    document.getElementById('prof-phone').value = u.phone || '';
    if (u.default_fy) {
      document.getElementById('prof-fy').value = u.default_fy;
    }

    // Calculate age & bracket
    updateAgeClassification(u.dob);

  } catch (err) {
    showToast(err.message || 'Error loading profile', 'danger');
  }
}

function updateAgeClassification(dobStr) {
  const badge = document.getElementById('prof-age-badge');
  if (!dobStr) {
    badge.textContent = 'Age category: Standard (< 60)';
    badge.className = 'badge badge-primary';
    return;
  }

  const birthDate = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age >= 80) {
    badge.textContent = `Super Senior Citizen (Age ${age} - ₹5L Exemption in Old Regime)`;
    badge.className = 'badge badge-warning';
  } else if (age >= 60) {
    badge.textContent = `Senior Citizen (Age ${age} - ₹3L Exemption in Old Regime)`;
    badge.className = 'badge badge-info';
  } else {
    badge.textContent = `General Individual (Age ${age} - ₹2.5L Exemption in Old Regime)`;
    badge.className = 'badge badge-primary';
  }
}

// Handle Profile Details update
async function handleProfileUpdate(e) {
  e.preventDefault();
  const name = document.getElementById('prof-name').value.trim();
  const pan_number = document.getElementById('prof-pan').value.trim().toUpperCase();
  const dob = document.getElementById('prof-dob').value;
  const phone = document.getElementById('prof-phone').value.trim();
  const default_fy = document.getElementById('prof-fy').value;

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(pan_number)) {
    showToast('Invalid PAN format (Expected 5 letters, 4 digits, 1 letter)', 'danger');
    return;
  }

  const btn = document.getElementById('prof-save-btn');
  btn.disabled = true;

  try {
    const res = await apiRequest('profile.php?action=update_details', {
      method: 'POST',
      body: { name, pan_number, dob, phone, default_fy }
    });

    showToast('Profile updated successfully!', 'success');
    setSelectedFY(default_fy);
    updateAgeClassification(dob);
    checkAuthSession();
  } catch (err) {
    showToast(err.message || 'Failed to update profile', 'danger');
  } finally {
    btn.disabled = false;
  }
}

// Handle Password change
async function handlePasswordChange(e) {
  e.preventDefault();
  const current_password = document.getElementById('prof-current-pass').value;
  const new_password = document.getElementById('prof-new-pass').value;
  const confirm_password = document.getElementById('prof-confirm-pass').value;

  if (new_password !== confirm_password) {
    showToast('New passwords do not match.', 'danger');
    return;
  }

  if (new_password.length < 8) {
    showToast('New password must be at least 8 characters long.', 'danger');
    return;
  }

  const btn = document.getElementById('prof-pass-btn');
  btn.disabled = true;

  try {
    await apiRequest('profile.php?action=change_password', {
      method: 'POST',
      body: { current_password, new_password }
    });

    showToast('Password changed successfully!', 'success');
    document.getElementById('password-form').reset();
  } catch (err) {
    showToast(err.message || 'Failed to change password', 'danger');
  } finally {
    btn.disabled = false;
  }
}

// Reset data in danger zone
async function handleResetRecords() {
  if (!confirm('WARNING: This will permanently delete all your income records, deductions, and document checklist items. Are you sure you want to proceed?')) {
    return;
  }

  try {
    await apiRequest('profile.php?action=reset_data', {
      method: 'POST'
    });
    showToast('Your financial records have been reset.', 'info');
    setTimeout(() => {
      window.location.href = typeof getPageUrl === 'function' ? getPageUrl('dashboard') : 'dashboard.html';
    }, 1000);
  } catch (err) {
    showToast(err.message || 'Failed to reset records', 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  const dobInput = document.getElementById('prof-dob');
  if (dobInput) {
    dobInput.addEventListener('change', (e) => updateAgeClassification(e.target.value));
  }
});
