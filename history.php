<?php
// history.php
require_once __DIR__ . '/includes/auth_check.php';
requireAuthPage();

$pageTitle = "Tax Calculation History";
$topbarTitle = "Calculation Records";
$activePage = "history";

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <main class="content-body">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Tax Calculation History</h2>
        <p class="page-subtitle">Review previously computed tax liabilities, comparative regime analyses, and printable statements.</p>
      </div>
      <div class="page-actions">
        <a href="calculator.php" class="btn btn-primary btn-sm">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Calculation
        </a>
      </div>
    </div>

    <!-- History Table Card -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Saved Tax Snapshots</h3>
        <span class="badge badge-neutral" style="font-size: 0.85rem;"><span id="history-count">0</span> Saved Computations</span>
      </div>
      <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Date / Assessment Year</th>
                <th>Gross Income</th>
                <th>Deductions (Old)</th>
                <th>Old Regime Tax</th>
                <th>New Regime Tax</th>
                <th>Optimal Selection</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="history-table-body">
              <!-- Populated via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>

  <!-- Detailed Computation Sheet Modal (Printable) -->
  <div class="modal-overlay" id="computation-sheet-modal">
    <div class="modal-dialog modal-lg">
      <div class="modal-header">
        <h3 class="modal-title">Tax Computation Statement</h3>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button type="button" class="btn btn-primary btn-sm" onclick="printCurrentSheet()">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
            Print Statement
          </button>
          <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
        </div>
      </div>
      <div class="modal-body" id="printable-statement-content">
        <!-- Official Tax Computation Statement Header -->
        <div style="text-align: center; border-bottom: 2px solid var(--gray-300); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.4rem; color: var(--primary); margin-bottom: 0.25rem;">INCOME TAX ESTIMATION & REGIME COMPARISON SHEET</h2>
          <div style="font-size: 0.85rem; color: var(--gray-600);">Academic Demonstration Statement &bull; Income Tax Act, 1961</div>
          <div style="display: flex; justify-content: space-between; margin-top: 1rem; font-size: 0.85rem;">
            <div><strong>Taxpayer:</strong> <span class="js-user-name">-</span></div>
            <div><strong>Financial Year:</strong> <span id="sheet-fy">-</span></div>
            <div><strong>Generated On:</strong> <span id="sheet-date">-</span></div>
          </div>
        </div>

        <div id="sheet-winner-banner" class="disclaimer-banner" style="background: var(--success-bg); border-color: var(--success-border); color: var(--success); margin-bottom: 1.5rem;">
          Comparison Result
        </div>

        <!-- Comparative Table -->
        <div class="table-responsive">
          <table class="table" style="border: 1px solid var(--gray-300);">
            <thead>
              <tr style="background: var(--gray-100);">
                <th>Particulars</th>
                <th class="text-right">Old Tax Regime (₹)</th>
                <th class="text-right">New Tax Regime (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Gross Total Income (All Heads)</strong></td>
                <td class="text-right font-bold" id="sheet-gross">₹0</td>
                <td class="text-right font-bold" id="sheet-gross">₹0</td>
              </tr>
              <tr>
                <td>Less: Standard Deduction & Deductions</td>
                <td class="text-right text-success" id="sheet-old-ded">₹0</td>
                <td class="text-right text-success" id="sheet-new-ded">₹0</td>
              </tr>
              <tr style="background: var(--gray-50);">
                <td><strong>Net Taxable Income</strong></td>
                <td class="text-right font-bold" id="sheet-old-taxable">₹0</td>
                <td class="text-right font-bold" id="sheet-new-taxable">₹0</td>
              </tr>
              <tr style="background: #eff6ff; font-size: 1.05rem;">
                <td><strong>Total Income Tax Payable (inc. 4% Cess)</strong></td>
                <td class="text-right font-bold text-primary" id="sheet-old-tax">₹0</td>
                <td class="text-right font-bold text-success" id="sheet-new-tax">₹0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--gray-500); text-align: center; border-top: 1px dashed var(--gray-300); padding-top: 1rem;">
          * Note: Computed under applicable slab rates and rebate provisions of Section 87A of the Income Tax Act. This document is a non-statutory college project simulation.
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>

<script src="assets/js/history.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
