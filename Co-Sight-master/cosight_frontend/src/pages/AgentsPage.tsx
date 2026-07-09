import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import AgentsDemoPanel from '../components/admin/AgentsDemoPanel';
import { clearAuthed } from '../lib/storage';

function AgentsPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="协作角色"
      subtitle="按事项状态组织受理、研究、质检、生成与复核。"
      actions={<button type="button" className="btn btn-secondary" onClick={() => navigate('/review')}>查看审查</button>}
      onLogout={handleLogout}
    >
      <AgentsDemoPanel variant="user" />
    </AppShell>
  );
}

export default AgentsPage;
