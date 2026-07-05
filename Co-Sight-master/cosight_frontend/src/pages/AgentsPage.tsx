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
      title="智能体调度"
      subtitle="多智能体协作与动态调度演示"
      actions={<button type="button" className="btn btn-secondary" onClick={() => navigate('/review')}>查看审查</button>}
      onLogout={handleLogout}
    >
      <AgentsDemoPanel variant="user" />
    </AppShell>
  );
}

export default AgentsPage;
