import React, { useState } from 'react';
import { 
  Plus, Search, UserCheck, Calendar, ArrowLeftRight, ClipboardCheck, 
  Trash2, X, AlertCircle, Sparkles, CheckCircle, Info 
} from 'lucide-react';
import { AssignmentHistory, Asset, SIMContract, Employee } from '../types';

interface AssignmentHubViewProps {
  assignments: AssignmentHistory[];
  employees: Employee[];
  assets: Asset[];
  contracts: SIMContract[];
  onAssignDevice: (data: {
    employeeId: string;
    assetId: string;
    phoneNumber: string | null;
    notes: string;
    assignmentDate: string;
  }) => Promise<any>;
  onReturnDevice: (data: {
    assignmentId: string;
    notes: string;
    returnDate: string;
  }) => Promise<any>;
  onRefresh: () => void;
  userRole: 'admin' | 'user';
}

export default function AssignmentHubView({
  assignments,
  employees,
  assets,
  contracts,
  onAssignDevice,
  onReturnDevice,
  onRefresh,
  userRole
}: AssignmentHubViewProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  
  // Assignment Form Modal States
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignError, setAssignError] = useState('');

  // Return Form Modal States
  const [activeAsgToReturn, setActiveAsgToReturn] = useState<AssignmentHistory | null>(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnError, setReturnError] = useState('');

  // Dropdown filtering helpers
  const spareAssets = assets.filter(a => a.status === 'Spare' && !a.isDeleted);
  
  // Contracts that are active and not currently assigned/linked with another active assignee
  const activeUnassignedSIMs = contracts.filter(c => {
    if (c.isDeleted || c.contractStatus !== 'Active') return false;
    // check if this phone number matches an active assignment in the assignments array
    const isActiveInAssignment = assignments.some(asg => asg.phoneNumber === c.phoneNumber && asg.status === 'Active');
    return !isActiveInAssignment;
  });

  const handleOpenAssign = () => {
    if (employees.length === 0) {
      alert('กรุณาไปลงทะเบียนรายชื่อพนักงานในระบบก่อนทำรายการส่งมอบ');
      return;
    }
    if (spareAssets.length === 0) {
      alert('ขณะนี้ไม่มีอุปกรณ์สำรอง (Spare) ว่างในสต็อกที่จะจัดสรรได้ กรุณาไปเพิ่มอุปกรณ์หรือทำเรื่องคืนอุปกรณ์เสียก่อน');
      return;
    }

    setSelectedEmpId(employees[0]?.id || '');
    setSelectedAssetId(spareAssets[0]?.id || '');
    setSelectedPhone('');
    setAssignNotes('');
    setAssignDate(new Date().toISOString().split('T')[0]);
    setAssignError('');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');

    if (!selectedEmpId || !selectedAssetId) {
      setAssignError('กรุณาเลือกพนักงาน และ อุปกณ์โทรศัพท์เพื่อสร้างใบรับมอบสิทธิ์');
      return;
    }

    try {
      await onAssignDevice({
        employeeId: selectedEmpId,
        assetId: selectedAssetId,
        phoneNumber: selectedPhone ? selectedPhone : null,
        notes: assignNotes,
        assignmentDate: assignDate
      });
      setAssignModalOpen(false);
      onRefresh();
      alert('ลงบันทึกใบเซ็นส่งมอบสมาร์ทโฟนสำเร็จ!');
    } catch (err: any) {
      setAssignError(err.message || 'จัดสันทรัพย์สินล้มเหลว');
    }
  };

  const handleOpenReturn = (asg: AssignmentHistory) => {
    setActiveAsgToReturn(asg);
    setReturnNotes('');
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnError('');
    setReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError('');

    if (!activeAsgToReturn) return;

    try {
      await onReturnDevice({
        assignmentId: activeAsgToReturn.id,
        notes: returnNotes,
        returnDate: returnDate
      });
      setReturnModalOpen(false);
      onRefresh();
      alert('บันทึกคืนอุปกรณ์เข้าหมวดคลังสำรอง (Spare) เรียบร้อยแล้ว!');
    } catch (err: any) {
      setReturnError(err.message || 'คืนขัดข้อง');
    }
  };

  // Filter history log
  const filteredAssignments = assignments.filter(asg => {
    const term = searchTerm.toLowerCase();
    return (
      asg.employeeName.toLowerCase().includes(term) ||
      asg.employeeId.toLowerCase().includes(term) ||
      asg.assetId.toLowerCase().includes(term) ||
      asg.assetName.toLowerCase().includes(term) ||
      (asg.phoneNumber && asg.phoneNumber.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Handover summary alert to resolve painpoint */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
          <ClipboardCheck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-950">โมดูลจัดระเบียบสารบรรณพนักงานลาออก / เข้าใหม่</h4>
          <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
            เมื่อมีพนักงานใหม่ สามารถกด "บันทึกส่งมอบใบเครื่อง" เพื่อผูกเบอร์ AIS และเครื่องเข้าประวัติพนักงานทันที 
            และหากแผนกหรือหัวหน้าสัญญารับแจ้งลาออก เพียงกด **"คืนอุปกรณ์"** ด้านหลังตาราง ระบบจะเคลียร์ความคุ้มครอง คืนเครื่องสู่สต็อก และปลดเบอร์กลับมาให้อัตโนมัติ โดยเก็บประวัติการถือครองครั้งนี้ไว้เต็มรอย
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-3xs">
        
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อพนักงาน, รหัสพนักงาน, อุปกรณ์, เบอร์โทรรายเดือน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {userRole === 'admin' && (
          <button
            onClick={handleOpenAssign}
            className="flex items-center gap-1.5 py-2 px-4 bg-brand-primary text-slate-900 rounded-lg text-xs font-bold hover:bg-brand-hover transition-colors cursor-pointer"
          >
            <UserCheck size={16} />
            <span>กระทำบันทึกส่งมอบใบเครื่อง</span>
          </button>
        )}
      </div>

      {/* Grid of Handovers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-150 bg-gray-50 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">ประวัติบันทึกการครอบครองทรัพย์สินทั้งหมดในบริษัท</h3>
          <span className="text-[11px] font-semibold text-gray-400">จำนวนทั้งหมด {assignments.length} รายการ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">ผู้สิทธิ์ใช้ (พนักงาน)</th>
                <th className="py-3 px-4">เครื่องโทรศัพท์มือถือ</th>
                <th className="py-3 px-4">เบอร์พ่วงรายเดือน AIS</th>
                <th className="py-3 px-4">วันส่งมอบ</th>
                <th className="py-3 px-4">วันส่งคืนกลับ</th>
                <th className="py-3 px-4">สถานะครอง</th>
                <th className="py-3 px-4 text-center">จัดการคืน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-xs text-gray-700">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 italic">
                    ไม่พบรายการประวัติเซ็นรับมอบสิทธิ์อุปกรณ์
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asg, index) => {
                  return (
                    <tr key={asg.id || index} className="table-row-hover hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{asg.employeeName}</div>
                        <div className="text-[10px] text-gray-400">ID: {asg.employeeId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{asg.assetName}</div>
                        <div className="text-[10px] text-teal-600 font-mono font-bold">รหัส: {asg.assetId}</div>
                      </td>
                      <td className="py-3 px-4">
                        {asg.phoneNumber ? (
                          <div className="font-bold text-emerald-700 font-mono">
                            {asg.phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">- ไม่มีแพ็กเกจเบอร์ -</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{asg.assignmentDate}</td>
                      <td className="py-3 px-4">
                        {asg.returnDate ? (
                          <span className="text-gray-500 font-semibold">{asg.returnDate}</span>
                        ) : (
                          <span className="text-emerald-600 font-extrabold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150">ไม่มีกำหนด</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          asg.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {asg.status === 'Active' ? 'กำลังถือครอง' : 'คืนเครื่องแล้ว'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {asg.status === 'Active' ? (
                          userRole === 'admin' ? (
                            <button
                              onClick={() => handleOpenReturn(asg)}
                              className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded text-[11px] font-bold cursor-pointer transition-all"
                            >
                              ลงบิลคืนเครื่อง
                            </button>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">สิทธิ์จำกัด</span>
                          )
                        ) : (
                          <div className="text-center text-gray-400 font-medium text-[11px] flex justify-center items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                            <span>คืนเครื่องเรียบร้อย</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD HANDOVER RECORD (ASSIGN) */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-xl w-full">
            
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-sm font-bold text-gray-800">เซ็นใบรับส่งมอบหน้าเครื่องสื่อสาร</h3>
              <button onClick={() => setAssignModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-900 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="p-6 space-y-4">
                
                {assignError && (
                  <div className="p-3 bg-red-100 text-red-800 rounded border border-red-250 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle size={15} />
                    <span>{assignError}</span>
                  </div>
                )}

                {/* Employee select */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">เลือกผู้เบิกจับมอบ (พนักงาน)*</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-250 rounded-lg text-sm"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.id}) - แผนก: {e.department}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Spare device select */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">เลือกสินทรัพย์สำรองที่เข้าคลัง (Spare)*</label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-250 rounded-lg text-sm"
                  >
                    {spareAssets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.id} - {a.brand} {a.name} (S/N: {a.serialNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available SIM select */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">เลือกเบอร์โทรศัพท์ AIS ว่างที่จะจ่ายพ่วง (ออปชันนัล)</label>
                  <select
                    value={selectedPhone}
                    onChange={(e) => setSelectedPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-250 rounded-lg text-sm"
                  >
                    <option value="">-- ไม่จ่ายเบอร์ (เครื่องเปล่าสำหรับ Wi-Fi หรือหน้าจอสั่งงาน) --</option>
                    {activeUnassignedSIMs.map(c => (
                      <option key={c.phoneNumber} value={c.phoneNumber}>
                        {c.phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')} (สัญญารายเดือน ฿{c.monthlyCost})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">วันที่ทำส่งมอบเครื่อง</label>
                    <input
                      type="date"
                      value={assignDate}
                      onChange={(e) => setAssignDate(e.target.value)}
                      className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ขยายความบันทึกย้อนหลัง (Notes)</label>
                  <textarea
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="e.g. ตรวจสอบคุณภาพจอปกติ ไม่มีรอยขนแมว พร้อมแถมที่ชาร์จและฟิล์มกระจก..."
                    rows={2}
                    className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                  ></textarea>
                </div>

              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-150 rounded-b-2xl flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-100 cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  ลงทะเบียนเซ็นมอบสิทธิ์
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: EQUIPMENT RETURN DIALOG */}
      {returnModalOpen && activeAsgToReturn && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full">
            
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-sm font-bold text-gray-800">ทำรายการเซ็นหนังสือตรวจรับสินทรัพย์คืน</h3>
              <button onClick={() => setReturnModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-900 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit}>
              <div className="p-6 space-y-4">
                
                {returnError && (
                  <div className="p-3 bg-red-100 text-red-800 rounded border border-red-200 text-xs font-semibold">
                    {returnError}
                  </div>
                )}

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-slate-800">รายละเอียดใบส่งมอบสิทธิ์:</p>
                  <div>ผู้ครอง: <span className="font-bold text-gray-900">{activeAsgToReturn.employeeName}</span></div>
                  <div>อุปกรณ์โทรศัพท์: <span className="font-bold text-gray-900">{activeAsgToReturn.assetName}</span> ({activeAsgToReturn.assetId})</div>
                  {activeAsgToReturn.phoneNumber && (
                    <div>เบอร์ไอเอสพ่วง: <span className="font-bold text-emerald-800">{activeAsgToReturn.phoneNumber}</span></div>
                  )}
                  <div>วันที่ส่งมอบเริ่มแรก: <span className="font-semibold text-gray-700">{activeAsgToReturn.assignmentDate}</span></div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">วันที่ทำนำส่งตรวจสอบคืนที่คลัง</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">บันทึกตรวจรับสภาพเครื่อง*</label>
                  <textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="ระบุรอยขีดข่วน สภาพแบตเตอรี่ หรือว่าชำรุดเสียหายไหม..."
                    rows={3}
                    required
                    className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                  ></textarea>
                </div>

              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-150 rounded-b-2xl flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
                >
                  ยืนยันการเคลียร์เครื่องสมบูรณ์
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
