export interface OrderItem {
  id: string;
  type: string;
  color: string;
  size: string;
  customName: string;
  quantity: number;
}

export interface Order {
  id: string;
  buyerName: string;
  isStudent: boolean;
  pickupDays: string[];
  items: OrderItem[];
  totalPrice: number;
  createdAt: string;
  note?: string;
}

export interface AppSettings {
  announcementText: string;
  paymentDeadline: string;
  basePrice: number;
  printPrice: number;
  studentDiscount: number;
  heroImageUrl: string;
  sizeChartUrl: string;
  imageUrls: string[];
  packageA: {
    enabled: boolean;
    requiredQty: number;
    price: number;
    freePrints: number;
    requireSameName: boolean;
  };
  packageB: {
    enabled: boolean;
    requiredQty: number;
    price: number;
    freePrints: number;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  announcementText: "大船羽球 | THE 4TH ANNIVERSARY SPECIAL EDITION",
  paymentDeadline: "2026/04/30 (週四)",
  basePrice: 500,     // 每件 500
  printPrice: 40,     // 印字原價 40
  studentDiscount: 100,
  heroImageUrl: "https://i.postimg.cc/Y9Q01sQm/di-si-jie-tuan-fu-shi-yi-tu.jpg",
  sizeChartUrl: "https://i.postimg.cc/SRVpbwBk/chi-cun.png",
  
  // 🖼️ 這裡已經換成你最新的 500 元價目表圖了！
  imageUrls: ["https://i.postimg.cc/3RRY5Wdg/4final.png"], 

  packageA: {
    enabled: true,
    requiredQty: 4,     // 4件方案
    price: 1750,        // 💡 這裡改為 1750
    freePrints: 1,      // 基礎逻辑：給予 1 個免費名額
    requireSameName: true, // 💡 開啟「相同名字」邏輯開關
  },
  packageB: {
    enabled: true,
    requiredQty: 2,
    price: 900,         // 2件優惠價 900
    freePrints: 1,      // 1件免費印名字
  },
};

export const CLOTHING_TYPES = ["短袖", "無袖"];
export const CLOTHING_COLORS = ["白色", "海軍藍"];
export const CLOTHING_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
export const PICKUP_OPTIONS = ["週一實小", "週二板橋", "週四板橋", "週六板橋", "還不確定...我會主動跟挨滴喬時間"];