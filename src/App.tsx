import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import OrderForm from './components/OrderForm';
import AdminDashboard from './components/AdminDashboard';
import SettingsPanel from './components/SettingsPanel';
import { AppSettings, DEFAULT_SETTINGS, Order } from './types';
import { ClipboardList, LayoutDashboard, Settings, Menu, X } from 'lucide-react';

// --- ☁️ Supabase 雲端初始化 ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'admin' | 'settings'>('form');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // 💡 核心邏輯：使用 v2 名稱強制重新整理所有人的手機記憶
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('clothing_settings_V8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...DEFAULT_SETTINGS, 
          ...parsed,
          heroImageUrl: parsed.heroImageUrl || DEFAULT_SETTINGS.heroImageUrl,
          sizeChartUrl: parsed.sizeChartUrl || DEFAULT_SETTINGS.sizeChartUrl,
          announcementText: parsed.announcementText || DEFAULT_SETTINGS.announcementText,
          paymentDeadline: parsed.paymentDeadline || DEFAULT_SETTINGS.paymentDeadline
        };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 1. 🔒 管理員權限檢查
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '888' || localStorage.getItem('dachuan_admin_access') === 'true') {
      setIsAdmin(true);
      localStorage.setItem('dachuan_admin_access', 'true');
    }
  }, []);

  // 2. 📡 雲端資料同步與 Realtime 即時更新
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (!error && data) {
        setOrders(data);
      }
    };

    fetchOrders();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. ⚙️ 設定存檔 (使用 v2 名稱)
  useEffect(() => {
    localStorage.setItem('clothing_settings_V8', JSON.stringify(settings));
  }, [settings]);

  // --- 🛠️ 完整後台功能處理函數 ---

  const handleAddOrder = async (newOrder: Order) => {
    const { id, ...orderDataWithoutId } = newOrder;
    const { error } = await supabase.from('orders').insert([orderDataWithoutId]);
    if (error) alert('送出失敗，請檢查網路！');
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm('確定要刪除這筆訂單嗎？雲端資料也會消失。')) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) alert('刪除失敗');
    }
  };

  const handleTogglePickupStatus = async (id: string, isPickedUp: boolean) => {
    const { error } = await supabase.from('orders').update({ isPickedUp }).eq('id', id);
    if (error) console.error('Update Error:', error.message);
  };

  const handleClearData = async () => {
    if (confirm('確定要清空雲端所有訂單嗎？這動作無法復原！')) {
      const { error } = await supabase.from('orders').delete().neq('id', '0');
      if (error) alert('清空失敗');
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-[#f4f7f9] font-sans text-[#1e293b] overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-[#172554] text-white p-4 shrink-0 shadow-md relative z-20">
        <div className="font-bold tracking-wide flex items-center text-lg">
          <ShirtIcon className="w-5 h-5 mr-2" />
          大船團服訂購系統
        </div>
        <button onClick={toggleSidebar} className="p-1 hover:bg-white/10 rounded-md transition-colors">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={closeSidebar} />
      )}

      {/* Sidebar 導覽列 */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#172554] text-white p-6 flex flex-col gap-8 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0 bottom-0 top-[60px]' : '-translate-x-full md:top-0'
      }`}>
        <div className="hidden md:flex text-[20px] font-bold border-b border-white/10 pb-4 tracking-[1px] items-center">
          <ShirtIcon className="w-6 h-6 mr-2" />
          大船團服訂購
        </div>
        <nav className="flex flex-col gap-3">
          <button
            onClick={() => { setActiveTab('form'); closeSidebar(); }}
            className={`flex items-center px-4 py-3 rounded-lg text-[14px] transition-colors text-left ${activeTab === 'form' ? 'bg-[#3b82f6]' : 'hover:bg-white/10'}`}
          >
            <ClipboardList className="w-4 h-4 mr-3 shrink-0" />
            填寫訂購單
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => { setActiveTab('admin'); closeSidebar(); }}
                className={`flex items-center px-4 py-3 rounded-lg text-[14px] transition-colors text-left ${activeTab === 'admin' ? 'bg-[#3b82f6]' : 'hover:bg-white/10'}`}
              >
                <LayoutDashboard className="w-4 h-4 mr-3 shrink-0" />
                雲端後台管理
              </button>
              <button
                onClick={() => { setActiveTab('settings'); closeSidebar(); }}
                className={`flex items-center px-4 py-3 rounded-lg text-[14px] transition-colors text-left ${activeTab === 'settings' ? 'bg-[#3b82f6]' : 'hover:bg-white/10'}`}
              >
                <Settings className="w-4 h-4 mr-3 shrink-0" />
                系統設定
              </button>
            </>
          )}
        </nav>
        {isAdmin && activeTab === 'admin' && orders.length > 0 && (
          <div className="mt-auto pt-8">
            <button onClick={handleClearData} className="w-full text-sm text-red-400 hover:text-red-300 font-medium py-2 rounded-md hover:bg-white/5 transition-colors border border-red-500/30 text-center">
              清空雲端資料庫
            </button>
          </div>
        )}
      </aside>

      {/* Main Content 主畫面 */}
      <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto w-full relative z-10">
        {activeTab === 'form' && (
          <div className="max-w-4xl mx-auto w-full transition-all animate-in fade-in slide-in-from-bottom-4">
            {/* 🚩 置頂橫幅：固定戰旗圖 */}
            <div className="w-full mb-8 overflow-hidden rounded-2xl shadow-lg bg-white border border-slate-100 p-0">
              <img 
                src="https://i.postimg.cc/90hMJHhT/da-chuan-da-zhan-qi-gua-bu-jie-tu-ban.jpg" 
                className="w-full h-auto block" 
                alt="大船戰旗" 
              />
            </div>
            {/* 👕 訂購表單 */}
            <OrderForm onSubmit={handleAddOrder} settings={settings} />
          </div>
        )}
        
        {isAdmin && activeTab === 'admin' && (
          <AdminDashboard 
            orders={orders} 
            onDeleteOrder={handleDeleteOrder} 
            onTogglePickupStatus={handleTogglePickupStatus} 
          />
        )}

        {isAdmin && activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto w-full transition-all animate-in fade-in">
            <SettingsPanel settings={settings} onSettingsChange={setSettings} />
          </div>
        )}
      </main>
    </div>
  );
}

function ShirtIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}