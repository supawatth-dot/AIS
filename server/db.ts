import fs from 'fs';
import path from 'path';
import { 
  Asset, 
  SIMContract, 
  Employee, 
  AssignmentHistory, 
  SystemDocument, 
  ActivityLog, 
  SystemNotification,
  DashboardStats,
  AssetStatus,
  AssetType
} from '../src/types';

const DB_FILE_PATH = path.join(process.cwd(), 'uploads', 'db.json');

// Interface to wrap our full DB state
interface DBState {
  assets: Asset[];
  contracts: SIMContract[];
  employees: Employee[];
  assignments: AssignmentHistory[];
  documents: SystemDocument[];
  logs: ActivityLog[];
  notifications: SystemNotification[];
}

// Initial seed data generator
function getInitialSeedData(): DBState {
  const now = new Date();
  
  // Future/past date utility
  const offsetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const assets: Asset[] = [
    {
      id: 'AST-0001',
      name: 'iPhone 15 Pro Max',
      brand: 'Apple',
      model: 'A3106 (256GB, Blue Titanium)',
      serialNumber: 'QX9H8D4F7G',
      imei: '358921849204812',
      purchaseDate: offsetDate(-300),
      purchasePrice: 48900,
      warrantyExpiry: offsetDate(65),
      assetType: 'Contract Device',
      status: 'Active',
      notes: 'เครื่องติดสัญญารายเดือน AIS แพ็กเกจ VIP-5G',
      qrCode: '',
      isDeleted: false
    },
    {
      id: 'AST-0002',
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      model: 'SM-S928B/DS (512GB, Titanium Gray)',
      serialNumber: 'R5CW301X9H',
      imei: '351429402941549',
      purchaseDate: offsetDate(-120),
      purchasePrice: 46900,
      warrantyExpiry: offsetDate(245),
      assetType: 'Company Asset',
      status: 'Active',
      notes: 'เครื่องกองกลางฝ่ายเขียนแบบ ซื้อขาดเป็นสินทรัพย์บริษัท',
      qrCode: '',
      isDeleted: false
    },
    {
      id: 'AST-0003',
      name: 'iPad Air 5 (Cellular)',
      brand: 'Apple',
      model: 'A2589 (64GB, Space Gray)',
      serialNumber: 'GG7H3K8S9Q',
      imei: '357381940291048',
      purchaseDate: offsetDate(-450),
      purchasePrice: 29900,
      warrantyExpiry: offsetDate(-85), // warranty expired
      assetType: 'Company Asset',
      status: 'Spare',
      notes: 'เครื่องสำรองไอทีพร้อมใช้ มีรอยบิ่นมุมล่างขวา',
      qrCode: '',
      isDeleted: false
    },
    {
      id: 'AST-0004',
      name: 'AIS Super 4G Pocket WiFi',
      brand: 'ZTE',
      model: 'MF971R',
      serialNumber: 'ZTE8G3H19C',
      imei: '862048123951010',
      purchaseDate: offsetDate(-200),
      purchasePrice: 1990,
      warrantyExpiry: offsetDate(165),
      assetType: 'Contract Device',
      status: 'Active',
      notes: 'Pocket Wi-Fi สำหรับออกหน้างาน ตรวจสอบสัญญาซิม',
      qrCode: '',
      isDeleted: false
    },
    {
      id: 'AST-0005',
      name: 'Samsung Galaxy A55 5G',
      brand: 'Samsung',
      model: 'SM-A556B (128GB, Awesome Lilac)',
      serialNumber: 'R5DW412A8B',
      imei: '352938102948194',
      purchaseDate: offsetDate(-10),
      purchasePrice: 13999,
      warrantyExpiry: offsetDate(355),
      assetType: 'Contract Device',
      status: 'Spare',
      notes: 'เครื่องสัญญาใหม่ รอส่งมอบให้พนักงานใหม่ทดลองงาน',
      qrCode: '',
      isDeleted: false
    },
    {
      id: 'AST-0006',
      name: 'iPhone 13',
      brand: 'Apple',
      model: 'A2633 (128GB, Midnight)',
      serialNumber: 'X8F7R5P3V1',
      imei: '354918204910293',
      purchaseDate: offsetDate(-750),
      purchasePrice: 25900,
      warrantyExpiry: offsetDate(-385),
      assetType: 'Company Asset',
      status: 'Repair',
      notes: 'หน้าจอแตก ส่งศูนย์ซ่อมประเมินราคาเมื่อวาน',
      qrCode: '',
      isDeleted: false
    }
  ];

  const contracts: SIMContract[] = [
    {
      phoneNumber: '0819238475',
      carrier: 'AIS',
      contractNumber: 'AIS-CON-2024-001',
      packageName: 'AIS 5G Ultra Max Speed 1199',
      monthlyCost: 1199,
      contractStartDate: offsetDate(-300),
      contractEndDate: offsetDate(65), // expiring in 65 days (danger close)
      contractStatus: 'Active',
      aisAccountName: 'บริษัท ทีแอนด์เอส เทเลคอม ดีไซน์ จำกัด',
      linkedAssetId: 'AST-0001',
      attachedDocId: 'DOC-0001',
      isDeleted: false
    },
    {
      phoneNumber: '0891234567',
      carrier: 'AIS',
      contractNumber: 'AIS-CON-2025-002',
      packageName: 'AIS Business 5G Flexi 899',
      monthlyCost: 899,
      contractStartDate: offsetDate(-120),
      contractEndDate: offsetDate(245),
      contractStatus: 'Active',
      aisAccountName: 'บริษัท ทีแอนด์เอส เทเลคอม ดีไซน์ จำกัด',
      linkedAssetId: 'AST-0002',
      attachedDocId: null,
      isDeleted: false
    },
    {
      phoneNumber: '0937482910',
      carrier: 'AIS',
      contractNumber: 'AIS-CON-2024-003',
      packageName: 'AIS Mobile Net Unlimited 599',
      monthlyCost: 599,
      contractStartDate: offsetDate(-200),
      contractEndDate: offsetDate(-20), // contract expired!
      contractStatus: 'Expired',
      aisAccountName: 'บริษัท ทีแอนด์เอส เทเลคอม ดีไซน์ จำกัด',
      linkedAssetId: 'AST-0004',
      attachedDocId: 'DOC-0002',
      isDeleted: false
    },
    {
      phoneNumber: '0821122334',
      carrier: 'AIS',
      contractNumber: 'AIS-CON-2025-010',
      packageName: 'AIS Net Extreme 1099',
      monthlyCost: 1099,
      contractStartDate: offsetDate(-10),
      contractEndDate: offsetDate(355),
      contractStatus: 'Active',
      aisAccountName: 'บริษัท ทีแอนด์เอส เทเลคอม ดีไซน์ จำกัด',
      linkedAssetId: null, // floating SIM
      attachedDocId: null,
      isDeleted: false
    }
  ];

  const employees: Employee[] = [
    {
      id: 'EMP-1001',
      name: 'สมชาย รักดี',
      department: 'Sales & Business',
      email: 'somchai.r@company.com',
      isDeleted: false
    },
    {
      id: 'EMP-1002',
      name: 'วิภาดา รวยเจริญ',
      department: 'Marketing Creative',
      email: 'wiphada.r@company.com',
      isDeleted: false
    },
    {
      id: 'EMP-1003',
      name: 'ธีรเดช เอื้ออังกูร',
      department: 'Engineering Outsource',
      email: 'theeradech.a@company.com',
      isDeleted: false
    },
    {
      id: 'EMP-1004',
      name: 'อนันต์ สันติสุข',
      department: 'IT Support',
      email: 'anant.s@company.com',
      isDeleted: false
    }
  ];

  const assignments: AssignmentHistory[] = [
    {
      id: 'HIS-0001',
      employeeId: 'EMP-1001',
      employeeName: 'สมชาย รักดี',
      assetId: 'AST-0001',
      assetName: 'iPhone 15 Pro Max',
      phoneNumber: '0819238475',
      assignmentDate: offsetDate(-300),
      returnDate: null,
      status: 'Active',
      notes: 'ส่งมอบเครื่องเพื่อใช้งานติดต่อลูกค้าฝ่ายขายพร้อมซิมรายเดือน'
    },
    {
      id: 'HIS-0002',
      employeeId: 'EMP-1002',
      employeeName: 'วิภาดา รวยเจริญ',
      assetId: 'AST-0002',
      assetName: 'Samsung Galaxy S24 Ultra',
      phoneNumber: '0891234567',
      assignmentDate: offsetDate(-120),
      returnDate: null,
      status: 'Active',
      notes: 'ส่งมอบเครื่องถ่ายภาพรีวิวสื่อและโซเชียลบริษัท'
    },
    {
      id: 'HIS-0003',
      employeeId: 'EMP-1003',
      employeeName: 'ธีรเดช เอื้ออังกูร',
      assetId: 'AST-0003',
      assetName: 'iPad Air 5 (Cellular)',
      phoneNumber: null,
      assignmentDate: offsetDate(-450),
      returnDate: offsetDate(-10), // return device
      status: 'Returned',
      notes: 'คืนเครื่องเนื่องจากหมดสัญญาจ้าง เอาท์ซอร์สวิศวกร ยืนยันเครื่องปกติดี'
    },
    {
      id: 'HIS-0004',
      employeeId: 'EMP-1003',
      employeeName: 'ธีรเดช เอื้ออังกูร',
      assetId: 'AST-0004',
      assetName: 'AIS Super 4G Pocket WiFi',
      phoneNumber: '0937482910',
      assignmentDate: offsetDate(-200),
      returnDate: null,
      status: 'Active',
      notes: 'พกพาเพื่อต่ออินเทอร์เน็ตหน้างานตรวจเสาสัญญาณ'
    }
  ];

  const documents: SystemDocument[] = [
    {
      id: 'DOC-0001',
      name: 'สัญญาจดทะเบียนเบอร์ 081-923-8475.pdf',
      fileName: '0819238475_contract.pdf',
      fileType: 'Contract',
      mimeType: 'application/pdf',
      filePath: '/uploads/0819238475_contract.pdf',
      uploadedAt: offsetDate(-300),
      fileSize: 1048576, // 1MB
      linkedType: 'contract',
      linkedId: '0819238475'
    },
    {
      id: 'DOC-0002',
      name: 'ใบเสร็จค่าใช้จ่าย AIS Pocket Wifi.pdf',
      fileName: 'pocketcell_invoice.pdf',
      fileType: 'Invoice',
      mimeType: 'application/pdf',
      filePath: '/uploads/pocketcell_invoice.pdf',
      uploadedAt: offsetDate(-200),
      fileSize: 450000,
      linkedType: 'asset',
      linkedId: 'AST-0004'
    }
  ];

  const logs: ActivityLog[] = [
    {
      id: 'LOG-0001',
      timestamp: new Date().toISOString(),
      action: 'System Initialized',
      details: 'ระบบฐานข้อมูล Telecom & Asset เริ่มต้นใช้งาน พร้อมข้อมูลตัวอย่าง',
      user: 'admin'
    }
  ];

  const notifications: SystemNotification[] = []; // filled dynamically on DB init

  return { assets, contracts, employees, assignments, documents, logs, notifications };
}

