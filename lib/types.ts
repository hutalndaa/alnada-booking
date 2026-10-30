export interface Unit {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  base_hourly_price: number;
  weekend_hourly_price: number | null;
  cleanup_buffer_minutes: number;
  hold_minutes: number;
  amenities: string[];
  location_url: string | null;
  status: "active" | "maintenance" | "inactive";
}

export interface PricingTierRow {
  id: string;
  unit_id: string | null;
  min_hours: number;
  discount_percent: number;
}

export interface Booking {
  id: string;
  unit_id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  num_guests: number;
  start_time: string;
  end_time: string;
  hourly_price: number;
  discount_percent: number;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "expired";
  payment_status: "unpaid" | "paid" | "refunded";
  hold_expires_at: string;
}
