/**
 * Income Tax Filing Assistant - Calculation History Module
 * Vanilla JavaScript (No frameworks)
 */

let currentHistoryList = [];
let activeViewingCalculation = null;

async function loadHistoryList() {
  const tbody = document.getElementById('history-table-body');
  const countDisplay = document.getElementById('history-count');

  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center" style="padding: 2rem;">
        <div class="spinner spinner-primary"></div>
        <div style="margin-top: 0.5rem; color: var(--gray-500);">Loading calculation records...</div>
      </td>
    </tr>
  `;

  try {
    const res = await apiRequest('history.php');
    currentHistoryList = res.data || [];

    countDisplay.textContent = currentHistoryList.length;

    if (currentHistoryList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
              </div>
              <div class="empty-state-title">No Calculation History Saved</div>
              <p class="empty-state-text">You haven't saved any tax calculations yet. Use the Tax Calculator and click "Save to History" to record snapshots.</p>
              <a href="calculator.php" class="btn btn-primary btn-sm">Go to Tax Calculator</a>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let rows = '';
    currentHistoryList.forEach(item => {
      const oldTax = parseFloat(item.net_tax_old || 0);
      const newTax = parseFloat(item.net_tax_new || 0);
      const isNewBest = item.recommended_regime === 'new' || newTax < oldTax;
      const savings = Math.abs(oldTax - newTax);

      const recBadge = isNewBest
        ? `<span class="badge badge-success">New Regime (Save ${formatINR(savings)})</span>`
        : `<span class="badge badge-primary">Old Regime (Save ${formatINR(savings)})</span>`;

      const formattedDate = new Date(item.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      rows += `
        <tr>
          <td>
            <strong>${formattedDate}</strong>
            <div style="font-size: 0.8rem; color: var(--gray-500); font-family: var(--font-mono);">${item.financial_year}</div>
          </td>
          <td>${formatINR(item.gross_income)}</td>
          <td>${formatINR(item.total_deductions_old)}</td>
          <td class="font-bold">${formatINR(oldTax)}</td>
          <td class="font-bold text-success">${formatINR(newTax)}</td>
          <td>${recBadge}</td>
          <td class="text-right">
            <button class="btn btn-secondary btn-sm" onclick="viewHistoryDetails(${item.id})" title="View Computation Sheet">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteHistoryItem(${item.id})" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rows;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger" style="padding: 2rem;">Error: ${err.message}</td></tr>`;
    showToast(err.message || 'Error loading history', 'danger');
  }
}

// View Computation Sheet Modal
function viewHistoryDetails(id) {
  const item = currentHistoryList.find(x => x.id == id);
  if (!item) return;

  activeViewingCalculation = item;

  const dateStr = new Date(item.created_at).toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'medium'
  });

  document.getElementById('sheet-date').textContent = dateStr;
  document.getElementById('sheet-fy').textContent = item.financial_year;
  document.getElementById('sheet-gross').textContent = formatINR(item.gross_income);
  
  document.getElementById('sheet-old-ded').textContent = formatINR(item.total_deductions_old);
  document.getElementById('sheet-new-ded').textContent = formatINR(item.total_deductions_new || 75000);

  document.getElementById('sheet-old-taxable').textContent = formatINR(item.taxable_income_old);
  document.getElementById('sheet-new-taxable').textContent = formatINR(item.taxable_income_new);

  document.getElementById('sheet-old-tax').textContent = formatINR(item.net_tax_old);
  document.getElementById('sheet-new-tax').textContent = formatINR(item.net_tax_new);

  const diff = Math.abs(parseFloat(item.net_tax_old) - parseFloat(item.net_tax_new));
  const isNew = parseFloat(item.net_tax_new) <= parseFloat(item.net_tax_old);

  document.getElementById('sheet-winner-banner').innerHTML = isNew
    ? `🎉 <strong>New Tax Regime Saves ${formatINR(diff)}</strong> compared to the Old Regime.`
    : `🎉 <strong>Old Tax Regime Saves ${formatINR(diff)}</strong> due to Chapter VI-A deductions.`;

  openModal('computation-sheet-modal');
}

// Delete calculation record
async function deleteHistoryItem(id) {
  if (!confirm('Are you sure you want to delete this saved calculation?')) return;

  try {
    await apiRequest(`history.php?id=${id}`, {
      method: 'DELETE'
    });
    showToast('Calculation snapshot deleted', 'success');
    loadHistoryList();
  } catch (err) {
    showToast(err.message || 'Failed to delete record', 'danger');
  }
}

// Print currently open sheet
function printCurrentSheet() {
  window.print();
}

document.addEventListener('DOMContentLoaded', () => {
  loadHistoryList();
});
