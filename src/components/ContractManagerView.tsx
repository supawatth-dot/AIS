import React, { useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, Link, Link2Off, Calendar, FileText, 
  X, Check, AlertTriangle, Eye, ShieldAlert, Sparkles 
} from 'lucide-react';
import { SIMContract, Asset } from '../types';

interface ContractManagerViewProps {
  contracts: SIMContract[];
  assets: Asset[]; // to allow linking SIMs to spare devices
  onAddContract: (contract: Omit<SIMContract, 'isDeleted'>) => Promise<any>;
  onEditContract: (phone: string, updates: Partial<SIMContract>) => Promise<any>;
  onDeleteContract: (phone: string) => Promise<any>;
  onRefresh: () => void;
  userRole: 'admin' | 'user';
}

export default function ContractManagerView({
  contracts,
  assets,
  onAddContract,
  onEditContract,
  onDeleteContract,
  onRefresh,
  userRole
}: ContractManagerViewProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<SIMContract | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [linkAssetModalOpen, setLinkAssetModalOpen] = useState(false);
  
  // Details Modal States
  const [contractDetails, setContractDetails] = useState<any | null>(null);

  // Form States
  const [isEditMode, setIsEditMode] = useState(false);
  const [formPhone, setFormPhone] = useState('');
  const [formCarrier, setFormCarrier] = useState('AIS');
  const [formContractNo, setFormContractNo] = useState('');
  const [formPackage, setFormPackage] = useState('');
  const [formCost, setFormCost] = useState(1199);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formStatus, setFormStatus] = useState<SIMContract['contractStatus']>('Active');
  const [formAisAccount, setFormAisAccount] = useState('บริษัท ทีแอนด์เอส เทเลคอม ดีไซน์ จำกัด');
  const [errorText, setErrorText] = useState('');

  // Link Asset States
  const [currentPhoneToLink, setCurrentPhoneToLink] = useState('');
  const [selectedAssetIdToLink, setSelectedAssetIdToLink] = useState('');

  const handleViewDetail = async (contract: SIMContract) => {
    setSelectedContract(contract);
    setDetailModalOpen(true);
    try {
      const res = await fetch(`/api/contracts/${contract.phoneNumber}`);
      if (res.ok) {
        const fullDetails = await res.json();
        setContractDetails(fullDetails);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormPhone('');
    setFormCarrier('AIS');
    setFormContractNo(`AIS-CON-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`);
    setFormPackage('');
    setFormCost(1199);
    setFormStart(new Date().toISOString().split('T')[0]);
    // default 1-year contract length
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormEnd(nextYear.toISOString().split('T')[0]);
    setFormStatus('Active');
    setFormAisAccount('บริษัท ทีแอนด์เอส เทเลคอม ดีไซน์ จำกัด');
    setErrorText('');
    setFormModalOpen(true);
  };

  const handleOpenEdit = (contract: SIMContract) => {
    setIsEditMode(true);
    setFormPhone(contract.phoneNumber);
    setFormCarrier(contract.carrier);
    setFormContractNo(contract.contractNumber);
    setFormPackage(contract.packageName);
    setFormCost(contract.monthlyCost);
    setFormStart(contract.contractStartDate);
    setFormEnd(contract.contractEndDate);
    setFormStatus(contract.contractStatus);
    setFormAisAccount(contract.aisAccountName);
    setErrorText('');
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!formPhone || !formContractNo || !formPackage || !formAisAccount) {
      setErrorText('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (เบอร์มือถือ, เลขที่สัญญา, ชื่อแพ็กเกจ)');
      return;
    }

    if (formPhone.length !== 10 || !formPhone.startsWith('0')) {
      setErrorText('กรุณาระบุหมายเลขโทรศัพท์ 10 หลักขึ้นต้นด้วย 0 เท่านั้น');
      return;
    }

    const payload = {
      phoneNumber: formPhone,
      carrier: formCarrier,
      contractNumber: formContractNo,
      packageName: formPackage,
      monthlyCost: Number(formCost),
      contractStartDate: formStart,
      contractEndDate: formEnd,
      contractStatus: formStatus,
      aisAccountName: formAisAccount,
      linkedAssetId: isEditMode ? (contracts.find(c => c.phoneNumber === formPhone)?.linkedAssetId || null) : null,
      attachedDocId: isEditMode ? (contracts.find(c => c.phoneNumber === formPhone)?.attachedDocId || null) : null
    };

    try {
      if (isEditMode) {
        await onEditContract(formPhone, payload);
      } else {
        await onAddContract(payload);
      }
      setFormModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorText(err.message || 'บันทึกสัญญาไม่สำเร็จ');
    }
  };

  const handleDelete = async (phone: string) => {
    if (confirm(`คุณต้องการยืนยันการลบสัญญาบริการเบอร์ ${phone} ออกจากฐานข้อมูลหรือไม่?`)) {
      try {
        await onDeleteContract(phone);
        onRefresh();
        if (detailModalOpen && selectedContract?.phoneNumber === phone) {
          setDetailModalOpen(false);
        }
      } catch (err: any) {
        alert(err.message || 'ลบล้มเหลว');
      }
    }
  };

  // Pairing Asset/Device Modal
  const handleOpenLinkAsset = (phone: string, currentAssetId: string | null) => {
    setCurrentPhoneToLink(phone);
    setSelectedAssetIdToLink(currentAssetId || '');
    setLinkAssetModalOpen(true);
  };

  const handleLinkAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onEditContract(currentPhoneToLink, {
        linkedAssetId: selectedAssetIdToLink ? selectedAssetIdToLink : null
      });
      // automatically sync asset status on link if needed
      setLinkAssetModalOpen(false);
      onRefresh();
      alert('เชื่อมโยงซิมและอุปกรณ์เข้าคู่สำเร็จ!');
    } catch (err: any) {
      alert('เชื่อมโยงอุปสงค์ซิมล้มเหลว: ' + err.message);
    }
  };

  const handleUnloadAssetLink = async (phone: string) => {
    if (confirm('คุณต้องการยกเลิกการจับคู่อุปกรณ์เพื่ออิสระการเบิกจ่ายใช่หรือไม่?')) {
      try {
        await onEditContract(phone, { linkedAssetId: null });
        onRefresh();
        alert('ปลดการเชื่อมโยงเรียบร้อย');
      } catch (e) {
        alert('ปลดล้มเหลว');
      }
    }
  };

  // Filter pipeline
  const filteredContracts = contracts.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.phoneNumber.includes(term) ||
      c.contractNumber.toLowerCase().includes(term) ||
      c.packageName.toLowerCase().includes(term) ||
      c.aisAccountName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Filters / Search line */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-3xs">
        
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาตามเบอร์โทรศัพท์, เลขที่สัญญา AIS, ชื่อแพ็กเกจจิ้ง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {userRole === 'admin' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 py-2 px-4 bg-slate-900 border border-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>ลงทะเบียนสัญญา & เบอร์ใหม่</span>
          </button>
        )}
      </div>

      {/* Main SIMs List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">เบอร์มือถือ AIS</th>
                <th className="py-3 px-4">ชื่อแพ็กเกจบริการ</th>
                <th className="py-3 px-4 hidden md:table-cell">เลขใบสัญญา</th>
                <th className="py-3 px-4 text-emerald-700">รายเดือน (บาท)</th>
                <th className="py-3 px-4 hidden md:table-cell">วันสิ้นสุดสัญญา</th>
                <th className="py-3 px-4">อุปกรณ์เข้าคู่</th>
                <th className="py-3 px-4">สถานะสัญญา</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 text-xs">
                    ไม่มีข้อมูลเบอร์ซิมหรือสัญญารายเดือนที่พบในองค์กร
                  </td>
                </tr>
              ) : (
                filteredContracts.map(c => {
                  const now = new Date();
                  const end = new Date(c.contractEndDate);
                  const isExpired = end < now;
                  const isExpiringSoon = !isExpired && (end.getTime() - now.getTime()) <= 30 * 24 * 60 * 60 * 1000;

                  return (
                    <tr key={c.phoneNumber} className="table-row-hover hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 font-mono tracking-tight text-md">
                          {c.phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                        </div>
                        <div className="text-[10px] text-gray-400">จดทะเบียน: {c.aisAccountName}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate">
                        <span className="font-medium text-gray-800">{c.packageName}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-xs font-mono text-gray-500">{c.contractNumber}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">฿{c.monthlyCost.toLocaleString()}</td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className={`text-xs ${isExpired ? 'text-red-500 font-semibold' : isExpiringSoon ? 'text-amber-600 font-semibold h-animate-pulse' : 'text-gray-500'}`}>
                          {c.contractEndDate}
                          {isExpired && <span className="block text-[9px] text-red-500">(หมดอายุ)</span>}
                          {isExpiringSoon && <span className="block text-[9px] text-amber-500">(เตือนหมดอายุ &lt; 30 วัน)</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {c.linkedAssetId ? (
                          <div className="flex items-center gap-1">
                            <span className="p-1 px-2 font-bold font-mono text-[10px] bg-emerald-50 rounded border border-emerald-250 text-emerald-800">
                              {c.linkedAssetId}
                            </span>
                            {userRole === 'admin' && (
                              <button 
                                onClick={() => handleUnloadAssetLink(c.phoneNumber)}
                                title="ปลดการเชื่อมโยงมือถือ" 
                                className="text-red-400 hover:text-red-700 p-0.5 cursor-pointer hover:bg-red-50 rounded"
                              >
                                <Link2Off size={11} />
                              </button>
                            )}
                          </div>
                        ) : (
                          userRole === 'admin' ? (
                            <button
                              onClick={() => handleOpenLinkAsset(c.phoneNumber, c.linkedAssetId)}
                              className="text-[11px] text-blue-600 bg-blue-50 border border-blue-200 p-1 px-2.5 rounded-lg font-bold hover:bg-blue-100 cursor-pointer flex items-center gap-1"
                            >
                              <Link size={12} />
                              <span>เข้าคู่อุปกรณ์</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">ไม่ได้ติดตั้งในเครื่องใดๆ</span>
                          )
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          c.contractStatus === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : c.contractStatus === 'Expired' || isExpired
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {c.contractStatus === 'Active' && !isExpired ? 'เปิดสัญญาบริการ' : 'หมดประกัน / อายุ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewDetail(c)}
                            title="ดูประวัติการผูกเบอร์พนักงาน"
                            className="p-1 px-2 text-slate-700 bg-slate-50 border border-gray-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
                          >
                            <Eye size={13} />
                            <span>ดูเบอร์</span>
                          </button>
                          
                          {userRole === 'admin' && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="p-1 text-slate-500 hover:text-slate-800 border border-transparent hover:border-gray-200 rounded transition-colors cursor-pointer"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(c.phoneNumber)}
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

      {/* MODAL 1: DETAIL VIEWER WITH COMPREHENSIVE LINKS */}
      {detailModalOpen && selectedContract && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-brand-primary text-slate-900 font-bold font-mono text-xs rounded-md">AIS SIM Detail</span>
                <h3 className="text-lg font-bold text-gray-800">ข้อมูลสัญญาเบอร์ {selectedContract.phoneNumber}</h3>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">หมายเลขโทรศัพท์</span>
                  <p className="text-lg font-bold text-emerald-700">{selectedContract.phoneNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">เครือข่ายสัญญาณ</span>
                  <p className="text-zinc-800 font-bold">{selectedContract.carrier || 'AIS'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">เลขที่สัญญาจดทะเบียน (AIS Contract No.)</span>
                  <p className="text-gray-700 font-mono font-semibold">{selectedContract.contractNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">ชื่อแพ็กเกจ (Package)</span>
                  <p className="text-gray-700 text-sm font-semibold">{selectedContract.packageName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">ค่าบริการรายเดือนสุทธิ</span>
                  <p className="text-gray-900 font-bold text-md">฿{selectedContract.monthlyCost} / เดือน</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">จดทะเบียนในชื่อบัญชี</span>
                  <p className="text-gray-700 text-xs">{selectedContract.aisAccountName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">วันเริ่มต้นสัญญาใช้งาน</span>
                  <p className="text-gray-700 text-xs">{selectedContract.contractStartDate}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">วันสิ้นสุดพันธะสัญญาค้างของ AIS</span>
                  <p className="text-gray-700 text-xs font-semibold">{selectedContract.contractEndDate}</p>
                </div>
              </div>

              {/* Connected Asset specs */}
              {contractDetails?.linkedAsset ? (
                <div className="p-4 bg-slate-50 border border-gray-250 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">อุปกรณ์มือถือที่สวมใส่ซิมนี้อยู่</span>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-150">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{contractDetails.linkedAsset.name}</h4>
                      <p className="text-xs text-gray-500">รหัสสิ่งของ: {contractDetails.linkedAsset.id} | ยี่ห้อ: {contractDetails.linkedAsset.brand}</p>
                      <p className="font-mono text-[10px] text-gray-400">IMEI: {contractDetails.linkedAsset.imei}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                      พ่วงอุปสงค์
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/40 border border-amber-250 rounded-xl text-center text-amber-800 text-xs font-semibold">
                  ซิมเกยตื้นลอย (ยังไม่มีอุปกรณ์ใดๆ มารองรับติดตั้งซิมนี้ เหมาะสำหรับเปิดไลน์สำรอง)
                </div>
              )}

              {/* Assignment trail for this line */}
              <div className="pt-3 border-t">
                <span className="text-[10px] font-bold text-gray-400 block uppercase mb-2">ประวัติพนักงานที่ถือครองเบอร์ AIS นี้ย้อนหลัง</span>
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {contractDetails?.history && contractDetails.history.length > 0 ? (
                    contractDetails.history.map((h: any, i: number) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-gray-200 rounded text-xs flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">{h.employeeName} ({h.employeeId})</p>
                          <p className="text-[10px] text-gray-400">ส่งมอบ: {h.assignmentDate} {h.returnDate && `| คืนเครื่อง: ${h.returnDate}`}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          h.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {h.status === 'Active' ? 'กำลังครองใช้งาน' : 'นำส่งคืนแล้ว'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">ไม่มีบันทึกข้อมูลการจ่ายเบอร์นี้ให้กับรายบุคคล</p>
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                ปิดสารบบสัญญา
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ADD & EDIT CONTRACT FORM */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-md font-bold text-gray-800">
                {isEditMode ? `แก้ไขรายละเอียดสัญญาสัญญาเบอร์ ${formPhone}` : 'ขึ้นทะเบียนซิมรายเดือนใหม่ (AIS)'}
              </h3>
              <button 
                onClick={() => setFormModalOpen(false)} 
                className="p-1 text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4">
                
                {errorText && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-red-100">
                    <AlertTriangle size={15} />
                    <span>{errorText}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">หมายเลขโทรศัพท์ 10 หลัก*</label>
                  <input
                    type="text"
                    disabled={isEditMode}
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="e.g. 0819238475"
                    className="w-full p-2 border border-gray-250 rounded-lg text-sm font-mono tracking-tight text-md disabled:bg-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ผู้ให้บริการ (Carrier)</label>
                    <input
                      type="text"
                      disabled
                      value={formCarrier}
                      className="w-full p-2 border border-gray-250 bg-gray-50 rounded-lg text-sm text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">เลขที่เอกสารสัญญา (AIS No)*</label>
                    <input
                      type="text"
                      value={formContractNo}
                      onChange={(e) => setFormContractNo(e.target.value)}
                      placeholder="e.g. AIS-CON-XXXX"
                      className="w-full p-2 border border-gray-250 rounded-lg text-xs font-mono"
                    />
                  </div>

                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ชื่อแพ็กเกจอินเทอร์เน็ต/โทร*</label>
                  <input
                    type="text"
                    value={formPackage}
                    onChange={(e) => setFormPackage(e.target.value)}
                    placeholder="e.g. AIS 5G Ultra Max Speed 1199 (เน็ตไม่อั้น)"
                    className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ค่าใช้บริการรายเดือนหลัก (บาท)</label>
                    <input
                      type="number"
                      value={formCost}
                      onChange={(e) => setFormCost(Number(e.target.value))}
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ชื่อบัญชีเจ้าของลิขสิทธิ์</label>
                    <input
                      type="text"
                      value={formAisAccount}
                      onChange={(e) => setFormAisAccount(e.target.value)}
                      className="w-full p-2 border border-gray-250 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">วันมีผลเริ่มคุ้มครองสัญญา</label>
                    <input
                      type="date"
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">วันเซ็นรับภาระสิ้นสุดสัญญากด</label>
                    <input
                      type="date"
                      value={formEnd}
                      onChange={(e) => setFormEnd(e.target.value)}
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>

                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">สถานะสัญญารูปซิม</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-250 bg-white rounded-lg text-sm"
                  >
                    <option value="Active">เปิดใช้งานสัญญา (Active)</option>
                    <option value="Expired">สัญญาครบกำหนดอายุความ (Expired)</option>
                    <option value="Terminated">ระเบียบยกเลิกถาวรไลน์ (Terminated)</option>
                  </select>
                </div>

              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  บันทึกสัญญาซิม
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PAIR DEVICE LINK ASSISTANT */}
      {linkAssetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full">
            
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-md font-bold text-gray-800">เชื่อมต่อซิม ({currentPhoneToLink}) เข้าเครื่อง</h3>
              <button 
                onClick={() => setLinkAssetModalOpen(false)} 
                className="p-1 text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLinkAssetSubmit}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500">
                  กรุณาเลือกอุปกรณ์สื่อสารหรือแท็บเล็ตว่าง (Spare) ด้านล่างที่จะทำการผูกเบอร์ AIS นี้ เพื่อความแม่นยำในการคุมคลังและตรวจสอบภายหลัง
                </p>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">เลือกอุปกรณ์ในระบบ</label>
                  <select
                    value={selectedAssetIdToLink}
                    onChange={(e) => setSelectedAssetIdToLink(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-250 rounded-lg text-sm"
                  >
                    <option value="">-- ไม่เชื่อมต่อ (ลอยเบอร์เปล่า) --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.id} - {a.brand} {a.name} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLinkAssetModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary text-slate-900 font-bold rounded-lg cursor-pointer hover:bg-brand-hover"
                >
                  ลงทะเบียนจับคู่เครื่อง
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
