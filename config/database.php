<?php
// config/database.php
/**
 * Database Connection Configuration (MySQL / PDO)
 * Default credentials configured for standard XAMPP environment.
 */

define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'tax_assistant');
define('DB_USER', 'root');
define('DB_PASS', '');

function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // If database does not exist, attempt to auto-create database & tables
        if ($e->getCode() == 1049 || strpos($e->getMessage(), 'Unknown database') !== false) {
            try {
                $rootDsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
                $rootPdo = new PDO($rootDsn, DB_USER, DB_PASS, $options);
                $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                
                // Connect to newly created database
                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                
                // Initialize schema if database.sql exists
                $sqlFile = dirname(__DIR__) . '/database.sql';
                if (file_exists($sqlFile)) {
                    $sql = file_get_contents($sqlFile);
                    $pdo->exec($sql);
                }
                return $pdo;
            } catch (Exception $initEx) {
                error_log("Database initialization error: " . $initEx->getMessage());
                throw new Exception("Unable to auto-initialize database: " . $initEx->getMessage());
            }
        }
        
        error_log("Database Connection Error: " . $e->getMessage());
        throw new Exception("Database connection failed. Ensure MySQL is running in XAMPP. Error: " . $e->getMessage());
    }
}
