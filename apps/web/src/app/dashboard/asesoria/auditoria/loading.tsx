import { DashboardListSkeleton } from '@/components/dashboard/dashboard-list-skeleton';

export default function AsesoriaAuditoriaLoading() {
  return <DashboardListSkeleton showKpis={false} rows={10} />;
}
