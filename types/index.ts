export type Category = "clothing" | "shoes" | "watches" | "accessories";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: Category;
  image_urls: string[];
  sizes: string[];
  stock_quantity: number;
  is_active: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image_url: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: CartItem[];
  total_amount: number;
  status: OrderStatus;
  whatsapp_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
