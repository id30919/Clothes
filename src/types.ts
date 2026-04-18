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
  
  // 💰 基礎價格設定
  basePrice: 500,     // 每件 500 元
  printPrice: 40,     // 印名字每件 +40 元
  studentDiscount: 100, // 學生身分總價再折 100 元
  
  // 🖼️ 圖片連結設定
  heroImageUrl: "https://i.postimg.cc/Y9Q01sQm/di-si-jie-tuan-fu-shi-yi-tu.jpg",
  sizeChartUrl: "https://i.postimg.cc/SRVpbwBk/chi-cun.png",
  imageUrls: ["https://i.postimg.cc/qqSDSK0t/wei-ming-ming-she-ji.png"], 

  // 🎁 禮包方案修正
  packageA: {
    enabled: true,
    requiredQty: 4,      // 需任四件
    price: 1800,         // 優惠價 1800 元
    freePrints: 4,       // 4 件均免費印名字
    requireSameName: true, // 限相同名字
  },
  packageB: {
    enabled: true,
    requiredQty: 2,      // 需任兩件
    price: 900,          // 優惠價 900 元
    freePrints: 1,       // 1 件免費印名字，另一件自動維持 +40
  },
};

export const CLOTHING_TYPES = ["短袖", "無袖"];
export const CLOTHING_COLORS = ["白色", "海軍藍"];
export const CLOTHING_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
export const PICKUP_OPTIONS = ["週一實小", "週二板橋", "週四板橋", "週六板橋", "還不確定...我會主動跟挨滴湊時間"];