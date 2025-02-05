import DashboardMetrics from '@/components/dashboard/metrics';
import MembershipChart from '@/components/dashboard/membership-chart';
import CommissionTrends from '@/components/dashboard/commission-trends';
import TopEarners from '@/components/dashboard/top-earners';
import CommissionMetrics from '@/components/dashboard/commission-metrics';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CommissionMetrics />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <CommissionTrends />
        </div>
        <div className="col-span-3">
          <MembershipChart />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardMetrics />
        <TopEarners />
      </div>
    </div>
  );
} 