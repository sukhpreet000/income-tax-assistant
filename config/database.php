<?php
// config/database.php
/**
 * Database Connection Configuration (MySQL / PDO)
 * Supports local XAMPP environment and cloud MySQL on Vercel / Railway / TiDB / Aiven.
 */

if (!defined('DB_HOST')) {
    define('DB_HOST', getenv('DB_HOST') ?: (getenv('MYSQLHOST') ?: '127.0.0.1'));
}
if (!defined('DB_PORT')) {
    define('DB_PORT', getenv('DB_PORT') ?: (getenv('MYSQLPORT') ?: '3306'));
}
if (!defined('DB_NAME')) {
    define('DB_NAME', getenv('DB_NAME') ?: (getenv('MYSQLDATABASE') ?: 'tax_assistant'));
}
if (!defined('DB_USER')) {
    define('DB_USER', getenv('DB_USER') ?: (getenv('MYSQLUSER') ?: 'root'));
}
if (!defined('DB_PASS')) {
    define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : (getenv('MYSQLPASSWORD') !== false ? getenv('MYSQLPASSWORD') : ''));
}

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
        PDO::ATTR_TIMEOUT            => 3,
    ];

    // Enable SSL if specified in environment (common for cloud DBs like Aiven, TiDB, PlanetScale)
    if (getenv('DB_SSL') || getenv('MYSQL_SSL') || getenv('MYSQL_ATTR_SSL_CA')) {
        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
    }

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // If database does not exist, attempt to auto-create database & tables (for local XAMPP)
        if (($e->getCode() == 1049 || strpos($e->getMessage(), 'Unknown database') !== false) && (DB_HOST === '127.0.0.1' || DB_HOST === 'localhost')) {
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
                error_log("Database auto-initialization error: " . $initEx->getMessage());
                throw new Exception("Unable to auto-initialize database: " . $initEx->getMessage());
            }
        }
        
        error_log("Database Connection Error: " . $e->getMessage());
        throw new Exception("Database connection failed. Ensure MySQL is running in XAMPP or configure cloud DB variables. Error: " . $e->getMessage());
    }
}
