import { AdminShell } from '../../components/layout/AdminShell';
import AgentsDemoPanel from '../../components/admin/AgentsDemoPanel';

function AdminAgentsPage() {
  return (
    <AdminShell title="协作角色" subtitle="法律事项办理中的多角色协作与能力展示">
      <AgentsDemoPanel variant="admin" />
    </AdminShell>
  );
}

export default AdminAgentsPage;
