/**
 * Income Tax Filing Assistant - Deductions Management Module
 * Vanilla JavaScript (No frameworks)
 */

let currentDeductionList = [];
let editingDeductionId = null;

const SECTION_LIMITS = {
  '80c': { name: 'Section 80C (PPF, EPF, ELSS, LIC, Home Loan Principal)', max: 150000, description: 'Statutory cap: ₹1,50,000 across all 80C instruments' },
  '80d': { name: 'Section 80D (Health Insurance Premium)', max: 100000, description: 'Self & Family: Up to ₹25,000 (₹50,000 for seniors) + Parents: Up to ₹25,000 (₹50,000 for seniors)' },
  '80ccd_1b': { name: 'Section 80CCD(1B) (National Pension Scheme - NPS)', max: 50000, description: 'Additional deduction of ₹50,000 over and above 80C' },
  'sec_24b': { name: 'Section 24(b) (Home Loan Interest)', max: 200000, description: 'Interest on home loan for self-occupied property: Max ₹2,00,000' },
  '80e': { name: 'Section 80E (Higher Education Loan Interest)', max: Infinity, description: 'No upper limit; valid for up to 8 consecutive assessment years' },
  '80g': { name: 'Section 80G (Charitable Donations)', max: Infinity, description: '100% or 50% eligible donation with receipt to registered charities' },
  '80tta': { name: 'Section 80TTA (Savings Account Interest)', max: 10000, description: 'Max ₹10,000 for individuals under 60 years' },
  '80ttb': { name: 'Section 80TTB (Senior Citizen Deposit Interest)', max: 50000, description: 'Max ₹50,000 for Senior Citizens (Savings + FD interest)' },
  'other': { name: 'Other Eligible Exemptions', max: Infinity, description: 'Other Chapter VI-A deductions' }
};

// Fetch and render deductions
async function loadDeductionsList() {
  const fy = getSelectedFY();
  const tbody = document.getElementById('deduction-table-body');
  const totalDisplay = document.getElementById('deduction-total-amount');
  const countDisplay = document.getElementById('deduction-total-count');

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center" style="padding: 2rem;">
        <div class="spinner spinner-primary"></div>
        <div style="margin-top: 0.5rem; color: var(--gray-500);">Loading deduction records...</div>
      </td>
    </tr>
  `;

  try {
    const res = await apiRequest(`deductions.php?fy=${encodeURIComponent(fy)}`);
    currentDeductionList = res.data || [];

    let total = 0;
    countDisplay.textContent = currentDeductionList.length;

    if (currentDeductionList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
              </div>
              <div class="empty-state-title">No Deductions Claimed Yet</div>
              <p class="empty-state-text">Add your 80C, 80D, NPS, or Home Loan Interest deductions to lower your Old Regime tax liability.</p>
              <button class="btn btn-primary btn-sm" onclick="openAddDeductionModal()">+ Add Deduction</button>
            </div>
          </td>
        </tr>
      `;
      totalDisplay.textContent = formatINR(0);
      renderSectionCapsBreakdown([]);
      return;
    }

    let rowsHtml = '';
    currentDeductionList.forEach(item => {
      const amt = parseFloat(item.amount || 0);
      total += amt;
      const secInfo = SECTION_LIMITS[item.section] || { name: item.section, max: Infinity };

      rowsHtml += `
        <tr>
          <td>
            <span class="badge badge-success">${item.section.toUpperCase()}</span>
          </td>
          <td>
            <strong>${secInfo.name}</strong>
            ${item.notes ? `<div style="font-size: 0.8rem; color: var(--gray-500);">${escapeHtml(item.notes)}</div>` : ''}
          </td>
          <td>${item.financial_year}</td>
          <td class="text-right font-bold" style="font-size: 1rem; color: var(--success);">
            ${formatINR(amt)}
          </td>
          <td class="text-right">
            <button class="btn btn-secondary btn-sm" onclick="openEditDeductionModal(${item.id})" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm" onclick="confirmDeleteDeduction(${item.id})" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;
    totalDisplay.textContent = formatINR(total);
    renderSectionCapsBreakdown(currentDeductionList);

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger" style="padding: 2rem;">Error: ${err.message}</td></tr>`;
    showToast(err.message || 'Error loading deductions', 'danger');
  }
}