export class DBManager {
  private static state: DBState | null = null;

  public static initialize(): DBState {
    if (this.state) return this.state;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Load from disk or seed
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.state = JSON.parse(fileContent);
      } catch (error) {
        console.error('Error reading database file, noseeding with dynamic default data', error);
        this.state = getInitialSeedData();
        this.save();
      }
    } else {
      this.state = getInitialSeedData();
      this.save();
    }

    this.runJobNotificationCheck();
    return this.state!;
  }

  private static save() {
    if (!this.state) return;
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  public static runJobNotificationCheck(): SystemNotification[] {
    if (!this.state) this.initialize();
    const state = this.state!;
    const now = new Date();
    const notifications: SystemNotification[] = [];

    // Log tracking dynamic check
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

    // Check 1: 60 days before contract expiry
    state.contracts.forEach(contract => {
      if (contract.isDeleted || contract.contractStatus === 'Terminated') return;
      const endDate = new Date(contract.contractEndDate);
      const timeDiff = endDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (daysDiff <= 60 && daysDiff > 0) {
        notifications.push({
          id: `NOT-CNT-${contract.phoneNumber}-${now.getDate()}`,
          type: 'contract_expiry',
          title: `สัญญาหมดอายุภายใน ${daysDiff} วัน`,
          message: `เบอร์โทรศัพท์ ${contract.phoneNumber} (แพ็กเกจ ${contract.packageName}) สัญญาจะสิ้นสุดลงวันที่ ${contract.contractEndDate}`,
          severity: daysDiff <= 15 ? 'danger' : 'warning',
          date: now.toISOString(),
          targetId: contract.phoneNumber,
          isRead: false
        });
      } else if (daysDiff <= 0) {
        notifications.push({
          id: `NOT-CNT-EXP-${contract.phoneNumber}`,
          type: 'contract_expiry',
          title: `สัญญาหมดอายุแล้ว`,
          message: `เบอร์โทรศัพท์ ${contract.phoneNumber} หมดอายุการใช้งานสัญญาตั้งแต่วันที่ ${contract.contractEndDate}`,
          severity: 'danger',
          date: now.toISOString(),
          targetId: contract.phoneNumber,
          isRead: false
        });
      }
    });

    // Check 2: Warranty expiration
    state.assets.forEach(asset => {
      if (asset.isDeleted) return;
      const warrantyDate = new Date(asset.warrantyExpiry);
      const timeDiff = warrantyDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (daysDiff <= 30 && daysDiff > 0) {
        notifications.push({
          id: `NOT-WAR-${asset.id}`,
          type: 'warranty_expiry',
          title: `รับประกันเครื่องใกล้หมดใน ${daysDiff} วัน`,
          message: `ทรัพย์สิน ${asset.id} (${asset.name}) การรับประกันจะสิ้นสุดลงวันที่ ${asset.warrantyExpiry}`,
          severity: 'warning',
          date: now.toISOString(),
          targetId: asset.id,
          isRead: false
        });
      } else if (daysDiff <= 0) {
        notifications.push({
          id: `NOT-WAR-EXP-${asset.id}`,
          type: 'warranty_expiry',
          title: `ประกันสินทรัพย์หมดอายุแล้ว`,
          message: `ทรัพย์สิน ${asset.id} (${asset.name}) หมดประกันเมื่อวันที ${asset.warrantyExpiry}`,
          severity: 'info',
          date: now.toISOString(),
          targetId: asset.id,
          isRead: false
        });
      }
    });

    // Merge notifications keeping read statuses if already found
    const existing = state.notifications || [];
    const merged = notifications.map(newNotif => {
      const match = existing.find(e => e.id === newNotif.id);
      return match ? { ...newNotif, isRead: match.isRead } : newNotif;
    });

    state.notifications = merged;
    this.save();
    return merged;
  }

  // --- Logger ---
  public static addLog(action: string, details: string, user = 'admin') {
    const state = this.state || this.initialize();
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      user
    };
    state.logs.unshift(newLog);
    // Keep logs of max 100 entries for stability
    if (state.logs.length > 200) {
      state.logs = state.logs.slice(0, 200);
    }
    this.save();
  }

  // --- STATS ENGINE ---
  public static getDashboardStats(): DashboardStats {
    const state = this.state || this.initialize();
    
    const activeAssets = state.assets.filter(a => !a.isDeleted);
    const activeContracts = state.contracts.filter(c => !c.isDeleted);
    const activeEmployees = state.employees.filter(e => !e.isDeleted);

    const now = new Date();
    
    // Total numbers
    const totalDevices = activeAssets.length;
    const activeContractsCount = activeContracts.filter(c => c.contractStatus === 'Active').length;

    // Contracts expiring soon (within 60 days)
    const contractsExpiringSoon = activeContracts.filter(c => {
      if (c.contractStatus !== 'Active') return false;
      const end = new Date(c.contractEndDate);
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 60 && diffDays > 0;
    }).length;

    // Assigned devices status counts
    const assignedDevices = activeAssets.filter(a => a.status === 'Active').length;
    const spareDevices = activeAssets.filter(a => a.status === 'Spare').length;

    // Monthly bill summary
    const monthlyCost = activeContracts.reduce((sum, c) => c.contractStatus === 'Active' ? sum + c.monthlyCost : sum, 0);

    // Group assets status
    const byStatus: Record<AssetStatus, number> = {
      Active: 0,
      Spare: 0,
      Repair: 0,
      Lost: 0,
      Retired: 0
    };
    activeAssets.forEach(a => {
      if (byStatus[a.status] !== undefined) {
        byStatus[a.status]++;
      }
    });

    // Group assets type
    const byType: Record<AssetType, number> = {
      'Company Asset': 0,
      'Contract Device': 0
    };
    activeAssets.forEach(a => {
      if (byType[a.assetType] !== undefined) {
        byType[a.assetType]++;
      }
    });

    // Monthly Telecom Cost by Department
    const departmentCost: Record<string, number> = {};
    activeEmployees.forEach(e => {
      departmentCost[e.department] = 0;
    });
    // Find active assignments with numbers
    const activeAssignments = state.assignments.filter(asg => asg.status === 'Active');
    activeAssignments.forEach(asg => {
      if (asg.phoneNumber) {
        const contract = activeContracts.find(c => c.phoneNumber === asg.phoneNumber);
        if (contract && contract.contractStatus === 'Active') {
          // Find employee department
          const emp = activeEmployees.find(e => e.id === asg.employeeId);
          if (emp) {
            const dept = emp.department;
            departmentCost[dept] = (departmentCost[dept] || 0) + contract.monthlyCost;
          } else {
            departmentCost['Other'] = (departmentCost['Other'] || 0) + contract.monthlyCost;
          }
        }
      }
    });

    return {
      totalDevices,
      activeContracts: activeContractsCount,
      contractsExpiringSoon,
      assignedDevices,
      spareDevices,
      monthlyCost,
      byStatus,
      byType,
      departmentCost
    };
  }

  // --- ASSETS ---
  public static getAssets(search = ''): Asset[] {
    const state = this.state || this.initialize();
    const term = search.toLowerCase().trim();
    const list = state.assets.filter(a => !a.isDeleted);
    
    if (!term) return list;

    return list.filter(a => 
      a.id.toLowerCase().includes(term) ||
      a.name.toLowerCase().includes(term) ||
      a.brand.toLowerCase().includes(term) ||
      a.model.toLowerCase().includes(term) ||
      a.serialNumber.toLowerCase().includes(term) ||
      a.imei.toLowerCase().includes(term) ||
      a.notes.toLowerCase().includes(term)
    );
  }

  public static getAsset(id: string): Asset | null {
    const state = this.state || this.initialize();
    return state.assets.find(a => a.id === id && !a.isDeleted) || null;
  }

  public static createAsset(assetData: Omit<Asset, 'isDeleted' | 'qrCode'>): Asset {
    const state = this.state || this.initialize();
    
    const duplicate = state.assets.find(a => a.id === assetData.id && !a.isDeleted);
    if (duplicate) {
      throw new Error(`รหัสสินทรัพย์ ${assetData.id} มีอยู่แล้วในระบบ`);
    }

    const newAsset: Asset = {
      ...assetData,
      qrCode: '', // Generated on the client side dynamically or via an event link
      isDeleted: false
    };

    state.assets.unshift(newAsset);
    this.addLog('Create Asset', `เพิ่มสินทรัพย์มือถือใหม่ ${newAsset.id}: ${newAsset.brand} ${newAsset.name}`);
    this.save();
    this.runJobNotificationCheck();
    return newAsset;
  }

  public static updateAsset(id: string, updates: Partial<Asset>): Asset {
    const state = this.state || this.initialize();
    const index = state.assets.findIndex(a => a.id === id && !a.isDeleted);
    if (index === -1) {
      throw new Error(`ไม่พบสินทรัพย์รหัส ${id}`);
    }

    const previous = state.assets[index];
    const updated: Asset = {
      ...previous,
      ...updates,
      id // prevent id overwrite
    };

    state.assets[index] = updated;
    this.addLog('Update Asset', `แก้ไขทรัพย์สิน ${id} ปรับปรุงสถานะ: ${updated.status}`);
    this.save();
    this.runJobNotificationCheck();
    return updated;
  }

  public static deleteAsset(id: string): boolean {
    const state = this.state || this.initialize();
    const index = state.assets.findIndex(a => a.id === id && !a.isDeleted);
    if (index === -1) return false;

    state.assets[index].isDeleted = true;
    
    // Soft-deleting links
    // SIMContracts tied to this device should release link
    state.contracts.forEach(cnt => {
      if (cnt.linkedAssetId === id) {
        cnt.linkedAssetId = null;
      }
    });

    this.addLog('Delete Asset', `ลบข้อมูลสินทรัพย์มือถือ ${id} แบบ Soft Delete`);
    this.save();
    this.runJobNotificationCheck();
    return true;
  }

  // --- CONTRACTS ---
  public static getContracts(search = ''): SIMContract[] {
    const state = this.state || this.initialize();
    const term = search.toLowerCase().trim();
    const list = state.contracts.filter(c => !c.isDeleted);

    if (!term) return list;

    return list.filter(c => 
      c.phoneNumber.includes(term) ||
      c.contractNumber.toLowerCase().includes(term) ||
      c.packageName.toLowerCase().includes(term) ||
      c.aisAccountName.toLowerCase().includes(term)
    );
  }

  public static getContractByPhone(phone: string): SIMContract | null {
    const state = this.state || this.initialize();
    return state.contracts.find(c => c.phoneNumber === phone && !c.isDeleted) || null;
  }

  public static createContract(contractData: Omit<SIMContract, 'isDeleted'>): SIMContract {
    const state = this.state || this.initialize();
    const exists = state.contracts.find(c => c.phoneNumber === contractData.phoneNumber && !c.isDeleted);
    if (exists) {
      throw new Error(`เบอร์โทรศัพท์ ${contractData.phoneNumber} มีสัญญาเดิมอยู่แล้วในระบบ`);
    }

    const newContract: SIMContract = {
      ...contractData,
      isDeleted: false
    };

    state.contracts.unshift(newContract);
    this.addLog('Create SIM Contract', `เปิดทะเบียนสัญญาซิม / เบอร์โทรศัพท์ใหม่ ${newContract.phoneNumber} (${newContract.packageName})`);
    
    // Automatically flag status if date is expired
    const end = new Date(newContract.contractEndDate);
    if (end < new Date()) {
      newContract.contractStatus = 'Expired';
    }

    this.save();
    this.runJobNotificationCheck();
    return newContract;
  }

  public static updateContract(phone: string, updates: Partial<SIMContract>): SIMContract {
    const state = this.state || this.initialize();
    const index = state.contracts.findIndex(c => c.phoneNumber === phone && !c.isDeleted);
    if (index === -1) {
      throw new Error(`ไม่พบสัญญาสำหรับเบอร์ ${phone}`);
    }

    // Ensure we do not overwrite phone number
    const updated: SIMContract = {
      ...state.contracts[index],
      ...updates,
      phoneNumber: phone
    };

    state.contracts[index] = updated;
    this.addLog('Update SIM Contract', `แก้ไขข้อมูลเบอร์ ${phone} สัญญา: ${updated.contractNumber}`);
    this.save();
    this.runJobNotificationCheck();
    return updated;
  }

  public static deleteContract(phone: string): boolean {
    const state = this.state || this.initialize();
    const index = state.contracts.findIndex(c => c.phoneNumber === phone && !c.isDeleted);
    if (index === -1) return false;

    state.contracts[index].isDeleted = true;
    this.addLog('Delete SIM Contract', `ลบชื่อเบอร์และสัญญาบริการ ${phone} แบบ Soft Delete`);
    this.save();
    this.runJobNotificationCheck();
    return true;
  }

  // --- EMPLOYEES ---
  public static getEmployees(search = ''): Employee[] {
    const state = this.state || this.initialize();
    const term = search.toLowerCase().trim();
    const list = state.employees.filter(e => !e.isDeleted);

    if (!term) return list;

    return list.filter(e => 
      e.id.toLowerCase().includes(term) ||
      e.name.toLowerCase().includes(term) ||
      e.department.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term)
    );
  }

  public static getEmployee(id: string): Employee | null {
    const state = this.state || this.initialize();
    return state.employees.find(e => e.id === id && !e.isDeleted) || null;
  }

  public static createEmployee(emp: Omit<Employee, 'isDeleted'>): Employee {
    const state = this.state || this.initialize();
    const exists = state.employees.find(e => e.id === emp.id && !e.isDeleted);
    if (exists) {
      throw new Error(`รหัสพนักงาน ${emp.id} มีอยู่แล้วในระบบ`);
    }

    const newEmp: Employee = {
      ...emp,
      isDeleted: false
    };

    state.employees.push(newEmp);
    this.addLog('Create Employee', `เพิ่มพนักงานใหม่ ${newEmp.id}: ${newEmp.name} (แผนก ${newEmp.department})`);
    this.save();
    return newEmp;
  }

  public static updateEmployee(id: string, updates: Partial<Employee>): Employee {
    const state = this.state || this.initialize();
    const index = state.employees.findIndex(e => e.id === id && !e.isDeleted);
    if (index === -1) {
      throw new Error(`ไม่พบข้อมูลพนักงาน ${id}`);
    }

    const updated: Employee = {
      ...state.employees[index],
      ...updates,
      id
    };

    state.employees[index] = updated;
    this.addLog('Update Employee', `แก้ไขประวัติพนักงาน ${id}: ${updated.name}`);
    this.save();
    return updated;
  }

  public static deleteEmployee(id: string): boolean {
    const state = this.state || this.initialize();
    const index = state.employees.findIndex(e => e.id === id && !e.isDeleted);
    if (index === -1) return false;

    state.employees[index].isDeleted = true;
    this.addLog('Delete Employee', `ลบข้อมูลพนักงาน ${id} ออกจากระบบ`);
    this.save();
    return true;
  }

  // --- ASSIGNMENTS & HANDOVER ---
  public static getAssignments(search = ''): AssignmentHistory[] {
    const state = this.state || this.initialize();
    const term = search.toLowerCase().trim();
    const list = state.assignments; // History is kept, no soft delete on hist

    if (!term) return list;

    return list.filter(a => 
      a.employeeName.toLowerCase().includes(term) ||
      a.employeeId.toLowerCase().includes(term) ||
      a.assetId.toLowerCase().includes(term) ||
      a.assetName.toLowerCase().includes(term) ||
      (a.phoneNumber && a.phoneNumber.includes(term))
    );
  }

  public static getActiveAssignmentsForEmployee(empId: string): AssignmentHistory[] {
    const state = this.state || this.initialize();
    return state.assignments.filter(a => a.employeeId === empId && a.status === 'Active');
  }

  public static assignDevice(
    employeeId: string, 
    assetId: string, 
    phoneNumber: string | null, 
    notes = '',
    assignmentDate = new Date().toISOString().split('T')[0]
  ): AssignmentHistory {
    const state = this.state || this.initialize();
    
    // Find employee, asset
    const emp = state.employees.find(e => e.id === employeeId && !e.isDeleted);
    if (!emp) throw new Error(`ไม่พบคัดสรรประวัติพนักงานรหัส ${employeeId}`);

    const asset = state.assets.find(a => a.id === assetId && !a.isDeleted);
    if (!asset) throw new Error(`ไม่พบสินทรัพย์มือถือและไอทีรหัส ${assetId}`);

    // If asset is already active elsewhere, require return first
    if (asset.status === 'Active' || asset.status === 'Repair') {
      const activeAsg = state.assignments.find(a => a.assetId === assetId && a.status === 'Active');
      if (activeAsg) {
        throw new Error(`ครี่งสินทรัพย์นี้กำลังถูกใช้งานโดย ${activeAsg.employeeName}. กรุณาทำรายการคืนเครื่องเดิมก่อน`);
      }
    }

    // If phone number is passed, check if it is active elsewhere
    if (phoneNumber) {
      const activePhoneAsg = state.assignments.find(a => a.phoneNumber === phoneNumber && a.status === 'Active');
      if (activePhoneAsg) {
        throw new Error(`เบอร์โทรศัพท์ ${phoneNumber} กำลังถูกใช้งานโดย ${activePhoneAsg.employeeName}. กรุณาให้ผู้ใช้เดิมคืนสิทธิ์ก่อน`);
      }
    }

    // Logical state updates
    asset.status = 'Active';
    
    // If phone number is linked, update contract links
    if (phoneNumber) {
      const contract = state.contracts.find(c => c.phoneNumber === phoneNumber && !c.isDeleted);
      if (contract) {
        contract.linkedAssetId = assetId;
      }
    }

    const newAssignment: AssignmentHistory = {
      id: `HIS-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      assetId: asset.id,
      assetName: asset.name,
      phoneNumber: phoneNumber || null,
      assignmentDate,
      returnDate: null,
      status: 'Active',
      notes
    };

    state.assignments.unshift(newAssignment);
    this.addLog(
      'Assign Equipment', 
      `ส่งมอบเครื่อง ${asset.name} (${asset.id}) ${phoneNumber ? 'พร้อมเบอร์ ' + phoneNumber : ''} ให้พนักงาน ${emp.name}`
    );
    this.save();
    return newAssignment;
  }

  public static returnDevice(
    assignmentId: string, 
    notes = '', 
    returnDate = new Date().toISOString().split('T')[0]
  ): AssignmentHistory {
    const state = this.state || this.initialize();
    const index = state.assignments.findIndex(a => a.id === assignmentId);
    if (index === -1) {
      throw new Error(`ไม่พบประวัติการทำมอบรับอุปกรณ์รหัส ${assignmentId}`);
    }

    const asg = state.assignments[index];
    if (asg.status !== 'Active') {
      throw new Error(`รายการนี้ได้รับการคืนหรือโอนย้ายไปก่อนแล้ว`);
    }

    // Update assignment status
    asg.status = 'Returned';
    asg.returnDate = returnDate;
    if (notes) asg.notes += ` | คืน: ${notes}`;

    // Update asset status back to Spare
    const asset = state.assets.find(a => a.id === asg.assetId);
    if (asset) {
      asset.status = 'Spare';
    }

    // Unlink the SIM contract
    if (asg.phoneNumber) {
      const contract = state.contracts.find(c => c.phoneNumber === asg.phoneNumber);
      if (contract) {
        contract.linkedAssetId = null;
      }
    }

    this.addLog(
      'Return Equipment', 
      `พนักงาน ${asg.employeeName} นำส่งคืนอุปกรณ์ ${asg.assetName} (${asg.assetId}) คืนสต็อก`
    );
    this.save();
    return asg;
  }

  // --- DOCUMENTS ---
  public static getDocuments(): SystemDocument[] {
    const state = this.state || this.initialize();
    return state.documents;
  }

  public static uploadDocument(
    name: string,
    fileName: string,
    fileType: SystemDocument['fileType'],
    mimeType: string,
    fileSize: number,
    linkedType: SystemDocument['linkedType'],
    linkedId: string | null
  ): SystemDocument {
    const state = this.state || this.initialize();
    const newDoc: SystemDocument = {
      id: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      fileName,
      fileType,
      mimeType,
      filePath: `/uploads/${fileName}`,
      uploadedAt: new Date().toISOString(),
      fileSize,
      linkedType,
      linkedId
    };

    state.documents.unshift(newDoc);
    
    // Auto-link to specific entities if exists
    if (linkedType === 'contract' && linkedId) {
      const contract = state.contracts.find(c => c.phoneNumber === linkedId);
      if (contract) {
        contract.attachedDocId = newDoc.id;
      }
    }

    this.addLog('Upload Document', `อัปโหลดเอกสารประกอบแนบ ${fileType}: ${name}`);
    this.save();
    return newDoc;
  }

  public static deleteDocument(id: string): boolean {
    const state = this.state || this.initialize();
    const index = state.documents.findIndex(d => d.id === id);
    if (index === -1) return false;

    const doc = state.documents[index];
    
    // Unlink from contract
    if (doc.linkedType === 'contract' && doc.linkedId) {
      const contract = state.contracts.find(c => c.phoneNumber === doc.linkedId);
      if (contract && contract.attachedDocId === id) {
        contract.attachedDocId = null;
      }
    }

    // Try deleting from fs
    try {
      const realPath = path.join(process.cwd(), 'uploads', doc.fileName);
      if (fs.existsSync(realPath)) {
        fs.unlinkSync(realPath);
      }
    } catch (e) {
      console.error('File cleanup failed', e);
    }

    state.documents.splice(index, 1);
    this.addLog('Delete Document', `ลบไฟล์เอกสารรหัส ${id}`);
    this.save();
    return true;
  }

  // --- LOGS ---
  public static getLogs(): ActivityLog[] {
    const state = this.state || this.initialize();
    return state.logs;
  }

  // --- NOTIFICATIONS ---
  public static getNotifications(): SystemNotification[] {
    const state = this.state || this.initialize();
    return state.notifications;
  }

  public static markNotificationRead(id: string): boolean {
    const state = this.state || this.initialize();
    const notif = state.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  public static markAllNotificationsRead(): void {
    const state = this.state || this.initialize();
    state.notifications.forEach(n => { n.isRead = true; });
    this.save();
  }
}
