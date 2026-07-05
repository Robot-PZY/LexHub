import { Clock3, LogOut, Plus } from 'lucide-react';
import BrandLogo from '../app/BrandLogo';

type WorkspaceSidebarProps = {
  onNewTask: () => void;
  onReplay: () => void;
  onLogout: () => void;
};

function WorkspaceSidebar({ onNewTask, onReplay, onLogout }: WorkspaceSidebarProps) {
  return (
    <aside className="sidebar-react minimal-sidebar-react">
      <BrandLogo subtitle="法律业务智能体" compact className="sidebar-brand-react" />

      <div className="sidebar-section-react sidebar-section-surface-react sidebar-section-primary-react">
        <span className="sidebar-label-react">新建</span>
        <button type="button" className="sidebar-primary-action-react" onClick={onNewTask}>
          <Plus size={16} />
          <span>新建事项</span>
        </button>
        <div className="sidebar-meta-react">先提交问题，后续再继续补充。</div>
      </div>

      <div className="sidebar-section-react sidebar-section-links-react">
        <button type="button" className="sidebar-action-react" onClick={onReplay}>
          <Clock3 size={16} />
          <span>记录</span>
        </button>
        <button type="button" className="sidebar-action-react" onClick={onLogout}>
          <LogOut size={16} />
          <span>退出</span>
        </button>
      </div>
    </aside>
  );
}

export default WorkspaceSidebar;
