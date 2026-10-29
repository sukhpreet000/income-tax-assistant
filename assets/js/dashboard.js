/**
 * Income Tax Filing Assistant - Dashboard Logic
 * Vanilla JavaScript (No React, No jQuery)
 */

async function loadDashboardData() {
  const fy = getSelectedFY();
  const loadingIndicator = document.getElementById('dashboard-loading');
  const dashboardContent = document.getElementById('dashboard-content');

  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (dashboardContent) dashboardContent.style.opacity = '0.5';

  try {
    // 1. Fetch Income summary for this FY
    const incomeRes = await apiRequest(`income.php?fy=${encodeURIComponent(fy)}`);
    const incomeList = incomeRes.data || [];
    const totalGrossIncome = incomeList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    // 2. Fetch Deductions summary for this FY
    const deductionsRes = await apiRequest(`deductions.php?fy=${encodeURIComponent(fy)}`);
    const deductionsList = deductionsRes.data || [];
    const totalDeductions = deductionsList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    // 3. Fetch Document Checklist for this FY
    const docRes = await apiRequest(`checklist.php?fy=${encodeURIComponent(fy)}`);
    const docList = docRes.data || [];
    const completedDocs = docList.filter(d => d.status === 'uploaded' || d.status === 'verified').length;
    const docProgress = docList.length > 0 ? Math.round((completedDocs / docList.length) * 100) : 0;

    // 4. Compute Tax under both regimes
    const calcRes = await apiRequest('calculator.php?action=compute', {
      method: 'POST',
      body: {
        financial_year: fy,
        gross_income: totalGrossIncome,
        deductions: totalDeductions
      }
    });

    const taxData = calcRes.data || {};

    // Update Summary Cards
    document.getElementById('dash-gross-income').textContent = formatINR(totalGrossIncome);
    document.getElementById('dash-income-count').textContent = `${incomeList.length} sources recorded`;

    document.getElementById('dash-total-deductions').textContent = formatINR(totalDeductions);
    document.getElementById('dash-deduction-count').textContent = `${deductionsList.length} deductions added`;

    // Taxable Incomes
    document.getElementById('dash-taxable-old').textContent = formatINR(taxData.taxable_income_old || 0);
    document.getElementById('dash-taxable-new').textContent = formatINR(taxData.taxable_income_new || 0);

    // Estimated Taxes
    const oldTax = taxData.net_tax_old || 0;
    const newTax = taxData.net_tax_new || 0;
    document.getElementById('dash-old-tax').textContent = formatINR(oldTax);
    document.getElementById('dash-new-tax').textContent = formatINR(newTax);

    // Regime Comparison Highlight
    const recBanner = document.getElementById('dash-recommendation-banner');
    const oldCard = document.getElementById('dash-old-regime-card');
    const newCard = document.getElementById('dash-new-regime-card');

    oldCard.classList.remove('recommended');
    newCard.classList.remove('recommended');
    const oldBadge = document.getElementById('dash-old-badge');
    const newBadge = document.getElementById('dash-new-badge');
    if (oldBadge) oldBadge.style.display = 'none';
    if (newBadge) newBadge.style.display = 'none';

    if (totalGrossIncome === 0) {
      recBanner.innerHTML = `<strong>No Income Records Found:</strong> Please add your income sources to generate accurate tax liabilities.`;
      recBanner.className = 'disclaimer-banner';
    } else if (newTax < oldTax) {
      const savings = oldTax - newTax;
      newCard.classList.add('recommended');
      if (newBadge) newBadge.style.display = 'inline-block';
      recBanner.innerHTML = `🎉 <strong>New Tax Regime Recommended:</strong> You save <strong>${formatINR(savings)}</strong> compared to the Old Regime!`;
      recBanner.className = 'disclaimer-banner';
      recBanner.style.background = 'var(--success-bg)';
      recBanner.style.borderColor = 'var(--success-border)';
      recBanner.style.color = 'var(--success)';
    } else if (oldTax < newTax) {
      const savings = newTax - oldTax;
      oldCard.classList.add('recommended');
      if (oldBadge) oldBadge.style.display = 'inline-block';
      recBanner.innerHTML = `🎉 <strong>Old Tax Regime Recommended:</strong> Your Chapter VI-A deductions save you <strong>${formatINR(savings)}</strong> compared to the New Regime!`;
      recBanner.className = 'disclaimer-banner';
      recBanner.style.background = 'var(--primary-light)';
      recBanner.style.borderColor = 'var(--primary-border)';
      recBanner.style.color = 'var(--primary)';
    } else {
      recBanner.innerHTML = `⚖️ <strong>Equal Liability:</strong> Both tax regimes result in identical tax of <strong>${formatINR(newTax)}</strong>.`;
      recBanner.className = 'disclaimer-banner';
    }

    // Detailed breakdown items
    document.getElementById('dash-old-std-ded').textContent = formatINR(taxData.std_ded_old || 50000);
    document.getElementById('dash-old-rebate').textContent = formatINR(taxData.rebate_87a_old || 0);
    document.getElementById('dash-old-cess').textContent = formatINR(taxData.cess_old || 0);

    document.getElementById('dash-new-std-ded').textContent = formatINR(taxData.std_ded_new || 75000);
    document.getElementById('dash-new-rebate').textContent = formatINR(taxData.rebate_87a_new || 0);
    document.getElementById('dash-new-cess').textContent = formatINR(taxData.cess_new || 0);

    // Income breakdown by Head
    renderIncomeBreakdown(incomeList, totalGrossIncome);

    // Document checklist progress
    document.getElementById('dash-doc-progress-text').textContent = `${completedDocs} of ${docList.length} Completed (${docProgress}%)`;
    document.getElementById('dash-doc-progress-bar').style.width = `${docProgress}%`;

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    showToast('Failed to load dashboard data: ' + err.message, 'danger');
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (dashboardContent) dashboardContent.style.opacity = '1';
  }
}

