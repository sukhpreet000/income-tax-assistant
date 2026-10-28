/**
 * Income Tax Filing Assistant - Income Management Module
 * Vanilla JavaScript (No frameworks)
 */

let currentIncomeList = [];
let editingIncomeId = null;

const CATEGORY_NAMES = {
  salary: 'Salary / Allowances',
  house_property: 'House Property (Rental)',
  capital_gains: 'Capital Gains (STCG/LTCG)',
  business: 'Business / Profession',
  other: 'Income from Other Sources'
};

const SUBCATEGORY_SUGGESTIONS = {
  salary: ['Basic Salary', 'House Rent Allowance (HRA)', 'Special Allowance', 'Performance Bonus', 'Employer EPF Contribution'],
  house_property: ['Residential Property Rent', 'Commercial Property Rent', 'Deemed Rental Income'],
  capital_gains: ['Listed Equity / Mutual Fund LTCG', 'Listed Equity / Mutual Fund STCG', 'Real Estate LTCG', 'Debt Fund Gains'],
  business: ['Freelancing / Consulting Fees', 'Retail Trading Profits', 'Professional Practice (44ADA)', 'Small Business Turnover'],
  other: ['Bank Savings Account Interest', 'Fixed Deposit (FD) Interest', 'Dividend Income', 'Gift from Non-Relatives', 'Family Pension']
};

// Fetch and render income list
async function loadIncomeList() {
  const fy = getSelectedFY();
  const tbody = document.getElementById('income-table-body');
  const totalDisplay = document.getElementById('income-total-amount');
  const countDisplay = document.getElementById('income-total-count');

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center" style="padding: 2rem;">
        <div class="spinner spinner-primary"></div>
        <div style="margin-top: 0.5rem; color: var(--gray-500);">Loading income records...</div>
      </td>
    </tr>
  `;

  try {
    const res = await apiRequest(`income.php?fy=${encodeURIComponent(fy)}`);
    currentIncomeList = res.data || [];

    let total = 0;
    countDisplay.textContent = currentIncomeList.length;

    if (currentIncomeList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
              </div>
              <div class="empty-state-title">No Income Records Found</div>
              <p class="empty-state-text">You haven't recorded any income for ${fy} yet. Click "+ Add Income" above to get started.</p>
              <button class="btn btn-primary btn-sm" onclick="openAddIncomeModal()">+ Add Income</button>
            </div>
          </td>
        </tr>
      `;
      totalDisplay.textContent = formatINR(0);
      return;
    }

    let rowsHtml = '';
    currentIncomeList.forEach(item => {
      const amt = parseFloat(item.amount || 0);
      total += amt;
      const catLabel = CATEGORY_NAMES[item.category] || item.category;

      rowsHtml += `
        <tr>
          <td>
            <span class="badge badge-primary">${catLabel}</span>
          </td>
          <td>
            <strong>${escapeHtml(item.subcategory || '-')}</strong>
            ${item.description ? `<div style="font-size: 0.8rem; color: var(--gray-500);">${escapeHtml(item.description)}</div>` : ''}
          </td>
          <td>${item.financial_year}</td>
          <td class="text-right font-bold" style="font-size: 1rem; color: var(--gray-900);">
            ${formatINR(amt)}
          </td>
          <td class="text-right">
            <button class="btn btn-secondary btn-sm" onclick="openEditIncomeModal(${item.id})" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm" onclick="confirmDeleteIncome(${item.id})" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;
    totalDisplay.textContent = formatINR(total);
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger" style="padding: 2rem;">
          Failed to load records: ${err.message}
        </td>
      </tr>
    `;
    showToast(err.message || 'Error loading income', 'danger');
  }
}

// Open Add Modal
function openAddIncomeModal() {
  editingIncomeId = null;
  document.getElementById('income-modal-title').textContent = 'Add Income Entry';
  document.getElementById('income-form').reset();
  document.getElementById('income-fy').value = getSelectedFY();
  updateSubcategorySuggestions();
  openModal('income-modal');
}

// Open Edit Modal
function openEditIncomeModal(id) {
  const item = currentIncomeList.find(x => x.id == id);
  if (!item) return;

  editingIncomeId = id;
  document.getElementById('income-modal-title').textContent = 'Edit Income Entry';
  document.getElementById('income-category').value = item.category;
  updateSubcategorySuggestions();
  document.getElementById('income-subcategory').value = item.subcategory || '';
  document.getElementById('income-amount').value = item.amount;
  document.getElementById('income-fy').value = item.financial_year;
  document.getElementById('income-desc').value = item.description || '';

  openModal('income-modal');
}

// Update subcategory dropdown datalist
function updateSubcategorySuggestions() {
  const cat = document.getElementById('income-category').value;
  const datalist = document.getElementById('subcategory-suggestions');
  datalist.innerHTML = '';

  const suggestions = SUBCATEGORY_SUGGESTIONS[cat] || [];
  suggestions.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    datalist.appendChild(opt);
  });
}

// Handle Form Submission (Add or Edit)
async function handleIncomeFormSubmit(e) {
  e.preventDefault();
  const category = document.getElementById('income-category').value;
  const subcategory = document.getElementById('income-subcategory').value.trim();
  const amount = parseFloat(document.getElementById('income-amount').value);
  const financial_year = document.getElementById('income-fy').value;
  const description = document.getElementById('income-desc').value.trim();

  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid income amount greater than 0.', 'warning');
    return;
  }

  const payload = {
    category,
    subcategory,
    amount,
    financial_year,
    description
  };

  const btn = document.getElementById('income-save-btn');
  btn.disabled = true;

  try {
    if (editingIncomeId) {
      payload.id = editingIncomeId;
      await apiRequest('income.php?action=update', {
        method: 'PUT',
        body: payload
      });
      showToast('Income entry updated successfully!', 'success');
    } else {
      await apiRequest('income.php?action=create', {
        method: 'POST',
        body: payload
      });
      showToast('New income entry added!', 'success');
    }

    closeModal('income-modal');
    loadIncomeList();
  } catch (err) {
    showToast(err.message || 'Failed to save income record', 'danger');
  } finally {
    btn.disabled = false;
  }
}

// Delete Income Confirmation
let incomeToDeleteId = null;

function confirmDeleteIncome(id) {
  incomeToDeleteId = id;
  openModal('income-delete-modal');
}

async function executeDeleteIncome() {
  if (!incomeToDeleteId) return;

  try {
    await apiRequest(`income.php?id=${incomeToDeleteId}`, {
      method: 'DELETE'
    });
    showToast('Income entry deleted successfully', 'success');
    closeModal('income-delete-modal');
    loadIncomeList();
  } catch (err) {
    showToast(err.message || 'Failed to delete income record', 'danger');
  } finally {
    incomeToDeleteId = null;
  }
}

// Client-side CSV export
function exportIncomeCSV() {
  if (!currentIncomeList.length) {
    showToast('No records to export.', 'info');
    return;
  }

  let csv = 'ID,Financial Year,Category,Subcategory,Amount (INR),Description\n';
  currentIncomeList.forEach(item => {
    csv += `"${item.id}","${item.financial_year}","${item.category}","${(item.subcategory||'').replace(/"/g, '""')}","${item.amount}","${(item.description||'').replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Income_Details_${getSelectedFY()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

// Listen to FY changes
window.addEventListener('fy-changed', () => {
  loadIncomeList();
});

document.addEventListener('DOMContentLoaded', () => {
  loadIncomeList();
  const catSelect = document.getElementById('income-category');
  if (catSelect) {
    catSelect.addEventListener('change', updateSubcategorySuggestions);
  }
});
