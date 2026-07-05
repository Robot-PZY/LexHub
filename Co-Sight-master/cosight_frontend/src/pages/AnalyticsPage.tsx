import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import { clearAuthed } from '../lib/storage';

function AnalyticsPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="分析驾驶舱"
      subtitle="案件分布、风险等级、材料完整度与智能体调用概览。"
      onLogout={handleLogout}
    >
      <AnalyticsDashboard variant="user" />
    </AppShell>
  );
}

export default AnalyticsPage;
