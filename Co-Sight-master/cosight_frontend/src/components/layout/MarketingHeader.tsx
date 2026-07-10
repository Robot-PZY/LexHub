import { Link } from 'react-router-dom';
import BrandLogo from '../app/BrandLogo';
import { isAuthed } from '../../lib/storage';

type MarketingHeaderProps = {
  active?: 'home' | 'replay';
};

const navAnchors = [
  { label: '产品能力', href: '/#capabilities' },
  { label: '办理流程', href: '/#workflow' },
  { label: '解决方案', href: '/#scenes' },
  { label: '会员方案', href: '/#pricing' },
];

function MarketingHeader({ active = 'home' }: MarketingHeaderProps) {
  const authed = isAuthed();
  const workspacePath = authed ? '/workspace' : '/login';
  const replayPath = authed ? '/replay' : '/login';

  return (
    <header className="marketing-header ds-animate-in">
      <BrandLogo subtitle="Legal Matter Workbench" />
      <nav className="marketing-nav">
        <Link to="/" className={active === 'home' ? 'active' : ''}>首页</Link>
        {navAnchors.map((item) => (
          <Link key={item.href} to={item.href}>{item.label}</Link>
        ))}
        <Link to={replayPath} className={active === 'replay' ? 'active' : ''}>案件归档</Link>
        {!authed && <Link to="/login">登录</Link>}
        <Link to={workspacePath} className="marketing-nav-cta">发起事项</Link>
      </nav>
    </header>
  );
}

export default MarketingHeader;
