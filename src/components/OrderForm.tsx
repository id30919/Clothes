import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, CreditCard, X, Info, Gift } from 'lucide-react';
import { CLOTHING_COLORS, CLOTHING_SIZES, CLOTHING_TYPES, PICKUP_OPTIONS, Order, OrderItem, AppSettings } from '../types';

interface OrderFormProps {
  onSubmit: (order: Order) => void;
  settings: AppSettings;
  isAdmin?: boolean; // 💡 傳入管理員權限
}

export default function OrderForm({ onSubmit, settings, isAdmin }: OrderFormProps) {
  const [buyerName, setBuyerName] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [pickupDays, setPickupDays] = useState<string[]>([]);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [sizeModalTab, setSizeModalTab] = useState<'chart' | 'feedback'>('chart');
  
  const [items, setItems] = useState<OrderItem[]>([{
    id: crypto.randomUUID(),
    type: CLOTHING_TYPES[0],
    color: CLOTHING_COLORS[0],
    size: CLOTHING_SIZES[2],
    customName: '',
    quantity: 1
  }]);
  const [note, setNote] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  // 成功送出後自動捲動
  useEffect(() => {
    if (submittedOrder) {
      const timer = setTimeout(() => {
        const successElement = document.getElementById('success-top-anchor');
        if (successElement) {
          successElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [submittedOrder]);

  const handlePickupToggle = (day: string) => {
    setPickupDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), type: CLOTHING_TYPES[0], color: CLOTHING_COLORS[0], size: CLOTHING_SIZES[2], customName: '', quantity: 1 }]);
  };

  const { total, appliedPackages, itemBreakdown } = useMemo(() => {
    let _total = 0;
    let _applied: string[] = [];
    let _breakdown = { base: 0, print: 0, packages: 0 };

    const expandedItems: any[] = [];
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) expandedItems.push({ size: item.size, customName: item.customName.trim() });
    });

    const bySize: Record<string, any[]> = {};
    expandedItems.forEach(item => {
      if (!bySize[item.size]) bySize[item.size] = [];
      bySize[item.size].push(item);
    });

    Object.entries(bySize).forEach(([size, sizeItems]) => {
      let unassigned = [...sizeItems];

      // 🎁 禮包 A (1750) + 同名免費邏輯
      if (settings.packageA.enabled) {
        while (unassigned.length >= settings.packageA.requiredQty) {
          const group = unassigned.splice(0, settings.packageA.requiredQty);
          _total += settings.packageA.price;
          _breakdown.packages += settings.packageA.price;
          _applied.push(`🎁 禮包A優惠 (同Size: ${size})`);
          const uniqueNames = new Set(group.map(i => i.customName).filter(n => n !== "")).size;
          const printCost = Math.max(0, uniqueNames - 1) * settings.printPrice;
          _total += printCost;
          _breakdown.print += printCost;
        }
      }

      // 🎁 禮包 B (900) + 1件免印
      if (settings.packageB.enabled) {
        while (unassigned.length >= settings.packageB.requiredQty) {
          const group = unassigned.splice(0, settings.packageB.requiredQty);
          _total += settings.packageB.price;
          _breakdown.packages += settings.packageB.price;
          _applied.push(`🎁 禮包B優惠 (同Size: ${size})`);
          const printCount = group.filter(i => i.customName).length;
          const printCost = Math.max(0, printCount - settings.packageB.freePrints) * settings.printPrice;
          _total += printCost;
          _breakdown.print += printCost;
        }
      }

      unassigned.forEach(item => {
        _total += settings.basePrice;
        _breakdown.base += settings.basePrice;
        if (item.customName) { _total += settings.printPrice; _breakdown.print += settings.printPrice; }
      });
    });

    if (isStudent && _total > 0) {
      _total = Math.max(0, _total - settings.studentDiscount);
      _applied.push(`🎓 學生優惠 (-${settings.studentDiscount}元)`);
    }

    return { total: _total, appliedPackages: _applied, itemBreakdown: _breakdown };
  }, [items, isStudent, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return; // 💡 只有帶 ?admin=888 才能下單
    const newOrder: Order = { id: crypto.randomUUID(), buyerName, isStudent, pickupDays, items, totalPrice: total, createdAt: new Date().toISOString(), note };
    onSubmit(newOrder);
    setSubmittedOrder(newOrder);
  };

  if (submittedOrder) {
    return (
      <div id="success-top-anchor" className="flex flex-col items-center justify-center pt-8">
        <div className="bg-white rounded-xl shadow-lg border border-[#e2e8f0] p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 text-[#10b981] mx-auto mb-4" />
            <h2 className="text-[24px] font-bold text-[#1e293b]">訂單已成功送出！</h2>
            <div className="mt-4 bg-blue-50 text-blue-700 px-6 py-3 rounded-lg border border-blue-100 font-bold text-2xl">
              {submittedOrder.totalPrice} 元
            </div>
          </div>
          <div className="bg-blue-50/80 border border-blue-200 p-6 rounded-lg text-blue-900 mb-8 mx-auto">
            <h3 className="font-bold flex items-center justify-center mb-4 text-[16px] border-b border-blue-200/60 pb-3">
               <CreditCard className="w-5 h-5 mr-2" /> 付款通知
            </h3>
            <div className="space-y-3 max-w-md mx-auto text-[14px]">
              <p>台新銀行 (812) / 28881000045799 / 許弘德</p>
              <p className="text-red-500 font-bold">匯款備註請務必備註您的「大名or花名」</p>
              <div className="flex justify-center pt-2">
                <a href="https://mobile.richart.tw/TSDIB_RichartWeb/RC04/RC040300?token=890B498D154495B2DA69B2D355607613" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold border-2 border-blue-200 bg-white px-4 py-2 rounded-md">
                   📌 開啟台新 Richart 連結
                </a>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#f1f5f9] text-[#475569] font-medium rounded-lg hover:bg-[#e2e8f0]">返回填寫下一筆</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-6 text-center">
         <div className="text-[#1e293b] font-black text-2xl md:text-[28px] tracking-wider uppercase">
           {settings.announcementText}
         </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-[#e2e8f0] bg-[#fafafa]">
          <h2 className="text-[14px] font-semibold text-[#1e293b] mb-4">一、填寫訂購人資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">您在大船的花名？ <span className="text-red-500">*</span></label>
              <input type="text" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] outline-none" placeholder="例如：小明 (工程師)" />
            </div>
            <div className="flex items-center mt-2 md:mt-[22px]">
               <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={isStudent} onChange={(e) => setIsStudent(e.target.checked)} className="rounded text-[#3b82f6] w-4 h-4" />
                <span className="ml-2 text-[14px] font-medium text-[#64748b]">具備學生身分 (總價折抵 {settings.studentDiscount} 元)</span>
              </label>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#e2e8f0]/50">
            <label className="block text-[13px] font-medium text-[#64748b] mb-3">可領貨的球敘日？ <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-4">
              {PICKUP_OPTIONS.map(day => (
                <label key={day} className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={pickupDays.includes(day)} onChange={() => handlePickupToggle(day)} className="rounded text-[#3b82f6] w-4 h-4" />
                  <span className="ml-2 text-[14px] font-medium text-[#1e293b]">{day}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {settings.heroImageUrl && <img src={settings.heroImageUrl} alt="主視覺" className="w-full border-b border-[#e2e8f0] h-auto" loading="lazy" referrerPolicy="no-referrer" />}

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[14px] font-semibold text-[#1e293b]">二、訂購品項明細</h2>
            <button type="button" onClick={() => setIsSizeModalOpen(true)} className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-[13px] font-medium flex items-center">
              <Info className="w-4 h-4 mr-1.5" /> 尺寸參考與試穿報告
            </button>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg text-[13px] mb-4 shadow-sm">
            <p className="font-bold underline underline-offset-4 decoration-emerald-300">不同的 款式、尺寸、顏色，或 有的印/不印名字，請點擊下方「+新增品項」：</p>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="relative p-5 border border-[#e2e8f0] rounded-lg bg-[#f4f7f9]/50 shadow-sm">
                <div className="absolute top-4 left-4 text-[12px] font-bold text-[#64748b]">#{index + 1}</div>
                {items.length > 1 && (
                  <button type="button" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="absolute top-4 right-4 text-[#64748b] hover:text-red-500"><Trash2 size={16}/></button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                  <div>
                    <label className="block text-[12px] font-medium text-slate-500 mb-1">款式</label>
                    <select value={item.type} onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, type: e.target.value } : i))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] bg-white outline-none">
                      {CLOTHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-slate-500 mb-1">顏色</label>
                    <select value={item.color} onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, color: e.target.value } : i))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] bg-white outline-none">
                      {CLOTHING_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-slate-500 mb-1">尺寸</label>
                    <select value={item.size} onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, size: e.target.value } : i))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] bg-white outline-none">
                      {CLOTHING_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-slate-500 mb-1">客製印字 (+{settings.printPrice})</label>
                    <input type="text" value={item.customName} onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, customName: e.target.value } : i))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] outline-none" placeholder="(中英文皆可)" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-slate-500 mb-1">數量</label>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, quantity: parseInt(e.target.value) || 1 } : i))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] outline-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddItem} className="mt-4 flex items-center justify-center w-full py-2 border border-dashed border-[#64748b] rounded-lg text-[#64748b] hover:border-[#3b82f6] hover:text-[#3b82f6] text-[14px] bg-[#fafafa]">
            <Plus size={16} className="mr-2" /> 新增品項
          </button>
        </div>

        <div className="p-6 border-t border-[#e2e8f0] bg-white flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-[13px] font-semibold text-[#64748b]">費用試算 (同名免費已套用)</h3>
               <button type="button" onClick={() => setIsPackageModalOpen(true)} className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-md text-[13px] font-medium flex items-center">
                 <Gift size={16} className="mr-1.5" /> 大船好康禮包
               </button>
             </div>
             <ul className="text-[14px] space-y-1">
               <li>單件基礎總計: <span className="font-bold">{itemBreakdown.base + itemBreakdown.packages}</span> 元</li>
               <li className="text-[#10b981] font-medium">客製印字追加: <span className="font-bold">{itemBreakdown.print}</span> 元</li>
               {appliedPackages.map((pkg, i) => <li key={i} className="text-emerald-600 text-[12px]">✅ {pkg}</li>)}
             </ul>
          </div>
          <div className="text-right">
             <div className="text-[13px] text-slate-500">應付總額</div>
             <div className="text-3xl font-black text-[#3b82f6]">NT$ {total}</div>
          </div>
        </div>

        <div className="p-6 border-t border-[#e2e8f0] bg-[#fafafa]">
           <button 
             type="submit" 
             disabled={!isAdmin} 
             className={`w-full py-4 rounded-xl font-bold text-lg shadow-sm transition-all ${isAdmin ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-400 text-white cursor-not-allowed opacity-80'}`}
           >
            {isAdmin ? '確認金額無誤，送出訂單 🚢' : '訂購時間已到，無法下單。'}
          </button>
        </div>
      </form>

      {/* 📊 尺寸彈窗與試穿數據 (回歸 400+ 行版完整內容)[cite: 1] */}
      {isSizeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-[#fafafa]">
              <h3 className="font-bold text-[#1e293b]">尺寸參考與試穿報告</h3>
              <button onClick={() => setIsSizeModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="flex border-b bg-white px-2 pt-2">
               <button className={`px-4 py-2 text-[14px] font-bold border-b-2 ${sizeModalTab === 'chart' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#64748b]'}`} onClick={() => setSizeModalTab('chart')}>尺寸表</button>
               <button className={`px-4 py-2 text-[14px] font-bold border-b-2 ${sizeModalTab === 'feedback' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#64748b]'}`} onClick={() => setSizeModalTab('feedback')}>體感回報</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
               {sizeModalTab === 'chart' ? (
                 <img src={settings.sizeChartUrl} alt="尺寸表" className="w-full rounded-lg border" />
               ) : (
                 <div className="space-y-6 text-[14px]">
                   <div><h4 className="font-bold text-blue-600 bg-blue-50 px-2 py-1 inline-block rounded mb-2">Size M</h4><p>172/62 略小、161/60 合身、165/72 合身</p></div>
                   <div><h4 className="font-bold text-blue-600 bg-blue-50 px-2 py-1 inline-block rounded mb-2">Size L</h4><p>170/70 略小、167/70 合身、174/73 合身、172/62 合身、165/72 舒適</p></div>
                   <div><h4 className="font-bold text-blue-600 bg-blue-50 px-2 py-1 inline-block rounded mb-2">Size XL</h4><p>171/88 略小、181/82 略小、172/81 合身、166/80 合身、167/70 舒適</p></div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* 🎁 禮包彈窗 */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-[#fafafa]">
              <h3 className="font-bold flex items-center"><Gift size={20} className="mr-2 text-rose-500" />大船好康禮包</h3>
              <button onClick={() => setIsPackageModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="p-4">
              <img src="https://i.postimg.cc/3RRY5Wdg/4final.png" alt="禮包" className="w-full rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}