// Render dynamic visual bars for income categories
function renderIncomeBreakdown(incomeList, totalGross) {
  const container = document.getElementById('dash-income-bars');
  if (!container) return;

  const categories = {
    salary: { name: 'Income from Salary', color: '#2563eb', total: 0 },
    house_property: { name: 'House Property', color: '#0d9488', total: 0 },
    capital_gains: { name: 'Capital Gains', color: '#d97706', total: 0 },
    business: { name: 'Business / Profession', color: '#7c3aed', total: 0 },
    other: { name: 'Other Sources (Interest / Div)', color: '#db2777', total: 0 }
  };

  incomeList.forEach(item => {
    if (categories[item.category]) {
      categories[item.category].total += parseFloat(item.amount || 0);
    } else {
      categories.other.total += parseFloat(item.amount || 0);
    }
  });

  if (totalGross === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem 0;">
        <div class="empty-state-icon" style="width: 44px; height: 44px; margin-bottom: 0.5rem;">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </div>
        <div class="empty-state-title" style="font-size: 1rem;">No Income Entries Yet</div>
        <p class="empty-state-text" style="font-size: 0.85rem; margin-bottom: 1rem;">Add your salary, rental income, or interest to view your breakdown.</p>
        <a href="${typeof getPageUrl === 'function' ? getPageUrl('income') : 'income.html'}" class="btn btn-primary btn-sm">+ Add First Income Source</a>
      </div>
    `;
    return;
  }

  let html = '';
  Object.values(categories).forEach(cat => {
    if (cat.total > 0) {
      const pct = Math.round((cat.total / totalGross) * 100);
      html += `
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">
            <span>${cat.name}</span>
            <span>${formatINR(cat.total)} <span style="color: var(--gray-500); font-weight: normal;">(${pct}%)</span></span>
          </div>
          <div class="progress-bar-container" style="height: 10px;">
            <div class="progress-bar-fill" style="width: ${pct}%; background: ${cat.color};"></div>
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;
}

// React to global Financial Year changes
window.addEventListener('fy-changed', () => {
  loadDashboardData();
});

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});
