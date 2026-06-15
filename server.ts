import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { DBManager } from './server/db';
import { Asset, SIMContract, Employee } from './src/types';

const app = express();
const PORT = process.env.PORT || 3000;

// Set up JSON parsing limits to allow base64 uploads easily
app.use(express.json({ limit: '32mb' }));
app.use(express.urlencoded({ extended: true, limit: '32mb' }));

// Set up server-side uploads static directory to allow file viewing/downloading
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Initialize persistent database on boot
DBManager.initialize();

// ==========================================
// API REST ENDPOINTS
// ==========================================

// 1. SIMPLE AUTH
// Dummy session store map for admin / user
let sessionUser: { username: string; role: 'admin' | 'user' } | null = { username: 'admin', role: 'admin' };

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    sessionUser = { username: 'admin', role: 'admin' };
    DBManager.addLog('User Login', 'ผู้ดูแลระบบ (Admin) เข้าสู่ระบบสำเร็จ', 'admin');
    return res.json({ success: true, user: sessionUser });
  } else if (username === 'user' && password === 'user123') {
    sessionUser = { username: 'user', role: 'user' };
    DBManager.addLog('User Login', 'พนักงานทั่วไป (User) เข้าสู่ระบบสำเร็จ', 'user');
    return res.json({ success: true, user: sessionUser });
  }
  
  return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (ใบคำใบ้: admin/admin123 และ user/user123)' });
});

app.get('/api/auth/current', (req, res) => {
  res.json({ user: sessionUser });
});

app.post('/api/auth/logout', (req, res) => {
  if (sessionUser) {
    DBManager.addLog('User Logout', `ผู้ใช้งาน ${sessionUser.username} ออกจากระบบ`, sessionUser.username);
  }
  sessionUser = null;
  res.json({ success: true });
});


