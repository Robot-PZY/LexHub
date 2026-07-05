import { AdminShell } from '../../components/layout/AdminShell';
import AgentsDemoPanel from '../../components/admin/AgentsDemoPanel';

function AdminAgentsPage() {
  return (
    <AdminShell title="智能体演示" subtitle="多智能体编排与异构能力展示">
      <AgentsDemoPanel variant="admin" />
    </AdminShell>
  );
}

export default AdminAgentsPage;
