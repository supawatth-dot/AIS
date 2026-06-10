import React, { useState } from 'react';
import { Clipboard, Shield, User, Clock, Search, HelpCircle, FileTerminal } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogsViewProps {
  logs: ActivityLog[];
}

export default function ActivityLogsView({ logs }: ActivityLogsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l => {
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.details.toLowerCase().includes(term) ||
      l.user.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-3xs">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาตามประเด็นกิจกรรม, ชื่อผู้สั่งการ, หรือข้อเท็จจริงจดหมาย..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Activity Logs Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        
        <div className="p-4 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileTerminal size={14} className="text-gray-400" />
            <span>สมุดจดบันทึกกิจกรรมเซิร์ฟเวอร์ย้อนหลัง (System Audit Trails)</span>
          </h3>
          <span className="text-[11px] font-semibold text-gray-400">จดบันทึกสูงสุด 200 รายการค้าง</span>
        </div>

        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xs">
              ไม่พบประวัติกิจกรรมตรงกับวิเคราะห์วิสัยทัศน์ของคุณ
            </div>
          ) : (
            filteredLogs.map((log) => {
              const formatTime = (isoString: string) => {
                try {
                  const d = new Date(isoString);
                  return d.toLocaleString('th-TH', { hour12: false });
                } catch (e) {
                  return isoString;
                }
              };

              // Customize colors depending on action
              const getActionColor = (action: string) => {
                const act = action.toLowerCase();
                if (act.includes('delete') || act.includes('remove')) return 'bg-rose-50 border-rose-200 text-rose-800';
                if (act.includes('assign') || act.includes('handover')) return 'bg-emerald-50 border-emerald-250 text-emerald-800';
                if (act.includes('login')) return 'bg-blue-50 border-blue-200 text-blue-800';
                if (act.includes('create') || act.includes('add')) return 'bg-purple-50 border-purple-200 text-purple-800';
                return 'bg-slate-50 border-gray-200 text-slate-800';
              };

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                  <div className="p-2 bg-slate-55 text-slate-500 border rounded-lg shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1 font-mono">
                          <User size={10} className="text-gray-400" />
                          <span>โดย: {log.user}</span>
                        </h4>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-650 mt-1.5 leading-relaxed font-sans select-all">
                      {log.details}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