// 2. DASHBOARD STATS
app.get('/api/stats', (req, res) => {
  try {
    const stats = DBManager.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// 3. MOBILE ASSETS
app.get('/api/assets', (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    const assets = DBManager.getAssets(search);
    res.json(assets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/assets/:id', (req, res) => {
  try {
    const asset = DBManager.getAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: `ไม่พบอุปกรณ์รหัส ${req.params.id}` });
    }
    
    // Supplement with detailed history trail
    const allAssignments = DBManager.getAssignments();
    const history = allAssignments.filter(a => a.assetId === asset.id);
    
    // Find active assignment
    const activeAssign = history.find(a => a.status === 'Active');

    res.json({
      ...asset,
      history,
      currentAssignment: activeAssign || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assets', (req, res) => {
  try {
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่เพิ่มอุปกรณ์ได้' });
    }
    const newAsset = DBManager.createAsset(req.body);
    res.status(201).json(newAsset);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/assets/:id', (req, res) => {
  try {
    const updated = DBManager.updateAsset(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/assets/:id', (req, res) => {
  try {
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ลบอุปกรณ์ได้' });
    }
    const success = DBManager.deleteAsset(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'ไม่พบอุปกรณ์ที่ต้องการลบ' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// 4. SIM CARDS & CONTRACTS
app.get('/api/contracts', (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    const contracts = DBManager.getContracts(search);
    res.json(contracts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contracts/:phone', (req, res) => {
  try {
    const contract = DBManager.getContractByPhone(req.params.phone);
    if (!contract) {
      return res.status(404).json({ error: `ไม่พบสัญญาณเบอร์ ${req.params.phone}` });
    }
    
    // Supplement with detailed history trail
    const allAssignments = DBManager.getAssignments();
    const history = allAssignments.filter(a => a.phoneNumber === contract.phoneNumber);
    
    // Find linked asset details
    let linkedAsset = null;
    if (contract.linkedAssetId) {
      linkedAsset = DBManager.getAsset(contract.linkedAssetId);
    }

    res.json({
      ...contract,
      history,
      linkedAsset
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contracts', (req, res) => {
  try {
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ลงทะเบียนสัญญาได้' });
    }
    const newContract = DBManager.createContract(req.body);
    res.status(201).json(newContract);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/contracts/:phone', (req, res) => {
  try {
    const updated = DBManager.updateContract(req.params.phone, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/contracts/:phone', (req, res) => {
  try {
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ลบข้อมูลได้' });
    }
    const success = DBManager.deleteContract(req.params.phone);
    if (!success) {
      return res.status(404).json({ error: 'ไม่พบหมายเลขที่ต้องการลบ' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// 5. EMPLOYEES
app.get('/api/employees', (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    const employees = DBManager.getEmployees(search);
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/employees/:id', (req, res) => {
  try {
    const employee = DBManager.getEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: `ไม่พบพนักงานรหัส ${req.params.id}` });
    }
    
    // Detailed active equipments and history
    const allAssignments = DBManager.getAssignments();
    const history = allAssignments.filter(a => a.employeeId === employee.id);
    const activeEquipments = history.filter(a => a.status === 'Active');

    res.json({
      ...employee,
      history,
      activeEquipments
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employees', (req, res) => {
  try {
    const newEmp = DBManager.createEmployee(req.body);
    res.status(201).json(newEmp);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/employees/:id', (req, res) => {
  try {
    const updated = DBManager.updateEmployee(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  try {
    const success = DBManager.deleteEmployee(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'ไม่พบพนักงานที่ต้องการลบ' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// 6. EQUIPMENT HANDOVER & ASSIGNMENTS
app.get('/api/assignments', (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    const assignments = DBManager.getAssignments(search);
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assignments/assign', (req, res) => {
  try {
    const { employeeId, assetId, phoneNumber, notes, assignmentDate } = req.body;
    if (!employeeId || !assetId) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงานและรหัสอุปกรณ์เพื่อบันทึกการส่งมอบ' });
    }
    const newAssignment = DBManager.assignDevice(employeeId, assetId, phoneNumber, notes, assignmentDate);
    res.status(201).json(newAssignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/assignments/return', (req, res) => {
  try {
    const { assignmentId, notes, returnDate } = req.body;
    if (!assignmentId) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสการส่งมอบที่ต้องการคืนอุปกรณ์' });
    }
    const updated = DBManager.returnDevice(assignmentId, notes, returnDate);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


// 7. FILE MANAGEMENT (BASE64 UPLOADER DIRECT TO FS)
app.get('/api/documents', (req, res) => {
  try {
    res.json(DBManager.getDocuments());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents/upload', (req, res) => {
  try {
    const { name, base64, fileType, linkedType, linkedId } = req.body;
    
    if (!name || !base64 || !fileType) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วนสำหรับการอัปโหลดไฟล์' });
    }

    // Capture standard base64 raw string
    // Data pattern: "data:application/pdf;base64,JVBERi0xLjQK..." or raw binary string
    let pureBase64 = base64;
    let mimeType = 'application/octet-stream';
    if (base64.includes(';base64,')) {
      const parts = base64.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      pureBase64 = parts[1];
    }

    // Safeguard safe file saving
    const fileExt = path.extname(name) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
    const timestampedName = `${Date.now()}_${Math.floor(Math.random() * 1000)}${fileExt}`;
    const targetDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, timestampedName);
    const buffer = Buffer.from(pureBase64, 'base64');
    
    fs.writeFileSync(targetPath, buffer);

    const doc = DBManager.uploadDocument(
      name,
      timestampedName,
      fileType,
      mimeType,
      buffer.length,
      linkedType || 'general',
      linkedId || null
    );

    res.status(201).json(doc);
  } catch (error: any) {
    res.status(500).json({ error: 'อัปโหลดสัญญาล้มเหลว: ' + error.message });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  try {
    const success = DBManager.deleteDocument(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'ไม่พบเอกสารที่ต้องการลบ' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// 8. SYSTEM LOGS
app.get('/api/logs', (req, res) => {
  try {
    res.json(DBManager.getLogs());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// 9. SYSTEM NOTIFICATIONS
app.get('/api/notifications', (req, res) => {
  try {
    const notifs = DBManager.getNotifications();
    res.json(notifs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/check-jobs', (req, res) => {
  try {
    const notifs = DBManager.runJobNotificationCheck();
    res.json({ success: true, count: notifs.length, notifications: notifs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', (req, res) => {
  try {
    const success = DBManager.markNotificationRead(req.params.id);
    res.json({ success });
  } catch (error: any) {
    res.status(550).json({ error: error.message });
  }
});

app.post('/api/notifications/read-all', (req, res) => {
  try {
    DBManager.markAllNotificationsRead();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// STATIC ASSETS & VITE PLAYGROUND INTEGRATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode with Vite serving
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
    
    app.use('*', (req, res, next) => {
      // In development, let Vite asset router fallback handle SPA routing
      next();
    });
  } else {
    // Production mode with built files serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Telecom & Asset Server] Server is running on http://localhost:${PORT}`);
  });
}

startServer();
