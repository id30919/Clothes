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
  isPickedUp?: boolean;
  note?: string;
}

export const CLOTHING_TYPES = ['短袖', '無袖'];
export const CLOTHING_COLORS = ['白色', '海軍藍'];
export const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
export const PICKUP_OPTIONS = ['週一實小', '週二板橋', '週四板橋', '週六板橋', '還不確定...我會主動跟挨滴橋時間'];

export interface AppSettings {
  basePrice: number;
  printPrice: number;
  studentDiscount: number;
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
  announcementText: string;
  imageUrls: string[];
  sizeChartUrl: string;
  paymentDeadline: string;
  heroImageUrl: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  basePrice: 500,
  printPrice: 40,
  studentDiscount: 100,
  packageA: {
    enabled: true,
    requiredQty: 4,
    price: 1800,
    freePrints: 4,
    requireSameName: true,
  },
  packageB: {
    enabled: true,
    requiredQty: 2,
    price: 900,
    freePrints: 1,
  },
  announcementText: '大船羽球 | The 4th Anniversary Special Edition',
  imageUrls: [],
  sizeChartUrl: '',
  paymentDeadline: '2026/4/26 週日 下午4點前',
  heroImageUrl: ''
};

