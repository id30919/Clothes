import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import OrderForm from './components/OrderForm';
import AdminDashboard from './components/AdminDashboard';
import AppSettingsForm from './components/SettingsPanel'; 
import { Order, AppSettings, DEFAULT_SETTINGS } from './types';
import { LayoutDashboard, ShoppingBag, Settings as SettingsIcon, Ship } from 'lucide-react';

// 🔌 直接在 App.tsx 初始化 Supabase 連線，避免檔案遺失報錯
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  // 偵測是否為管理員模式 (網址後綴 ?admin=888)
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === '888';
  
  const [activeTab, setActiveTab] = useState<'order' | 'admin' | 'settings'>(isAdmin ? 'admin' : 'order');
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // 📡 初始化與即時同步邏輯
  useEffect(() => {
    // 讀取本地設定
    const savedSettings = localStorage.getItem('clothing_settings_v5');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    
    fetchOrders();

    // 啟動 Supabase Realtime 即時同步
    const subscription = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: '*', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') setOrders(prev => [payload.new as Order, ...prev]);
        else if (payload.eventType === 'DELETE') setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      if (data) setOrders(data);
    } catch (err) {
      console.error('資料抓取失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  // 📝 處理新訂單 (管理員補單也走這條路徑)
  const handleCreateOrder = async (newOrder: Order) => {
    try {
      const { error } = await supabase.from('orders').insert([newOrder]);
      if (error) throw error;
    } catch (err) {
      alert('訂單送出失敗，請檢查網路連線。');
    }
  };

  // 🗑️ 刪除單筆訂單
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('確定要刪除這筆訂單嗎？刪除後無法復原。')) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
    } catch (err) {
      alert('刪除失敗。');
    }
  };

  // ⚙️ 更新系統設定
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('clothing_settings_v5', JSON.stringify(newSettings));
    alert('系統設定已更新！');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Ship className="text-blue-600 animate-bounce mb-4" size={48} />
      <p className="text-slate-500 font-bold">大船號載貨中...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 管理員導覽列 */}
      {isAdmin && (
        <nav className="bg-white border-b sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 font-black text-slate-800">
              <Ship className="text-blue-600"/> 大船管理系統
            </div>
            <div className="flex gap-1 sm:gap-2">
              <button 
                onClick={() => setActiveTab('order')} 
                className={`p-2 rounded-lg transition-colors ${activeTab === 'order' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
                title="填單畫面"
              >
                <ShoppingBag size={20}/>
              </button>
              <button 
                onClick={() => setActiveTab('admin')} 
                className={`p-2 rounded-lg transition-colors ${activeTab === 'admin' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
                title="數據看板"
              >
                <LayoutDashboard size={20}/>
              </button>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`p-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
                title="系統設定"
              >
                <SettingsIcon size={20}/>
              </button>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 填單分頁 */}
        {activeTab === 'order' && (
          <div className="max-w-4xl mx-auto">
            <OrderForm 
              onSubmit={handleCreateOrder} 
              settings={settings} 
              isAdmin={isAdmin} 
            />
          </div>
        )}

        {/* 數據看板分頁 (對應 AdminDashboard.tsx) */}
        {isAdmin && activeTab === 'admin' && (
          <AdminDashboard 
            orders={orders} 
            settings={settings} 
            onDeleteOrder={handleDeleteOrder}
            onAddOrder={() => setActiveTab('order')} // 💡 讓後台按鈕可以跳轉回填單頁
          />
        )}

        {/* 系統設定分頁 */}
        {isAdmin && activeTab === 'settings' && (
          <AppSettingsForm settings={settings} onUpdate={handleUpdateSettings} />
        )}
      </main>
      
      <footer className="py-12 text-center text-slate-400 text-xs">
        <p>© 2026 大船羽球 4th Anniversary</p>
        <p className="mt-1 font-mono uppercase tracking-widest">Designed by 挨滴</p>
      </footer>
    </div>
  );
}

export default App;