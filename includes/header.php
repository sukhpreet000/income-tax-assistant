<?php
// includes/header.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$pageTitle = isset($pageTitle) ? $pageTitle . " - Income Tax Filing Assistant" : "Income Tax Filing Assistant";
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo htmlspecialchars($pageTitle); ?></title>
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/dashboard.css">
</head>
<body>
<div class="app-wrapper">
