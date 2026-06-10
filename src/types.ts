export type AssetType = 'Company Asset' | 'Contract Device';
export type AssetStatus = 'Active' | 'Spare' | 'Repair' | 'Lost' | 'Retired';

export interface Asset {
  id: string; // e.g., AST-0001
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  imei: string;
  purchaseDate: string; // ISO date
  purchasePrice: number;
  warrantyExpiry: string; // ISO date
  assetType: AssetType;
  status: AssetStatus;
  notes: string;
  qrCode: string; // data URL or string content
  isDeleted: boolean;
}

export interface SIMContract {
  phoneNumber: string; // Key / identifier
  carrier: string; // e.g. "AIS"
  contractNumber: string;
  packageName: string;
  monthlyCost: number;
  contractStartDate: string; // ISO date
  contractEndDate: string; // ISO date
  contractStatus: 'Active' | 'Expired' | 'Terminated';
  aisAccountName: string;
  linkedAssetId: string | null;
  attachedDocId: string | null;
  isDeleted: boolean;
}

export interface Employee {
  id: string; // EMP-0001
  name: string;
  department: string;
  email: string;
  isDeleted: boolean;
}

export interface AssignmentHistory {
  id: string;
  employeeId: string;
  employeeName: string;
  assetId: string;
  assetName: string;
  phoneNumber: string | null;
  assignmentDate: string; // ISO Date
  returnDate: string | null; // ISO Date
  status: 'Active' | 'Returned' | 'Transferred';
  notes: string;
}

export interface SystemDocument {
  id: string;
  name: string;
  fileName: string;
  fileType: 'Contract' | 'Invoice' | 'Device Photo' | 'Handover Form' | 'Warranty File' | 'Other';
  mimeType: string;
  filePath: string;
  uploadedAt: string; // ISO date
  fileSize: number;
  linkedType: 'asset' | 'contract' | 'general';
  linkedId: string | null;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export interface SystemNotification {
  id: string;
  type: 'contract_expiry' | 'warranty_expiry' | 'overdue_return';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  date: string;
  targetId: string; // AssetId or PhoneNumber
  isRead: boolean;
}

export interface DashboardStats {
  totalDevices: number;
  activeContracts: number;
  contractsExpiringSoon: number;
  assignedDevices: number;
  spareDevices: number;
  monthlyCost: number;
  byStatus: Record<AssetStatus, number>;
  byType: Record<AssetType, number>;
  departmentCost: Record<string, number>;
}
