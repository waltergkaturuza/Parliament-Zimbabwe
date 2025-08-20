import api from './index';

export interface ReceivedBreakdownItem {
  fuel_type: 'PETROL' | 'DIESEL' | string;
  denomination: number; // litres per coupon
  received_coupons: number;
  verified_coupons: number;
  unverified_coupons: number;
}

export interface ReceivedBreakdownResponse {
  period: 'week' | 'month' | 'year' | string;
  start_date: string;
  end_date: string;
  breakdown: ReceivedBreakdownItem[];
}

export async function getReceivedBreakdown(period: 'week' | 'month' | 'year' = 'month') {
  const { data } = await api.get<ReceivedBreakdownResponse>(`/analytics/received-breakdown/`, { params: { period } });
  return data;
}

export interface AvailableByCenterItem {
  subcenter_id: number;
  subcenter_name: string;
  breakdown: { fuel_type: string; denomination: number; available_coupons: number }[];
  totals: { total_available: number; diesel_available: number; petrol_available: number };
}

export interface AvailableByCenterResponse {
  centers: AvailableByCenterItem[];
  count: number;
  generated_at: string;
}

export async function getAvailableByCenter() {
  const { data } = await api.get<AvailableByCenterResponse>(`/analytics/available-by-center/`);
  return data;
}

export interface DispatchesTimelineResponse {
  start_date: string;
  end_date: string;
  timeline: { date: string; dispatches: number }[];
  by_status: { status: string; count: number }[];
  by_center: { name: string; count: number }[];
  by_program?: { id: number | null; title: string; count: number }[];
  by_session?: { id: number | null; title: string; count: number }[];
}

export async function getDispatchesTimeline(params?: { start_date?: string; end_date?: string; program_id?: number | string; session_id?: number | string }) {
  const { data } = await api.get<DispatchesTimelineResponse>(`/analytics/dispatches-timeline/`, { params });
  return data;
}

export default {
  getReceivedBreakdown,
  getAvailableByCenter,
  getDispatchesTimeline,
};
