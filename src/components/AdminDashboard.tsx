import React, { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx'; 
import { Order, AppSettings, CLOTHING_TYPES, CLOTHING_COLORS, CLOTHING_SIZES, PICKUP_OPTIONS } from '../types';
import { 
  BarChart3, Users, Shirt, Receipt, Download, Trash2, Filter, 
  GripVertical, Scissors, FileSpreadsheet, PlusCircle 
} from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  settings: AppSettings;
  onDeleteOrder: (id: string) => void;
  onAddOrder: () => void; // 💡 新增：切換下單功能的 Prop
}

export default function AdminDashboard({ orders, settings, onDeleteOrder, onAddOrder }: AdminDashboardProps) {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [filterDay, setFilterDay] = useState<string>('all');

  // 🔍 左右面板獨立搜尋狀態
  const [leftFilter, setLeftFilter] = useState({ type: 'all', color: 'all', size: 'all', hasPrint: 'all' });
  const [rightFilter, setRightFilter] = useState({ type: 'all', color: 'all', size: 'all' });

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = useCallback((e: any) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const percentage = (clientX / window.innerWidth) * 100;
    if (percentage > 20 && percentage < 80) setLeftWidth(percentage);
  }, [isDragging]);

  const dayFilteredOrders = useMemo(() => {
    if (filterDay === 'all') return orders;
    return orders.filter(o => o.pickupDays.includes(filterDay));
  }, [orders, filterDay]);

  const getColorBadge = (color: string) => {
    if (color === '白色') return 'bg-white text-slate-600 border border-slate-200';
    if (color === '海軍藍') return 'bg-[#1e3a8a] text-white border border-[#1e3a8a]';
    return 'bg-slate-100 text-slate-600';
  };

  // 💡 核心計算：整合搜尋過濾[cite: 1]
  const vendorSummary = useMemo(() => {
    const summary: Record<string, { total: number; print: number; type: string; color: string; size: string }> = {};
    dayFilteredOrders.forEach(order => {
      order.items.forEach(item => {
        const matchType = leftFilter.type === 'all' || item.type === leftFilter.type;
        const matchColor = leftFilter.color === 'all' || item.color === leftFilter.color;
        const matchSize = leftFilter.size === 'all' || item.size === leftFilter.size;
        const isPrint = item.customName && item.customName.trim() !== "";
        const matchPrint = leftFilter.hasPrint === 'all' || (leftFilter.hasPrint === 'yes' ? isPrint : !isPrint);

        if (matchType && matchColor && matchSize && matchPrint) {
          const key = `${item.type}-${item.color}-${item.size}`;
          if (!summary[key]) summary[key] = { total: 0, print: 0, type: item.type, color: item.color, size: item.size };
          summary[key].total += item.quantity;
          if (isPrint) summary[key].print += item.quantity;
        }
      });
    });
    return Object.values(summary).sort((a, b) => a.type.localeCompare(b.type));
  }, [dayFilteredOrders, leftFilter]);

  const totalPrintItems = useMemo(() => vendorSummary.reduce((sum, item) => sum + item.print, 0), [vendorSummary]);

  const handleExportExcel = () => {
    const rawData = orders.flatMap(order => order.items.map(item => ({
      '訂購人': order.buyerName, '領貨日': order.pickupDays.join(', '),
      '款式': item.type, '顏色': item.color, '尺寸': item.size,
      '印字': item.customName || '無', '數量': item.quantity, '應付': order.totalPrice
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rawData), "明細備份");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendorSummary.map(v => ({
      '款式': v.type, '顏色': v.color, '尺寸': v.size, '總件數': v.total, '需印字': v.print
    }))), "廠商統計");
    XLSX.writeFile(wb, `大船備份_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className={`space-y-6 ${isDragging ? 'cursor-col-resize' : ''}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}>
      
      {/* 頂部數據卡片[cite: 1] */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users/>} label="訂購人數" value={`${dayFilteredOrders.length} 人`} />
        <StatCard icon={<Shirt/>} label="總衣物件數" value={`${vendorSummary.reduce((s, i) => s + i.total, 0)} 件`} />
        <StatCard icon={<Scissors/>} label="總印字件數" value={`${totalPrintItems} 件`} color="text-orange-600" />
        <StatCard icon={<Filter/>} label="目前篩選" value={filterDay === 'all' ? '全部' : filterDay} color="text-blue-500" />
      </div>

      <div className="flex flex-col lg:flex-row gap-0 h-[700px] border rounded-2xl overflow-hidden bg-slate-100 shadow-xl relative">
        <div style={{ width: `${leftWidth}%` }} className="bg-white h-full overflow-y-auto flex flex-col border-r">
          <div className="p-4 border-b sticky top-0 bg-white z-20 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center text-sm mb-3">
              <BarChart3 size={16} className="mr-2 text-blue-500"/> 廠商叫貨統計
            </h3>
            {/* 🔍 搜尋列 */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2 rounded-xl">
              <FilterSelect value={leftFilter.type} onChange={(v)=>setLeftFilter({...leftFilter, type:v})} options={CLOTHING_TYPES} label="款式" />
              <FilterSelect value={leftFilter.color} onChange={(v)=>setLeftFilter({...leftFilter, color:v})} options={CLOTHING_COLORS} label="顏色" />
              <FilterSelect value={leftFilter.size} onChange={(v)=>setLeftFilter({...leftFilter, size:v})} options={CLOTHING_SIZES} label="尺寸" />
              <FilterSelect value={leftFilter.hasPrint} onChange={(v)=>setLeftFilter({...leftFilter, hasPrint:v})} options={[{l:'全部',v:'all'},{l:'需印字',v:'yes'},{l:'不印字',v:'no'}]} label="印字" />
            </div>
            {/* 小卡片[cite: 1] */}
            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 grid grid-cols-2 gap-2">
              {CLOTHING_TYPES.map(type => CLOTHING_COLORS.map(color => {
                const items = vendorSummary.filter(v => v.type === type && v.color === color);
                const subTotal = items.reduce((s, i) => s + i.total, 0);
                if (subTotal === 0) return null;
                return (
                  <div key={`${type}-${color}`} className="bg-white p-2 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-400">{type}</span>
                      <span className={`text-[9px] px-1 rounded font-black ${getColorBadge(color)}`}>{color}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {items.map(i => <span key={i.size} className="text-[11px] font-bold text-slate-600">{i.size}:<span className="text-blue-600">{i.total}</span></span>)}
                    </div>
                    <div className="text-right border-t pt-1 text-[12px] font-black text-blue-700">共 {subTotal} 件</div>
                  </div>
                );
              }))}
            </div>
          </div>
          <div className="p-4">
            <table className="w-full text-[13px] text-left">
              <thead className="text-slate-400 font-bold border-b">
                <tr><th className="pb-2">細節清單</th><th className="pb-2 text-center">尺寸</th><th className="pb-2 text-right">總數</th><th className="pb-2 text-right text-orange-500">印</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vendorSummary.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 flex items-center gap-2"><span className="text-slate-500">{item.type}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${getColorBadge(item.color)}`}>{item.color}</span></td>
                    <td className="py-2.5 text-center font-bold">{item.size}</td>
                    <td className="py-2.5 text-right font-black">{item.total}</td>
                    <td className="py-2.5 text-right font-black text-orange-500">{item.print > 0 ? item.print : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div onMouseDown={handleMouseDown} onTouchStart={handleMouseDown} className="hidden lg:flex w-1.5 bg-slate-200 hover:bg-blue-400 cursor-col-resize items-center justify-center group"><GripVertical size={12} className="text-slate-400 group-hover:text-white" /></div>

        <div style={{ width: `calc(100% - ${leftWidth}%)` }} className="bg-white h-full overflow-y-auto flex flex-col">
          <div className="p-4 border-b sticky top-0 bg-white z-20 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center text-sm mb-3">
              <Scissors size={16} className="mr-2 text-orange-500"/> 印製加工總計 (共 {totalPrintItems} 件)
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-3 bg-orange-50/50 p-2 rounded-xl">
              <FilterSelect value={rightFilter.type} onChange={(v)=>setRightFilter({...rightFilter, type:v})} options={CLOTHING_TYPES} label="款式" />
              <FilterSelect value={rightFilter.color} onChange={(v)=>setRightFilter({...rightFilter, color:v})} options={CLOTHING_COLORS} label="顏色" />
              <FilterSelect value={rightFilter.size} onChange={(v)=>setRightFilter({...rightFilter, size:v})} options={CLOTHING_SIZES} label="尺寸" />
            </div>
            <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100 flex flex-wrap gap-2">
              {CLOTHING_TYPES.map(type => CLOTHING_COLORS.map(color => {
                const printCount = vendorSummary.filter(v => v.type === type && v.color === color).reduce((s, i) => s + i.print, 0);
                if (printCount === 0) return null;
                return (
                  <div key={`p-${type}-${color}`} className="bg-white px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-2">
                     <span className={`text-[10px] px-1 rounded font-black ${getColorBadge(color)}`}>{color}</span>
                     <span className="text-[11px] font-bold text-slate-600">{type}</span>
                     <span className="text-[13px] font-black text-orange-600">{printCount} 件</span>
                  </div>
                );
              }))}
            </div>
          </div>
          <div className="p-4 space-y-2">
            {dayFilteredOrders.map(o => o.items.filter(i => {
              const isPrint = i.customName && i.customName.trim() !== "";
              return isPrint && (rightFilter.type === 'all' || i.type === rightFilter.type) && (rightFilter.color === 'all' || i.color === rightFilter.color) && (rightFilter.size === 'all' || i.size === rightFilter.size);
            }).map((i, idx) => (
              <div key={`${o.id}-${idx}`} className="p-3 border border-slate-100 rounded-xl bg-[#fafafa] flex justify-between items-center shadow-sm">
                <div><span className="text-[10px] text-slate-400 block mb-0.5">{o.buyerName}</span><span className="font-bold text-slate-800 text-[15px]">{i.customName}</span></div>
                <div className="flex flex-col items-end gap-1"><span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${getColorBadge(i.color)}`}>{i.color}</span><span className="text-[10px] font-bold text-slate-500">{i.type} / {i.size}</span></div>
              </div>
            )))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-800 text-sm">原始紀錄 (共 {dayFilteredOrders.length} 筆)</h3>
            <select value={filterDay} onChange={(e)=>setFilterDay(e.target.value)} className="text-xs border rounded-lg px-2 py-1 font-bold">
              <option value="all">所有領貨日</option>
              {PICKUP_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            {/* 💡 增加：管理員下單按鈕 */}
            <button onClick={onAddOrder} className="text-xs flex items-center bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm">
              <PlusCircle size={14} className="mr-1.5"/> 手動補單
            </button>
            <button onClick={handleExportExcel} className="text-xs flex items-center bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700">
              <FileSpreadsheet size={14} className="mr-1.5"/> 匯出 Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-[13px]">
            <thead className="bg-[#fafafa] text-slate-500 font-bold border-b">
              <tr><th className="p-4">時間</th><th className="p-4">訂購人</th><th className="p-4">應付金額</th><th className="p-4">明細</th><th className="p-4">操作</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dayFilteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-400">{new Date(order.createdAt).toLocaleString('zh-TW')}</td>
                  <td className="p-4 font-bold">{order.buyerName}</td>
                  <td className="p-4 font-black text-blue-600">${order.totalPrice}</td>
                  <td className="p-4 text-slate-600">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {i.type}({i.size}) <span className={`text-[9px] px-1 rounded font-bold ${getColorBadge(i.color)}`}>{i.color}</span> x{i.quantity} 
                        {i.customName && <span className="text-orange-500 font-black">[{i.customName}]</span>}
                      </div>
                    ))}
                  </td>
                  <td className="p-4"><button onClick={()=>onDeleteOrder(order.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options, label }: any) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-slate-400 font-bold ml-1 mb-0.5">{label}</span>
      <select value={value} onChange={(e)=>onChange(e.target.value)} className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 outline-none bg-white font-bold text-slate-600">
        <option value="all">全部</option>
        {options.map((o: any) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function StatCard({ icon, label, value, color = "text-blue-600" }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-xl text-slate-400">{icon}</div>
      <div><p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{label}</p><p className={`text-xl font-black ${color}`}>{value}</p></div>
    </div>
  );
}