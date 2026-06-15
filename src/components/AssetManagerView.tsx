import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Plus, Search, Download, Trash2, Edit, QrCode, Clipboard, FileText,
  X, Info, Calendar, Sparkles, AlertCircle, Eye, Link, Image as ImageIcon,
  Upload, FileSpreadsheet, CheckCircle
} from 'lucide-react';
import { Asset, AssetType, AssetStatus } from '../types';

interface AssetManagerViewProps {
  assets: Asset[];
  userRole: 'admin' | 'user';
  onAddAsset: (asset: Omit<Asset, 'isDeleted' | 'qrCode'>) => Promise<any>;
  onEditAsset: (id: string, updates: Partial<Asset>) => Promise<any>;
  onDeleteAsset: (id: string) => Promise<any>;
  onUploadDoc: (data: { name: string; base64: string; fileType: any; linkedType: 'asset'; linkedId: string }) => Promise<any>;
  onRefresh: () => void;
  // Deep link optional prop
  scannedAssetId?: string | null;
  clearScannedAssetId?: () => void;
}

export default function AssetManagerView({
  assets,
  userRole,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onUploadDoc,
  onRefresh,
  scannedAssetId,
  clearScannedAssetId
}: AssetManagerViewProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [historyTrail, setHistoryTrail] = useState<any[]>([]);
  const [activeAssignee, setActiveAssignee] = useState<any | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  // Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [formAssetId, setFormAssetId] = useState('');
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formImei, setFormImei] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState(0);
  const [formWarrantyExpiry, setFormWarrantyExpiry] = useState('');
  const [formAssetType, setFormAssetType] = useState<AssetType>('Company Asset');
  const [formStatus, setFormStatus] = useState<AssetStatus>('Spare');
  const [formNotes, setFormNotes] = useState('');

  // Local document upload states
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileBase64, setUploadFileBase64] = useState('');
  const [uploadFileType, setUploadFileType] = useState<'Invoice' | 'Device Photo' | 'Warranty File'>('Invoice');
  const [isUploading, setIsUploading] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Bulk import states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: { row: number; id: string; error: string }[] } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  // Handle scanned asset id Deep link in QR tags
  useEffect(() => {
    if (scannedAssetId) {
      const found = assets.find(a => a.id === scannedAssetId);
      if (found) {
        handleViewDetail(found);
      }
      if (clearScannedAssetId) clearScannedAssetId();
    }
  }, [scannedAssetId, assets]);

  // Load detailed asset history & QR code on detail view
  const handleViewDetail = async (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailModalOpen(true);
    
    // Generate QR Code containing the link for easy scan & check code
    // Points to current address with ?scan=AST-XXXX
    try {
      const scanUrl = `${window.location.origin}?scan=${asset.id}`;
      const codeUrl = await QRCode.toDataURL(scanUrl, { width: 250, margin: 2 });
      setQrCodeDataUrl(codeUrl);
    } catch (e) {
      console.error(e);
    }

    try {
      const res = await fetch(`/api/assets/${asset.id}`);
      if (res.ok) {
        const fullDetails = await res.json();
        setHistoryTrail(fullDetails.history || []);
        setActiveAssignee(fullDetails.currentAssignment || null);
      }
    } catch (e) {
      console.error('Failed to grab additional asset details', e);
    }
  };

  // Open Form for Adding New Device
  const handleOpenAdd = () => {
    setIsEditMode(false);
    // Generate incremental id like BKK-PH-XXXX based on the highest existing BKK-PH number
    const maxNum = assets.reduce((max, a) => {
      const match = a.id.match(/^BKK-PH-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const paddingId = String(maxNum + 1).padStart(4, '0');
    setFormAssetId(`BKK-PH-${paddingId}`);
    
    setFormName('');
    setFormBrand('');
    setFormModel('');
    setFormSerial('');
    setFormImei('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormPurchasePrice(0);
    setFormWarrantyExpiry(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormAssetType('Company Asset');
    setFormStatus('Spare');
    setFormNotes('');
    setErrorText('');
    setFormModalOpen(true);
  };

  // Open Form for Editing Device
  const handleOpenEdit = (asset: Asset) => {
    setIsEditMode(true);
    setFormAssetId(asset.id);
    setFormName(asset.name);
    setFormBrand(asset.brand);
    setFormModel(asset.model);
    setFormSerial(asset.serialNumber);
    setFormImei(asset.imei);
    setFormPurchaseDate(asset.purchaseDate);
    setFormPurchasePrice(asset.purchasePrice);
    setFormWarrantyExpiry(asset.warrantyExpiry);
    setFormAssetType(asset.assetType);
    setFormStatus(asset.status);
    setFormNotes(asset.notes);
    setErrorText('');
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!formBrand || !formName || !formSerial || !formImei) {
      setErrorText('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, ยี่ห้อ, S/N, IMEI)');
      return;
    }

    const payload = {
      id: formAssetId,
      name: formName,
      brand: formBrand,
      model: formModel,
      serialNumber: formSerial,
      imei: formImei,
      purchaseDate: formPurchaseDate,
      purchasePrice: Number(formPurchasePrice),
      warrantyExpiry: formWarrantyExpiry,
      assetType: formAssetType,
      status: formStatus,
      notes: formNotes
    };

    try {
      if (isEditMode) {
        await onEditAsset(formAssetId, payload);
      } else {
        await onAddAsset(payload);
      }
      setFormModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorText(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`คุณต้องการยืนยันการลบอุปกรณ์รหัส ${id} ใช่หรือไม่? สัญญาที่ผูกอยู่จะถูกปลดลิงก์อัตโนมัติ`)) {
      try {
        await onDeleteAsset(id);
        onRefresh();
        if (detailModalOpen && selectedAsset?.id === id) {
          setDetailModalOpen(false);
        }
      } catch (err: any) {
        alert(err.message || 'ลบล้มเหลว');
      }
    }
  };

  // Document base64 helper callback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDocument = async () => {
    if (!selectedAsset || !uploadFileBase64 || !uploadFileName) return;
    setIsUploading(true);
    try {
      await onUploadDoc({
        name: `${selectedAsset.id}_${uploadFileType}_${uploadFileName}`,
        base64: uploadFileBase64,
        fileType: uploadFileType,
        linkedType: 'asset',
        linkedId: selectedAsset.id
      });
      setIsUploading(false);
      setUploadFileBase64('');
      setUploadFileName('');
      // Reload detail modal
      handleViewDetail(selectedAsset);
    } catch (err) {
      alert('อัปโหลดไฟล์ล้มเหลว: ' + err);
      setIsUploading(false);
    }
  };

  // Download import template
  const handleDownloadTemplate = () => {
    const headers = ['Asset ID', 'Name', 'Brand', 'Model', 'Serial Number', 'IMEI', 'Purchase Date (YYYY-MM-DD)', 'Price (THB)', 'Warranty Expiry (YYYY-MM-DD)', 'Asset Type', 'Status', 'Notes'];
    const example = ['BKK-PH-0001', 'iPhone 15 Pro', 'Apple', 'A3290', 'SN1234567890', '358123456789012', '2024-01-15', '45000', '2025-01-15', 'Company Asset', 'Spare', 'ตัวอย่างข้อมูล'];
    const notes = ['', '', '', '', '', '', '', '', '', 'Company Asset หรือ Contract Device', 'Active, Spare, Repair, Lost, Retired', ''];
    const csvContent = '﻿' + [headers, example, notes].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'AIS_Asset_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV file upload for import
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportResult(null);
    setImportLoading(true);

    const text = await file.text();
    const lines = text.replace(/^﻿/, '').split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      setImportError('ไฟล์ไม่มีข้อมูล (ต้องมีอย่างน้อย 1 แถวข้อมูล นอกจาก header)');
      setImportLoading(false);
      return;
    }

    const parseCSVRow = (line: string) => {
      const result: string[] = [];
      let inQuote = false, cur = '';
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      result.push(cur.trim());
      return result;
    };

    // Skip header row (index 0), and skip rows that look like the example notes row
    const rows = lines.slice(1).map(line => {
      const cols = parseCSVRow(line);
      return {
        id: cols[0] || '',
        name: cols[1] || '',
        brand: cols[2] || '',
        model: cols[3] || '',
        serialNumber: cols[4] || '',
        imei: cols[5] || '',
        purchaseDate: cols[6] || '',
        purchasePrice: cols[7] || '0',
        warrantyExpiry: cols[8] || '',
        assetType: cols[9] || '',
        status: cols[10] || '',
        notes: cols[11] || '',
      };
    }).filter(r => r.id && r.id !== 'Asset ID' && r.assetType !== 'Company Asset หรือ Contract Device');

    if (rows.length === 0) {
      setImportError('ไม่พบข้อมูลที่ถูกต้องในไฟล์');
      setImportLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/assets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      setImportResult(data);
      if (data.success > 0) onRefresh();
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    const csvRows = [
      ['Asset ID', 'Name', 'Brand', 'Model', 'Serial Number', 'IMEI', 'Purchase Date', 'Price (THB)', 'Warranty Expiry', 'Asset Type', 'Status', 'Notes'],
      ...assets.map(a => [
        a.id,
        `"${a.name.replace(/"/g, '""')}"`,
        a.brand,
        `"${a.model.replace(/"/g, '""')}"`,
        a.serialNumber,
        a.imei,
        a.purchaseDate,
        a.purchasePrice,
        a.warrantyExpiry,
        a.assetType,
        a.status,
        `"${a.notes.replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = '\uFEFF' + csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'AIS_Telecom_Assets_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter pipeline
  const filteredAssets = assets.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      a.id.toLowerCase().includes(term) ||
      a.name.toLowerCase().includes(term) ||
      a.brand.toLowerCase().includes(term) ||
      a.model.toLowerCase().includes(term) ||
      a.imei.toLowerCase().includes(term) ||
      a.serialNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-3xs">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัส อาร์แอนด์ดี, แบรนด์, S/N, IMEI, ชื่ออุปกรณ์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 py-2 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>ส่งออกรายงาน (CSV)</span>
          </button>

          {userRole === 'admin' && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 py-2 px-3.5 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                <span>ดาวน์โหลด Template</span>
              </button>

              <label className="flex items-center gap-2 py-2 px-3.5 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer">
                <Upload size={14} />
                <span>นำเข้าข้อมูล (CSV)</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { setImportModalOpen(true); handleImportFile(e); }}
                />
              </label>

              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 py-2 px-4 bg-brand-primary text-slate-900 rounded-lg text-xs font-bold hover:bg-brand-hover transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>ลงทะเบียนเครื่องใหม่</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-[110px]">รหัสทรัพย์สิน</th>
                <th className="py-3 px-4">ชื่อเครื่อง / ยี่ห้อ</th>
                <th className="py-3 px-4 hidden md:table-cell">โมเดล</th>
                <th className="py-3 px-4">S/N & IMEI</th>
                <th className="py-3 px-4 hidden md:table-cell">ประเภทสินทรัพย์</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-center w-[120px]">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-xs">
                    ไม่พบข้อมูลสินทรัพย์ตรงกับคำค้นหา
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const statusStyles: Record<AssetStatus, string> = {
                    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Spare: 'bg-blue-50 text-blue-700 border-blue-150',
                    Repair: 'bg-amber-50 text-amber-700 border-amber-250',
                    Lost: 'bg-red-50 text-red-700 border-red-200',
                    Retired: 'bg-gray-100 text-gray-600 border-gray-250'
                  };

                  return (
                    <tr key={asset.id} className="table-row-hover hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-gray-900">{asset.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{asset.name}</div>
                        <div className="text-[11px] text-gray-400">{asset.brand}</div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-xs text-gray-500">{asset.model}</td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="text-gray-500">S/N: {asset.serialNumber}</div>
                        <div className="text-[10px] text-gray-400">IMEI: {asset.imei}</div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          asset.assetType === 'Contract Device' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-slate-800'
                        }`}>
                          {asset.assetType === 'Contract Device' ? 'ติดสัญญา AIS' : 'ซื้อขาด (Company)'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusStyles[asset.status]}`}>
                          {asset.status === 'Active' ? 'กำลังใช้งาน' : 
                           asset.status === 'Spare' ? 'เครื่องสำรอง' : 
                           asset.status === 'Repair' ? 'ส่งตรวจซ่อม' : 
                           asset.status === 'Lost' ? 'เครื่องสูญหาย' : 'ตัดชำรุดเกรด'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewDetail(asset)}
                            title="ดูรายละเอียดครบครัน"
                            className="p-1 px-2 text-slate-700 bg-slate-50 border border-gray-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
                          >
                            <Eye size={13} />
                            <span>ข้อมูล</span>
                          </button>
                          
                          {userRole === 'admin' && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(asset)}
                                className="p-1 text-slate-500 hover:text-slate-800 border border-transparent hover:border-gray-200 rounded transition-colors cursor-pointer"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(asset.id)}
                                className="p-1 text-red-500 hover:text-red-700 border border-transparent hover:border-red-100 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: DETAIL VIEWER WITH QR GENERATOR */}
      {detailModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-brand-primary text-slate-900 font-bold text-xs rounded-md">
                  {selectedAsset.id}
                </span>
                <h3 className="text-lg font-bold text-gray-800">รายละเอียดข้อมูลอุปกรณ์ทางเทคนิค</h3>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left/Middle Column: Form details */}
                <div className="md:col-span-2 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ชื่อสินค้า</span>
                      <p className="text-gray-900 font-bold">{selectedAsset.name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ยี่ห้อแบรนด์</span>
                      <p className="text-gray-800 font-semibold">{selectedAsset.brand}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">โมเดลระบุจำเพาะ</span>
                      <p className="text-gray-700 text-sm">{selectedAsset.model || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ประเภททรัพย์สิน</span>
                      <p className="text-gray-700 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          selectedAsset.assetType === 'Contract Device' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-slate-800'
                        }`}>
                          {selectedAsset.assetType}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Serial Number (S/N)</span>
                      <p className="font-mono text-sm font-bold text-slate-800 bg-slate-50 p-1 rounded border border-gray-100">{selectedAsset.serialNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">IMEI โมดูลรับสัญญาณ</span>
                      <p className="font-mono text-sm font-bold text-slate-800 bg-slate-50 p-1 rounded border border-gray-100">{selectedAsset.imei || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">วันที่รับซึ้อของ</span>
                      <p className="text-gray-700 text-sm">{selectedAsset.purchaseDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ราคาในการจัดซื้อ (บาท)</span>
                      <p className="text-gray-900 font-bold">฿{selectedAsset.purchasePrice?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">วันหมดการรับประกันสินค้า</span>
                      <p className={`text-sm font-bold ${
                        new Date(selectedAsset.warrantyExpiry) < new Date() ? 'text-red-500' : 'text-emerald-600'
                      }`}>
                        {selectedAsset.warrantyExpiry}
                        {new Date(selectedAsset.warrantyExpiry) < new Date() && ' (ประกันหมดอายุแล้ว)'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">สถานะปัจจุบัน</span>
                      <p className="text-gray-700 text-sm font-semibold">{selectedAsset.status}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">บันทึกเพิ่มเติม (Notes)</span>
                    <p className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50 text-xs text-amber-950 italic mt-1 font-sans">
                      {selectedAsset.notes || 'ไม่มีประวัติบันทึกข้อมูลเพิ่มเติม'}
                    </p>
                  </div>

                  {/* Active Holder Banner */}
                  {activeAssignee ? (
                    <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-4 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-700 p-2 bg-emerald-100 rounded-lg">👤</span>
                        <div>
                          <div className="text-emerald-800 font-bold">พนักงานผู้ครอบครองเครื่องปัจจุบัน</div>
                          <div className="font-semibold text-gray-800">{activeAssignee.employeeName} ({activeAssignee.employeeId})</div>
                          {activeAssignee.phoneNumber && (
                            <div className="text-xs text-emerald-700">ผูกเบอร์ AIS: <span className="font-mono font-bold">{activeAssignee.phoneNumber}</span></div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-emerald-700 bg-white border border-emerald-200 px-3 py-1 rounded-full font-bold">
                        กำลังใช้งาน
                      </span>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-250 rounded-xl p-4 text-center text-gray-500 text-xs text-medium">
                      ไม่มีประวัติผู้เบิกใช้ปัจจุบัน (เครื่องอยู่ในสต็อกพร้อมจ่ายส่งมอบ)
                    </div>
                  )}

                  {/* Document and warranties files list */}
                  <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <FileText size={15} className="text-slate-500" />
                      <span>เอกสารประกอบแนบทดแทนพนักงาน / ใบเสร็จเคลมประกัน</span>
                    </h4>

                    {/* Files list */}
                    <div className="space-y-1.5 mb-3 bg-white p-2.5 rounded border border-gray-150">
                      {/* Normally, documents with this asset ID is queried or calculated */}
                      <span className="text-[11px] text-gray-400">อัปโหลดไฟล์ (พิมพ์ PDF, รูปภาพหลักฐาน)</span>
                    </div>

                    {/* Simple base64 file uploader inside detail wrapper */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <select 
                        value={uploadFileType} 
                        onChange={(e) => setUploadFileType(e.target.value as any)}
                        className="text-xs border p-1 rounded"
                      >
                        <option value="Invoice">ใบกำกับภาษีจัดซื้อ</option>
                        <option value="Device Photo">ภาพถ่ายเครื่อง</option>
                        <option value="Warranty File">เอกสารเคลมประกัน</option>
                        <option value="Handover Form">ใบตอบรับเซ็นมอบสินค้า</option>
                      </select>
                      
                      <input 
                        type="file" 
                        onChange={handleFileChange}
                        className="text-xs"
                      />
                      
                      {uploadFileBase64 && (
                        <button
                          onClick={handleUploadDocument}
                          disabled={isUploading}
                          className="px-3 py-1 bg-brand-primary text-slate-900 hover:bg-brand-hover text-xs font-bold rounded cursor-pointer disabled:opacity-50"
                        >
                          {isUploading ? 'กำลังเซฟ...' : 'บันทึกไฟล์'}
                        </button>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column: QR Code & Handover Trail */}
                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-5 space-y-5">
                  
                  {/* Generated QR Card */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 flex flex-col items-center text-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">ป้ายทรัพย์สินองค์ประกอบ QR</span>
                    
                    {qrCodeDataUrl ? (
                      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-3xs">
                        <img src={qrCodeDataUrl} alt="Asset QR Code" className="w-[140px] h-[140px]" />
                      </div>
                    ) : (
                      <div className="w-[140px] h-[140px] bg-slate-100 flex items-center justify-center text-xs">กำลังโหลด QR...</div>
                    )}

                    <div className="mt-3 text-[11px] leading-relaxed text-gray-500">
                      <p className="font-bold text-slate-800">{selectedAsset.id}</p>
                      <p className="px-2">พิมพ์ติดทรัพย์สิน สแกนเพื่อเช็กประจักษ์ผู้ครอบครอง</p>
                    </div>

                    {/* Copy print button */}
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = qrCodeDataUrl;
                        link.download = `${selectedAsset.id}_qrcode.png`;
                        link.click();
                      }}
                      className="mt-3.5 w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download size={11} />
                      <span>ดาวน์โหลด QR ป้ายรหัส</span>
                    </button>
                  </div>

                  {/* Mini History Trail */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clipboard size={14} className="text-gray-400" />
                      <span>ประวัติครอบครองย้อนหลัง</span>
                    </h4>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {historyTrail.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">ไม่มีบันทึกส่งคืนหรือรับเข้าในระบบ</p>
                      ) : (
                        historyTrail.map((h, i) => (
                          <div key={h.id || i} className="p-2.5 bg-white border border-gray-150 rounded-lg text-[11px] space-y-1">
                            <div className="flex justify-between items-center font-semibold text-gray-800">
                              <span>พนักงาน: {h.employeeName}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                h.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {h.status === 'Active' ? 'กำลังถือครอง' : 'คืนเครื่องแล้ว'}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              วันส่งมอบ: {h.assignmentDate} {h.returnDate && `| วันนำส่งคืน: ${h.returnDate}`}
                            </div>
                            {h.phoneNumber && (
                              <div className="text-[10px] text-slate-700">เบอร์สื่อสาร: <span className="font-semibold text-gray-900">{h.phoneNumber}</span></div>
                            )}
                            {h.notes && (
                              <div className="text-[10px] text-amber-800 bg-amber-50/40 p-1 rounded font-serif italic mt-0.5">"{h.notes}"</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                ปิดหน้าต่างตรวจเช็ก
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ADD & EDIT FORM MODAL */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-md font-bold text-gray-800">
                {isEditMode ? `แก้ไขรายละเอียดข้อมูลทรัพย์สินมือถือ ${formAssetId}` : 'เซ็นลงทะเบียนจัดระเบียบสินทรัพย์มือถือใหม่'}
              </h3>
              <button 
                onClick={() => setFormModalOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4">
                {errorText && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle size={16} />
                    <span>{errorText}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Asset ID inputs */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">รหัสทรัพย์สิน (ID)*</label>
                    <input
                      type="text"
                      disabled={isEditMode}
                      value={formAssetId}
                      onChange={(e) => setFormAssetId(e.target.value)}
                      placeholder="e.g. BKK-PH-0005"
                      className="w-full p-2 border border-gray-250 roundedL-md text-sm font-mono disabled:bg-gray-100"
                    />
                  </div>

                  {/* Brand inputs */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ยี่ห้อ (Brand)*</label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Apple, Samsung, Oppo"
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>

                  {/* Name inputs */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ชื่อเครื่อง (Device Name)*</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. iPhone 15 Pro, Galaxy Tab S9"
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>

                  {/* Model inputs */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">รหัสโมเดลสี / ความจุ (Model)</label>
                    <input
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="e.g. A3106 (256GB Midnight)"
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>

                  {/* Serial input */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Serial Number (S/N)*</label>
                    <input
                      type="text"
                      value={formSerial}
                      onChange={(e) => setFormSerial(e.target.value)}
                      placeholder="รหัส S/N ข้างตัวกล่อง"
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm font-mono"
                    />
                  </div>

                  {/* IMEI inputs */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">รหัส IMEI (15 หลัก)*</label>
                    <input
                      type="text"
                      value={formImei}
                      onChange={(e) => setFormImei(e.target.value)}
                      placeholder="รหัสโมเด็มซิม IMEI"
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm font-mono"
                    />
                  </div>

                  {/* Purchase Date inputs */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">วันที่ซื้อรับมือ (Purchase Date)</label>
                    <input
                      type="date"
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>

                  {/* Purchase Price inputs */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ราคาสุทธิจัดสรร (บาท)</label>
                    <input
                      type="number"
                      value={formPurchasePrice}
                      onChange={(e) => setFormPurchasePrice(Number(e.target.value))}
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>

                  {/* Warranty Expiration input */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">วันสิ้นสุดรับประกันสินค้า</label>
                    <input
                      type="date"
                      value={formWarrantyExpiry}
                      onChange={(e) => setFormWarrantyExpiry(e.target.value)}
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>

                  {/* Asset Type */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ประเภทสัญญาทรัพย์สิน</label>
                    <select
                      value={formAssetType}
                      onChange={(e) => setFormAssetType(e.target.value as AssetType)}
                      className="w-full p-2.5 border border-gray-250 rounded-lg text-sm"
                    >
                      <option value="Company Asset">ซื้อขาดเป็นสินทรัพย์ (Company Asset)</option>
                      <option value="Contract Device">เครื่องแถมส่งมอบติดสัญญา (Contract Device)</option>
                    </select>
                  </div>

                  {/* Status selection */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">สถานะพร้อมขายหรือคลัง</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                      className="w-full p-2.5 border border-gray-250 rounded-lg text-sm"
                    >
                      <option value="Active">ใช้งาน (Active)</option>
                      <option value="Spare">สต็อกสำรอง (Spare)</option>
                      <option value="Repair">ปัญหาส่งซ่อม (Repair)</option>
                      <option value="Lost">เครื่องสูญหาย (Lost)</option>
                      <option value="Retired">ชำรุดตัดคาร์บอน (Retired)</option>
                    </select>
                  </div>

                </div>

                {/* Notes inputs */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ขยายความบันทึกย่อ (Notes)</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="ระบุข้อเท็จจริง แผนกที่มีสิทธิ์เบิก หรือแพ็กเกจ AIS ที่คู่มาด้วย..."
                    rows={3}
                    className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                  ></textarea>
                </div>

              </div>

              {/* Form Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-150 rounded-b-2xl flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  ยกเลิกปฏิบัติการ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary text-slate-900 rounded-lg font-bold hover:bg-brand-hover cursor-pointer"
                >
                  บันทึกข้อมูลเรียบร้อย
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Import Result Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">นำเข้าข้อมูลอุปกรณ์</h2>
              <button onClick={() => { setImportModalOpen(false); setImportResult(null); setImportError(''); }} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {importLoading && (
              <div className="flex flex-col items-center gap-3 py-8 text-gray-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">กำลังนำเข้าข้อมูล...</span>
              </div>
            )}

            {importError && !importLoading && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importResult && !importLoading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>นำเข้าสำเร็จ <strong>{importResult.success}</strong> รายการ</span>
                </div>
                {importResult.failed.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-600">ล้มเหลว {importResult.failed.length} รายการ:</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {importResult.failed.map((f, i) => (
                        <div key={i} className="text-xs bg-red-50 border border-red-100 rounded px-2 py-1 text-red-700">
                          แถว {f.row} (ID: {f.id}) — {f.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => { setImportModalOpen(false); setImportResult(null); setImportError(''); }}
              disabled={importLoading}
              className="w-full py-2 bg-brand-primary text-slate-900 rounded-lg font-bold hover:bg-brand-hover cursor-pointer disabled:opacity-50"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
