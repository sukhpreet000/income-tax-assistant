<?php
// api/calculator.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/auth_check.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/tax_rules.php';

$action = $_GET['action'] ?? 'compute';

try {
    switch ($action) {
        case 'compute':
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            $grossIncome = floatval($input['gross_income'] ?? 0);
            $deductions = floatval($input['deductions'] ?? 0);
            $fy = trim($input['financial_year'] ?? '2024-2025');
            $ageGroup = trim($input['age_group'] ?? 'general');
            $isSalaried = isset($input['is_salaried']) ? (bool)$input['is_salaried'] : true;

            $result = TaxEngine::computeAll($grossIncome, $deductions, $fy, $ageGroup, $isSalaried);

            echo json_encode([
                'success' => true,
                'data' => $result
            ]);
            break;

        case 'save':
            $userId = requireAuthApi();
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

            $fy = trim($input['financial_year'] ?? '2024-2025');
            $gross = floatval($input['gross_income'] ?? 0);
            $dedOld = floatval($input['deductions_applied_old'] ?? 0) + floatval($input['std_ded_old'] ?? 0);
            $dedNew = floatval($input['std_ded_new'] ?? 0);
            $taxableOld = floatval($input['taxable_income_old'] ?? 0);
            $taxableNew = floatval($input['taxable_income_new'] ?? 0);
            $netTaxOld = floatval($input['net_tax_old'] ?? 0);
            $netTaxNew = floatval($input['net_tax_new'] ?? 0);
            $recommended = trim($input['recommended_regime'] ?? 'new');
            $detailsJson = json_encode($input);

            $db = getDbConnection();
            $stmt = $db->prepare("
                INSERT INTO tax_calculations (
                    user_id, financial_year, gross_income, total_deductions_old, total_deductions_new,
                    taxable_income_old, taxable_income_new, net_tax_old, net_tax_new, recommended_regime, calculation_details
                ) VALUES (
                    :uid, :fy, :gross, :ded_old, :ded_new,
                    :taxable_old, :taxable_new, :net_old, :net_new, :rec, :details
                )
            ");
            $stmt->execute([
                ':uid'         => $userId,
                ':fy'          => $fy,
                ':gross'       => $gross,
                ':ded_old'     => $dedOld,
                ':ded_new'     => $dedNew,
                ':taxable_old' => $taxableOld,
                ':taxable_new' => $taxableNew,
                ':net_old'     => $netTaxOld,
                ':net_new'     => $netTaxNew,
                ':rec'         => $recommended,
                ':details'     => $detailsJson
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Calculation saved to history successfully',
                'id' => (int)$db->lastInsertId()
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid calculator action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
