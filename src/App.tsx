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

  // 1. 初始化設定邏輯
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('clothing_settings_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...DEFAULT_SETTINGS, 
          ...parsed,
          heroImageUrl: parsed.heroImageUrl || DEFAULT_SETTINGS.heroImageUrl,
          sizeChartUrl: parsed.sizeChartUrl || DEFAULT_SETTINGS.sizeChartUrl,
          announcementText: parsed.announcementText || DEFAULT_SETTINGS.announcementText,
          paymentDeadline: parsed.paymentDeadline || DEFAULT_SETTINGS.paymentDeadline,
          imageUrls: (parsed.imageUrls && parsed.imageUrls.length > 0) ? parsed.imageUrls : DEFAULT_SETTINGS.imageUrls
        };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '888' || localStorage.getItem('dachuan_admin_access') === 'true') {
      setIsAdmin(true);
      localStorage.setItem('dachuan_admin_access', 'true');
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
      if (!error && data) setOrders(data);
    };
    fetchOrders();
    const channel = supabase.channel('schema-db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    localStorage.setItem('clothing_settings', JSON.stringify(settings_v2));
  }, [settings]);

  const handleAddOrder = async (newOrder: Order) => {
    const { id, ...orderDataWithoutId } = newOrder;
    const { error } = await supabase.from('orders').insert([orderDataWithoutId]);
    if (error) alert('送出失敗！');
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm('確定要刪除這筆訂單嗎？')) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) alert('刪除失敗');
    }
  };

  const handleTogglePickupStatus = async (id: string, isPickedUp: boolean) => {
    const { error } = await supabase.from('orders').update({ isPickedUp }).eq('id', id);
    if (error) console.error('Update Error:', error.message);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-[#f4f7f9] font-sans text-[#1e293b] overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-[#172554] text-white p-4 shrink-0 z-20">
        <div className="font-bold flex items-center text-lg">🚢 大船團服訂購系統</div>
        <button onClick={toggleSidebar}>{isSidebarOpen ? <X /> : <Menu />}</button>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={closeSidebar} />}

      <aside className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-[#172554] text-white p-6 flex flex-col gap-8 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 top-[60px]' : '-translate-x-full md:top-0'}`}>
        <div className="hidden md:flex text-[20px] font-bold border-b border-white/10 pb-4 items-center">🚢 大船團服訂購</div>
        <nav className="flex flex-col gap-3">
          <button onClick={() => { setActiveTab('form'); closeSidebar(); }} className={`flex items-center px-4 py-3 rounded-lg text-[14px] ${activeTab === 'form' ? 'bg-[#3b82f6]' : 'hover:bg-white/10'}`}>填寫訂購單</button>
          {isAdmin && (
            <>
              <button onClick={() => { setActiveTab('admin'); closeSidebar(); }} className={`flex items-center px-4 py-3 rounded-lg text-[14px] ${activeTab === 'admin' ? 'bg-[#3b82f6]' : 'hover:bg-white/10'}`}>雲端後台管理</button>
              <button onClick={() => { setActiveTab('settings'); closeSidebar(); }} className={`flex items-center px-4 py-3 rounded-lg text-[14px] ${activeTab === 'settings' ? 'bg-[#3b82f6]' : 'hover:bg-white/10'}`}>系統設定</button>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full relative z-10">
        {activeTab === 'form' && (
          <div className="max-w-4xl mx-auto w-full transition-all animate-in fade-in slide-in-from-bottom-4">
            
            {/* 🖼️ 1. 置頂橫幅：寫死「大船戰旗」掛布網址，不與設定連動 */}
            <div className="w-full mb-8 overflow-hidden rounded-2xl shadow-lg bg-white border border-slate-100 p-0">
              <img 
                src="https://i.postimg.cc/90hMJHhT/da-chuan-da-zhan-qi-gua-bu-jie-tu-ban.jpg" 
                alt="大船羽球戰旗"
                className="w-full h-auto block"
              />
            </div>

            {/* 📝 2. 訂購表單：中間的服飾預覽圖會抓取 settings.heroImageUrl */}
            <OrderForm onSubmit={handleAddOrder} settings={settings} />
          </div>
        )}
        
        {isAdmin && activeTab === 'admin' && (
          <AdminDashboard orders={orders} onDeleteOrder={handleDeleteOrder} onTogglePickupStatus={handleTogglePickupStatus} />
        )}

        {isAdmin && activeTab === 'settings' && (
          <SettingsPanel settings={settings} onSettingsChange={setSettings} />
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