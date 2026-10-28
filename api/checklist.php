<?php
// api/checklist.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../config/database.php';

$userId = requireAuthApi();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $db = getDbConnection();

    if ($method === 'GET') {
        $fy = $_GET['fy'] ?? '2024-2025';
        $stmt = $db->prepare("
            SELECT id, financial_year, doc_name, status, notes, created_at 
            FROM documents 
            WHERE user_id = :uid AND financial_year = :fy 
            ORDER BY id ASC
        ");
        $stmt->execute([':uid' => $userId, ':fy' => $fy]);
        $items = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $items
        ]);
        exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

        if ($action === 'update_status') {
            $id = (int)($input['id'] ?? 0);
            $status = trim($input['status'] ?? 'pending');
            $allowed = ['pending', 'uploaded', 'verified', 'na'];

            if ($id <= 0 || !in_array($status, $allowed)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid document ID or status.']);
                exit;
            }

            $stmt = $db->prepare("UPDATE documents SET status = :status WHERE id = :id AND user_id = :uid");
            $stmt->execute([':status' => $status, ':id' => $id, ':uid' => $userId]);

            echo json_encode(['success' => true, 'message' => 'Status updated successfully.']);
            exit;
        }

        if ($action === 'update_note') {
            $id = (int)($input['id'] ?? 0);
            $notes = trim($input['notes'] ?? '');

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid document ID.']);
                exit;
            }

            $stmt = $db->prepare("UPDATE documents SET notes = :notes WHERE id = :id AND user_id = :uid");
            $stmt->execute([':notes' => $notes, ':id' => $id, ':uid' => $userId]);

            echo json_encode(['success' => true, 'message' => 'Note updated successfully.']);
            exit;
        }

        if ($action === 'create') {
            $docName = trim($input['doc_name'] ?? '');
            $notes = trim($input['notes'] ?? '');
            $fy = trim($input['financial_year'] ?? '2024-2025');

            if (empty($docName)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Document name is required.']);
                exit;
            }

            $stmt = $db->prepare("
                INSERT INTO documents (user_id, financial_year, doc_name, status, notes) 
                VALUES (:uid, :fy, :name, 'pending', :notes)
            ");
            $stmt->execute([
                ':uid'   => $userId,
                ':fy'    => $fy,
                ':name'  => $docName,
                ':notes' => $notes
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Document added to checklist',
                'id' => (int)$db->lastInsertId()
            ]);
            exit;
        }

        if ($action === 'seed_defaults') {
            $fy = trim($input['financial_year'] ?? '2024-2025');

            // Delete existing documents for this year to prevent duplicates
            $del = $db->prepare("DELETE FROM documents WHERE user_id = :uid AND financial_year = :fy");
            $del->execute([':uid' => $userId, ':fy' => $fy]);

            $standardDocs = [
                ['Form 16 (Part A & Part B)', 'Employer salary certificate with TDS deduction details'],
                ['Form 26AS & AIS / TIS Statement', 'Comprehensive tax passbook downloaded from TRACES / e-Filing portal'],
                ['PAN & Aadhaar Linkage Status', 'Mandatory for processing Income Tax Returns'],
                ['Bank Account Statements & Interest Certificates', 'Savings account and Term Deposit certificates for Sec 80TTA/80TTB'],
                ['Housing Loan Certificate (Interest & Principal)', 'Issued by bank/HFC indicating interest under Sec 24b and principal under 80C'],
                ['Section 80D Medical Insurance Receipts', 'Health insurance premium payment receipts for family & senior parents'],
                ['Section 80C Investment Receipts (PPF, ELSS, LIC)', 'Mutual fund tax saving statements, PPF passbook, life insurance receipts'],
                ['Capital Gains Statement / Broker Ledger', 'Annual capital gains summary from stockbroker/mutual fund registrar'],
                ['Rent Receipts & Landlord PAN Details', 'Required for claiming House Rent Allowance (HRA) exemption under Old Regime']
            ];

            $ins = $db->prepare("INSERT INTO documents (user_id, financial_year, doc_name, status, notes) VALUES (:uid, :fy, :name, 'pending', :notes)");
            foreach ($standardDocs as $d) {
                $ins->execute([
                    ':uid'   => $userId,
                    ':fy'    => $fy,
                    ':name'  => $d[0],
                    ':notes' => $d[1]
                ]);
            }

            echo json_encode(['success' => true, 'message' => 'Standard tax checklist reset successfully.']);
            exit;
        }
    }

    if ($method === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Valid document ID required.']);
            exit;
        }

        $stmt = $db->prepare("DELETE FROM documents WHERE id = :id AND user_id = :uid");
        $stmt->execute([':id' => $id, ':uid' => $userId]);

        echo json_encode(['success' => true, 'message' => 'Document item removed.']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
