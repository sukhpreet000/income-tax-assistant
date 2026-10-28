/**
 * Income Tax Filing Assistant - Calculator Module
 * Vanilla JavaScript (No frameworks)
 */

let lastCalculationResult = null;

// Load recorded user financial values as initial calculator state
async function prefillFromUserData() {
  const fy = getSelectedFY();
  try {
    const [incRes, dedRes] = await Promise.all([
      apiRequest(`income.php?fy=${encodeURIComponent(fy)}`),
      apiRequest(`deductions.php?fy=${encodeURIComponent(fy)}`)
    ]);

    const incomeList = incRes.data || [];
    const deductionsList = dedRes.data || [];

    const totalIncome = incomeList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalDeductions = deductionsList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    if (totalIncome > 0) {
      document.getElementById('calc-gross-income').value = totalIncome;
      document.getElementById('calc-deductions').value = totalDeductions;
      showToast(`Loaded ₹${formatNumber(totalIncome)} income & ₹${formatNumber(totalDeductions)} deductions from your records.`, 'info');
    }
  } catch (err) {
    console.warn('Could not auto-fill recorded financial data:', err);
  }

  // Trigger calculation
  computeTaxComparison();
}

// Perform interactive tax computation
async function computeTaxComparison() {
  const fy = document.getElementById('calc-fy').value;
  const ageGroup = document.getElementById('calc-age-group').value;
  const isSalaried = document.getElementById('calc-is-salaried').checked;
  const grossIncome = Math.max(0, parseFloat(document.getElementById('calc-gross-income').value) || 0);
  const deductions = Math.max(0, parseFloat(document.getElementById('calc-deductions').value) || 0);

  const payload = {
    financial_year: fy,
    age_group: ageGroup,
    is_salaried: isSalaried,
    gross_income: grossIncome,
    deductions: deductions
  };

  try {
    const res = await apiRequest('calculator.php?action=compute', {
      method: 'POST',
      body: payload
    });

    const data = res.data;
    lastCalculationResult = data;
    renderCalculationResults(data);
  } catch (err) {
    showToast(err.message || 'Tax computation error', 'danger');
  }
}

