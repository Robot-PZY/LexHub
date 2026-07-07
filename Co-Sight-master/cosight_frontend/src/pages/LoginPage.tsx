import {
  ArrowLeft,
  Database,
  KeyRound,
  LogIn,
  Settings2,
  ShieldCheck,
  UserPlus,
  Workflow,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/app/BrandLogo';
import {
  ensureDemoSeedVersion,
  isReservedAdminAccount,
  loginDemoUser,
  loginAdmin,
  markAuthedRole,
  registerUser,
  resetDemoRuntimeData,
  saveDemoUser,
  touchMembershipUser,
  validateAdminLogin,
  validateUserLogin,
  type AuthRole,
} from '../lib/storage';

const trustPoints = ['Co-Sight 编排', '多 API 工具位', '过程可回放', '结果可复核'];

const roleCards: Array<{
  role: AuthRole;
  title: string;
  desc: string;
  icon: typeof Workflow;
}> = [
  {
    role: 'user',
    title: '用户工作台',
    desc: '发起法律任务，上传材料，查看智能体协作过程与结果归档。',
    icon: Workflow,
  },
  {
    role: 'admin',
    title: '管理控制台',
    desc: '维护知识库、模型配置、API Key 与工具链状态。',
    icon: Settings2,
  },
];

type AuthMode = 'login' | 'register';

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<AuthRole>('user');
  const [mode, setMode] = useState<AuthMode>('login');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (ensureDemoSeedVersion()) {
      resetDemoRuntimeData({ clearProfile: true });
    }
  }, []);

  const enterSystem = () => {
    markAuthedRole(role);
    navigate(role === 'admin' ? '/admin' : '/workspace');
  };

  const resetForm = () => {
    setAccount('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setError('');
  };

  const handleLogin = () => {
    setError('');

    if (role === 'admin') {
      if (!account.trim() || !password.trim()) {
        setError('请输入管理员账号和密码。');
        return;
      }
      if (!validateAdminLogin(account, password)) {
        setError('管理员账号或密码错误。');
        return;
      }
      loginAdmin(account.trim());
      enterSystem();
      return;
    }

    if (isReservedAdminAccount(account) && validateAdminLogin(account, password)) {
      setError('管理员账号请切换到「管理控制台」入口登录。');
      return;
    }

    if (!account.trim() || !password.trim()) {
      setError('请输入账号和密码。');
      return;
    }

    if (!validateUserLogin(account, password)) {
      setError('账号或密码错误。');
      return;
    }

    const tier = touchMembershipUser(account.trim(), { name: displayName || account.trim() });
    saveDemoUser({
      name: displayName.trim() || account.trim(),
      account: account.trim(),
      membershipTier: tier,
    });
    if (account.trim() === 'user') loginDemoUser();
    enterSystem();
  };

  const handleRegister = () => {
    setError('');
    if (!account.trim() || !password.trim()) {
      setError('请填写账号和密码。');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }

    const result = registerUser({
      account,
      password,
      name: displayName.trim() || account.trim(),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    enterSystem();
  };

  const activeRole = roleCards.find((item) => item.role === role)!;
  const isRegister = role === 'user' && mode === 'register';

  return (
    <div className="auth-shell auth-shell-wide">
      <section className="auth-panel auth-copy-panel">
        <Link className="auth-back" to="/">
          <ArrowLeft size={16} />
          <span>返回首页</span>
        </Link>

        <div>
          <BrandLogo subtitle="Co-Sight Legal Workbench" className="auth-brand-react" />
          <div style={{ marginTop: 32 }}>
            <p className="eyebrow">Welcome</p>
            <h1 style={{ margin: '0 0 12px', fontSize: 36, color: 'var(--color-text-strong)', lineHeight: 1.15 }}>
              选择入口，进入律枢。
            </h1>
            <p style={{ margin: 0, color: 'var(--color-muted)', lineHeight: 1.85, maxWidth: '46ch' }}>
              用户端负责法律任务处理与结果跟进，管理端负责知识库、模型与 API 工具链配置，共同构成完整工作流。
            </p>
          </div>
        </div>

        <div className="auth-trust-list">
          {trustPoints.map((point) => (
            <span key={point} className="auth-trust-item">{point}</span>
          ))}
        </div>

        <div className="auth-flow-steps">
          <div className="auth-flow-step">
            <span>1</span>
            <div>
              <strong>用户端发起任务</strong>
              <em>LearnWeave 式任务录入：选场景、写描述、上传材料。</em>
            </div>
          </div>
          <div className="auth-flow-step">
            <span>2</span>
            <div>
              <strong>Co-Sight 多智能体协作</strong>
              <em>LaborAid 风格过程面板：DAG、工具轨迹、阶段结论可追踪。</em>
            </div>
          </div>
          <div className="auth-flow-step">
            <span>3</span>
            <div>
              <strong>归档复核与回放</strong>
              <em>材料库、结果页与管理端运营视图形成可追溯闭环。</em>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-form-panel">
        <div className="auth-role-grid">
          {roleCards.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.role}
                type="button"
                className={`auth-role-card${role === item.role ? ' active' : ''}`}
                onClick={() => {
                  setRole(item.role);
                  setMode('login');
                  resetForm();
                }}
              >
                <Icon size={18} />
                <strong>{item.title}</strong>
                <span>{item.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="auth-icon">
          {role === 'admin' ? <Database size={22} /> : <ShieldCheck size={22} />}
        </div>

        <div>
          <h2>{role === 'admin' ? '管理端入口' : isRegister ? '用户端注册' : '用户端登录'}</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-muted)', fontSize: 14 }}>
            当前选择：{activeRole.title}。
            {role === 'admin'
              ? '用于配置系统能力，不直接处理用户任务。'
              : isRegister
                ? '注册后即可体验版套餐，发起法律任务。'
                : '用于发起和跟进法律工作流。'}
          </p>
        </div>

        {role === 'user' ? (
          <div className="auth-mode-tabs" role="tablist" aria-label="账号入口">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setError(''); }}
            >
              <LogIn size={15} />
              登录
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => { setMode('register'); setError(''); }}
            >
              <UserPlus size={15} />
              注册
            </button>
          </div>
        ) : (
          <div className="auth-mode-tabs auth-mode-tabs-single" role="tablist" aria-label="账号入口">
            <button type="button" className="active">
              <LogIn size={15} />
              登录
            </button>
          </div>
        )}

        {isRegister && (
          <label>
            昵称（可选）
            <input
              className="ds-input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="显示名称"
            />
          </label>
        )}

        <label>
          账号
          <input
            className="ds-input"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder={role === 'admin' ? '管理员账号' : '用户名'}
          />
        </label>

        <label>
          密码
          <input
            className="ds-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                if (isRegister) handleRegister();
                else handleLogin();
              }
            }}
          />
        </label>

        {isRegister && (
          <label>
            确认密码
            <input
              className="ds-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入密码"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleRegister();
              }}
            />
          </label>
        )}

        {error && <div className="auth-form-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={isRegister ? handleRegister : handleLogin}
        >
          <KeyRound size={16} />
          <span>
            {role === 'admin'
              ? '进入管理控制台'
              : isRegister
                ? '注册并进入工作台'
                : '进入用户工作台'}
          </span>
        </button>

        {role === 'user' && mode === 'login' && (
          <p className="auth-switch-hint">
            还没有账号？
            <button type="button" className="text-button" onClick={() => { setMode('register'); setError(''); }}>
              立即注册
            </button>
          </p>
        )}
      </section>
    </div>
  );
}

export default LoginPage;
