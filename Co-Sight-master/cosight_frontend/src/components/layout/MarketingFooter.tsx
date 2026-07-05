import { Link } from 'react-router-dom';

function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div>
        <strong>律枢 LexHub</strong>
        <span>基于 Co-Sight 的法律智能工作台。</span>
      </div>
      <div className="marketing-footer-links">
        <Link to="/#capabilities">核心能力</Link>
        <Link to="/#pricing">定价方案</Link>
        <Link to="/login">登录入口</Link>
        <Link to="/workspace">智能工作台</Link>
      </div>
    </footer>
  );
}

export default MarketingFooter;
