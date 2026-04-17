import React from 'react';
import { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export default function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const handleChange = (field: keyof AppSettings, value: any) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  const handlePackageAChange = (field: keyof AppSettings['packageA'], value: any) => {
    onSettingsChange({
      ...settings,
      packageA: { ...settings.packageA, [field]: value }
    });
  };

  const handlePackageBChange = (field: keyof AppSettings['packageB'], value: any) => {
    onSettingsChange({
      ...settings,
      packageB: { ...settings.packageB, [field]: value }
    });
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const urls = [...settings.imageUrls];
    urls[index] = value;
    if (value === '' && index === urls.length - 1) {
      // do nothing
    }
    onSettingsChange({ ...settings, imageUrls: urls.filter(u => u !== '') });
  };

  const addImageUrl = () => {
    onSettingsChange({ ...settings, imageUrls: [...settings.imageUrls, ''] });
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#e2e8f0] overflow-hidden">
      <div className="p-6 border-b border-[#e2e8f0] bg-[#fafafa]">
        <h2 className="text-[18px] font-semibold text-[#1e293b]">系統設定</h2>
        <p className="text-[14px] text-[#64748b] mt-1">動態調整衣服價格、折扣方案與前台公告圖片。</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Basic Pricing */}
        <section>
          <h3 className="text-[15px] font-semibold text-[#3b82f6] mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] mr-2"></span>
            基礎定價
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">衣服單價 (元)</label>
              <input
                type="number"
                value={settings.basePrice}
                onChange={(e) => handleChange('basePrice', Number(e.target.value))}
                className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">客製印字單價 (元)</label>
              <input
                type="number"
                value={settings.printPrice}
                onChange={(e) => handleChange('printPrice', Number(e.target.value))}
                className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">學生優惠折扣 (元)</label>
              <input
                type="number"
                value={settings.studentDiscount}
                onChange={(e) => handleChange('studentDiscount', Number(e.target.value))}
                className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
            </div>
          </div>
        </section>

        {/* Package A */}
        <section className="bg-[#f4f7f9] p-5 rounded-lg border border-[#e2e8f0]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#1e293b]">優惠方案 A（例：愛你4發）</h3>
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.packageA.enabled}
                onChange={(e) => handlePackageAChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b82f6] relative"></div>
              <span className="ml-3 text-[13px] font-medium text-[#64748b]">啟用</span>
            </label>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${!settings.packageA.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">同尺寸累積件數</label>
              <input type="number" value={settings.packageA.requiredQty} onChange={(e) => handlePackageAChange('requiredQty', Number(e.target.value))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">方案優惠價 (元)</label>
              <input type="number" value={settings.packageA.price} onChange={(e) => handlePackageAChange('price', Number(e.target.value))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px]" />
            </div>
             <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">免費印字扣打 (件)</label>
              <input type="number" value={settings.packageA.freePrints} onChange={(e) => handlePackageAChange('freePrints', Number(e.target.value))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px]" />
            </div>
             <div className="flex items-end pb-2">
              <label className="flex items-center">
                <input type="checkbox" checked={settings.packageA.requireSameName} onChange={(e) => handlePackageAChange('requireSameName', e.target.checked)} className="rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]" />
                <span className="ml-2 text-[13px] text-[#64748b]">只在「名字相同」時才給印字免費</span>
              </label>
            </div>
          </div>
        </section>

        {/* Package B */}
        <section className="bg-[#f4f7f9] p-5 rounded-lg border border-[#e2e8f0]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#1e293b]">優惠方案 B（例：2根才夠）</h3>
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.packageB.enabled}
                onChange={(e) => handlePackageBChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b82f6] relative"></div>
              <span className="ml-3 text-[13px] font-medium text-[#64748b]">啟用</span>
            </label>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!settings.packageB.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">同尺寸累積件數</label>
              <input type="number" value={settings.packageB.requiredQty} onChange={(e) => handlePackageBChange('requiredQty', Number(e.target.value))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">方案優惠價 (元)</label>
              <input type="number" value={settings.packageB.price} onChange={(e) => handlePackageBChange('price', Number(e.target.value))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px]" />
            </div>
             <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">免費印字扣打 (件)</label>
              <input type="number" value={settings.packageB.freePrints} onChange={(e) => handlePackageBChange('freePrints', Number(e.target.value))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px]" />
            </div>
          </div>
        </section>

        {/* Display Settings */}
        <section>
           <h3 className="text-[15px] font-semibold text-[#3b82f6] mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] mr-2"></span>
            前台展示設定
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#64748b] mb-1">公告文字</label>
              <textarea
                value={settings.announcementText}
                onChange={(e) => handleChange('announcementText', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
            </div>
            
            <div>
               <label className="block text-[13px] font-medium text-[#64748b] mb-1">團服主視覺照片網址 (顯示於表單上方)</label>
               <input
                 type="text"
                 value={settings.heroImageUrl || ''}
                 onChange={(e) => handleChange('heroImageUrl', e.target.value)}
                 placeholder="（選填）提供主視覺圖片網址"
                 className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
               />
               <p className="text-[12px] text-gray-400 mt-1">此照片將顯眼地呈現於訂購品項明細的上方，吸引填單人。</p>
            </div>

            <div>
               <label className="block text-[13px] font-medium text-[#64748b] mb-1">尺寸表圖片網址</label>
               <input
                 type="text"
                 value={settings.sizeChartUrl}
                 onChange={(e) => handleChange('sizeChartUrl', e.target.value)}
                 placeholder="（選填）提供尺寸圖片網址"
                 className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
               />
               <p className="text-[12px] text-gray-400 mt-1">此圖片將顯示於「尺寸參考」彈出視窗內。</p>
            </div>

            <div>
               <label className="block text-[13px] font-medium text-[#64748b] mb-1">大船好康禮包圖片網址 (可多張)</label>
               {settings.imageUrls.map((url, i) => (
                 <div key={i} className="flex mb-2 gap-2">
                   <input
                     type="text"
                     value={url}
                     onChange={(e) => handleImageUrlChange(i, e.target.value)}
                     placeholder="https://..."
                     className="flex-1 rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                   />
                   <button 
                     onClick={() => {
                        const urls = [...settings.imageUrls];
                        urls.splice(i, 1);
                        handleChange('imageUrls', urls);
                     }}
                     className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-md border border-red-200"
                   >
                     移除
                   </button>
                 </div>
               ))}
               <button 
                 onClick={addImageUrl}
                 className="text-[13px] text-[#3b82f6] hover:underline"
               >
                 + 新增一組圖片網址（例如 Imgur 連結）
               </button>
               <p className="text-[12px] text-gray-400 mt-2">提示：若要更換好康禮包圖片，您可以先將圖片上傳至 Imgur 或其他空間，再貼上其直接網址 (例如結尾是 .jpg 或 .png 的網址) 即可。</p>
            </div>

            <div>
               <label className="block text-[13px] font-medium text-[#64748b] mb-1">匯款與現金繳交截止期限</label>
               <input
                 type="text"
                 value={settings.paymentDeadline || ''}
                 onChange={(e) => handleChange('paymentDeadline', e.target.value)}
                 placeholder="例如：2026/4/26 週日 下午4點前"
                 className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
               />
               <p className="text-[12px] text-gray-400 mt-1">此文字將顯示在前台的最後付款通知內。</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
