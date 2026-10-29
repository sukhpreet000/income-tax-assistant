/**
 * Income Tax Filing Assistant - Core API & UI Helpers
 * Hybrid Architecture: Connects to PHP/MySQL backend when available,
 * and automatically provides full offline/client-side storage on Vercel / GitHub Pages.
 */

const API_BASE = 'api';

// Currency Formatter for Indian Rupees (Lakhs and Crores)
function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

// Format numbers without currency symbol
function formatNumber(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

// Dynamic page URL helper (handles both .html and .php depending on environment)
function getPageUrl(pageName) {
  if (window.location.pathname.endsWith('.php')) {
    return pageName + '.php';
  }
  return pageName + '.html';
}

// Toast Notification Manager
function showToast(message, type = 'info', title = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconMap = {
    success: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>',
    danger:  '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/></svg>',
    warning: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>',
    info:    '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/></svg>'
  };

  const defaultTitles = {
    success: 'Success',
    danger: 'Error',
    warning: 'Notice',
    info: 'Information'
  };

  toast.innerHTML = `
    <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title || defaultTitles[type]}</div>
      <div>${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 4500);
}

// -------------------------------------------------------------
// Client-Side Tax & Mock Storage Engine (Fallback for Vercel/Static)
// -------------------------------------------------------------
const ClientTaxStore = {
  getStorage(key, defaultVal) {
    try {
      const data = localStorage.getItem('tax_' + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  },

  setStorage(key, val) {
    try {
      localStorage.setItem('tax_' + key, JSON.stringify(val));
    } catch (e) {}
  },

  initDefaults() {
    if (!localStorage.getItem('tax_seeded_v1')) {
      // Default demo user
      const demoUser = {
        id: 1,
        name: 'Demo Taxpayer',
        email: 'demo@taxassistant.local',
        pan_number: 'ABCDE1234F',
        dob: '1992-08-15',
        phone: '+91 98765 43210',
        default_fy: '2024-2025'
      };
      this.setStorage('users', [demoUser]);
      this.setStorage('active_user', demoUser);

      // Default sample incomes
      this.setStorage('income', [
        { id: 1, financial_year: '2024-2025', category: 'Salary', subcategory: 'Basic + HRA + Special Allowance', amount: 950000, description: 'Annual gross salary from employer Form 16', created_at: '2026-04-10' },
        { id: 2, financial_year: '2024-2025', category: 'Other Sources', subcategory: 'Savings Bank Interest', amount: 18000, description: 'Quarterly credited interest from SB accounts', created_at: '2026-04-15' },
        { id: 3, financial_year: '2024-2025', category: 'Other Sources', subcategory: 'Fixed Deposit Interest', amount: 32000, description: 'Cumulative bank term deposit interest', created_at: '2026-04-20' }
      ]);

      // Default sample deductions
      this.setStorage('deductions', [
        { id: 1, financial_year: '2024-2025', section: '80C', amount: 150000, notes: 'Employee Provident Fund (EPF) + ELSS Mutual Funds', created_at: '2026-04-12' },
        { id: 2, financial_year: '2024-2025', section: '80D', amount: 25000, notes: 'Self & family health insurance premium', created_at: '2026-04-14' },
        { id: 3, financial_year: '2024-2025', section: '80CCD(1B)', amount: 50000, notes: 'National Pension System (Tier 1 NPS contribution)', created_at: '2026-04-18' }
      ]);

      // Default standard checklist items
      this.setStorage('checklist', [
        { id: 1, financial_year: '2024-2025', doc_name: 'Form 16 (Part A & Part B)', status: 'uploaded', notes: 'Employer salary certificate with TDS deduction details', created_at: '2026-04-10' },
        { id: 2, financial_year: '2024-2025', doc_name: 'Form 26AS & AIS / TIS Statement', status: 'verified', notes: 'Comprehensive tax passbook downloaded from TRACES / e-Filing portal', created_at: '2026-04-12' },
        { id: 3, financial_year: '2024-2025', doc_name: 'PAN & Aadhaar Linkage Status', status: 'verified', notes: 'Mandatory for processing Income Tax Returns', created_at: '2026-04-12' },
        { id: 4, financial_year: '2024-2025', doc_name: 'Pre-validated Bank Account', status: 'verified', notes: 'Selected for direct electronic refund credit', created_at: '2026-04-14' },
        { id: 5, financial_year: '2024-2025', doc_name: 'Section 80C Investment Receipts', status: 'uploaded', notes: 'ELSS statements, PPF receipts, LIC policy payments', created_at: '2026-04-15' },
        { id: 6, financial_year: '2024-2025', doc_name: 'Health Insurance Premium Receipt (80D)', status: 'uploaded', notes: 'Paid via digital banking with 80D section certificate', created_at: '2026-04-18' },
        { id: 7, financial_year: '2024-2025', doc_name: 'Interest Certificates (Savings & FDs)', status: 'pending', notes: 'Bank annual interest certificates downloaded from net banking', created_at: '2026-04-20' },
        { id: 8, financial_year: '2024-2025', doc_name: 'House Rent Receipts / Agreement (HRA)', status: 'na', notes: 'Residing in own ancestral accommodation', created_at: '2026-04-20' }
      ]);

      // Calculations
      this.setStorage('calculations', []);
      localStorage.setItem('tax_seeded_v1', 'true');
    }
  },

  // Statutory Tax Calculation Algorithm (India Budget 2024 Compliant)
  computeTax(grossIncome, deductions = 0, fy = '2024-2025', ageGroup = 'general', isSalaried = true) {
    grossIncome = Math.max(0, parseFloat(grossIncome) || 0);
    deductions = Math.max(0, parseFloat(deductions) || 0);
    fy = ['2023-2024', '2024-2025'].includes(fy) ? fy : '2024-2025';

    // Standard Deductions
    let stdDedOld = isSalaried ? 50000 : 0;
    let stdDedNew = isSalaried ? (fy === '2024-2025' ? 75000 : 50000) : 0;
    stdDedOld = Math.min(stdDedOld, grossIncome);
    stdDedNew = Math.min(stdDedNew, grossIncome);

    // Old Regime
    const taxableOld = Math.max(0, grossIncome - stdDedOld - deductions);
    let oldSlabs = [];
    if (ageGroup === 'super_senior') {
      oldSlabs = [
        { from: 0, to: 500000, rate: 0 },
        { from: 500000, to: 1000000, rate: 20 },
        { from: 1000000, to: Infinity, rate: 30 }
      ];
    } else if (ageGroup === 'senior') {
      oldSlabs = [
        { from: 0, to: 300000, rate: 0 },
        { from: 300000, to: 500000, rate: 5 },
        { from: 500000, to: 1000000, rate: 20 },
        { from: 1000000, to: Infinity, rate: 30 }
      ];
    } else {
      oldSlabs = [
        { from: 0, to: 250000, rate: 0 },
        { from: 250000, to: 500000, rate: 5 },
        { from: 500000, to: 1000000, rate: 20 },
        { from: 1000000, to: Infinity, rate: 30 }
      ];
    }

    const oldCalc = this.calculateSlabs(taxableOld, oldSlabs);
    const baseTaxOld = oldCalc.totalTax;
    const rebate87aOld = taxableOld <= 500000 ? Math.min(baseTaxOld, 12500) : 0;
    const taxAfterRebateOld = Math.max(0, baseTaxOld - rebate87aOld);
    const surchargeOld = this.calculateSurcharge(taxAfterRebateOld, taxableOld, false);
    const cessOld = Math.round((taxAfterRebateOld + surchargeOld) * 0.04);
    const netTaxOld = Math.round(taxAfterRebateOld + surchargeOld + cessOld);

    // New Regime
    const taxableNew = Math.max(0, grossIncome - stdDedNew);
    let newSlabs = [];
    if (fy === '2024-2025') {
      newSlabs = [
        { from: 0, to: 300000, rate: 0 },
        { from: 300000, to: 700000, rate: 5 },
        { from: 700000, to: 1000000, rate: 10 },
        { from: 1000000, to: 1200000, rate: 15 },
        { from: 1200000, to: 1500000, rate: 20 },
        { from: 1500000, to: Infinity, rate: 30 }
      ];
    } else {
      newSlabs = [
        { from: 0, to: 300000, rate: 0 },
        { from: 300000, to: 600000, rate: 5 },
        { from: 600000, to: 900000, rate: 10 },
        { from: 900000, to: 1200000, rate: 15 },
        { from: 1200000, to: 1500000, rate: 20 },
        { from: 1500000, to: Infinity, rate: 30 }
      ];
    }

    const newCalc = this.calculateSlabs(taxableNew, newSlabs);
    const baseTaxNew = newCalc.totalTax;
    const rebate87aNew = taxableNew <= 700000 ? baseTaxNew : 0;
    const taxAfterRebateNew = Math.max(0, baseTaxNew - rebate87aNew);
    const surchargeNew = this.calculateSurcharge(taxAfterRebateNew, taxableNew, true);
    const cessNew = Math.round((taxAfterRebateNew + surchargeNew) * 0.04);
    const netTaxNew = Math.round(taxAfterRebateNew + surchargeNew + cessNew);

    const recRegime = netTaxNew < netTaxOld ? 'new' : (netTaxOld < netTaxNew ? 'old' : 'equal');
    const taxSavings = Math.abs(netTaxOld - netTaxNew);

    return {
      financial_year: fy,
      age_group: ageGroup,
      is_salaried: isSalaried,
      gross_income: grossIncome,
      std_ded_old: stdDedOld,
      deductions_applied_old: deductions,
      taxable_income_old: taxableOld,
      base_tax_old: Math.round(baseTaxOld),
      rebate_87a_old: Math.round(rebate87aOld),
      tax_after_rebate_old: Math.round(taxAfterRebateOld),
      surcharge_old: Math.round(surchargeOld),
      cess_old: cessOld,
      net_tax_old: netTaxOld,
      slab_breakdown_old: oldCalc.breakdown,

      std_ded_new: stdDedNew,
      taxable_income_new: taxableNew,
      base_tax_new: Math.round(baseTaxNew),
      rebate_87a_new: Math.round(rebate87aNew),
      tax_after_rebate_new: Math.round(taxAfterRebateNew),
      surcharge_new: Math.round(surchargeNew),
      cess_new: cessNew,
      net_tax_new: netTaxNew,
      slab_breakdown_new: newCalc.breakdown,

      recommended_regime: recRegime,
      tax_savings: taxSavings
    };
  },

  calculateSlabs(income, slabs) {
    let totalTax = 0;
    const breakdown = [];

    for (const s of slabs) {
      if (income > s.from) {
        const taxableInSlab = Math.min(income, s.to) - s.from;
        const slabTax = taxableInSlab * (s.rate / 100);
        totalTax += slabTax;
        breakdown.push({
          slab: `${formatINR(s.from + 1)} - ${s.to === Infinity ? 'Above' : formatINR(s.to)}`,
          rate: s.rate + '%',
          taxable_amount: Math.round(taxableInSlab),
          tax: Math.round(slabTax)
        });
      } else {
        breakdown.push({
          slab: `${formatINR(s.from + 1)} - ${s.to === Infinity ? 'Above' : formatINR(s.to)}`,
          rate: s.rate + '%',
          taxable_amount: 0,
          tax: 0
        });
      }
    }
    return { totalTax, breakdown };
  },

  calculateSurcharge(tax, taxableIncome, isNewRegime = false) {
    if (taxableIncome <= 5000000) return 0;
    if (taxableIncome <= 10000000) return tax * 0.10;
    if (taxableIncome <= 20000000) return tax * 0.15;
    if (isNewRegime) return tax * 0.25;
    return taxableIncome > 50000000 ? (tax * 0.37) : (tax * 0.25);
  },

  // Emulated API Router for Client/Vercel Standalone Mode
  handleRequest(endpoint, options = {}) {
    this.initDefaults();

    const [pathPart, queryPart] = endpoint.split('?');
    const query = new URLSearchParams(queryPart || '');
    const method = (options.method || 'GET').toUpperCase();
    let body = {};
    if (options.body) {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    }

    // AUTH
    if (pathPart.includes('auth.php')) {
      const action = query.get('action') || '';
      if (action === 'check') {
        const user = this.getStorage('active_user', null);
        return { success: true, authenticated: !!user, user: user };
      }
      if (action === 'login') {
        const email = (body.email || '').trim().toLowerCase();
        const users = this.getStorage('users', []);
        let found = users.find(u => u.email.toLowerCase() === email);
        if (!found) {
          // If demo credentials or new tester, auto-create
          found = {
            id: Date.now(),
            name: email.split('@')[0].toUpperCase(),
            email: email,
            pan_number: 'ABCDE1234F',
            dob: '1995-01-01',
            phone: '+91 98765 00000',
            default_fy: '2024-2025'
          };
          users.push(found);
          this.setStorage('users', users);
        }
        this.setStorage('active_user', found);
        return { success: true, message: 'Login successful', user: found };
      }
      if (action === 'register') {
        const newUser = {
          id: Date.now(),
          name: body.name || 'Taxpayer',
          email: body.email,
          pan_number: (body.pan_number || 'ABCDE1234F').toUpperCase(),
          dob: body.dob || '1995-01-01',
          phone: body.phone || '',
          default_fy: body.default_fy || '2024-2025'
        };
        const users = this.getStorage('users', []);
        users.push(newUser);
        this.setStorage('users', users);
        this.setStorage('active_user', newUser);
        return { success: true, message: 'Registration successful', user: newUser };
      }
      if (action === 'logout') {
        localStorage.removeItem('tax_active_user');
        return { success: true, message: 'Logged out successfully' };
      }
    }

    // CALCULATOR
    if (pathPart.includes('calculator.php')) {
      const action = query.get('action') || 'compute';
      if (action === 'compute') {
        const gross = parseFloat(body.gross_income) || 0;
        const ded = parseFloat(body.deductions) || 0;
        const fy = body.financial_year || '2024-2025';
        const age = body.age_group || 'general';
        const salaried = body.is_salaried !== undefined ? body.is_salaried : true;
        const result = this.computeTax(gross, ded, fy, age, salaried);
        return { success: true, data: result };
      }
      if (action === 'save') {
        const calcs = this.getStorage('calculations', []);
        const newRecord = {
          id: Date.now(),
          financial_year: body.financial_year || '2024-2025',
          gross_income: body.gross_income || 0,
          total_deductions_old: (body.deductions_applied_old || 0) + (body.std_ded_old || 0),
          total_deductions_new: body.std_ded_new || 0,
          taxable_income_old: body.taxable_income_old || 0,
          taxable_income_new: body.taxable_income_new || 0,
          net_tax_old: body.net_tax_old || 0,
          net_tax_new: body.net_tax_new || 0,
          recommended_regime: body.recommended_regime || 'new',
          calculation_details: body,
          created_at: new Date().toISOString()
        };
        calcs.unshift(newRecord);
        this.setStorage('calculations', calcs);
        return { success: true, message: 'Calculation saved to history successfully', id: newRecord.id };
      }
    }

    // INCOME
    if (pathPart.includes('income.php')) {
      let income = this.getStorage('income', []);
      if (method === 'GET') {
        const fy = query.get('fy') || '2024-2025';
        const filtered = income.filter(i => i.financial_year === fy);
        return { success: true, data: filtered };
      }
      if (method === 'DELETE' || query.has('id')) {
        const delId = parseInt(query.get('id'));
        income = income.filter(i => i.id !== delId);
        this.setStorage('income', income);
        return { success: true, message: 'Income entry removed.' };
      }
      if (method === 'POST') {
        const action = query.get('action') || 'create';
        if (action === 'update') {
          const id = parseInt(body.id);
          income = income.map(i => i.id === id ? { ...i, ...body } : i);
          this.setStorage('income', income);
          return { success: true, message: 'Income record updated.' };
        }
        const newEntry = {
          id: Date.now(),
          financial_year: body.financial_year || '2024-2025',
          category: body.category,
          subcategory: body.subcategory || '',
          amount: parseFloat(body.amount) || 0,
          description: body.description || '',
          created_at: new Date().toISOString().split('T')[0]
        };
        income.unshift(newEntry);
        this.setStorage('income', income);
        return { success: true, message: 'Income entry recorded successfully.', id: newEntry.id };
      }
    }

    // DEDUCTIONS
    if (pathPart.includes('deductions.php')) {
      let deds = this.getStorage('deductions', []);
      if (method === 'GET') {
        const fy = query.get('fy') || '2024-2025';
        const filtered = deds.filter(d => d.financial_year === fy);
        return { success: true, data: filtered };
      }
      if (method === 'DELETE' || query.has('id')) {
        const delId = parseInt(query.get('id'));
        deds = deds.filter(d => d.id !== delId);
        this.setStorage('deductions', deds);
        return { success: true, message: 'Deduction record removed.' };
      }
      if (method === 'POST') {
        const action = query.get('action') || 'create';
        if (action === 'update') {
          const id = parseInt(body.id);
          deds = deds.map(d => d.id === id ? { ...d, ...body } : d);
          this.setStorage('deductions', deds);
          return { success: true, message: 'Deduction updated.' };
        }
        const newDed = {
          id: Date.now(),
          financial_year: body.financial_year || '2024-2025',
          section: body.section,
          amount: parseFloat(body.amount) || 0,
          notes: body.notes || '',
          created_at: new Date().toISOString().split('T')[0]
        };
        deds.unshift(newDed);
        this.setStorage('deductions', deds);
        return { success: true, message: 'Deduction recorded successfully.', id: newDed.id };
      }
    }

    // CHECKLIST
    if (pathPart.includes('checklist.php')) {
      let docs = this.getStorage('checklist', []);
      if (method === 'GET') {
        const fy = query.get('fy') || '2024-2025';
        const filtered = docs.filter(d => d.financial_year === fy);
        return { success: true, data: filtered };
      }
      if (method === 'DELETE' || query.has('id')) {
        const delId = parseInt(query.get('id'));
        docs = docs.filter(d => d.id !== delId);
        this.setStorage('checklist', docs);
        return { success: true, message: 'Document item removed.' };
      }
      if (method === 'POST') {
        const action = query.get('action') || '';
        if (action === 'update_status') {
          const id = parseInt(body.id);
          docs = docs.map(d => d.id === id ? { ...d, status: body.status } : d);
          this.setStorage('checklist', docs);
          return { success: true, message: 'Status updated successfully.' };
        }
        if (action === 'update_note') {
          const id = parseInt(body.id);
          docs = docs.map(d => d.id === id ? { ...d, notes: body.notes } : d);
          this.setStorage('checklist', docs);
          return { success: true, message: 'Note updated successfully.' };
        }
        if (action === 'create') {
          const newDoc = {
            id: Date.now(),
            financial_year: body.financial_year || '2024-2025',
            doc_name: body.doc_name,
            status: 'pending',
            notes: body.notes || '',
            created_at: new Date().toISOString().split('T')[0]
          };
          docs.push(newDoc);
          this.setStorage('checklist', docs);
          return { success: true, message: 'Checklist item added.' };
        }
        if (action === 'seed_defaults') {
          localStorage.removeItem('tax_seeded_v1');
          this.initDefaults();
          return { success: true, message: 'Default checklist items reset.' };
        }
      }
    }

    // HISTORY
    if (pathPart.includes('history.php')) {
      let calcs = this.getStorage('calculations', []);
      if (method === 'GET') {
        if (query.has('id')) {
          const id = parseInt(query.get('id'));
          const item = calcs.find(c => c.id === id);
          if (item) return { success: true, data: item };
          return { success: false, message: 'Record not found.' };
        }
        return { success: true, data: calcs };
      }
      if (method === 'DELETE' || query.has('id')) {
        const id = parseInt(query.get('id'));
        calcs = calcs.filter(c => c.id !== id);
        this.setStorage('calculations', calcs);
        return { success: true, message: 'Calculation deleted.' };
      }
    }

    // PROFILE
    if (pathPart.includes('profile.php')) {
      let user = this.getStorage('active_user', { name: 'Demo Taxpayer', email: 'demo@taxassistant.local' });
      if (method === 'GET') {
        return { success: true, user: user };
      }
      if (method === 'POST') {
        const action = query.get('action') || '';
        if (action === 'update_details') {
          user = { ...user, ...body };
          this.setStorage('active_user', user);
          return { success: true, message: 'Profile updated successfully.' };
        }
        if (action === 'change_password') {
          return { success: true, message: 'Security password changed successfully.' };
        }
        if (action === 'reset_data') {
          localStorage.removeItem('tax_income');
          localStorage.removeItem('tax_deductions');
          localStorage.removeItem('tax_checklist');
          localStorage.removeItem('tax_calculations');
          localStorage.removeItem('tax_seeded_v1');
          this.initDefaults();
          return { success: true, message: 'Financial data successfully reset.' };
        }
      }
    }

    return { success: true, data: [] };
  }
};

// Universal API Fetcher with Automatic Fallback
async function apiRequest(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    ...options
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  // Handle FormData
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, config);
    const contentType = res.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If server returned non-JSON HTML (e.g. 500 error or 404 from serverless runtime),
        // trigger client-side fallback
        console.warn(`[TaxAssist] Server returned non-JSON for ${endpoint}. Falling back to browser store.`);
        return ClientTaxStore.handleRequest(endpoint, options);
      }
    }

    if (!res.ok) {
      if (res.status === 401) {
        const path = window.location.pathname;
        if (!path.includes('login') && !path.includes('register') && !path.endsWith('/') && !path.endsWith('index.html') && !path.endsWith('index.php')) {
          window.location.href = getPageUrl('login');
        }
        throw new Error(data.message || 'Unauthorized');
      }

      // If server failed due to database connection error on Vercel/serverless, fallback!
      if (res.status === 500 || res.status === 503 || res.status === 404) {
        console.warn(`[TaxAssist] Server returned HTTP ${res.status} for ${endpoint}. Using browser storage engine.`);
        return ClientTaxStore.handleRequest(endpoint, options);
      }

      throw new Error(data.message || data.error || `HTTP error ${res.status}`);
    }

    return data;
  } catch (err) {
    // If fetch failed due to offline/serverless/static hosting, use browser data store
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('404') || err.message.includes('500') || err.message.includes('Database connection failed'))) {
      console.info(`[TaxAssist] Network/DB unavailable for ${endpoint}. Using browser storage.`);
      return ClientTaxStore.handleRequest(endpoint, options);
    }
    // If it's a 401 or intentional user validation error, rethrow
    throw err;
  }
}

// Modal Handlers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Global Financial Year State
function getSelectedFY() {
  const fySelector = document.getElementById('global-fy-selector');
  if (fySelector) {
    return fySelector.value;
  }
  return localStorage.getItem('selected_fy') || '2024-2025';
}

function setSelectedFY(fy) {
  localStorage.setItem('selected_fy', fy);
  const fySelector = document.getElementById('global-fy-selector');
  if (fySelector && fySelector.value !== fy) {
    fySelector.value = fy;
  }
}

// Session check for dashboard pages
async function checkAuthSession() {
  try {
    const res = await apiRequest('auth.php?action=check');
    if (!res || !res.authenticated) {
      const path = window.location.pathname;
      if (!path.includes('login') && !path.includes('register') && !path.endsWith('/') && !path.endsWith('index.html') && !path.endsWith('index.php')) {
        window.location.href = getPageUrl('login');
      }
      return null;
    }
    
    // Update user display in topbar and sidebar if present
    const userElements = document.querySelectorAll('.js-user-name');
    userElements.forEach(el => el.textContent = (res.user && res.user.name) ? res.user.name : 'User');
    
    const userEmailElements = document.querySelectorAll('.js-user-email');
    userEmailElements.forEach(el => el.textContent = (res.user && res.user.email) ? res.user.email : '');

    const userInitialElements = document.querySelectorAll('.js-user-initial');
    userInitialElements.forEach(el => {
      const name = (res.user && res.user.name) ? res.user.name : 'U';
      el.textContent = name.charAt(0).toUpperCase();
    });

    if (res.user && res.user.default_fy) {
      setSelectedFY(res.user.default_fy);
    }

    return res.user;
  } catch (err) {
    console.warn('Session verification notice:', err);
    return null;
  }
}

// Logout handler
async function handleLogout() {
  try {
    await apiRequest('auth.php?action=logout', { method: 'POST' });
    showToast('Logged out successfully', 'success');
  } catch (err) {
    // ignore
  } finally {
    localStorage.removeItem('tax_active_user');
    setTimeout(() => {
      window.location.href = getPageUrl('login');
    }, 400);
  }
}

// Attach event listeners for modal closes and FY changes
document.addEventListener('DOMContentLoaded', () => {
  // Ensure default demo taxpayer is seeded for immediate zero-config testing
  ClientTaxStore.initDefaults();

  // Close modals when clicking backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Close modals when clicking elements with data-dismiss="modal"
  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });
  }

  // FY Selector change event
  const fySelector = document.getElementById('global-fy-selector');
  if (fySelector) {
    const savedFY = localStorage.getItem('selected_fy');
    if (savedFY) {
      fySelector.value = savedFY;
    }
    fySelector.addEventListener('change', (e) => {
      setSelectedFY(e.target.value);
      window.dispatchEvent(new CustomEvent('fy-changed', { detail: { fy: e.target.value } }));
    });
  }
});
