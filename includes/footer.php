<?php
// includes/footer.php
?>
  </div><!-- /main-wrapper -->
</div><!-- /app-wrapper -->

<!-- Global Toast Container -->
<div id="toast-container"></div>

<!-- Core Scripts -->
<script src="assets/js/api.js"></script>
<script>
  // Automatically verify session and populate header profile info
  document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
  });
</script>
</body>
</html>
