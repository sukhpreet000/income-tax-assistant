<?php
// includes/topbar.php
$topbarTitle = isset($topbarTitle) ? $topbarTitle : 'Dashboard';
?>
<header class="topbar">
  <div class="topbar-left">
    <button type="button" class="mobile-sidebar-toggle" id="mobile-sidebar-toggle" aria-label="Toggle Navigation">
      <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
    </button>
    <h1 class="topbar-title"><?php echo htmlspecialchars($topbarTitle); ?></h1>
  </div>

  <div class="topbar-right">
    <!-- Financial Year Switcher -->
    <div class="fy-badge-selector">
      <label for="global-fy-selector">F.Y.</label>
      <select id="global-fy-selector" class="fy-select" title="Change Active Financial Year">
        <option value="2024-2025">2024-25 (AY 2025-26)</option>
        <option value="2023-2024">2023-24 (AY 2024-25)</option>
      </select>
    </div>

    <!-- Quick Action Button -->
    <div style="display: flex; gap: 0.5rem;">
      <a href="calculator.php" class="btn btn-outline-primary btn-sm" title="Compute Tax">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
        <span>Tax Calc</span>
      </a>
      <a href="profile.php" class="btn btn-secondary btn-sm js-user-name" title="Manage Profile">Profile</a>
    </div>
  </div>
</header>
