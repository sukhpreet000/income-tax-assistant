<?php
// includes/sidebar.php
$activePage = isset($activePage) ? $activePage : '';
?>
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <a href="dashboard.php" class="sidebar-brand">
      <div class="sidebar-brand-icon">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z"/></svg>
      </div>
      <span>TaxAssist</span>
    </a>
  </div>

  <ul class="sidebar-menu">
    <li class="sidebar-heading">Main Navigation</li>
    <li class="sidebar-item">
      <a href="dashboard.php" class="sidebar-link <?php echo ($activePage === 'dashboard') ? 'active' : ''; ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        <span>Dashboard</span>
      </a>
    </li>

    <li class="sidebar-heading">Tax Planning</li>
    <li class="sidebar-item">
      <a href="income.php" class="sidebar-link <?php echo ($activePage === 'income') ? 'active' : ''; ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
        <span>Income Sources</span>
      </a>
    </li>

    <li class="sidebar-item">
      <a href="deductions.php" class="sidebar-link <?php echo ($activePage === 'deductions') ? 'active' : ''; ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
        <span>Deductions (80C/80D)</span>
      </a>
    </li>

    <li class="sidebar-item">
      <a href="calculator.php" class="sidebar-link <?php echo ($activePage === 'calculator') ? 'active' : ''; ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
        <span>Tax Calculator</span>
      </a>
    </li>

    <li class="sidebar-heading">Compliance</li>
    <li class="sidebar-item">
      <a href="checklist.php" class="sidebar-link <?php echo ($activePage === 'checklist') ? 'active' : ''; ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        <span>Document Checklist</span>
      </a>
    </li>

    <li class="sidebar-item">
      <a href="history.php" class="sidebar-link <?php echo ($activePage === 'history') ? 'active' : ''; ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
        <span>Calculation History</span>
      </a>
    </li>

    <li class="sidebar-heading">Account</li>
    <li class="sidebar-item">
      <a href="profile.php" class="sidebar-link <?php echo ($activePage === 'profile') ? 'active' : ''; ?>">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        <span>My Profile</span>
      </a>
    </li>

    <li class="sidebar-item">
      <a href="#" onclick="handleLogout(); return false;" class="sidebar-link" style="color: #ef4444;">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
        <span>Sign Out</span>
      </a>
    </li>
  </ul>

  <div class="sidebar-footer">
    <div class="user-snippet">
      <div class="user-avatar js-user-initial">U</div>
      <div class="user-details">
        <div class="user-name js-user-name">Loading...</div>
        <div class="user-role js-user-email">Taxpayer</div>
      </div>
    </div>
  </div>
</aside>
