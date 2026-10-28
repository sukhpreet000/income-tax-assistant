<?php
// config/tax_rules.php
/**
 * Verified Indian Income Tax Rules & Slab Computation Engine
 * Supports FY 2024-25 (AY 2025-26 Budget 2024) & FY 2023-24 (AY 2024-25)
 */

class TaxEngine {

    /**
     * Compute comprehensive tax comparison for both regimes
     */
    public static function computeAll($grossIncome, $deductions = 0, $fy = '2024-2025', $ageGroup = 'general', $isSalaried = true) {
        $grossIncome = max(0, floatval($grossIncome));
        $deductions = max(0, floatval($deductions));
        $fy = in_array($fy, ['2023-2024', '2024-2025']) ? $fy : '2024-2025';

        // 1. Standard Deductions
        $stdDedOld = $isSalaried ? 50000 : 0;
        $stdDedNew = $isSalaried ? (($fy === '2024-2025') ? 75000 : 50000) : 0;

        // Ensure std deduction does not exceed gross income
        $stdDedOld = min($stdDedOld, $grossIncome);
        $stdDedNew = min($stdDedNew, $grossIncome);

        // 2. Compute Old Regime
        $taxableOld = max(0, $grossIncome - $stdDedOld - $deductions);
        $oldResult = self::computeOldRegime($taxableOld, $ageGroup);

        // 3. Compute New Regime
        $taxableNew = max(0, $grossIncome - $stdDedNew);
        $newResult = self::computeNewRegime($taxableNew, $fy);

        // Determine recommended regime
        $recRegime = ($newResult['net_tax'] < $oldResult['net_tax']) ? 'new' : (($oldResult['net_tax'] < $newResult['net_tax']) ? 'old' : 'equal');
        $taxSavings = abs($oldResult['net_tax'] - $newResult['net_tax']);

        return [
            'financial_year'         => $fy,
            'age_group'              => $ageGroup,
            'is_salaried'            => $isSalaried,
            'gross_income'           => $grossIncome,
            
            // Old Regime Details
            'std_ded_old'            => $stdDedOld,
            'deductions_applied_old' => $deductions,
            'taxable_income_old'     => $taxableOld,
            'base_tax_old'           => $oldResult['base_tax'],
            'rebate_87a_old'         => $oldResult['rebate_87a'],
            'tax_after_rebate_old'   => $oldResult['tax_after_rebate'],
            'surcharge_old'          => $oldResult['surcharge'],
            'cess_old'               => $oldResult['cess'],
            'net_tax_old'            => $oldResult['net_tax'],
            'slab_breakdown_old'     => $oldResult['slab_breakdown'],

            // New Regime Details
            'std_ded_new'            => $stdDedNew,
            'taxable_income_new'     => $taxableNew,
            'base_tax_new'           => $newResult['base_tax'],
            'rebate_87a_new'         => $newResult['rebate_87a'],
            'tax_after_rebate_new'   => $newResult['tax_after_rebate'],
            'surcharge_new'          => $newResult['surcharge'],
            'cess_new'               => $newResult['cess'],
            'net_tax_new'            => $newResult['net_tax'],
            'slab_breakdown_new'     => $newResult['slab_breakdown'],

            // Optimization
            'recommended_regime'     => $recRegime,
            'tax_savings'            => $taxSavings
        ];
    }

    /**
     * Compute Old Regime Tax with age-based basic exemption
     */
    public static function computeOldRegime($taxableIncome, $ageGroup = 'general') {
        $slabs = [];
        if ($ageGroup === 'super_senior') {
            // 80+ years: exemption up to 5 Lakhs
            $slabs = [
                ['from' => 0,       'to' => 500000,   'rate' => 0],
                ['from' => 500000,  'to' => 1000000,  'rate' => 20],
                ['from' => 1000000, 'to' => INF,      'rate' => 30]
            ];
        } elseif ($ageGroup === 'senior') {
            // 60-79 years: exemption up to 3 Lakhs
            $slabs = [
                ['from' => 0,       'to' => 300000,   'rate' => 0],
                ['from' => 300000,  'to' => 500000,   'rate' => 5],
                ['from' => 500000,  'to' => 1000000,  'rate' => 20],
                ['from' => 1000000, 'to' => INF,      'rate' => 30]
            ];
        } else {
            // General individual (< 60 yrs)
            $slabs = [
                ['from' => 0,       'to' => 250000,   'rate' => 0],
                ['from' => 250000,  'to' => 500000,   'rate' => 5],
                ['from' => 500000,  'to' => 1000000,  'rate' => 20],
                ['from' => 1000000, 'to' => INF,      'rate' => 30]
            ];
        }

        $calc = self::calculateSlabs($taxableIncome, $slabs);
        $baseTax = $calc['total_tax'];

        // Rebate u/s 87A: Available if taxable income <= 5,00,000 (Max 12,500)
        $rebate = 0;
        if ($taxableIncome <= 500000) {
            $rebate = min($baseTax, 12500);
        }

        $taxAfterRebate = max(0, $baseTax - $rebate);

        // Surcharge
        $surcharge = self::calculateSurcharge($taxAfterRebate, $taxableIncome);

        // Health & Education Cess @ 4%
        $cess = round(($taxAfterRebate + $surcharge) * 0.04);
        $netTax = round($taxAfterRebate + $surcharge + $cess);

        return [
            'base_tax'         => round($baseTax),
            'rebate_87a'       => round($rebate),
            'tax_after_rebate' => round($taxAfterRebate),
            'surcharge'        => round($surcharge),
            'cess'             => round($cess),
            'net_tax'          => round($netTax),
            'slab_breakdown'   => $calc['breakdown']
        ];
    }

