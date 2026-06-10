const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const { Asset, Employee, Contract } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { createLog } = require('../services/auditService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel/CSV files allowed'));
    }
  },
});

function parseSheet(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

// POST /api/import/assets
router.post('/assets', verifyToken, requireRole('itadmin', 'superadmin'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const rows = parseSheet(req.file.buffer);
    const results = { success: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const data = {
          assetTag: row['Asset Tag'] || row['assetTag'],
          type: (row['Type'] || row['type'] || 'other').toLowerCase(),
          brand: row['Brand'] || row['brand'],
          model: row['Model'] || row['model'],
          serialNumber: row['Serial Number'] || row['serialNumber'],
          imei: row['IMEI'] || row['imei'],
          simNumber: row['SIM Number'] || row['simNumber'],
          phoneNumber: row['Phone Number'] || row['phoneNumber'],
          status: (row['Status'] || row['status'] || 'available').toLowerCase(),
          department: row['Department'] || row['department'],
          purchaseDate: row['Purchase Date'] || row['purchaseDate'],
          purchasePrice: parseFloat(row['Purchase Price'] || row['purchasePrice']) || null,
          warrantyExpiry: row['Warranty Expiry'] || row['warrantyExpiry'],
          notes: row['Notes'] || row['notes'],
          createdBy: req.user.id,
          updatedBy: req.user.id,
        };

        if (!data.assetTag) throw new Error('Asset Tag is required');
        const validTypes = ['phone', 'tablet', 'sim', 'router', 'laptop', 'other'];
        if (!validTypes.includes(data.type)) data.type = 'other';
        const validStatuses = ['available', 'assigned', 'maintenance', 'retired'];
        if (!validStatuses.includes(data.status)) data.status = 'available';

        const asset = await Asset.create(data);
        await createLog('IMPORT', 'asset', asset.id, req, null, asset.toJSON());
        results.success++;
      } catch (err) {
        results.errors.push({ row: i + 2, error: err.message, data: row });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

// POST /api/import/employees
router.post('/employees', verifyToken, requireRole('itadmin', 'superadmin'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const rows = parseSheet(req.file.buffer);
    const results = { success: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const data = {
          employeeId: row['Employee ID'] || row['employeeId'],
          firstName: row['First Name'] || row['firstName'],
          lastName: row['Last Name'] || row['lastName'],
          email: row['Email'] || row['email'],
          phone: row['Phone'] || row['phone'],
          department: row['Department'] || row['department'],
          position: row['Position'] || row['position'],
          status: (row['Status'] || row['status'] || 'active').toLowerCase(),
          createdBy: req.user.id,
        };

        if (!data.employeeId) throw new Error('Employee ID is required');
        if (!data.firstName) throw new Error('First Name is required');
        if (!data.lastName) throw new Error('Last Name is required');

        const employee = await Employee.create(data);
        await createLog('IMPORT', 'employee', employee.id, req, null, employee.toJSON());
        results.success++;
      } catch (err) {
        results.errors.push({ row: i + 2, error: err.message, data: row });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

// POST /api/import/contracts
router.post('/contracts', verifyToken, requireRole('itadmin', 'superadmin'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const rows = parseSheet(req.file.buffer);
    const results = { success: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const data = {
          contractNumber: row['Contract Number'] || row['contractNumber'],
          provider: row['Provider'] || row['provider'],
          type: (row['Type'] || row['type'] || 'mobile').toLowerCase(),
          startDate: row['Start Date'] || row['startDate'],
          endDate: row['End Date'] || row['endDate'],
          monthlyRate: parseFloat(row['Monthly Rate'] || row['monthlyRate']) || null,
          annualRate: parseFloat(row['Annual Rate'] || row['annualRate']) || null,
          status: (row['Status'] || row['status'] || 'active').toLowerCase(),
          notes: row['Notes'] || row['notes'],
          createdBy: req.user.id,
        };

        if (!data.contractNumber) throw new Error('Contract Number is required');
        if (!data.provider) throw new Error('Provider is required');
        const validTypes = ['mobile', 'internet', 'cloud', 'hardware'];
        if (!validTypes.includes(data.type)) data.type = 'mobile';

        const contract = await Contract.create(data);
        await createLog('IMPORT', 'contract', contract.id, req, null, contract.toJSON());
        results.success++;
      } catch (err) {
        results.errors.push({ row: i + 2, error: err.message, data: row });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

// GET /api/import/template/:type - download sample Excel template
router.get('/template/:type', verifyToken, (req, res, next) => {
  try {
    const { type } = req.params;
    const wb = XLSX.utils.book_new();
    let headers, sampleRow;

    if (type === 'assets') {
      headers = ['Asset Tag', 'Type', 'Brand', 'Model', 'Serial Number', 'IMEI', 'SIM Number', 'Phone Number', 'Status', 'Department', 'Purchase Date', 'Purchase Price', 'Warranty Expiry', 'Notes'];
      sampleRow = ['AS-001', 'phone', 'Apple', 'iPhone 14', 'SN123456', '356938035643809', 'SIM001', '0891234567', 'available', 'IT', '2024-01-15', '35000', '2026-01-15', 'Sample asset'];
    } else if (type === 'employees') {
      headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Position', 'Status'];
      sampleRow = ['EMP001', 'John', 'Doe', 'john.doe@company.com', '0891234567', 'IT', 'Software Engineer', 'active'];
    } else if (type === 'contracts') {
      headers = ['Contract Number', 'Provider', 'Type', 'Start Date', 'End Date', 'Monthly Rate', 'Annual Rate', 'Status', 'Notes'];
      sampleRow = ['CON-001', 'AIS', 'mobile', '2024-01-01', '2024-12-31', '500', '6000', 'active', 'Sample contract'];
    } else {
      return res.status(400).json({ success: false, message: 'Invalid template type' });
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="${type}-template.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
