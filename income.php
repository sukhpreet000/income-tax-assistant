<?php
// income.php
require_once __DIR__ . '/includes/auth_check.php';
requireAuthPage();

$pageTitle = "Income Details Management";
$topbarTitle = "Income Sources";
$activePage = "income";

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <main class="content-body">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Income Sources & Head Management</h2>
        <p class="page-subtitle">Record and categorize all heads of income for statutory tax liability computation.</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="exportIncomeCSV()">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          Export CSV
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="openAddIncomeModal()">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          + Add Income
        </button>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white;">
      <div class="card-body" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #bfdbfe;">Total Gross Income for Selected Year</span>
          <div id="income-total-amount" style="font-size: 2.25rem; font-weight: 800; color: #ffffff; line-height: 1.2;">₹0</div>
        </div>
        <div style="text-align: right;">
          <span class="badge" style="background: rgba(255, 255, 255, 0.2); color: white; font-size: 0.85rem; padding: 0.4rem 0.8rem;">
            <span id="income-total-count">0</span> Entries Recorded
          </span>
        </div>
      </div>
    </div>

    <!-- Income Table Card -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Recorded Income Items</h3>
        <span class="text-muted" style="font-size: 0.85rem;">Values used directly in Old & New Regime tax calculation</span>
      </div>
      <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Statutory Category</th>
                <th>Subcategory & Description</th>
                <th>F.Y.</th>
                <th class="text-right">Gross Amount</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="income-table-body">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>

  <!-- Add / Edit Income Modal -->
  <div class="modal-overlay" id="income-modal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title" id="income-modal-title">Add Income Entry</h3>
        <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
      </div>
      <form id="income-form" onsubmit="handleIncomeFormSubmit(event)">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="income-category">Income Head / Category <span class="required">*</span></label>
            <select id="income-category" class="form-select" required>
              <option value="salary">Income from Salary (Basic, HRA, Allowances)</option>
              <option value="house_property">Income from House Property (Rental)</option>
              <option value="capital_gains">Capital Gains (STCG / LTCG on Stocks, Mutual Funds, Property)</option>
              <option value="business">Profits & Gains of Business or Profession (PGBP / Freelancing)</option>
              <option value="other">Income from Other Sources (Interest, Dividends, Family Pension)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="income-subcategory">Subcategory / Component <span class="required">*</span></label>
            <input type="text" id="income-subcategory" class="form-control" list="subcategory-suggestions" placeholder="e.g. Basic Salary, Annual Bonus, Rental Income" required>
            <datalist id="subcategory-suggestions"></datalist>
          </div>

          <div class="grid grid-cols-2" style="gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="income-amount">Amount (₹) <span class="required">*</span></label>
              <div class="input-group">
                <span class="input-prefix">₹</span>
                <input type="number" id="income-amount" class="form-control" placeholder="0" min="1" step="100" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="income-fy">Financial Year <span class="required">*</span></label>
              <select id="income-fy" class="form-select" required>
                <option value="2024-2025">FY 2024-25 (AY 2025-26)</option>
                <option value="2023-2024">FY 2023-24 (AY 2024-25)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="income-desc">Description / Employer / Notes (Optional)</label>
            <textarea id="income-desc" class="form-control" rows="2" placeholder="e.g. ABC Technologies Pvt Ltd, HDFC Savings Account"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="income-save-btn">Save Income Entry</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div class="modal-overlay" id="income-delete-modal">
    <div class="modal-dialog" style="max-width: 440px;">
      <div class="modal-header">
        <h3 class="modal-title">Delete Income Record</h3>
        <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
      </div>
      <div class="modal-body">
        <p style="margin: 0; color: var(--gray-700);">
          Are you sure you want to delete this income entry? This will adjust your total gross income and tax calculation estimates.
        </p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-danger" onclick="executeDeleteIncome()">Delete Record</button>
      </div>
    </div>
  </div>

<script src="assets/js/income.js"></script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
