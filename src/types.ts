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
  basePrice: 440,
  printPrice: 60,
  studentDiscount: 100,
  heroImageUrl: "https://i.postimg.cc/Y9Q01sQm/di-si-jie-tuan-fu-shi-yi-tu.jpg",
  sizeChartUrl: "https://i.postimg.cc/SRVpbwBk/chi-cun.png",
  imageUrls: ["https://i.postimg.cc/4x0HTMG8/2FINAL.png"], 
  packageA: {
    enabled: true,
    requiredQty: 3,
    price: 1300,
    freePrints: 1,
    requireSameName: false,
  },
  packageB: {
    enabled: true,
    requiredQty: 2,
    price: 850,
    freePrints: 0,
  },
};

export const CLOTHING_TYPES = ["短袖", "無袖"];
export const CLOTHING_COLORS = ["白色", "海軍藍"];
export const CLOTHING_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
export const PICKUP_OPTIONS = ["週一實小", "週二板橋", "週四板橋", "週六板橋", "還不確定...我會主動跟挨滴湊時間"];