// Render statutory limit indicators for key sections (80C, 80D, 80CCD, Sec 24b)
function renderSectionCapsBreakdown(deductions) {
  const container = document.getElementById('statutory-caps-container');
  if (!container) return;

  const sectionTotals = {};
  deductions.forEach(d => {
    sectionTotals[d.section] = (sectionTotals[d.section] || 0) + parseFloat(d.amount || 0);
  });

  const trackSections = [
    { sec: '80c', title: 'Section 80C (EPF/PPF/ELSS)', cap: 150000 },
    { sec: '80d', title: 'Section 80D (Health Insurance)', cap: 50000 },
    { sec: '80ccd_1b', title: 'Section 80CCD(1B) (NPS)', cap: 50000 },
    { sec: 'sec_24b', title: 'Section 24(b) (Home Loan Int.)', cap: 200000 }
  ];

  let html = '';
  trackSections.forEach(s => {
    const claimed = sectionTotals[s.sec] || 0;
    const effective = Math.min(claimed, s.cap);
    const pct = Math.min(100, Math.round((claimed / s.cap) * 100));
    const isMaxed = claimed >= s.cap;

    html += `
      <div style="background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 1rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">
          <span>${s.title}</span>
          <span>${formatINR(claimed)} / ${formatINR(s.cap)}</span>
        </div>
        <div class="progress-bar-container" style="height: 8px;">
          <div class="progress-bar-fill" style="width: ${pct}%; background: ${isMaxed ? 'var(--success)' : 'var(--primary)'};"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--gray-500); margin-top: 0.25rem;">
          <span>Eligible Benefit: <strong>${formatINR(effective)}</strong></span>
          ${isMaxed ? '<span class="badge badge-success" style="font-size: 0.7rem;">Cap Reached</span>' : `<span>${formatINR(s.cap - claimed)} remaining</span>`}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Open Add Modal
function openAddDeductionModal() {
  editingDeductionId = null;
  document.getElementById('deduction-modal-title').textContent = 'Add Deduction Entry';
  document.getElementById('deduction-form').reset();
  document.getElementById('deduction-fy').value = getSelectedFY();
  updateSectionHelp();
  openModal('deduction-modal');
}

// Open Edit Modal
function openEditDeductionModal(id) {
  const item = currentDeductionList.find(x => x.id == id);
  if (!item) return;

  editingDeductionId = id;
  document.getElementById('deduction-modal-title').textContent = 'Edit Deduction Entry';
  document.getElementById('deduction-section').value = item.section;
  updateSectionHelp();
  document.getElementById('deduction-amount').value = item.amount;
  document.getElementById('deduction-fy').value = item.financial_year;
  document.getElementById('deduction-notes').value = item.notes || '';

  openModal('deduction-modal');
}

// Update section help text & limit notice
function updateSectionHelp() {
  const sec = document.getElementById('deduction-section').value;
  const helpBox = document.getElementById('section-help-box');
  const secInfo = SECTION_LIMITS[sec];
  if (secInfo && helpBox) {
    helpBox.textContent = secInfo.description;
  }
}

// Handle Form Submission (Add or Edit)
async function handleDeductionFormSubmit(e) {
  e.preventDefault();
  const section = document.getElementById('deduction-section').value;
  const amount = parseFloat(document.getElementById('deduction-amount').value);
  const financial_year = document.getElementById('deduction-fy').value;
  const notes = document.getElementById('deduction-notes').value.trim();

  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter an amount greater than 0.', 'warning');
    return;
  }

  const payload = {
    section,
    amount,
    financial_year,
    notes
  };

  const btn = document.getElementById('deduction-save-btn');
  btn.disabled = true;

  try {
    if (editingDeductionId) {
      payload.id = editingDeductionId;
      await apiRequest('deductions.php?action=update', {
        method: 'PUT',
        body: payload
      });
      showToast('Deduction entry updated successfully!', 'success');
    } else {
      await apiRequest('deductions.php?action=create', {
        method: 'POST',
        body: payload
      });
      showToast('New deduction recorded!', 'success');
    }

    closeModal('deduction-modal');
    loadDeductionsList();
  } catch (err) {
    showToast(err.message || 'Failed to save deduction', 'danger');
  } finally {
    btn.disabled = false;
  }
}

// Delete Deduction
let deductionToDeleteId = null;

function confirmDeleteDeduction(id) {
  deductionToDeleteId = id;
  openModal('deduction-delete-modal');
}

async function executeDeleteDeduction() {
  if (!deductionToDeleteId) return;

  try {
    await apiRequest(`deductions.php?id=${deductionToDeleteId}`, {
      method: 'DELETE'
    });
    showToast('Deduction removed successfully', 'success');
    closeModal('deduction-delete-modal');
    loadDeductionsList();
  } catch (err) {
    showToast(err.message || 'Failed to delete deduction', 'danger');
  } finally {
    deductionToDeleteId = null;
  }
}

// React to FY changes
window.addEventListener('fy-changed', () => {
  loadDeductionsList();
});

document.addEventListener('DOMContentLoaded', () => {
  loadDeductionsList();
  const secSelect = document.getElementById('deduction-section');
  if (secSelect) {
    secSelect.addEventListener('change', updateSectionHelp);
  }
});
