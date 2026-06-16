import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Smartphone, FileText, UserCheck, Users, FolderOpen,
  Settings, LogOut, Bell, Search, RefreshCw, Key, Shield, User, Clock,
  HelpCircle, Sparkles, X, ChevronRight, CheckCircle, Database, LogIn,
  Repeat, BellRing, CheckCheck
} from 'lucide-react';
import { ApiService } from './utils/api';
import { useLanguage } from './utils/i18n';
import { Globe } from 'lucide-react';
import { 
  Asset, SIMContract, Employee, AssignmentHistory, 
  SystemDocument, ActivityLog, SystemNotification, DashboardStats 
} from './types';

// Import our modular Sub-views
import DashboardView from './components/DashboardView';
import AssetManagerView from './components/AssetManagerView';
import ContractManagerView from './components/ContractManagerView';
import AssignmentHubView from './components/AssignmentHubView';
import EmployeeManagerView from './components/EmployeeManagerView';
import DocumentManagerView from './components/DocumentManagerView';
import ActivityLogsView from './components/ActivityLogsView';

type AppTab = 'Dashboard' | 'Assets' | 'Contracts' | 'Assignments' | 'Employees' | 'Documents' | 'Logs';

export default function App() {

  const { t, lang, toggleLang } = useLanguage();

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('Dashboard');
  const [currentUser, setCurrentUser] = useState<{ username: string; role: 'admin' | 'user' } | null>({ username: 'admin', role: 'admin' });
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginErrorText, setLoginErrorText] = useState('');

  // Primary Database Cache
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [contracts, setContracts] = useState<SIMContract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<AssignmentHistory[]>([]);
  const [documents, setDocuments] = useState<SystemDocument[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interface UX toggles
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [showGlobalSearchResults, setShowGlobalSearchResults] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Scan QR Code Deep Link hook
  const [scannedAssetId, setScannedAssetId] = useState<string | null>(null);

  // Trigger loading and QR scanner detection
  useEffect(() => {
    // Parse deep links: e.g., ?scan=AST-0001
    const p = new URLSearchParams(window.location.search);
    const scanId = p.get('scan');
    if (scanId) {
      setScannedAssetId(scanId);
      setActiveTab('Assets');
    }

    // Refresh DB
    checkCurrentUser();
    loadAllData();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await ApiService.getCurrentUser();
      if (res.user) {
        setCurrentUser(res.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Trigger fresh scheduled backend audit to run & update notification tables
      await ApiService.triggerNotificationAuditCheck();

      // 2. Fetch concurrent records
      const [
        fetchedStats,
        fetchedAssets,
        fetchedContracts,
        fetchedEmployees,
        fetchedAssignments,
        fetchedDocuments,
        fetchedLogs,
        fetchedNotifs
      ] = await Promise.all([
        ApiService.getStats(),
        ApiService.getAssets(),
        ApiService.getContracts(),
        ApiService.getEmployees(),
        ApiService.getAssignments(),
        ApiService.getDocuments(),
        ApiService.getLogs(),
        ApiService.getNotifications()
      ]);

      setStats(fetchedStats);
      setAssets(fetchedAssets);
      setContracts(fetchedContracts);
      setEmployees(fetchedEmployees);
      setAssignments(fetchedAssignments);
      setDocuments(fetchedDocuments);
      setLogs(fetchedLogs);
      setNotifications(fetchedNotifs);
    } catch (e) {
      console.error('Failed to parse backend databases', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  };

  // Auth Functions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorText('');
    try {
      const res = await ApiService.login(loginUsername, loginPassword);
      if (res.success) {
        setCurrentUser(res.user);
        loadAllData();
      }
    } catch (err: any) {
      setLoginErrorText(err.message || 'รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
      setCurrentUser(null);
    } catch (e) {
      setCurrentUser(null);
    }
  };

  // Callback operations for Assets
  const handleAddAsset = async (assetData: any) => {
    const res = await ApiService.createAsset(assetData);
    await loadAllData();
    return res;
  };

  const handleEditAsset = async (id: string, updates: any) => {
    const res = await ApiService.updateAsset(id, updates);
    await loadAllData();
    return res;
  };

  const handleDeleteAsset = async (id: string) => {
    const res = await ApiService.deleteAsset(id);
    await loadAllData();
    return res;
  };

  // Callbacks for SIMContracts
  const handleAddContract = async (contractData: any) => {
    const res = await ApiService.createContract(contractData);
    await loadAllData();
    return res;
  };

  const handleEditContract = async (phone: string, updates: any) => {
    const res = await ApiService.updateContract(phone, updates);
    await loadAllData();
    return res;
  };

  const handleDeleteContract = async (phone: string) => {
    const res = await ApiService.deleteContract(phone);
    await loadAllData();
    return res;
  };

  // Callbacks for Employees
  const handleAddEmployee = async (empData: any) => {
    const res = await ApiService.createEmployee(empData);
    await loadAllData();
    return res;
  };

  const handleEditEmployee = async (id: string, updates: any) => {
    const res = await ApiService.updateEmployee(id, updates);
    await loadAllData();
    return res;
  };

  const handleDeleteEmployee = async (id: string) => {
    const res = await ApiService.deleteEmployee(id);
    await loadAllData();
    return res;
  };

  // Callbacks for Handover & Returns
  const handleAssignDevice = async (data: any) => {
    const res = await ApiService.assignDevice(data);
    await loadAllData();
    return res;
  };

  const handleReturnDevice = async (data: any) => {
    const res = await ApiService.returnDevice(data);
    await loadAllData();
    return res;
  };

  // Callbacks for Documents
  const handleUploadDocument = async (data: any) => {
    const res = await ApiService.uploadDocument(data);
    await loadAllData();
    return res;
  };

  const handleDeleteDocument = async (id: string) => {
    const res = await ApiService.deleteDocument(id);
    await loadAllData();
    return res;
  };

  // Notifications callbacks
  const handleMarkNotifRead = async (id: string) => {
    await ApiService.markNotificationRead(id);
    // instant refresh local without refetching heavy stats
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllNotifsRead = async () => {
    await ApiService.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Global Multi-Search calculations
  const getGlobalSearchResults = () => {
    if (!globalSearchTerm.trim()) return { matchAssets: [], matchContracts: [], matchEmployees: [] };
    const term = globalSearchTerm.toLowerCase();
    
    const matchAssets = assets.filter(a => 
      a.id.toLowerCase().includes(term) ||
      a.name.toLowerCase().includes(term) ||
      a.serialNumber.toLowerCase().includes(term) ||
      a.imei.toLowerCase().includes(term)
    ).slice(0, 4);

    const matchContracts = contracts.filter(c => 
      c.phoneNumber.includes(term) || 
      c.packageName.toLowerCase().includes(term) ||
      c.contractNumber.toLowerCase().includes(term)
    ).slice(0, 4);

    const matchEmployees = employees.filter(e => 
      e.name.toLowerCase().includes(term) ||
      e.id.toLowerCase().includes(term) ||
      e.department.toLowerCase().includes(term)
    ).slice(0, 4);

    return { matchAssets, matchContracts, matchEmployees };
  };

  const matches = getGlobalSearchResults();
  const totalMatches = matches.matchAssets.length + matches.matchContracts.length + matches.matchEmployees.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-800">
      
      {/* 1. MOCK SESSION LOGIN GATE */}
      {!currentUser ? (
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-gray-900 to-emerald-950">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100">
            <div className="flex flex-col items-center text-center space-y-2.5 mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl text-brand-primary">
                <Database size={36} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t('login.title')}</h2>
              <p className="text-xs text-gray-400">
                {t('login.subtitle')}
              </p>
            </div>

            {/* Language toggle on login */}
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-3 py-1 border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                <Globe size={13} />
                <span>{lang === 'th' ? 'EN' : 'ไทย'}</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginErrorText && (
                <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs font-semibold">
                  {loginErrorText}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('login.username')}</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-sm font-semibold"
                    placeholder={t('login.usernamePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('login.password')}</label>
                <div className="relative">
                  <Key size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-sm"
                    placeholder={t('login.passwordPlaceholder')}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-primary text-slate-900 font-bold rounded-lg text-xs tracking-wide uppercase shadow-md cursor-pointer hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
              >
                <LogIn size={15} />
                {t('login.submit')}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-150 text-[11px] text-gray-400 text-center space-y-1">
              <p>{t('login.hint')}</p>
              <div className="flex justify-center gap-4">
                <span>**Admin**: admin / admin123</span>
                <span>**User**: user / user123</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        /* 2. AUTHENTICATED SYSTEM PANEL */
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Left Navigation Rails Sidebar */}
          <aside className="w-full md:w-[260px] bg-slate-900 text-white shrink-0 flex flex-col border-r border-slate-800">
            
            {/* Header Identity */}
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-slate-900 font-extrabold text-sm tracking-tight">
                  AS
                </div>
                <div>
                  <h1 className="text-xs font-bold uppercase tracking-wider text-white">HAT AIS PHONE MANAGEMENT</h1>
                  <span className="text-[10px] text-gray-400">{t('app.subtitle')}</span>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                title={t('app.refresh')}
                disabled={isRefreshing}
                className="p-1 hover:bg-slate-800 rounded text-gray-400 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Privileges Badge / Swapper */}
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="p-1 bg-brand-bg rounded text-brand-primary shrink-0">
                  <Shield size={14} />
                </div>
                <div className="truncate text-left">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{t('role.label')}</p>
                  <p className="text-xs font-bold text-white capitalize">{currentUser.role === 'admin' ? t('role.admin') : t('role.user')}</p>
                </div>
              </div>

              {/* Swapper button */}
              <button
                onClick={async () => {
                  const targetRole = currentUser.role === 'admin' ? 'user' : 'admin';
                  const username = targetRole;
                  const password = targetRole === 'admin' ? 'admin123' : 'user123';
                  try {
                    const r = await ApiService.login(username, password);
                    if (r.success) {
                      setCurrentUser(r.user);
                      loadAllData();
                    }
                  } catch (e) {
                    alert(t('role.swapError'));
                  }
                }}
                className="text-[9px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-brand-primary hover:bg-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Repeat size={10} />
                {t('role.swap')}
              </button>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 p-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-3 block mb-1 tracking-wider">{t('nav.sectionMain')}</span>
              
              <button
                onClick={() => { setActiveTab('Dashboard'); setShowGlobalSearchResults(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold text-left cursor-pointer transition-colors ${
                  activeTab === 'Dashboard' ? 'bg-brand-primary text-slate-900' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>{t('nav.dashboard')}</span>
              </button>

              <button
                onClick={() => { setActiveTab('Assets'); setShowGlobalSearchResults(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold text-left cursor-pointer transition-colors ${
                  activeTab === 'Assets' ? 'bg-brand-primary text-slate-900' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <Smartphone size={16} />
                <span>{t('nav.assets')}</span>
              </button>

              <button
                onClick={() => { setActiveTab('Contracts'); setShowGlobalSearchResults(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold text-left cursor-pointer transition-colors ${
                  activeTab === 'Contracts' ? 'bg-brand-primary text-slate-900' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <FileText size={16} />
                <span>{t('nav.contracts')}</span>
              </button>

              <button
                onClick={() => { setActiveTab('Assignments'); setShowGlobalSearchResults(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold text-left cursor-pointer transition-colors ${
                  activeTab === 'Assignments' ? 'bg-brand-primary text-slate-900' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <UserCheck size={16} />
                <span>{t('nav.assignments')}</span>
              </button>

              <span className="text-[10px] font-bold text-slate-500 uppercase px-3 block pt-4 mb-1 tracking-wider">{t('nav.sectionPeople')}</span>

              <button
                onClick={() => { setActiveTab('Employees'); setShowGlobalSearchResults(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold text-left cursor-pointer transition-colors ${
                  activeTab === 'Employees' ? 'bg-brand-primary text-slate-900' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <Users size={16} />
                <span>{t('nav.employees')}</span>
              </button>

              <button
                onClick={() => { setActiveTab('Documents'); setShowGlobalSearchResults(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold text-left cursor-pointer transition-colors ${
                  activeTab === 'Documents' ? 'bg-brand-primary text-slate-900' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <FolderOpen size={16} />
                <span>{t('nav.documents')}</span>
              </button>

              <button
                onClick={() => { setActiveTab('Logs'); setShowGlobalSearchResults(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold text-left cursor-pointer transition-colors ${
                  activeTab === 'Logs' ? 'bg-brand-primary text-slate-900' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <Clock size={16} />
                <span>{t('nav.logs')}</span>
              </button>
            </nav>

            {/* Logout Footer Section */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">
              <div className="text-[10px] text-gray-500 text-center font-mono select-none">
                {t('footer.utcNote')}
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut size={13} />
                <span>{t('footer.logout')}</span>
              </button>
            </div>

          </aside>

          {/* Right Main Body Layout */}
          <main className="flex-1 flex flex-col min-w-0">
            
            {/* Master Header */}
            <header className="h-[64px] bg-white border-b border-gray-200 px-6 flex justify-between items-center shrink-0 shadow-3xs relative">
              
              {/* Header Title / Tab indicator */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-gray-400">/</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {t(`header.${activeTab}` as any)}
                </span>
              </div>

              {/* Central Fast Search Bar */}
              <div className="relative flex-1 max-w-sm mx-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={globalSearchTerm}
                  onChange={(e) => {
                    setGlobalSearchTerm(e.target.value);
                    setShowGlobalSearchResults(!!e.target.value);
                  }}
                  onFocus={() => setShowGlobalSearchResults(!!globalSearchTerm)}
                  placeholder={t('header.searchPlaceholder')}
                  className="w-full pl-9 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-primary"
                />

                {/* Clear search query button */}
                {globalSearchTerm && (
                  <button 
                    onClick={() => { setGlobalSearchTerm(''); setShowGlobalSearchResults(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}

                {/* Search Result Popup */}
                {showGlobalSearchResults && (
                  <div className="absolute top-11 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-30 max-h-[360px] overflow-y-auto space-y-3.5">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">ผลลัพธ์พบรวม ({totalMatches} การจับคู่)</span>
                      <button 
                        onClick={() => setShowGlobalSearchResults(false)} 
                        className="text-[10px] text-gray-500 bg-gray-50 hover:bg-gray-100 p-0.5 rounded cursor-pointer"
                      >
                        ปิดหน้าต่าง
                      </button>
                    </div>

                    {totalMatches === 0 ? (
                      <p className="text-[11px] text-gray-400 italic text-center py-4">ไม่พบทะเบียนอุปกรณ์หรือชื่อบุคคลที่สอดคล้อง</p>
                    ) : (
                      <div className="space-y-4 text-left">
                        {/* Match Assets */}
                        {matches.matchAssets.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-blue-500 uppercase block tracking-wider">จับคู่เครื่องเด่น (Assets)</span>
                            {matches.matchAssets.map(a => (
                              <button
                                key={a.id}
                                onClick={() => {
                                  setScannedAssetId(a.id);
                                  setActiveTab('Assets');
                                  setShowGlobalSearchResults(false);
                                  setGlobalSearchTerm('');
                                }}
                                className="w-full p-2 hover:bg-slate-50 border rounded text-xs flex justify-between items-center text-gray-700 cursor-pointer"
                              >
                                <div>
                                  <p className="font-bold">{a.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">IMEI: {a.imei}</p>
                                </div>
                                <ChevronRight size={12} className="text-gray-400" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Match Contracts */}
                        {matches.matchContracts.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-emerald-600 uppercase block tracking-wider">จับคู่เบอร์ซิม AIS (Contracts)</span>
                            {matches.matchContracts.map(c => (
                              <button
                                key={c.phoneNumber}
                                onClick={() => {
                                  setActiveTab('Contracts');
                                  setShowGlobalSearchResults(false);
                                  setGlobalSearchTerm('');
                                }}
                                className="w-full p-2 hover:bg-slate-50 border rounded text-xs flex justify-between items-center text-gray-700 cursor-pointer"
                              >
                                <div>
                                  <p className="font-bold text-emerald-800">{c.phoneNumber}</p>
                                  <p className="text-[10px] text-gray-400">สัญญา: {c.contractNumber}</p>
                                </div>
                                <ChevronRight size={12} className="text-gray-400" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Match Employees */}
                        {matches.matchEmployees.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-purple-600 uppercase block tracking-wider">พนักงานองค์กร (Staff)</span>
                            {matches.matchEmployees.map(e => (
                              <button
                                key={e.id}
                                onClick={() => {
                                  setActiveTab('Employees');
                                  setShowGlobalSearchResults(false);
                                  setGlobalSearchTerm('');
                                }}
                                className="w-full p-2 hover:bg-slate-50 border rounded text-xs flex justify-between items-center text-gray-700 cursor-pointer"
                              >
                                <div>
                                  <p className="font-bold">{e.name}</p>
                                  <p className="text-[10px] text-gray-400">{e.department}</p>
                                </div>
                                <ChevronRight size={12} className="text-gray-400" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right widgets: UTC Date + Notifications popup */}
              <div className="flex items-center gap-4">

                {/* UTC clock */}
                <div className="hidden lg:flex flex-col text-right font-mono text-[10px] text-gray-400 select-none">
                  <div className="font-semibold text-gray-650 flex items-center gap-1">
                    <Clock size={11} />
                    <span>2026-06-09 07:53 UTC</span>
                  </div>
                </div>

                {/* Language toggle */}
                <button
                  onClick={toggleLang}
                  title={t('lang.label')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 hover:text-slate-800 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-colors text-xs font-bold"
                >
                  <Globe size={15} />
                  <span>{lang === 'th' ? 'EN' : 'ไทย'}</span>
                </button>

                {/* Alerts warning Bell with unread balloon */}
                <div className="relative">
                  <button
                    onClick={() => setNotifPanelOpen(!notifPanelOpen)}
                    className="p-1.5 text-gray-500 hover:text-slate-800 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-colors relative"
                  >
                    <Bell size={16} />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white animate-pulse">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>

                  {/* Panel Popup */}
                  {notifPanelOpen && (
                    <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-[340px] z-30 space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5"><BellRing size={13} className="text-amber-500" />{t('notif.title')} ({notifications.filter(n => !n.isRead).length})</h4>
                        <button
                          onClick={handleMarkAllNotifsRead}
                          className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer flex items-center gap-1"
                        >
                          <CheckCheck size={12} />
                          {t('notif.markAll')}
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[220px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-[11px] text-gray-400 italic text-center py-4">{t('notif.empty')}</p>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              className={`p-2 rounded border text-[11px] space-y-1 transition-colors ${
                                n.isRead ? 'bg-gray-50 border-gray-150 text-gray-400' : 'bg-amber-50/40 border-amber-200 text-amber-950'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold">{n.title}</span>
                                {!n.isRead && (
                                  <button 
                                    onClick={() => handleMarkNotifRead(n.id)}
                                    className="text-[9px] text-gray-500 underline font-semibold hover:text-gray-900 cursor-pointer"
                                  >
                                    {t('notif.read')}
                                  </button>
                                )}
                              </div>
                              <p className="opacity-90">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t flex justify-end">
                        <button 
                          onClick={() => setNotifPanelOpen(false)}
                          className="text-xs bg-slate-905 bg-slate-900 hover:bg-slate-800 text-white font-bold p-1 px-4.5 rounded cursor-pointer"
                        >
                          {t('notif.close')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </header>

            {/* View Port Panel Workspace */}
            <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
              
              {isLoading ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                  <RefreshCw className="animate-spin text-brand-primary" size={40} />
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{t('loading.title')}</h3>
                    <p className="text-xs text-gray-400 mt-1">{t('loading.subtitle')}</p>
                  </div>
                </div>
              ) : (
                
                /* TABS ROUTING DISPATCHER */
                <>
                  {activeTab === 'Dashboard' && stats && (
                    <DashboardView
                      stats={stats}
                      notifications={notifications}
                      onMarkNotificationRead={handleMarkNotifRead}
                      onMarkAllNotificationsRead={handleMarkAllNotifsRead}
                      onNavigateToTab={(tab: any) => { setActiveTab(tab); }}
                      userRole={currentUser.role}
                    />
                  )}

                  {activeTab === 'Assets' && (
                    <AssetManagerView
                      assets={assets}
                      userRole={currentUser.role}
                      onAddAsset={handleAddAsset}
                      onEditAsset={handleEditAsset}
                      onDeleteAsset={handleDeleteAsset}
                      onUploadDoc={handleUploadDocument}
                      onRefresh={loadAllData}
                      scannedAssetId={scannedAssetId}
                      clearScannedAssetId={() => setScannedAssetId(null)}
                    />
                  )}

                  {activeTab === 'Contracts' && (
                    <ContractManagerView
                      contracts={contracts}
                      assets={assets}
                      onAddContract={handleAddContract}
                      onEditContract={handleEditContract}
                      onDeleteContract={handleDeleteContract}
                      onRefresh={loadAllData}
                      userRole={currentUser.role}
                    />
                  )}

                  {activeTab === 'Assignments' && (
                    <AssignmentHubView
                      assignments={assignments}
                      employees={employees}
                      assets={assets}
                      contracts={contracts}
                      onAssignDevice={handleAssignDevice}
                      onReturnDevice={handleReturnDevice}
                      onRefresh={loadAllData}
                      userRole={currentUser.role}
                    />
                  )}

                  {activeTab === 'Employees' && (
                    <EmployeeManagerView
                      employees={employees}
                      onAddEmployee={handleAddEmployee}
                      onEditEmployee={handleEditEmployee}
                      onDeleteEmployee={handleDeleteEmployee}
                      onRefresh={loadAllData}
                      userRole={currentUser.role}
                    />
                  )}

                  {activeTab === 'Documents' && (
                    <DocumentManagerView
                      documents={documents}
                      onUploadDocument={handleUploadDocument}
                      onDeleteDocument={handleDeleteDocument}
                      onRefresh={loadAllData}
                    />
                  )}

                  {activeTab === 'Logs' && (
                    <ActivityLogsView
                      logs={logs}
                    />
                  )}
                </>
              )}

            </div>

          </main>

        </div>
      )}

    </div>
  );
}
