// src/pages/Dashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { StatsCard } from '../../components/shared/StatsCard';
import { Chart } from "../../components/shared/Chart";
import { CouponService } from '../../api/coupons';
import ParliamentLogo from '@/components/ParliamentLogo';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => CouponService.getStatistics(),
  });

  return (
    <div className="p-4 space-y-6">
      {/* Header with Parliament Logo */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b">
        <ParliamentLogo size="medium" />
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Total Coupons" 
          value={stats?.total_coupons} 
          trend="up" 
        />
        <StatsCard 
          title="Allocated" 
          value={stats?.allocated} 
          percentage={stats?.allocation_rate} 
        />
        <StatsCard 
          title="Used" 
          value={stats?.used} 
          trend={stats?.usage_trend === 'up' || stats?.usage_trend === 'down' ? stats.usage_trend : undefined} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Chart 
          title="Coupon Status Distribution"
          type="pie"
          data={stats?.status_distribution}
        />
        <Chart 
          title="Monthly Allocation Trend"
          type="line"
          data={stats?.monthly_trends}
        />
      </div>
    </div>
  );
}
