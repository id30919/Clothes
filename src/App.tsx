import React, { useState, useEffect } from 'react';
import OrderForm from './components/OrderForm';
import AdminDashboard from './components/AdminDashboard';
import SettingsPanel from './components/SettingsPanel';
import { AppSettings, DEFAULT_SETTINGS, Order } from './types';
import { ClipboardList, LayoutDashboard, Settings, Menu, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'admin' | 'settings'>('form');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- 🔒 管理員權限控制邏輯 ---
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. 檢查網址是否有暗號 ?admin=888
    const params = new URLSearchParams(window.location.search);
    const hasSecret = params.get('admin') === '888';

    // 2. 檢查這台設備是否曾經解鎖過 (localStorage)
    const wasAdmin = localStorage.getItem('dachuan_admin_access') === 'true';

    if (hasSecret || wasAdmin) {
      setIsAdmin(true);
      // 記憶這台設備的權限
      localStorage.setItem('dachuan_admin_access', 'true');
    }
  }, []);
  // --------------------------

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('clothing_orders');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('clothing_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem('clothing_orders', JSON.stringify(orders));
  }, [orders]);

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('clothing_settings', JSON.stringify(settings));
  }, [settings]);

  const handleAddOrder = (newOrder: Order) => {
    setOrders([...orders, newOrder]);
  };

  const handleClearData = () => {
    if (confirm('確定要清空所有測試資料嗎？')) {
      setOrders([]);
      localStorage.removeItem('clothing_orders');
    }
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('確定要刪除這筆訂單嗎？此動作無法復原。')) {
      setOrders(orders.filter(order => order.id !== id));
    }
  };

  const handleTogglePickupStatus = (id: string, isPickedUp: boolean) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, isPickedUp } : order
    ));
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-[#f4f7f9] font-sans text-[#1e293b] overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-[#172554] text-white p-4 shrink-0 shadow-md relative z-20">
        <div className="font-bold tracking-wide flex items-center text-lg">
          <ShirtIcon className="w-5 h-5 mr-2" />
          大船團服訂購
        </div>
        <button onClick={toggleSidebar} className="p-1 hover:bg-white/10 rounded-md transition-colors">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={closeSidebar} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#172554] text-white p-6 flex flex-col gap-8 flex-shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0 bottom-0 top-[60px]' : '-translate-x-full md:top-0'
      }`}>
        <div className="hidden md:flex text-[20px] font-bold border-b border-white/10 pb-4 tracking-[1px] items-center">
          <ShirtIcon className="w-6 h-6 mr-2" />
          大船團服訂購
        </div>
        
        <nav className="flex flex-col gap-3">
          <button
            onClick={() => { setActiveTab('form'); closeSidebar(); }}
            className={`flex items-center px-4 py-3 rounded-lg text-[14px] transition-colors text-left ${
              activeTab === 'form' ? 'bg-[#3b82f6]' : 'hover:bg-white/10'
            }`}
          >
            <ClipboardList className="w-4 h-4 mr-3 shrink-0" />
            填寫訂購單
          </button>

          {/* 🔒 只有管理員看得到的按鈕 */}
          {isAdmin && (
            <>
              <button
                onClick={() => { setActiveTab('admin'); closeSidebar(); }}
                className={`flex items-center px-4 py-3 rounded-lg text-[14px] transition-colors text-left ${
                  activeTab === 'admin' ? 'bg-[#3b82f6]' : 'hover:bg-white/10'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-3 shrink-0" />
                後台管理
              </button>
              <button
                onClick={() => { setActiveTab('settings'); closeSidebar(); }}
                className={`flex items-center px-4 py-3 rounded-lg text-[14px] transition-colors text-left ${
                  activeTab === 'settings' ? 'bg-[#3b82f6]' : 'hover:bg-white/10'
                }`}
              >
                <Settings className="w-4 h-4 mr-3 shrink-0" />
                系統設定
              </button>
            </>
          )}
        </nav>
        
        {/* 清空按鈕也同樣保護起來 */}
        {isAdmin && activeTab === 'admin' && orders.length > 0 && (
          <div className="mt-auto md:mt-auto pt-8">
            <button 
              onClick={handleClearData}
              className="w-full text-sm text-red-400 hover:text-red-300 font-medium py-2 rounded-md hover:bg-white/5 transition-colors border border-red-500/30 text-center"
            >
              清空測試資料
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto w-full relative z-10">
        {activeTab === 'form' && (
          <div className="max-w-4xl mx-auto w-full transition-all animate-in fade-in slide-in-from-bottom-4">
            <OrderForm onSubmit={handleAddOrder} settings={settings} />
          </div>
        )}
        
        {/* 只有管理員權限才能看到內容，即便有人透過 F12 切換 activeTab 也會看到空白 */}
        {isAdmin && activeTab === 'admin' && (
          <div className="flex-1 flex flex-col transition-all animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-[#1e293b] mb-1">後台管理總覽</h1>
                <p className="text-[14px] text-[#64748b]">自動整理廠商叫貨單與客製印字明細，擺脫人工統計的痛苦。</p>
              </div>
              <div className="bg-[#eff6ff] text-[#3b82f6] font-semibold rounded px-4 py-2 text-[14px] text-center inline-block sm:w-auto self-start">
                自動即時更新
              </div>
            </div>
            <AdminDashboard orders={orders} onDeleteOrder={handleDeleteOrder} onTogglePickupStatus={handleTogglePickupStatus} />
          </div>
        )}

        {isAdmin && activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto w-full transition-all animate-in fade-in slide-in-from-bottom-4">
            <SettingsPanel settings={settings} onSettingsChange={setSettings} />
          </div>
        )}
      </main>
    </div>
  );
}

function ShirtIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}