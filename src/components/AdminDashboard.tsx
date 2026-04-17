import React, { useMemo, useState } from 'react';
import { Order } from '../types';
import { Package, Users, Shirt, Printer, Trash2, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  onDeleteOrder?: (id: string) => void;
  onTogglePickupStatus?: (id: string, isPickedUp: boolean) => void;
}

export default function AdminDashboard({ orders, onDeleteOrder, onTogglePickupStatus }: AdminDashboardProps) {
  const [sortConfig, setSortConfig] = useState<{key: 'type' | 'color' | 'size' | 'count', direction: 'asc' | 'desc'}>({key: 'type', direction: 'asc'});
  const [pickupFilter, setPickupFilter] = useState<string>('all');

  // 1. 廠商叫貨統計 (Type -> Color -> Size -> Quantity)
  const aggregatedData = useMemo(() => {
    const data: Record<string, number> = {};
    let totalItems = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        const key = `${item.type}|${item.color}|${item.size}`;
        data[key] = (data[key] || 0) + item.quantity;
        totalItems += item.quantity;
      });
    });

    // 轉換成陣列並排序以便渲染
    const list = Object.entries(data).map(([key, count]) => {
      const [type, color, size] = key.split('|');
      return { type, color, size, count };
    });

    // 排序 (根據 sortConfig)
    list.sort((a, b) => {
       const key = sortConfig.key;
       let comparison = 0;
       
       if (key === 'count') {
         comparison = a.count - b.count;
       } else {
         comparison = a[key].localeCompare(b[key]);
         
         // 如果主要排序欄位相同，再依序比較其他欄位
         if (comparison === 0) {
            if (key !== 'type' && a.type !== b.type) comparison = a.type.localeCompare(b.type);
            else if (key !== 'color' && a.color !== b.color) comparison = a.color.localeCompare(b.color);
            else if (key !== 'size' && a.size !== b.size) comparison = a.size.localeCompare(b.size);
         }
       }
       
       return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return { list, totalItems };
  }, [orders, sortConfig]);

  const handleSort = (key: 'type' | 'color' | 'size' | 'count') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 取得所有有訂購的領貨日
  const allPickupDays = useMemo(() => {
    const days = new Set<string>();
    orders.forEach(o => o.pickupDays?.forEach(d => days.add(d)));
    return Array.from(days);
  }, [orders]);

  // 過濾與排序面交名單（已領取的排到最後面）
  const pickupOrders = useMemo(() => {
    let list = orders;
    if (pickupFilter !== 'all') {
      list = orders.filter(o => o.pickupDays?.includes(pickupFilter));
    }
    return [...list].sort((a, b) => {
      const aPicked = a.isPickedUp ? 1 : 0;
      const bPicked = b.isPickedUp ? 1 : 0;
      return aPicked - bPicked;
    });
  }, [orders, pickupFilter]);

  // 2. 印字明細
  const customPrintList = useMemo(() => {
    return orders.flatMap(order => 
      order.items
        .filter(item => item.customName && item.customName.trim() !== '')
        .map(item => ({
          buyerName: order.buyerName,
          type: item.type,
          color: item.color,
          size: item.size,
          customName: item.customName,
          quantity: item.quantity
        }))
    );
  }, [orders]);
  
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 text-[#64748b]">
        <Package className="w-16 h-16 mb-4 text-[#e2e8f0]" />
        <h2 className="text-[20px] font-medium text-[#1e293b]">目前還沒有任何訂單</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      {/* 總覽數據 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="text-[12px] text-[#64748b] mb-2 uppercase">總訂購人數</div>
          <div className="text-[24px] font-bold text-[#3b82f6]">{orders.length} <span className="text-[14px] font-normal text-[#64748b]">人</span></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="text-[12px] text-[#64748b] mb-2 uppercase">衣物總件數</div>
          <div className="text-[24px] font-bold text-[#3b82f6]">{aggregatedData.totalItems} <span className="text-[14px] font-normal text-[#64748b]">件</span></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="text-[12px] text-[#64748b] mb-2 uppercase">印字總件數</div>
          <div className="text-[24px] font-bold text-[#3b82f6]">
            {customPrintList.reduce((sum, item) => sum + item.quantity, 0)} <span className="text-[14px] font-normal text-[#64748b]">件</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="text-[12px] text-[#64748b] mb-2 uppercase">預估總金額</div>
          <div className="text-[24px] font-bold text-[#10b981]">
            $ {totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="text-[12px] text-[#64748b] mb-2 uppercase">資料狀態</div>
          <div className="text-[24px] font-bold text-[#10b981]">即時更新</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 flex-1 min-h-0">
        {/* 左側：廠商叫貨統計表 */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#fafafa] font-semibold text-[14px] flex justify-between items-center text-[#1e293b]">
            <span className="flex items-center">
              <Shirt className="w-4 h-4 mr-2 text-[#64748b]" />
              廠商叫貨統計單
            </span>
            <span className="text-[#3b82f6] font-normal text-[13px]">單位：件</span>
          </div>
          <div className="flex-1 overflow-y-auto px-5">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal cursor-pointer hover:bg-slate-50 transition-colors group" onClick={() => handleSort('type')}>
                    <div className="flex items-center">款式 {sortConfig.key === 'type' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50" />}</div>
                  </th>
                  <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal cursor-pointer hover:bg-slate-50 transition-colors group" onClick={() => handleSort('color')}>
                    <div className="flex items-center">顏色 {sortConfig.key === 'color' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50" />}</div>
                  </th>
                  <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal cursor-pointer hover:bg-slate-50 transition-colors group" onClick={() => handleSort('size')}>
                    <div className="flex items-center">尺寸 {sortConfig.key === 'size' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50" />}</div>
                  </th>
                  <th className="text-right py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal cursor-pointer hover:bg-slate-50 transition-colors group" onClick={() => handleSort('count')}>
                    <div className="flex items-center justify-end">數量 {sortConfig.key === 'count' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50" />}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.list.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-2 border-b border-[#e2e8f0] font-semibold text-[#1e293b]">{row.type}</td>
                    <td className="py-3 px-2 border-b border-[#e2e8f0] text-[#1e293b]">{row.color}</td>
                    <td className="py-3 px-2 border-b border-[#e2e8f0]">
                      <span className="bg-[#eff6ff] text-[#3b82f6] font-semibold rounded px-2 py-1 text-[11px]">
                        {row.size}
                      </span>
                    </td>
                    <td className="py-3 px-2 border-b border-[#e2e8f0] font-bold text-[#1e293b] text-right">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右側：客製印字明細 */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#fafafa] font-semibold text-[14px] flex justify-between items-center text-[#1e293b]">
            <span className="flex items-center">
              <Printer className="w-4 h-4 mr-2 text-[#64748b]" />
              印字與客製化清單
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-5">
            {customPrintList.length > 0 ? (
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">訂購人</th>
                    <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">印字內容</th>
                    <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">位置 (款式/顏色/尺寸)</th>
                  </tr>
                </thead>
                <tbody>
                  {customPrintList.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-2 border-b border-[#e2e8f0] text-[#1e293b]">{item.buyerName}</td>
                      <td className="py-3 px-2 border-b border-[#e2e8f0]">
                        <span className="bg-[#fffbeb] text-[#f59e0b] border border-[#fde68a] font-semibold rounded px-2 py-1 text-[11px]">
                          {item.customName}
                        </span>
                        {item.quantity > 1 && <span className="ml-2 text-xs text-[#64748b]">x{item.quantity}</span>}
                      </td>
                      <td className="py-3 px-2 border-b border-[#e2e8f0] text-[#64748b]">
                        {item.type} / {item.color} / {item.size}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
               <div className="py-12 text-center text-[#64748b] text-[14px]">
                目前沒有需要客製印字的項⽬。
               </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 原始訂單明細 (選用) */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] flex flex-col overflow-hidden max-h-[300px]">
        <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#fafafa] font-semibold text-[14px] text-[#1e293b] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span>所有原始訂單記錄</span>
            <select
              value={pickupFilter}
              onChange={(e) => setPickupFilter(e.target.value)}
              className="bg-white border border-[#e2e8f0] rounded px-2 py-1 text-[13px] text-[#64748b] focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="all">所有領貨日</option>
              {allPickupDays.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => {
              const headers = ['訂購時間', '訂購人(花名)', '身分', '領貨日', '應收金額', '訂購品項明細', '備註', '領取狀態'];
              const rows = pickupOrders.map(order => {
                const itemsStr = order.items.map(item => `${item.type}(${item.color},${item.size})x${item.quantity}${item.customName ? ` 印[${item.customName}]` : ''}`).join('；');
                const pickupStr = order.pickupDays?.join('、') || '未填寫';
                const isStudentStr = order.isStudent ? '學生' : '一般';
                const dateStr = new Date(order.createdAt).toLocaleString('zh-TW');
                const statusStr = order.isPickedUp ? '已領取' : '未領取';
                const noteStr = order.note || '';

                const escapeCell = (str: string | number) => `"${String(str).replace(/"/g, '""')}"`;
                return [escapeCell(dateStr), escapeCell(order.buyerName), escapeCell(isStudentStr), escapeCell(pickupStr), escapeCell(order.totalPrice), escapeCell(itemsStr), escapeCell(noteStr), escapeCell(statusStr)].join(',');
              });
              
              const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `大船團服訂購名單_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '')}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors text-[13px] font-medium"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            匯出至 Google Sheets (CSV)
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">時間</th>
                <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">訂購人 (花名)</th>
                <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">身分標籤</th>
                <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">領貨日</th>
                <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">應收金額</th>
                <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">訂購明細</th>
                <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">備註</th>
                <th className="text-left py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal">狀態</th>
                <th className="text-right py-3 px-2 text-[#64748b] border-b-2 border-[#e2e8f0] bg-white sticky top-0 font-normal min-w-[60px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {pickupOrders.map(order => (
                <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${order.isPickedUp ? 'bg-slate-50/70 opacity-60' : ''}`}>
                  <td className={`py-3 px-2 border-b border-[#e2e8f0] ${order.isPickedUp ? 'line-through text-slate-400' : 'text-[#64748b]'}`}>
                    {new Date(order.createdAt).toLocaleString('zh-TW')}
                  </td>
                  <td className={`py-3 px-2 border-b border-[#e2e8f0] ${order.isPickedUp ? 'line-through text-slate-400 font-medium' : 'font-semibold text-[#1e293b]'}`}>
                    {order.buyerName}
                  </td>
                  <td className={`py-3 px-2 border-b border-[#e2e8f0] text-[#64748b] ${order.isPickedUp ? 'line-through text-slate-400' : ''}`}>
                    {order.isStudent ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">學生</span> : '-'}
                  </td>
                  <td className={`py-3 px-2 border-b border-[#e2e8f0] text-[#64748b] ${order.isPickedUp ? 'line-through text-slate-400' : ''}`}>
                    {order.pickupDays?.length > 0 ? order.pickupDays.join(', ') : <span className="text-gray-300">未填寫</span>}
                  </td>
                  <td className={`py-3 px-2 border-b border-[#e2e8f0] font-semibold ${order.isPickedUp ? 'line-through text-emerald-600/50' : 'text-emerald-600'}`}>
                    ${order.totalPrice}
                  </td>
                  <td className={`py-3 px-2 border-b border-[#e2e8f0] text-[#64748b] ${order.isPickedUp ? 'line-through text-slate-400' : ''}`}>
                    <ul className="space-y-1">
                      {order.items.map(item => (
                        <li key={item.id} className="flex items-center gap-2">
                          <span>{item.type} ({item.color}, {item.size})</span>
                          <span className={`${order.isPickedUp ? 'text-slate-400' : 'font-semibold text-[#1e293b]'}`}>x{item.quantity}</span>
                          {item.customName && (
                            <span className="bg-[#fffbeb] text-[#f59e0b] border border-[#fde68a] rounded px-1.5 py-0.5 text-[10px]">
                              印 {item.customName}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className={`py-3 px-2 border-b border-[#e2e8f0] text-[#64748b] ${order.isPickedUp ? 'line-through text-slate-400' : ''} max-w-[150px] truncate`} title={order.note || ''}>
                    {order.note || '-'}
                  </td>
                  <td className="py-3 px-2 border-b border-[#e2e8f0]">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!order.isPickedUp} 
                        onChange={(e) => onTogglePickupStatus?.(order.id, e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 w-4 h-4 cursor-pointer" 
                      />
                      <span className={`text-xs ${order.isPickedUp ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>已領取</span>
                    </label>
                  </td>
                  <td className="py-3 px-2 border-b border-[#e2e8f0] text-right">
                    <button 
                      onClick={() => onDeleteOrder?.(order.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="刪除此筆訂單"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
