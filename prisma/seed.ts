import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  
  // Future/Past offset utilities
  const offsetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  console.log('Seeding database with AIS Telecom variables...');

  // 1. Seed Employees
  const somchai = await prisma.employee.upsert({
    where: { id: 'EMP-1001' },
    update: {},
    create: {
      id: 'EMP-1001',
      name: 'สมชาย รักดี',
      department: 'Sales & Business',
      email: 'somchai.r@company.com',
      isDeleted: false
    }
  });

  const wiphada = await prisma.employee.upsert({
    where: { id: 'EMP-1002' },
    update: {},
    create: {
      id: 'EMP-1002',
      name: 'วิภาดา รวยเจริญ',
      department: 'Marketing Creative',
      email: 'wiphada.r@company.com',
      isDeleted: false
    }
  });

  const theeradech = await prisma.employee.upsert({
    where: { id: 'EMP-1003' },
    update: {},
    create: {
      id: 'EMP-1003',
      name: 'ธีรเดช เอื้ออังกูร',
      department: 'Engineering Outsource',
      email: 'theeradech.a@company.com',
      isDeleted: false
    }
  });

  // 2. Seed Assets
  const asset1 = await prisma.asset.upsert({
    where: { id: 'BKK-PH-0001' },
    update: {},
    create: {
      id: 'BKK-PH-0001',
      name: 'iPhone 15 Pro Max',
      brand: 'Apple',
      model: 'A3106 (256GB, Blue Titanium)',
      serialNumber: 'QX9H8D4F7G',
      imei: '358921849204812',
      purchaseDate: offsetDate(-304),
      purchasePrice: 48900.0,
      warrantyExpiry: offsetDate(61),
      assetType: 'Contract Device',
      status: 'Active',
      notes: 'เครื่องติดสัญญารายเดือน AIS แพ็กเกจ VIP-5G',
      isDeleted: false
    }
  });

  const asset2 = await prisma.asset.upsert({
    where: { id: 'BKK-PH-0002' },
    update: {},
    create: {
      id: 'BKK-PH-0002',
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      model: 'SM-S928B/DS (512GB, Titanium Gray)',
      serialNumber: 'R5CW301X9H',
      imei: '351429402941549',
      purchaseDate: offsetDate(-120),
      purchasePrice: 46900.0,
      warrantyExpiry: offsetDate(245),
      assetType: 'Company Asset',
      status: 'Active',
      notes: 'เครื่องกองกลางฝ่ายเขียนแบบ ซื้อขาดเป็นสินทรัพย์บริษัท',
      isDeleted: false
    }
  });

  const asset3 = await prisma.asset.upsert({
    where: { id: 'BKK-PH-0003' },
    update: {},
    create: {
      id: 'BKK-PH-0003',
      name: 'iPad Air 5 (Cellular)',
      brand: 'Apple',
      model: 'A2589 (64GB, Space Gray)',
      serialNumber: 'GG7H3K8S9Q',
      imei: '357381940291048',
      purchaseDate: offsetDate(-450),
      purchasePrice: 29900.0,
      warrantyExpiry: offsetDate(-85),
      assetType: 'Company Asset',
      status: 'Spare',
      notes: 'เครื่องสำรองไอทีพร้อมใช้ มีรอยบิ่นมุมล่างขวา',
      isDeleted: false
    }
  });

  // 3. Seed SIMContracts
  await prisma.sIMContract.upsert({
    where: { phoneNumber: '0819238475' },
    update: {},
    create: {
      phoneNumber: '0819238475',
      carrier: 'AIS',
      contractNumber: 'AIS-CON-2024-001',
      packageName: 'AIS 5G Ultra Max Speed 1199',
      monthlyCost: 1199.0,
      contractStartDate: offsetDate(-300),
      contractEndDate: offsetDate(65),
      contractStatus: 'Active',
      aisAccountName: 'บริษัท ทีแอนด์เอส เทเลคอม ดีไซน์ จำกัด',
      linkedAssetId: 'BKK-PH-0001'
    }
  });

  await prisma.sIMContract.upsert({
    where: { phoneNumber: '0891234567' },
    update: {},
    create: {
      phoneNumber: '0891234567',
      carrier: 'AIS',
      contractNumber: 'AIS-CON-2025-002',
      packageName: 'AIS Business 5G Flexi 899',
      monthlyCost: 899.0,
      contractStartDate: offsetDate(-120),
      contractEndDate: offsetDate(245),
      contractStatus: 'Active',
      aisAccountName: 'บริษัท ทีแอนด์เอส เทเลคอม ดีไซน์ จำกัด',
      linkedAssetId: 'BKK-PH-0002'
    }
  });

  // 4. Seed Handover logs
  await prisma.assignmentHistory.upsert({
    where: { id: 'HIS-0001' },
    update: {},
    create: {
      id: 'HIS-0001',
      employeeId: 'EMP-1001',
      employeeName: 'สมชาย รักดี',
      assetId: 'BKK-PH-0001',
      assetName: 'iPhone 15 Pro Max',
      phoneNumber: '0819238475',
      assignmentDate: offsetDate(-300),
      status: 'Active',
      notes: 'ส่งมอบเครื่องเพื่อใช้งานติดต่อลูกค้าฝ่ายขายพร้อมซิมรายเดือน'
    }
  });

  // 5. Audit Log setup
  await prisma.activityLog.create({
    data: {
      id: 'LOG-INIT',
      action: 'System Initialized',
      details: 'ระบบฐานข้อมูลตั้งต้น Prisma-SQLite Seeding ทำเสร็จสิ้นเรียบร้อย',
      user: 'admin'
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