// Render the side-by-side computation cards & slabs table
function renderCalculationResults(data) {
  // Update Net Tax Display
  document.getElementById('res-old-net-tax').textContent = formatINR(data.net_tax_old);
  document.getElementById('res-new-net-tax').textContent = formatINR(data.net_tax_new);

  // Update Taxable Incomes
  document.getElementById('res-old-gross').textContent = formatINR(data.gross_income);
  document.getElementById('res-new-gross').textContent = formatINR(data.gross_income);

  document.getElementById('res-old-std-ded').textContent = formatINR(data.std_ded_old);
  document.getElementById('res-new-std-ded').textContent = formatINR(data.std_ded_new);

  document.getElementById('res-old-chap6').textContent = formatINR(data.deductions_applied_old);
  document.getElementById('res-new-chap6').textContent = 'NIL (Not Allowed)';

  document.getElementById('res-old-taxable').textContent = formatINR(data.taxable_income_old);
  document.getElementById('res-new-taxable').textContent = formatINR(data.taxable_income_new);

  document.getElementById('res-old-base-tax').textContent = formatINR(data.base_tax_old);
  document.getElementById('res-new-base-tax').textContent = formatINR(data.base_tax_new);

  document.getElementById('res-old-rebate').textContent = formatINR(data.rebate_87a_old);
  document.getElementById('res-new-rebate').textContent = formatINR(data.rebate_87a_new);

  document.getElementById('res-old-surcharge').textContent = formatINR(data.surcharge_old || 0);
  document.getElementById('res-new-surcharge').textContent = formatINR(data.surcharge_new || 0);

  document.getElementById('res-old-cess').textContent = formatINR(data.cess_old);
  document.getElementById('res-new-cess').textContent = formatINR(data.cess_new);

  // Recommendation Ribbon
  const oldCard = document.getElementById('calc-old-card');
  const newCard = document.getElementById('calc-new-card');
  const oldBadge = document.getElementById('calc-old-badge');
  const newBadge = document.getElementById('calc-new-badge');
  const recBanner = document.getElementById('calc-recommendation-box');

  oldCard.classList.remove('recommended');
  newCard.classList.remove('recommended');
  oldBadge.style.display = 'none';
  newBadge.style.display = 'none';

  if (data.net_tax_new < data.net_tax_old) {
    const diff = data.net_tax_old - data.net_tax_new;
    newCard.classList.add('recommended');
    newBadge.style.display = 'inline-block';
    recBanner.innerHTML = `
      <div style="font-size: 1.15rem; font-weight: 800;">Recommendation: Select New Tax Regime</div>
      <div style="margin-top: 0.25rem;">The New Tax Regime provides a lower tax liability, saving you <strong>${formatINR(diff)}</strong> in taxes for ${data.financial_year}.</div>
    `;
    recBanner.className = 'disclaimer-banner';
    recBanner.style.background = 'var(--success-bg)';
    recBanner.style.borderColor = 'var(--success-border)';
    recBanner.style.color = 'var(--success)';
  } else if (data.net_tax_old < data.net_tax_new) {
    const diff = data.net_tax_new - data.net_tax_old;
    oldCard.classList.add('recommended');
    oldBadge.style.display = 'inline-block';
    recBanner.innerHTML = `
      <div style="font-size: 1.15rem; font-weight: 800;">Recommendation: Select Old Tax Regime</div>
      <div style="margin-top: 0.25rem;">Your eligible Chapter VI-A deductions allow you to save <strong>${formatINR(diff)}</strong> under the Old Regime for ${data.financial_year}.</div>
    `;
    recBanner.className = 'disclaimer-banner';
    recBanner.style.background = 'var(--primary-light)';
    recBanner.style.borderColor = 'var(--primary-border)';
    recBanner.style.color = 'var(--primary)';
  } else {
    recBanner.innerHTML = `
      <div style="font-size: 1.15rem; font-weight: 800;">Recommendation: Neutral</div>
      <div style="margin-top: 0.25rem;">Both regimes generate the exact same tax liability of <strong>${formatINR(data.net_tax_new)}</strong>.</div>
    `;
    recBanner.className = 'disclaimer-banner';
  }

  // Render Slabs Breakdown Tables
  renderSlabsBreakdown('slabs-breakdown-old', data.slab_breakdown_old || []);
  renderSlabsBreakdown('slabs-breakdown-new', data.slab_breakdown_new || []);
}

function renderSlabsBreakdown(tableBodyId, breakdown) {
  const tbody = document.getElementById(tableBodyId);
  if (!tbody) return;

  if (!breakdown.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No tax applicable</td></tr>';
    return;
  }

  let html = '';
  breakdown.forEach(s => {
    html += `
      <tr>
        <td>${s.range}</td>
        <td>${s.rate}%</td>
        <td class="text-right">${formatINR(s.taxable_in_slab)}</td>
        <td class="text-right font-bold">${formatINR(s.tax)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// Save snapshot to user's calculation history
async function saveCalculationToHistory() {
  if (!lastCalculationResult) {
    showToast('Please compute taxes first.', 'warning');
    return;
  }

  const saveBtn = document.getElementById('save-calc-btn');
  saveBtn.disabled = true;

  try {
    await apiRequest('calculator.php?action=save', {
      method: 'POST',
      body: lastCalculationResult
    });
    showToast('Tax calculation saved to your history!', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to save calculation history', 'danger');
  } finally {
    saveBtn.disabled = false;
  }
}

// Print / PDF action
function printTaxStatement() {
  window.print();
}

// React to global FY switch
window.addEventListener('fy-changed', (e) => {
  document.getElementById('calc-fy').value = e.detail.fy;
  prefillFromUserData();
});

document.addEventListener('DOMContentLoaded', () => {
  const calcFy = document.getElementById('calc-fy');
  if (calcFy) {
    calcFy.value = getSelectedFY();
  }
  prefillFromUserData();
});
