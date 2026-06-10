import React, { useState } from 'react';
import { 
  Plus, Search, Edit, Trash2, Mail, Briefcase, Eye, X, 
  UserPlus, AlertCircle, Calendar, Smartphone, CheckSquare 
} from 'lucide-react';
import { Employee, AssignmentHistory } from '../types';

interface EmployeeManagerViewProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'isDeleted'>) => Promise<any>;
  onEditEmployee: (id: string, updates: Partial<Employee>) => Promise<any>;
  onDeleteEmployee: (id: string) => Promise<any>;
  onRefresh: () => void;
  userRole: 'admin' | 'user';
}

export default function EmployeeManagerView({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onRefresh,
  userRole
}: EmployeeManagerViewProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  
  // Detail supplementary state
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [pastLoans, setPastLoans] = useState<any[]>([]);

  // Form states
  const [isEditMode, setIsEditMode] = useState(false);
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('Sales & Business');
  const [formEmail, setFormEmail] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleViewDetail = async (emp: Employee) => {
    setSelectedEmp(emp);
    setDetailModalOpen(true);
    try {
      const res = await fetch(`/api/employees/${emp.id}`);
      if (res.ok) {
        const fullDetails = await res.json();
        // Separate historical from current active
        const hist = fullDetails.history || [];
        setActiveLoans(hist.filter((h: any) => h.status === 'Active'));
        setPastLoans(hist.filter((h: any) => h.status !== 'Active'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormId(`EMP-${1000 + employees.length + 1}`);
    setFormName('');
    setFormDept('Sales & Business');
    setFormEmail('');
    setErrorText('');
    setFormModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setIsEditMode(true);
    setFormId(emp.id);
    setFormName(emp.name);
    setFormDept(emp.department);
    setFormEmail(emp.email);
    setErrorText('');
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!formId || !formName || !formEmail) {
      setErrorText('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    const payload = {
      id: formId,
      name: formName,
      department: formDept,
      email: formEmail
    };

    try {
      if (isEditMode) {
        await onEditEmployee(formId, payload);
      } else {
        await onAddEmployee(payload);
      }
      setFormModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorText(err.message || 'บันทึกผิดพลาด');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`คุณต้องการยืนยันการลบรายชื่อพนักงานรหัส ${id} หรือไม่?`)) {
      try {
        await onDeleteEmployee(id);
        onRefresh();
        if (detailModalOpen && selectedEmp?.id === id) {
          setDetailModalOpen(false);
        }
      } catch (err: any) {
        alert(err.message || 'ลบล้มเหลว');
      }
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      e.id.toLowerCase().includes(term) ||
      e.name.toLowerCase().includes(term) ||
      e.department.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-3xs">
        
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาพนักงานตามชื่อจริง, รหัสไอดีแผนก หรืออีเมลบริษัท..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {userRole === 'admin' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 py-2 px-4 bg-brand-primary text-slate-900 rounded-lg text-xs font-bold hover:bg-brand-hover transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>เพิ่มรายชื่อพนักงานเกลี่ย</span>
          </button>
        )}
      </div>

      {/* Employees grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full py-16 bg-white border rounded-xl text-center text-gray-450 text-xs">
            ไม่พบรายชื่อพนักงานตรงกับคำค้นหา
          </div>
        ) : (
          filteredEmployees.map(emp => (
            <div key={emp.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-3xs flex flex-col justify-between transition-all hover:shadow-xs hover:border-gray-300">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                    {emp.id}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Briefcase size={12} className="text-gray-400" />
                    <span>{emp.department}</span>
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-md">{emp.name}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <Mail size={12} className="shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => handleViewDetail(emp)}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-gray-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye size={13} />
                  <span>ดูข้อมูลเครื่องเบิก</span>
                </button>

                {userRole === 'admin' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 border border-transparent hover:border-gray-250 rounded cursor-pointer"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 border border-transparent hover:border-red-150 rounded cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: EMPLOYEE DETAIL & ACTIVE LOAN STATUS */}
      {detailModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-brand-primary text-slate-00 font-bold text-xs rounded-md">EMP Profile</span>
                <h3 className="text-md font-bold text-gray-800">ข้อมูลสิทธิ์และการเบิกสินค้าของ {selectedEmp.name}</h3>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-900 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Profile Box */}
              <div className="bg-slate-55 p-4 rounded-xl border border-gray-150 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">รหัสพนักงาน</span>
                  <p className="font-mono font-bold text-gray-800">{selectedEmp.id}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">แผนกที่สังกัด</span>
                  <p className="font-semibold text-gray-850">{selectedEmp.department}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">อีเมลบริษัทเพื่อทำใบเสนอราคา</span>
                  <p className="text-gray-700 text-sm">{selectedEmp.email}</p>
                </div>
              </div>

              {/* Active equipment list */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <Smartphone size={14} className="text-teal-600" />
                  <span>อุปกรณ์และเบอร์ AIS ที่ถือครองปัจจุบัน ({activeLoans.length})</span>
                </h4>

                <div className="space-y-2.5">
                  {activeLoans.length === 0 ? (
                    <p className="text-xs text-gray-400 italic p-4 bg-gray-50 border border-dashed rounded-lg text-center">
                      พนักงานท่านนี้ยังไม่ได้ทำการเบิกเครื่อง และไม่มีการผูกเบอร์องค์กรในเวลานี้
                    </p>
                  ) : (
                    activeLoans.map((loan, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/55 border border-emerald-250 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{loan.assetName}</div>
                          <div className="text-xs text-gray-500">รหัสสิ่งของ: {loan.assetId} | วันรับส่งมอบ: {loan.assignmentDate}</div>
                          {loan.phoneNumber && (
                            <div className="text-xs text-emerald-800 mt-1">เบอร์พ่วงรายเดือน AIS: <span className="font-mono font-bold">{loan.phoneNumber}</span></div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-full uppercase shrink-0">
                          ถือครองใช้งาน
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Historic loans */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-gray-500" />
                  <span>ประวัติคืนอุปกรณ์และซิมย้อนหลัง ({pastLoans.length})</span>
                </h4>

                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {pastLoans.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">ไม่มีข้อมูลการเคลียร์หรือคืนสัมภาระย้อนหลัง</p>
                  ) : (
                    pastLoans.map((loan, idx) => (
                      <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200 rounded text-xs flex justify-between items-center text-gray-600">
                        <div>
                          <p className="font-semibold">{loan.assetName} ({loan.assetId})</p>
                          <p className="text-[10px] text-gray-400">วันเซ็นมอบ: {loan.assignmentDate} | นำส่งเช็กสภาพคืน: {loan.returnDate}</p>
                          {loan.notes && <p className="text-[10px] text-amber-800 italic font-serif mt-1">"{loan.notes}"</p>}
                        </div>
                        <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                          ส่งคืนสต็อกแล้ัว
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                ปิดประวัติพนักงาน
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ADD & EDIT EMPLOYEE FORM */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full">
            
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50 rounded-t-2xl animate-fade-in">
              <h3 className="text-md font-bold text-gray-800">
                {isEditMode ? 'แก้ไขข้อมูลพนักงาน' : 'บันทึกสมัครพนักงานขยับสิทธิ์'}
              </h3>
              <button onClick={() => setFormModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-900 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4">
                {errorText && (
                  <div className="p-3 bg-red-50 text-red-800 rounded border border-red-200 text-xs flex items-center gap-1.5 font-semibold">
                    <AlertCircle size={15} />
                    <span>{errorText}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">รหัสพนักงาน (ID)*</label>
                  <input
                    type="text"
                    disabled={isEditMode}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="e.g. EMP-1005"
                    className="w-full p-2 border border-gray-250 rounded-lg text-sm font-mono disabled:bg-gray-150"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ชื่อ-นามสกุลพนักงาน*</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. สมศักดิ์ รักชาติ"
                    className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">แผนกพนักงานสิทธิ์เบิก</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-250 rounded-lg text-sm"
                  >
                    <option value="Sales & Business">Sales & Business (ฝ่ายการตลาดและงานสิทธิ์)</option>
                    <option value="IT Support">IT Support (คอมพิวเตอร์และข่ายเสาสัญญาณ)</option>
                    <option value="Engineering Outsource">Engineering Outsource (วิศวกรออกตรวจหน้างาน)</option>
                    <option value="Marketing Creative">Marketing Creative (สื่อมีเดียและโฆษณา)</option>
                    <option value="Human Resource">Human Resource (ฝ่ายทรัพยากรบุคคล)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">อีเมลติดต่อบริษัท*</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. name@company.com"
                    className="w-full p-2 border border-gray-250 rounded-lg text-sm"
                  />
                </div>

              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-150 rounded-b-2xl flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  ยืนยันบันทึกพนักงาน
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
