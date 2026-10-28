<?php
// dashboard.php
require_once __DIR__ . '/includes/auth_check.php';
requireAuthPage();

$pageTitle = "Taxpayer Dashboard";
$topbarTitle = "Financial Overview";
$activePage = "dashboard";

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <main class="content-body">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Tax Computation Dashboard</h2>
        <p class="page-subtitle">Track your income sources, deductions, and compare tax liability under both regimes.</p>
      </div>
      <div class="page-actions">
        <a href="income.php" class="btn btn-secondary btn-sm">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Add Income
        </a>
        <a href="deductions.php" class="btn btn-secondary btn-sm">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Add Deduction
        </a>
        <a href="calculator.php" class="btn btn-primary btn-sm">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          Full Calculator
        </a>
      </div>
    </div>

    <!-- Statutory Disclaimer -->
    <div class="disclaimer-banner">
      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>
      <div>
        <strong>College Demonstration Notice:</strong>
        This software provides verified tax estimates under Indian Income Tax Act rules (FY 2024-25 & FY 2023-24). It is intended for educational purposes and does not file directly with the Income Tax e-Filing portal.
      </div>
    </div>

    <!-- Recommendation Banner (Populated via JS) -->
    <div id="dash-recommendation-banner" class="disclaimer-banner" style="background: var(--primary-light); border-color: var(--primary-border); color: var(--primary);">
      Calculating optimal tax regime...
    </div>

    <!-- Loading Spinner Indicator -->
    <div id="dashboard-loading" style="text-align: center; padding: 2rem 0; display: none;">
      <div class="spinner spinner-primary" style="width: 32px; height: 32px;"></div>
      <p style="margin-top: 0.5rem; color: var(--gray-500); font-size: 0.9rem;">Synchronizing financial records...</p>
    </div>

    <div id="dashboard-content">
      <!-- 4 Top Metric Cards -->
      <div class="grid grid-cols-4" style="margin-bottom: 2rem;">
        <!-- Gross Total Income -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Gross Total Income</span>
            <div class="stat-icon primary">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
            </div>
          </div>
          <div class="stat-value" id="dash-gross-income">₹0</div>
          <div class="stat-footer">
            <span id="dash-income-count">0 sources recorded</span>
          </div>
        </div>

        <!-- Total Deductions -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Total Deductions</span>
            <div class="stat-icon success">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
            </div>
          </div>
          <div class="stat-value text-success" id="dash-total-deductions">₹0</div>
          <div class="stat-footer">
            <span id="dash-deduction-count">0 deductions added</span>
          </div>
        </div>

        <!-- Taxable Income -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Taxable Income</span>
            <div class="stat-icon warning">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
            </div>
          </div>
          <div class="stat-value" id="dash-taxable-new">₹0</div>
          <div class="stat-footer">
            <span>Old: <strong id="dash-taxable-old">₹0</strong></span>
          </div>
        </div>

        <!-- Best Estimated Tax -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Est. Tax (New Regime)</span>
            <div class="stat-icon accent">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
          </div>
          <div class="stat-value text-primary" id="dash-new-tax">₹0</div>
          <div class="stat-footer">
            <span>Old Regime: <strong id="dash-old-tax">₹0</strong></span>
          </div>
        </div>
      </div>

      <!-- Regime Comparison Side by Side -->
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="margin: 0;">Old vs. New Tax Regime Side-by-Side</h3>
          <a href="calculator.php" class="btn btn-outline-primary btn-sm">Open Interactive Slab Calculator &rarr;</a>
        </div>

        <div class="grid grid-cols-2">
          <!-- New Regime Card -->
          <div class="regime-card" id="dash-new-regime-card">
            <span class="regime-card-badge" id="dash-new-badge" style="display: none;">Recommended</span>
            <div class="regime-title">New Tax Regime</div>
            <p class="regime-description">Lower tax slabs with Standard Deduction (₹75,000 for FY 24-25). Full rebate u/s 87A up to ₹7,00,000.</p>
            <div class="regime-tax-total text-success" id="dash-new-tax-display">₹0</div>

            <ul class="regime-details-list">
              <li class="regime-details-item">
                <span>Standard Deduction:</span>
                <span class="font-semibold" id="dash-new-std-ded">₹75,000</span>
              </li>
              <li class="regime-details-item">
                <span>Chapter VI-A Deductions:</span>
                <span class="text-muted">Not Applicable</span>
              </li>
              <li class="regime-details-item">
                <span>Section 87A Rebate:</span>
                <span class="text-success font-semibold" id="dash-new-rebate">₹0</span>
              </li>
              <li class="regime-details-item">
                <span>Health & Education Cess (4%):</span>
                <span id="dash-new-cess">₹0</span>
              </li>
              <li class="regime-details-item strong">
                <span>Net Tax Liability:</span>
                <span class="text-success" id="dash-new-tax-bottom">₹0</span>
              </li>
            </ul>
          </div>

          <!-- Old Regime Card -->
          <div class="regime-card" id="dash-old-regime-card">
            <span class="regime-card-badge" id="dash-old-badge" style="display: none;">Recommended</span>
            <div class="regime-title">Old Tax Regime</div>
            <p class="regime-description">Higher tax slabs but allows deductions under 80C, 80D, NPS, Home loan interest, HRA, etc.</p>
            <div class="regime-tax-total text-primary" id="dash-old-tax-display">₹0</div>

            <ul class="regime-details-list">
              <li class="regime-details-item">
                <span>Standard Deduction:</span>
                <span class="font-semibold" id="dash-old-std-ded">₹50,000</span>
              </li>
              <li class="regime-details-item">
                <span>Chapter VI-A Deductions:</span>
                <span class="text-success font-semibold" id="dash-old-deductions-applied">Applied</span>
              </li>
              <li class="regime-details-item">
                <span>Section 87A Rebate (up to 5L):</span>
                <span class="text-success font-semibold" id="dash-old-rebate">₹0</span>
              </li>
              <li class="regime-details-item">
                <span>Health & Education Cess (4%):</span>
                <span id="dash-old-cess">₹0</span>
              </li>
              <li class="regime-details-item strong">
                <span>Net Tax Liability:</span>
                <span class="text-primary" id="dash-old-tax-bottom">₹0</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Two Column Layout: Income Breakdown & Filing Checklist -->
      <div class="grid grid-cols-2" style="margin-bottom: 2rem;">
        <!-- Left: Income Breakdown by Head -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Income Sources Distribution</h3>
              <p class="card-subtitle">Visual split of gross earnings across statutory heads</p>
            </div>
            <a href="income.php" class="btn btn-outline-primary btn-sm">Manage</a>
          </div>
          <div class="card-body" id="dash-income-bars">
            <!-- Dynamic Income Progress Bars Rendered via JS -->
          </div>
        </div>

        <!-- Right: Filing Checklist Status -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Document Filing Readiness</h3>
              <p class="card-subtitle">Essential forms and certificates for ITR verification</p>
            </div>
            <a href="checklist.php" class="btn btn-outline-primary btn-sm">Full Checklist</a>
          </div>
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">
              <span>Readiness Progress</span>
              <span id="dash-doc-progress-text">0 of 0 Completed (0%)</span>
            </div>
            <div class="progress-bar-container" style="height: 12px; margin-bottom: 1.5rem;">
              <div class="progress-bar-fill" id="dash-doc-progress-bar" style="width: 0%;"></div>
            </div>

            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem;">
              <li style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; padding: 0.5rem 0.75rem; background: var(--gray-50); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-weight: 600;">Form 16</span>
                  <span class="text-muted" style="font-size: 0.8rem;">(TDS by Employer)</span>
                </div>
                <a href="checklist.php" class="badge badge-info">View in Checklist</a>
              </li>
              <li style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; padding: 0.5rem 0.75rem; background: var(--gray-50); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-weight: 600;">Form 26AS & AIS / TIS</span>
                  <span class="text-muted" style="font-size: 0.8rem;">(Tax Credit Statement)</span>
                </div>
                <a href="checklist.php" class="badge badge-info">View in Checklist</a>
              </li>
              <li style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; padding: 0.5rem 0.75rem; background: var(--gray-50); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-weight: 600;">Investment Proofs</span>
                  <span class="text-muted" style="font-size: 0.8rem;">(80C, 80D receipts)</span>
                </div>
                <a href="checklist.php" class="badge badge-info">View in Checklist</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>

<script src="assets/js/dashboard.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
