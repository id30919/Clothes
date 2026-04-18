import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, CreditCard, X, Info, Gift } from 'lucide-react';
import { CLOTHING_COLORS, CLOTHING_SIZES, CLOTHING_TYPES, PICKUP_OPTIONS, Order, OrderItem, AppSettings } from '../types';

interface OrderFormProps {
  onSubmit: (order: Order) => void;
  settings: AppSettings;
}

export default function OrderForm({ onSubmit, settings }: OrderFormProps) {
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
    size: CLOTHING_SIZES[2], // 預設 M
    customName: '',
    quantity: 1
  }]);

  const [note, setNote] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  // 成功送出後自動捲動到頂端
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
    setItems([...items, {
      id: crypto.randomUUID(),
      type: CLOTHING_TYPES[0],
      color: CLOTHING_COLORS[0],
      size: CLOTHING_SIZES[2],
      customName: '',
      quantity: 1
    }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // 💡 挨滴的核心算帳邏輯：包含同名免費優待
  const { total, appliedPackages, itemBreakdown } = useMemo(() => {
    let _total = 0;
    let _applied: string[] = [];
    let _breakdown = { base: 0, print: 0, packages: 0 };

    // 將所有品項展開（處理數量 > 1 的情況）
    const expandedItems: { size: string, customName: string }[] = [];
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        expandedItems.push({ size: item.size, customName: item.customName.trim() });
      }
    });

    // 依照 Size 分組計算（因為禮包要求同 Size 湊件）
    const bySize: Record<string, { size: string, customName: string }[]> = {};
    expandedItems.forEach(item => {
      if (!bySize[item.size]) bySize[item.size] = [];
      bySize[item.size].push(item);
    });

    Object.entries(bySize).forEach(([size, sizeItems]) => {
      let unassigned = [...sizeItems];

      // 🎁 1. 處理禮包 A (愛你4發：4件 1800)
      if (settings.packageA.enabled) {
        while (unassigned.length >= settings.packageA.requiredQty) {
          const group = unassigned.splice(0, settings.packageA.requiredQty);
          _total += settings.packageA.price;
          _breakdown.packages += settings.packageA.price;
          _applied.push(`🎁 禮包A優惠 (同Size: ${size})`);

          // 💡 同名免費邏輯：計算這 4 件中有幾種不同的名字
          const namesInGroup = group.map(i => i.customName).filter(n => n !== "");
          const uniqueNamesCount = new Set(namesInGroup).size;
          
          // 如果有印名字，第一種名字免費，從第二種不同的名字才開始收費
          const printChargeCount = Math.max(0, uniqueNamesCount - 1);
          _total += printChargeCount * settings.printPrice;
          _breakdown.print += printChargeCount * settings.printPrice;
        }
      }

      // 🎁 2. 處理禮包 B (2根才夠：2件 900)
      if (settings.packageB.enabled) {
        while (unassigned.length >= settings.packageB.requiredQty) {
          const group = unassigned.splice(0, settings.packageB.requiredQty);
          _total += settings.packageB.price;
          _breakdown.packages += settings.packageB.price;
          _applied.push(`🎁 禮包B優惠 (同Size: ${size})`);

          // 💡 禮包 B 邏輯：1 件免費印，另一件不論同名與否皆 +40 (符合優於兩件方案之說)
          const printCount = group.filter(i => i.customName).length;
          const printChargeCount = Math.max(0, printCount - settings.packageB.freePrints);
          _total += printChargeCount * settings.printPrice;
          _breakdown.print += printChargeCount * settings.printPrice;
        }
      }

      // 🛒 3. 處理剩餘單件 (500/件)
      unassigned.forEach(item => {
        _total += settings.basePrice;
        _breakdown.base += settings.basePrice;
        if (item.customName) {
          _total += settings.printPrice;
          _breakdown.print += settings.printPrice;
        }
      });
    });

    // 🎓 4. 學生身分最後折抵
    if (isStudent && _total > 0) {
      _total = Math.max(0, _total - settings.studentDiscount);
      _applied.push(`🎓 學生身分優惠 (-${settings.studentDiscount}元)`);
    }

    return { total: _total, appliedPackages: _applied, itemBreakdown: _breakdown };
  }, [items, isStudent, settings]);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const averagePrice = totalQuantity > 0 ? Math.round(total / totalQuantity) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || items.length === 0) return;
    const newOrder: Order = {
      id: crypto.randomUUID(),
      buyerName,
      isStudent,
      pickupDays,
      items,
      totalPrice: total,
      createdAt: new Date().toISOString(),
      note
    };
    onSubmit(newOrder);
    setSubmittedOrder(newOrder);
  };

  // ✅ 成功送出後的華麗畫面 [cite: 69-87]
  if (submittedOrder) {
    return (
      <div id="success-top-anchor" className="flex flex-col items-center justify-center pt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#e2e8f0] p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 text-[#10b981] mx-auto mb-4" />
            <h2 className="text-[24px] font-semibold text-[#1e293b] mb-2">訂單已成功送出！</h2>
            <p className="text-[#64748b]">感謝您的填寫，我們已收到您的訂購資訊。</p>
            <div className="mt-4 inline-block bg-blue-50 text-blue-700 px-6 py-3 rounded-lg border border-blue-100">
              <div className="text-[14px] text-blue-600/80 mb-1">應付款總金額</div>
              <div className="text-2xl font-bold text-blue-700">{submittedOrder.totalPrice} 元</div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-[16px] font-bold text-[#1e293b] mb-3 text-center border-b pb-2">購買明細</h3>
            <ul className="space-y-2 max-w-md mx-auto text-[14px] text-[#475569]">
              {submittedOrder.items.map((item, idx) => (
                <li key={item.id} className="flex flex-col bg-[#f8fafc] p-3 rounded border border-[#e2e8f0]">
                  <div className="flex justify-between font-medium">
                    <span>{idx + 1}. {item.type} ({item.color}) - {item.size}</span>
                    <span>x {item.quantity}</span>
                  </div>
                  {item.customName ? (
                    <div className="mt-1 text-[13px] text-amber-600 font-medium">◆ 印字內容：{item.customName}</div>
                  ) : (
                    <div className="mt-1 text-[13px] text-gray-400">◆ 無印字</div>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-center text-[13px] text-rose-500 mt-4 font-bold">⚠️ 系統已自動套用同名印字優惠！</p>
          </div>

          <div className="bg-blue-50/80 border border-blue-200 p-6 rounded-lg text-blue-900 mb-8 mx-auto">
            <h3 className="font-bold flex items-center justify-center mb-4 text-[16px] border-b border-blue-200/60 pb-3">
               <CreditCard className="w-5 h-5 mr-2 text-blue-600" /> 付款通知
            </h3>
            <div className="space-y-3 max-w-md mx-auto text-[14px]">
              <p className="flex items-center gap-4"><span className="bg-white px-2 py-0.5 rounded border border-blue-100 text-[#64748b] text-[12px] w-[42px] text-center">銀行</span><span className="font-bold">台新銀行 (812)</span></p>
              <p className="flex items-center gap-4"><span className="bg-white px-2 py-0.5 rounded border border-blue-100 text-[#64748b] text-[12px] w-[42px] text-center">帳號</span><span className="font-mono font-bold tracking-wider text-[15px]">28881000045799</span></p>
              <p className="flex items-center gap-4"><span className="bg-white px-2 py-0.5 rounded border border-blue-100 text-[#64748b] text-[12px] w-[42px] text-center">戶名</span><span className="font-bold">許弘德 (不收Line Pay)</span></p>
              <div className="pt-2 border-t border-blue-200/50 mt-2">
                <p className="text-red-500 font-bold text-center mb-3">✅ 匯款備註：請務必備註您的「大名or花名」</p>
                <div className="flex justify-center">
                  <a href="https://mobile.richart.tw/TSDIB_RichartWeb/RC04/RC040300?token=890B498D154495B2DA69B2D355607613" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 px-4 py-2 rounded-md font-bold border-2 border-blue-200 bg-white shadow-sm hover:bg-blue-50 transition-colors">
                    📌 點我開啟台新 Richart 匯款連結
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <button onClick={() => { setSubmittedOrder(null); setBuyerName(''); setPickupDays([]); setItems([{ id: crypto.randomUUID(), type: CLOTHING_TYPES[0], color: CLOTHING_COLORS[0], size: CLOTHING_SIZES[2], customName: '', quantity: 1 }]); }} className="px-6 py-2.5 bg-[#f1f5f9] text-[#475569] font-medium rounded-lg hover:bg-[#e2e8f0] transition-colors">完成，返回填寫下一筆訂單</button>
          </div>
        </div>
      </div>
    );
  }

  // 📝 填寫表單主體
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#e2e8f0] p-6 text-center">
         <div className="whitespace-pre-line text-[#1e293b] font-black text-2xl md:text-[28px] tracking-wider uppercase">
           {settings.announcementText}
         </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#e2e8f0] flex flex-col overflow-hidden">
        {/* 一、訂購人資訊 [cite: 89-93] */}
        <div className="p-6 border-b border-[#e2e8f0] bg-[#fafafa]">
          <h2 className="text-[14px] font-semibold text-[#1e293b] mb-4">一、填寫訂購人資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">您在大船的花名？（若同名，請補上職業） <span className="text-red-500">*</span></label>
              <input type="text" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] focus:ring-1 focus:ring-[#3b82f6] outline-none" placeholder="例如：小明 (工程師)" />
            </div>
            <div className="flex items-center mt-2 md:mt-[22px]">
               <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={isStudent} onChange={(e) => setIsStudent(e.target.checked)} className="rounded border-gray-300 text-[#3b82f6] w-4 h-4" />
                <span className="ml-2 text-[14px] font-medium text-[#64748b]">具備學生身分 (折抵 {settings.studentDiscount} 元)</span>
              </label>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#e2e8f0]/50">
            <label className="block text-[13px] font-medium text-[#64748b] mb-3">可領貨的球敘日？（可複選） <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-4">
              {PICKUP_OPTIONS.map(day => (
                <label key={day} className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={pickupDays.includes(day)} onChange={() => handlePickupToggle(day)} className="rounded border-gray-300 text-[#3b82f6] w-4 h-4" />
                  <span className="ml-2 text-[14px] font-medium text-[#1e293b]">{day}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 🖼️ 主視覺圖 [cite: 94] */}
        {settings.heroImageUrl && (
          <div className="w-full border-b border-[#e2e8f0]">
            <img src={settings.heroImageUrl} alt="團服主視覺" className="w-full h-auto block" loading="lazy" referrerPolicy="no-referrer" />
          </div>
        )}

        {/* 二、訂購品項 [cite: 95-108] */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[14px] font-semibold text-[#1e293b]">二、訂購品項明細</h2>
            <button type="button" onClick={() => setIsSizeModalOpen(true)} className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-[13px] font-medium hover:bg-blue-100 flex items-center transition-colors">
              <Info className="w-4 h-4 mr-1.5" /> 尺寸參考與試穿報告
            </button>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg text-[13px] mb-4 shadow-sm">
            <p className="font-bold mb-1 underline underline-offset-4 decoration-emerald-300">若購買以下情況，請務必點擊下方「+新增品項」：</p>
            <p>不同的 <span className="font-black">款式</span>、<span className="font-black">尺寸</span>、<span className="font-black">顏色</span>，或 <span className="font-black">有的印/不印名字</span>，系統才能正確辨認優惠哦！</p>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="relative p-5 border border-[#e2e8f0] rounded-lg bg-[#f4f7f9]/50 shadow-sm">
                <div className="absolute top-4 left-4 text-[12px] font-bold text-[#64748b]">#{index + 1}</div>
                {items.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="absolute top-4 right-4 text-[#64748b] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#64748b] mb-1">款式</label>
                    <select value={item.type} onChange={(e) => handleItemChange(item.id, 'type', e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] bg-white outline-none">
                      {CLOTHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#64748b] mb-1">顏色</label>
                    <select value={item.color} onChange={(e) => handleItemChange(item.id, 'color', e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] bg-white outline-none">
                      {CLOTHING_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#64748b] mb-1">尺寸</label>
                    <select value={item.size} onChange={(e) => handleItemChange(item.id, 'size', e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] bg-white outline-none">
                      {CLOTHING_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#64748b] mb-1">客製印字 <span className="opacity-70 text-[11px]">(+{settings.printPrice}元)</span></label>
                    <input type="text" value={item.customName} onChange={(e) => handleItemChange(item.id, 'customName', e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] outline-none" placeholder="(中英文皆可)" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#64748b] mb-1">數量</label>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] outline-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddItem} className="mt-4 flex items-center justify-center w-full py-2 border border-dashed border-[#64748b] rounded-lg text-[#64748b] hover:border-[#3b82f6] hover:text-[#3b82f6] text-[14px] bg-[#fafafa] transition-all">
            <Plus className="w-4 h-4 mr-2" /> 新增品項
          </button>
        </div>

        {/* 💰 費用試算 [cite: 109-113] */}
        <div className="p-6 border-t border-[#e2e8f0] bg-white flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-[13px] font-semibold text-[#64748b]">費用試算 (同名免費已套用)</h3>
               <button type="button" onClick={() => setIsPackageModalOpen(true)} className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-md text-[13px] font-medium hover:bg-rose-100 flex items-center transition-colors">
                 <Gift className="w-4 h-4 mr-1.5" /> 大船好康禮包
               </button>
             </div>
             <ul className="text-[14px] space-y-1 text-[#1e293b]">
               <li>單件基礎商品總計: <span className="font-bold">{itemBreakdown.base + itemBreakdown.packages}</span> 元</li>
               <li className="flex flex-col gap-1 text-[#10b981] font-medium">
                 <span>客製印字追加: <span className="font-bold">{itemBreakdown.print}</span> 元</span>
                 {appliedPackages.map((pkg, i) => <span key={i} className="text-[12px]">✅ {pkg}</span>)}
               </li>
             </ul>
          </div>
          <div className="text-right md:self-end mt-4 md:mt-0">
             <div className="text-[13px] text-[#64748b] mb-1">應付總額</div>
             <div className="text-3xl font-black text-[#3b82f6]">NT$ {total}</div>
             {totalQuantity > 0 && <div className="text-[12px] text-[#64748b] mt-1 font-medium">（共 {totalQuantity} 件，平均每件 {averagePrice} 元）</div>}
          </div>
        </div>

        {/* 三、備註與送出 [cite: 114-115] */}
        <div className="p-6 border-t border-[#e2e8f0] bg-white">
          <h2 className="text-[14px] font-semibold text-[#1e293b] mb-4">三、其他建議或附註</h2>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="交貨細節都可以填寫在這裡喔～" className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] outline-none" />
        </div>
        <div className="p-6 border-t border-[#e2e8f0] bg-[#fafafa]">
           <button type="submit" className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3 rounded-lg shadow-sm transition-colors text-[15px]">確認金額與領貨日無誤，送出訂單 🚢</button>
        </div>
      </form>

      {/* 📊 尺寸彈窗與試穿數據 [cite: 116-135] */}
      {isSizeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b bg-[#fafafa]">
              <h3 className="font-bold text-[#1e293b]">尺寸參考與試穿報告</h3>
              <button onClick={() => setIsSizeModalOpen(false)} className="p-1 hover:bg-[#e2e8f0] rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex border-b bg-white px-2 pt-2">
               <button className={`px-4 py-2 text-[14px] font-bold border-b-2 ${sizeModalTab === 'chart' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#64748b]'}`} onClick={() => setSizeModalTab('chart')}>尺寸表圖示</button>
               <button className={`px-4 py-2 text-[14px] font-bold border-b-2 ${sizeModalTab === 'feedback' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#64748b]'}`} onClick={() => setSizeModalTab('feedback')}>大家試穿體感回報</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-white">
               {sizeModalTab === 'chart' ? (
                 <div className="flex flex-col items-center">
                   {settings.sizeChartUrl ? <img src={settings.sizeChartUrl} alt="尺寸表" className="w-full h-auto rounded-lg border border-[#e2e8f0]" /> : <div className="py-12 text-[#64748b]">📋 尚無上傳尺寸表圖片</div>}
                 </div>
               ) : (
                 <div className="space-y-6 text-[14px] text-[#1e293b]">
                   <div><h4 className="font-bold text-[#3b82f6] bg-blue-50 px-3 py-1 rounded-md mb-2 inline-block">【Size M】</h4><ul className="space-y-1 ml-2 text-[#64748b]"><li>172/62，M <span className="text-orange-500">略小</span></li><li>170/60，M <span className="text-orange-500">略小</span></li><li>161/60，M <span className="text-green-600">合身</span></li><li>165/72，M <span className="text-green-600">合身</span></li><li>172/60，M <span className="text-green-600">合身</span></li></ul></div>
                   <div><h4 className="font-bold text-[#3b82f6] bg-blue-50 px-3 py-1 rounded-md mb-2 inline-block">【Size L】</h4><ul className="space-y-1 ml-2 text-[#64748b] grid grid-cols-2 gap-x-4"><li>170/70，L <span className="text-orange-500">略小</span></li><li>171/72，L <span className="text-orange-500">略小</span></li><li>167/70，L <span className="text-green-600">合身</span></li><li>174/73，L <span className="text-green-600">合身</span></li><li>172/62，L <span className="text-green-600">合身</span></li><li>171/73，L <span className="text-green-600">合身</span></li><li>170/60，L <span className="text-green-600">合身</span></li><li>177/76，L <span className="text-green-600">合身</span></li><li>175/66，L <span className="text-green-600">合身</span></li><li>165/72，L <span className="text-blue-500">舒適</span></li></ul></div>
                   <div><h4 className="font-bold text-[#3b82f6] bg-blue-50 px-3 py-1 rounded-md mb-2 inline-block">【Size XL】</h4><ul className="space-y-1 ml-2 text-[#64748b] grid grid-cols-2 gap-x-4"><li>171/88，XL <span className="text-orange-500">略小</span></li><li>181/82，XL <span className="text-orange-500">略小</span></li><li>172/90，XL <span className="text-orange-500">略小</span></li><li>170/70，XL <span className="text-green-600">合身</span></li><li>171/73，XL <span className="text-green-600">合身</span></li><li>172/81，XL <span className="text-green-600">合身</span></li><li>171/72，XL <span className="text-green-600">合身</span></li><li>166/80，XL <span className="text-green-600">合身</span></li><li>171/79，XL <span className="text-green-600">合身</span></li><li>167/70，XL <span className="text-blue-500">舒適</span></li><li>174/72，XL <span className="text-blue-500">舒適</span></li></ul></div>
                   <div><h4 className="font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-md mb-2 inline-block">【XL (無袖)】</h4><ul className="space-y-1 ml-2 text-[#64748b]"><li>172/90，XL <span className="text-orange-500">略小</span> (無袖)</li><li>178/68，XL <span className="text-green-600">合身</span> (無袖)</li><li>171/73，XL <span className="text-blue-500 font-medium">舒適</span> (無袖)</li></ul></div>
                 </div>
               )}
            </div>
            <div className="p-4 border-t bg-[#fafafa] flex justify-end">
              <button onClick={() => setIsSizeModalOpen(false)} className="px-6 py-2 bg-[#1e293b] text-white rounded-lg font-bold">關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* 🎁 禮包優惠彈窗 [cite: 137-142] */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b bg-[#fafafa]">
              <h3 className="font-bold text-[#1e293b] flex items-center"><Gift className="w-5 h-5 mr-2 text-rose-500" />大船好康禮包優惠</h3>
              <button onClick={() => setIsPackageModalOpen(false)} className="p-1 hover:bg-[#e2e8f0] rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-white">
               {settings.imageUrls.length > 0 ? (
                <div className="grid gap-4">{settings.imageUrls.map((url, i) => <img key={i} src={url} alt="優惠" className="rounded-lg border border-[#e2e8f0] w-full" referrerPolicy="no-referrer" />)}</div>
              ) : (
                <div className="space-y-6">
                  {settings.packageA.enabled && (<div className="bg-rose-50 border border-rose-200 p-5 rounded-lg"><h4 className="font-bold text-rose-700 text-lg mb-2">🎁 禮包 A (湊 {settings.packageA.requiredQty} 件)</h4><ul className="list-disc ml-5 text-rose-900 text-[14px]"><li>優惠價：{settings.packageA.price} 元</li><li>同名印字免費優待中！</li></ul></div>)}
                  {settings.packageB.enabled && (<div className="bg-blue-50 border border-blue-200 p-5 rounded-lg"><h4 className="font-bold text-blue-700 text-lg mb-2">🎁 禮包 B (湊 {settings.packageB.requiredQty} 件)</h4><ul className="list-disc ml-5 text-blue-900 text-[14px]"><li>優惠價：{settings.packageB.price} 元</li><li>1 件免費印名字</li></ul></div>)}
                </div>
               )}
            </div>
            <div className="p-4 border-t bg-[#fafafa] flex justify-end">
              <button onClick={() => setIsPackageModalOpen(false)} className="px-6 py-2 bg-[#1e293b] text-white rounded-lg font-bold">關閉</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}