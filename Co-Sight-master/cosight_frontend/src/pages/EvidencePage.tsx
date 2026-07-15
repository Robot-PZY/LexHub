import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileSearch, UploadCloud } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import FileUploadZone from '../components/workspace/FileUploadZone';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import type { UploadedFileInfo } from '../lib/chat';
import { clearAuthed } from '../lib/storage';
import { TOOLCHAIN_CATEGORIES } from '../lib/cosight-narrative';

const evidenceRows = [
  { name: '合作协议.pdf', type: '合同文本', status: '已解析', issue: '违约责任条款需复核' },
  { name: '付款记录.xlsx', type: '履行证据', status: '待核验', issue: '缺少银行流水原件' },
  { name: '沟通截图.zip', type: '沟通记录', status: '待上传', issue: '需补充完整时间线' },
];

const qualityItems = [
  { label: '主体信息一致性', value: '通过', tone: 'success' },
  { label: '关键日期完整度', value: '缺 2 项', tone: 'warning' },
  { label: '签署页与盖章页', value: '待补充', tone: 'warning' },
  { label: 'OCR 可读性', value: '可接入', tone: 'primary' },
];

function EvidencePage() {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);

  const tableRows = useMemo(() => {
    const uploaded = uploadedFiles.map((file) => ({
      name: file.filename,
      type: '本地上传',
      status: '已上传',
      issue: '等待进入事项工作区解析',
    }));
    return [...uploaded, ...evidenceRows];
  }, [uploadedFiles]);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="证据质检"
      subtitle="核验合同、票据、截图与沟通记录，识别证据缺口和材料风险。"
      badge={<span className="ds-badge ds-badge-success">{uploadedFiles.length > 0 ? `已上传 ${uploadedFiles.length} 份` : '支持本地上传'}</span>}
        actions={<button type="button" className="btn btn-primary" onClick={() => navigate('/workspace/new')}>带入事项受理</button>}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={FileSearch}
        title="证据质检中心"
        subtitle="通过文档解析、OCR 与材料上传能力核验材料质量，材料会进入事项工作区。"
      />

      <section className="feature-stat-grid">
        <StatCard label="本地上传" value={`${uploadedFiles.length}`} description="当前会话已上传材料" />
        <StatCard label="示例材料" value={`${evidenceRows.length}`} description="材料清单样例" />
        <StatCard label="完整度" value="68%" description="签署页与付款凭证待补" />
        <StatCard label="OCR 状态" value="已接入" description="支持百度 OCR 与扫描 PDF 自动回退" />
      </section>

      <section className="feature-layout">
        <article className="ds-card feature-panel feature-panel-large">
          <div className="feature-panel-head">
            <div>
              <p className="eyebrow">EVIDENCE INTAKE</p>
              <h2>材料清单与解析状态</h2>
            </div>
            <span className="ds-badge ds-badge-primary">支持本地上传</span>
          </div>

          <FileUploadZone
            files={uploadedFiles}
            onChange={setUploadedFiles}
            hint="上传后的材料可在事项受理时一并提交，系统会复制到事项工作区。"
          />

          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>材料</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>提示</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.type}</td>
                    <td><span className="ds-badge ds-badge-primary">{row.status}</span></td>
                    <td>{row.issue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="feature-side-stack">
          <article className="ds-card feature-panel">
            <div className="feature-card-title">
              <UploadCloud size={18} />
              <strong>证据处理能力</strong>
            </div>
            <div className="feature-mini-list">
              {TOOLCHAIN_CATEGORIES.filter((item) => item.id === 'document' || item.id === 'code').map((item) => (
                <div key={item.id}><span>{item.label}</span><em>{item.examples[0]}</em></div>
              ))}
              <div><span>材料上传</span><em>upload/files</em></div>
            </div>
          </article>

          <article className="ds-card feature-panel">
            <div className="feature-card-title">
              <CheckCircle2 size={18} />
              <strong>质检维度</strong>
            </div>
            <div className="feature-quality-grid">
              {qualityItems.map((item) => (
                <div key={item.label} className={`feature-quality-card ${item.tone}`}>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="ds-card feature-panel">
            <div className="feature-card-title">
              <AlertTriangle size={18} />
              <strong>下一步</strong>
            </div>
            <div className="feature-mini-list">
              <div><span>继续上传</span><em>补齐缺口材料</em></div>
              <div><span>进入事项受理</span><em>发起质检事项</em></div>
            </div>
          </article>
        </aside>
      </section>
    </AppShell>
  );
}

export default EvidencePage;
