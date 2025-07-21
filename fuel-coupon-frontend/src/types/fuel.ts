// src/types/fuel.ts
export interface FuelStats {
  timestamp: string;
  petrol_price: number;
  diesel_price: number;
  previous_petrol_price?: number;
  previous_diesel_price?: number;
  petrol_price_change?: number;
  diesel_price_change?: number;
  petrol_price_trend?: 'up' | 'down' | 'stable';
  diesel_price_trend?: 'up' | 'down' | 'stable';
  // Add any other relevant fields from your API
}