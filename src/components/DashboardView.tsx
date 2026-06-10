import React, { useState } from 'react';
import { 
  BarChart, Bar, Cell, 
  PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Smartphone, FileText, AlertTriangle, UserCheck, ShieldAlert, 
  HelpCircle, BarChart3, TrendingUp, Briefcase, BellOff, CheckCircle2 
} from 'lucide-react';
import { DashboardStats, SystemNotification } from '../types';

interface DashboardViewProps {
  stats: DashboardStats;
  notifications: SystemNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigateToTab: (tab: string) => void;
  userRole: 'admin' | 'user';
}

export default function DashboardView({
  stats,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateToTab,
  userRole,
}: DashboardViewProps) {
  
  const unreadNotifications = notifications.filter(n => !n.isRead);

  // Transform department cost map to array for Recharts
  const deptData = Object.entries(stats.departmentCost).map(([name, cost]) => ({
    name,
    cost
  }));

  // Transform status map to array
  const statusColors: Record<string, string> = {
    Active: '#10B981', // green
    Spare: '#3B82F6',  // blue
    Repair: '#F59E0B', // amber
    Lost: '#EF4444',   // red
    Retired: '#6B7280' // gray
  };

  const statusData = Object.entries(stats.byStatus).map(([name, value]) => ({
    name: name === 'Active' ? 'กำลังใช้งาน (Active)' :
          name === 'Spare' ? 'เครื่องสำรอง (Spare)' :
          name === 'Repair' ? 'ส่งซ่อม (Repair)' :
          name === 'Lost' ? 'สูญหาย (Lost)' : 'ตัดชำรุด (Retired)',
    value,
    color: statusColors[name] || '#CBD5E1'
  })).filter(item => item.value > 0);

  // Contract Expiration Alerts
  const contractsExpiring = notifications.filter(n => n.type === 'contract_expiry');
  const overdueReturns = notifications.filter(n => n.type === 'overdue_return');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-brand-primary text-slate-900 font-bold px-3 py-1 text-xs rounded-full uppercase tracking-wider">
            AIS Telecom Enterprise Portal
          </span>
          <h1 className="text-2xl font-bold mt-3">ระบบจัดการคุ้มครองอุปกรณ์สื่อสารและซิม AIS</h1>
          <p className="text-gray-300 text-sm mt-1 max-w-xl">
            ยินดีต้อนรับเข้าสู่ระบบจัดการแบบรวมศูนย์ ค้นหาข้อมูลเครื่อง เบอร์รายเดือน คาร์ริเออร์ AIS และประวัติเซ็นรับมอบพนักงานได้ทันที
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-5 translate-y-5">
          <Smartphone size={240} className="text-white" />
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Devices */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">อุปกรณ์ทั้งหมด</span>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
              <Smartphone size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-800">{stats.totalDevices}</h3>
            <p className="text-xs text-gray-400 mt-1">เครื่องในระบบ</p>
          </div>
        </div>

        {/* Active Contracts */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">สัญญาใช้งานคู่เบอร์</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-emerald-600">{stats.activeContracts}</h3>
            <p className="text-xs text-emerald-500 mt-1">เบอร์ AIS Active</p>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">สัญญาใกล้หมดอายุ</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500 animate-pulse">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-amber-600">{stats.contractsExpiringSoon}</h3>
            <p className="text-xs text-amber-500 mt-1">ภายใน 60 วัน</p>
          </div>
        </div>

        {/* Active Handover Devices */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">ส่งมอบพนักงาน</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-blue-600">{stats.assignedDevices}</h3>
            <p className="text-xs text-blue-400 mt-1">เครื่องที่มีผู้ครอง</p>
          </div>
        </div>

        {/* Spare Devices */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">สต็อกสำรองใช้</span>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-purple-600">{stats.spareDevices}</h3>
            <p className="text-xs text-purple-400 mt-1">เครื่องพร้อมเบิก</p>
          </div>
        </div>

        {/* Monthly bill summary */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">ยอดบิลรายเดือน</span>
            <div className="p-2 bg-lime-100 rounded-lg text-brand-primary">
              <span className="font-bold text-xs">฿</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">
              ฿{stats.monthlyCost.toLocaleString()}
            </h3>
            <p className="text-xs text-brand-primary mt-1">รวมทุกเบอร์ AIS</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Graphs + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Urgent System Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
              <h2 className="text-md font-bold text-gray-800">แจ้งเตือนสัญญา & การรับประกันสำคัญ</h2>
            </div>
            {unreadNotifications.length > 0 && (
              <button 
                onClick={onMarkAllNotificationsRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-md font-medium transition-colors"
              >
                ทำเครื่องหมายอ่านหมดแล้ว ({unreadNotifications.length})
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-400 flex flex-col items-center justify-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-500" />
                <p className="text-sm font-medium">ทุกข้อมูลอัปเดตเรียบร้อย ไม่มีสัญญาหมดอายุระยะกระชั้นชิด</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3.5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                    notif.isRead 
                      ? 'bg-gray-50 border-gray-150 text-gray-500' 
                      : notif.severity === 'danger'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {notif.type === 'contract_expiry' ? (
                        <ShieldAlert className={notif.isRead ? 'text-gray-400' : 'text-amber-500'} size={20} />
                      ) : (
                        <AlertTriangle className={notif.isRead ? 'text-gray-400' : 'text-rose-500'} size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        {notif.title}
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        )}
                      </h4>
                      <p className="text-xs mt-0.5 opacity-90">{notif.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (notif.type === 'contract_expiry') {
                          onNavigateToTab('Contracts');
                        } else {
                          onNavigateToTab('Assets');
                        }
                      }}
                      className="text-xs underline font-semibold cursor-pointer hover:opacity-80"
                    >
                      ตรวจสอบข้อมูล
                    </button>
                    {!notif.isRead && (
                      <button
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className="text-xs bg-white text-gray-700 px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 font-medium cursor-pointer"
                      >
                        รับทราบแล้ว
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Device Status Breakdown (Donut Chart) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-md font-bold text-gray-800">สถานะอุปกรณ์ในองค์กร</h2>
            <p className="text-xs text-gray-400 mt-1">แบ่งตามสถานะพร้อมใช้งาน หรือ ส่งดูแลรักษา</p>
          </div>
          
          <div className="h-[230px] my-4 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} เครื่อง`, 'จำนวน']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-xs">ไม่มีข้อมูลอุปกรณ์</div>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            {statusData.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold">{item.value} เครื่อง</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cost by Department (Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs p-5">
          <div className="mb-4">
            <h2 className="text-md font-bold text-gray-800">ค่าใช้จ่ายเทเลคอมคอร์ปอเรต รายแผนก (บาท/เดือน)</h2>
            <p className="text-xs text-gray-400 mt-1">สรุปจากเบอร์จัดมอบพนักงานรายเดือนทั้งหมดของ AIS</p>
          </div>

          <div className="h-[280px]">
            {deptData.length > 0 && deptData.some(d => d.cost > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'ค่าใช้จ่ายรายเดือน']} />
                  <Bar dataKey="cost" fill="#96D11F" radius={[4, 4, 0, 0]}>
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#96D11F' : '#7EB316'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 bg-gray-50 rounded-lg text-gray-400">
                <TrendingUp size={36} className="mb-2 opacity-55" />
                <p className="text-xs">ไม่พบรายการค่าใช้จ่ายรายแผนก (ยังไม่มีการจ่ายเบอร์ AIS ให้พนักงาน)</p>
              </div>
            )}
          </div>
        </div>

        {/* Handover & Help Quick Links */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-md font-bold text-gray-800">ข้อมูลและข่ายบริการช่วยเหลือ</h2>
            <p className="text-xs text-gray-400 mt-1">คู่มือเร่งด่วนสำหรับผู้ใช้งานและระบบ</p>
          </div>
          
          <div className="space-y-3.5 my-4">
            <div className="flex gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 h-10 w-10 flex items-center justify-center shrink-0">
                <Briefcase size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">ทำไมอุปกรณ์ถึงจัดกลุ่มกระจัดกระจาย?</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  เนื่องจากในอดีตไม่มีการคีย์ใบส่งมอบ จึงแก้โดยการอิงรหัสพนักงาน (EMP-XXXX) ชนคู่หมายเลขสัญญา AIS ในระบบทันทีเพื่อผูกสัญญากลับมาให้ครบถ้วน
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 h-10 w-10 flex items-center justify-center shrink-0">
                <Smartphone size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">ฟีเจอร์ QR Code สแกนบนป้ายทรัพย์สิน</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  แท็บ "เครื่องโทรศัพท์มือถือ" สามารถสั่งพิมพ์ QR Code ประจำสินค้าเพื่อนำไปแปะหลังตัวเครื่องโทรศัพท์ใดๆ เมื่อสแกนจะลิงก์เข้ามาดูหน้าดีเทลพร้อมผู้ถือครองปัจจุบันทันที
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <button
              onClick={() => onNavigateToTab('Assignments')}
              className="w-full py-2 bg-slate-900 border border-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-800 text-center transition-all"
            >
              บันทึกส่งมอบด่วน
            </button>
            <button
              onClick={() => onNavigateToTab('Documents')}
              className="w-full py-2 bg-slate-50 border border-gray-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-100 text-center transition-all"
            >
              คลังสัญญาแนบ PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