    /**
     * Compute New Regime Tax
     */
    public static function computeNewRegime($taxableIncome, $fy = '2024-2025') {
        $slabs = [];
        $rebateThreshold = 700000;

        if ($fy === '2024-2025') {
            // Union Budget 2024 Revised Slabs
            $slabs = [
                ['from' => 0,       'to' => 300000,   'rate' => 0],
                ['from' => 300000,  'to' => 700000,   'rate' => 5],
                ['from' => 700000,  'to' => 1000000,  'rate' => 10],
                ['from' => 1000000, 'to' => 1200000,  'rate' => 15],
                ['from' => 1200000, 'to' => 1500000,  'rate' => 20],
                ['from' => 1500000, 'to' => INF,      'rate' => 30]
            ];
        } else {
            // FY 2023-2024 Slabs
            $slabs = [
                ['from' => 0,       'to' => 300000,   'rate' => 0],
                ['from' => 300000,  'to' => 600000,   'rate' => 5],
                ['from' => 600000,  'to' => 900000,   'rate' => 10],
                ['from' => 900000,  'to' => 1200000,  'rate' => 15],
                ['from' => 1200000, 'to' => 1500000,  'rate' => 20],
                ['from' => 1500000, 'to' => INF,      'rate' => 30]
            ];
        }

        $calc = self::calculateSlabs($taxableIncome, $slabs);
        $baseTax = $calc['total_tax'];

        // Rebate u/s 87A: Full rebate if taxable income <= 7,00,000
        $rebate = 0;
        if ($taxableIncome <= $rebateThreshold) {
            $rebate = $baseTax;
        }

        $taxAfterRebate = max(0, $baseTax - $rebate);

        // Marginal Relief u/s 87A: If taxable income marginally exceeds 7L
        if ($taxableIncome > $rebateThreshold && $taxAfterRebate > 0) {
            $excessIncome = $taxableIncome - $rebateThreshold;
            if ($taxAfterRebate > $excessIncome) {
                // Marginal relief caps the tax payable to the excess income!
                $taxAfterRebate = $excessIncome;
            }
        }

        // Surcharge under New Regime (capped at 25% max)
        $surcharge = self::calculateSurcharge($taxAfterRebate, $taxableIncome, true);

        // Cess @ 4%
        $cess = round(($taxAfterRebate + $surcharge) * 0.04);
        $netTax = round($taxAfterRebate + $surcharge + $cess);

        return [
            'base_tax'         => round($baseTax),
            'rebate_87a'       => round($rebate),
            'tax_after_rebate' => round($taxAfterRebate),
            'surcharge'        => round($surcharge),
            'cess'             => round($cess),
            'net_tax'          => round($netTax),
            'slab_breakdown'   => $calc['breakdown']
        ];
    }

    /**
     * Slab-by-slab breakdown helper
     */
    private static function calculateSlabs($income, $slabs) {
        $totalTax = 0;
        $breakdown = [];

        foreach ($slabs as $s) {
            if ($income > $s['from']) {
                $slabRange = ($s['to'] === INF) ? "Above ₹" . number_format($s['from']) : "₹" . number_format($s['from']) . " - ₹" . number_format($s['to']);
                $taxableInSlab = min($income - $s['from'], ($s['to'] === INF ? $income : $s['to']) - $s['from']);
                $taxInSlab = ($taxableInSlab * $s['rate']) / 100;

                $totalTax += $taxInSlab;
                $breakdown[] = [
                    'range'           => $slabRange,
                    'rate'            => $s['rate'],
                    'taxable_in_slab' => round($taxableInSlab),
                    'tax'             => round($taxInSlab)
                ];
            }
        }

        return [
            'total_tax' => $totalTax,
            'breakdown' => $breakdown
        ];
    }

    /**
     * Surcharge helper
     */
    private static function calculateSurcharge($tax, $taxableIncome, $isNewRegime = false) {
        if ($taxableIncome <= 5000000) return 0;

        if ($taxableIncome > 5000000 && $taxableIncome <= 10000000) {
            return $tax * 0.10; // 10%
        } elseif ($taxableIncome > 10000000 && $taxableIncome <= 20000000) {
            return $tax * 0.15; // 15%
        } elseif ($taxableIncome > 20000000) {
            if ($isNewRegime) {
                return $tax * 0.25; // Capped at 25% under New Regime
            } else {
                return ($taxableIncome > 50000000) ? ($tax * 0.37) : ($tax * 0.25);
            }
        }
        return 0;
    }
}
