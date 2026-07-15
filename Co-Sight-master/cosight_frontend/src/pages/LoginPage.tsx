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
import { Button, TextField } from '../components/ui';
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

const trustPoints = ['动态 DAG 编排', '工具调用可观察', '结果全程可追溯'];

const roleCards: Array<{
  role: AuthRole;
  title: string;
  desc: string;
  icon: typeof Workflow;
}> = [
  {
    role: 'user',
    title: '用户端',
    desc: '发起与跟进法律事项',
    icon: Workflow,
  },
  {
    role: 'admin',
    title: '管理控制台',
    desc: '管理智能体、模型与 API',
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
    <div className="auth-shell auth-shell-wide lex-auth-v2">
      <section className="auth-panel auth-copy-panel">
        <Link className="auth-back" to="/">
          <ArrowLeft size={16} />
          <span>返回首页</span>
        </Link>

        <div>
          <BrandLogo subtitle="Legal Agent OS" className="auth-brand-react" />
          <div style={{ marginTop: 32 }}>
            <p className="eyebrow">MULTI-AGENT LEGAL WORKSPACE</p>
            <h1 style={{ margin: '0 0 12px', fontSize: 36, color: 'var(--color-text-strong)', lineHeight: 1.15 }}>
              让每一步法律办理，都清晰可见。
            </h1>
            <p style={{ margin: 0, color: 'var(--color-muted)', lineHeight: 1.85, maxWidth: '46ch' }}>
              从事项受理、动态规划到工具调用与报告交付，律枢将多智能体协作过程完整呈现在同一工作台。
            </p>
          </div>
        </div>

        <div className="auth-trust-list">
          {trustPoints.map((point) => (
            <span key={point} className="auth-trust-item">{point}</span>
          ))}
        </div>

        <div className="auth-agent-demo" aria-label="智能办理路径示意">
          <div className="auth-agent-demo-head">
            <span><i /> 演示路径</span>
            <strong>服务合同审查</strong>
          </div>
          <div className="auth-agent-demo-flow">
            <span className="done"><Workflow size={15} /> 规划</span>
            <span className="done"><Database size={15} /> 解析</span>
            <span className="running"><ShieldCheck size={15} /> 审查</span>
            <span><Settings2 size={15} /> 交付</span>
          </div>
          <p>正在调用：法规检索 · 已形成 3 条阶段结论</p>
        </div>
      </section>

      <section className="auth-panel auth-form-panel">
        <div className="auth-form-heading">
          <span>欢迎回来</span>
          <h2>登录律枢</h2>
          <p>选择使用入口，继续当前事项或管理系统能力。</p>
        </div>
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

        <div className="auth-icon" aria-hidden="true">
          {role === 'admin' ? <Database size={22} /> : <ShieldCheck size={22} />}
        </div>

        <div>
          <h2>{role === 'admin' ? '管理端入口' : isRegister ? '用户端注册' : '用户端登录'}</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-muted)', fontSize: 14 }}>
            当前选择：{activeRole.title}。
            {role === 'admin'
              ? '用于配置系统能力，不直接处理用户事项。'
              : isRegister
                ? '注册后即可获得体验版套餐，发起法律事项。'
                : '用于发起和跟进法律事项办理。'}
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
          <TextField
            label="昵称（可选）"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="显示名称"
          />
        )}

        <TextField
          id="lexhub-account"
          name="account"
          label="账号"
          value={account}
          onChange={(event) => setAccount(event.target.value)}
          placeholder={role === 'admin' ? '管理员账号' : '用户名'}
          autoComplete="username"
        />

        <TextField
          id="lexhub-password"
          name="password"
          label="密码"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (isRegister) handleRegister();
              else handleLogin();
            }
          }}
        />

        {isRegister && (
          <TextField
            id="lexhub-confirm-password"
            name="confirmPassword"
            label="确认密码"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="再次输入密码"
            autoComplete="new-password"
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleRegister();
            }}
          />
        )}

        {error && <div className="auth-form-error" role="alert" aria-live="assertive">{error}</div>}

        <Button
          type="button"
          fullWidth
          leadingIcon={<KeyRound size={16} />}
          onClick={isRegister ? handleRegister : handleLogin}
        >
          {role === 'admin'
            ? '进入管理控制台'
            : isRegister
              ? '注册并进入事项受理'
              : '进入事项受理'}
        </Button>

        {role === 'user' && mode === 'login' && (
          <p className="auth-switch-hint">
            还没有账号？
            <button type="button" className="text-button" onClick={() => { setMode('register'); setError(''); }}>
              立即注册
            </button>
          </p>
        )}

        <div className="auth-demo-hint">
          <ShieldCheck size={14} />
          <span>演示环境支持用户端完整办理流程与管理端能力配置预览。</span>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
