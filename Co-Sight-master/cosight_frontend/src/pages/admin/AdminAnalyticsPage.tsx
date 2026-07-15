import { AdminShell } from '../../components/layout/AdminShell';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';

function AdminAnalyticsPage() {
  return (
    <AdminShell title="数据分析" subtitle="运营监控与性能对比">
      <div className="admin-analytics-v2">
        <AnalyticsDashboard variant="admin" />
      </div>
    </AdminShell>
  );
}

export default AdminAnalyticsPage;
