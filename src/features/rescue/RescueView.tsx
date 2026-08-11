import {useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode, CSSProperties} from 'react';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  Clock3,
  Database,
  Download,
  Eye,
  FilePlus2,
  FileText,
  FolderOpen,
  HardDrive,
  Landmark,
  Link2,
  LockKeyhole,
  PhoneCall,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  buildRescueReport,
  createRescueCase,
  getRescueActionPlan,
  rescueReportAsText,
  rescueStepLabels,
} from '@scamsignal/core/rescue-case';
import type {
  RescueCase,
  RescueScenario,
  RescueStepId,
} from '@scamsignal/core/rescue-case';
import {
  addLocalEvidence,
  clearLocalRescueCase,
  loadLocalRescueCase,
  removeLocalEvidence,
  saveLocalRescueCase,
} from './local-case-store';

type RescueViewProps = {onBack: () => void};
type DialogKind = 'contact' | 'account' | 'report' | 'privacy' | null;

const scenarios: Array<{id: RescueScenario; label: string}> = [
  {id: 'none', label: 'Chưa chuyển tiền'},
  {id: 'money', label: 'Đã chuyển tiền'},
  {id: 'otp', label: 'Đã lộ OTP'},
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadBlob(contents: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([contents], {type}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function RescueDialog({open, title, onClose, children}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog className="rescue-dialog" ref={dialogRef} onClose={onClose} aria-label={title}>
      <div className="dialog-header">
        <div><p className="workspace-kicker">Hồ sơ cục bộ</p><h2>{title}</h2></div>
        <button type="button" onClick={onClose} aria-label="Đóng cửa sổ"><X /></button>
      </div>
      <div className="dialog-content">{children}</div>
    </dialog>
  );
}

function GoogleDriveMark() {
  return (
    <svg className="google-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#0F9D58" d="M11 3h10l8 14h-10z" />
      <path fill="#4285F4" d="M19 17h10l-5 9H8l5-9z" />
      <path fill="#F4B400" d="M11 3l5 9-8 14-5-9z" />
    </svg>
  );
}

function GoogleCalendarMark() {
  return (
    <svg className="google-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#4285F4" d="M5 7h22v20H5z" />
      <path fill="#34A853" d="M5 18v9h9z" />
      <path fill="#FBBC04" d="M27 18v9h-9z" />
      <path fill="#EA4335" d="M5 7h22v6H5z" />
      <path fill="#fff" d="M12 15h8v3h-5v2h5v6h-8v-3h5v-1h-5z" />
    </svg>
  );
}

export function RescueView({onBack}: RescueViewProps) {
  const [rescueCase, setRescueCase] = useState<RescueCase>(() => createRescueCase());
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<'loading' | 'saving' | 'saved' | 'error' | 'deleted'>('loading');
  const [statusMessage, setStatusMessage] = useState('Đang mở hồ sơ cục bộ…');
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const evidenceInput = useRef<HTMLInputElement>(null);
  const skipNextSave = useRef(false);

  useEffect(() => {
    let active = true;
    loadLocalRescueCase()
      .then((stored) => {
        if (!active) return;
        if (stored) setRescueCase(stored);
        setHydrated(true);
        setSaveState('saved');
        setStatusMessage(stored ? 'Đã khôi phục hồ sơ đã lưu trên thiết bị.' : 'Đã tạo hồ sơ mới trên thiết bị.');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setHydrated(true);
        setSaveState('error');
        setStatusMessage(error instanceof Error ? error.message : 'Không thể mở kho hồ sơ cục bộ.');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      saveLocalRescueCase(rescueCase)
        .then(() => {
          setSaveState('saved');
          setStatusMessage('Hồ sơ đã được lưu trên thiết bị này.');
        })
        .catch((error: unknown) => {
          setSaveState('error');
          setStatusMessage(error instanceof Error ? error.message : 'Không thể lưu hồ sơ trên thiết bị.');
        });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [hydrated, rescueCase]);

  const completedCount = Object.keys(rescueCase.completedAt).length;
  const actionPlan = useMemo(() => getRescueActionPlan(rescueCase.scenario), [rescueCase.scenario]);
  const report = useMemo(() => buildRescueReport(rescueCase), [rescueCase]);

  const updateCase = (updater: (current: RescueCase) => RescueCase) => {
    setRescueCase((current) => ({...updater(current), updatedAt: new Date().toISOString()}));
  };

  const toggleStep = (step: RescueStepId) => {
    updateCase((current) => {
      const completedAt = {...current.completedAt};
      if (completedAt[step]) delete completedAt[step];
      else completedAt[step] = new Date().toISOString();
      return {...current, completedAt};
    });
    setStatusMessage(`${rescueStepLabels[step]}: đã cập nhật trạng thái.`);
  };

  const openStepAction = (step: RescueStepId) => {
    if (step === 'bank') setDialog('contact');
    if (step === 'account') setDialog('account');
    if (step === 'evidence') evidenceInput.current?.click();
    if (step === 'report') {
      updateCase((current) => ({
        ...current,
        completedAt: {...current.completedAt, report: current.completedAt.report || new Date().toISOString()},
      }));
      setDialog('report');
    }
  };

  const handleEvidence = async (files: FileList | null) => {
    if (!files?.length) return;
    const slots = Math.max(0, 6 - rescueCase.evidence.length);
    const selected = Array.from(files).slice(0, slots);
    if (!selected.length) {
      setStatusMessage('Hồ sơ đã đạt giới hạn 6 tệp bằng chứng.');
      return;
    }
    try {
      const metadata = await addLocalEvidence(selected);
      updateCase((current) => ({
        ...current,
        evidence: [...current.evidence, ...metadata],
        completedAt: {...current.completedAt, evidence: current.completedAt.evidence || new Date().toISOString()},
      }));
      setStatusMessage(`Đã lưu ${metadata.length} tệp bằng chứng trên thiết bị.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Không thể lưu tệp bằng chứng.');
    } finally {
      if (evidenceInput.current) evidenceInput.current.value = '';
    }
  };

  const removeEvidence = async (id: string) => {
    try {
      await removeLocalEvidence(id);
      updateCase((current) => ({...current, evidence: current.evidence.filter((item) => item.id !== id)}));
      setStatusMessage('Đã xóa tệp khỏi hồ sơ trên thiết bị.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Không thể xóa tệp bằng chứng.');
    }
  };

  const downloadReport = (format: 'json' | 'txt') => {
    const filename = `scamsignal-${rescueCase.id}.${format}`;
    if (format === 'json') downloadBlob(JSON.stringify(report, null, 2), 'application/json', filename);
    else downloadBlob(rescueReportAsText(report), 'text/plain;charset=utf-8', filename);
    setStatusMessage(`Đã tạo bản tải xuống ${format.toUpperCase()} trên thiết bị.`);
  };

  const deleteCase = async () => {
    try {
      await clearLocalRescueCase();
      skipNextSave.current = true;
      setRescueCase(createRescueCase());
      setSaveState('deleted');
      setStatusMessage('Đã xóa hồ sơ và toàn bộ tệp bằng chứng khỏi thiết bị.');
      setConfirmDelete(false);
      setDialog(null);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Không thể xóa hồ sơ trên thiết bị.');
    }
  };

  const scenarioNote = rescueCase.scenario === 'money'
    ? 'Ưu tiên liên hệ ngân hàng ngay và cung cấp thời điểm, số tiền, tài khoản nhận.'
    : rescueCase.scenario === 'otp'
      ? 'Ưu tiên khóa đăng nhập, đổi mật khẩu và liên hệ ngân hàng qua kênh chính thức.'
      : 'Không chuyển tiền, không nhập OTP và tiếp tục xác minh độc lập.';

  return (
    <main className="rescue-page" id="main-content" tabIndex={-1}>
      <section className="rescue-content">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> Quay lại</button>
        <header className="rescue-hero">
          <p className="risk-eyebrow">Hướng dẫn 15 phút đầu</p>
          <h1>Bạn vẫn còn thời gian để giảm thiệt hại.</h1>
          <p>Chọn tình huống, thực hiện từng bước và tự xác nhận khi hoàn tất. Hồ sơ được lưu cục bộ trên thiết bị này.</p>
        </header>

        <div className="scenario-selector" role="group" aria-label="Tình trạng hiện tại">
          {scenarios.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={rescueCase.scenario === item.id}
              className={rescueCase.scenario === item.id ? 'active' : ''}
              onClick={() => updateCase((current) => ({...current, scenario: item.id}))}
            >{item.label}</button>
          ))}
        </div>
        <p className="scenario-guidance"><ShieldCheck /> {scenarioNote}</p>

        <section className="recovery-timeline" aria-labelledby="timeline-title">
          <div className="timeline-heading"><div><p className="workspace-kicker">Ưu tiên theo thời gian</p><h2 id="timeline-title">Việc cần làm ngay</h2></div><span>{completedCount}/{actionPlan.length} hoàn tất</span></div>
          {actionPlan.map((step, index) => {
            const done = Boolean(rescueCase.completedAt[step.id]);
            return (
              <article className={`timeline-row ${step.id === 'bank' ? 'urgent' : ''} ${done ? 'done' : ''}`} key={step.id}>
                <button
                  type="button"
                  className="timeline-state"
                  onClick={() => toggleStep(step.id)}
                  aria-pressed={done}
                  aria-label={`${done ? 'Bỏ hoàn tất' : 'Đánh dấu hoàn tất'}: ${step.title}`}
                >{done ? <Check size={19} /> : index + 1}</button>
                <time aria-label={`Mốc ưu tiên ${step.time}`}>{step.time}</time>
                <div><h3>{step.title}</h3><p>{step.description}</p>{done ? <small>Người dùng xác nhận lúc {formatDateTime(rescueCase.completedAt[step.id]!)}</small> : null}</div>
                <button type="button" className={step.id === 'bank' ? 'timeline-action urgent' : 'timeline-action'} onClick={() => openStepAction(step.id)}>{step.action}</button>
              </article>
            );
          })}
          <p className={`autosave-note ${saveState}`}><Database size={18} /> {
            saveState === 'loading' ? 'Đang mở kho cục bộ…'
              : saveState === 'saving' ? 'Đang lưu trên thiết bị…'
                : saveState === 'saved' ? `Đã lưu trên thiết bị · cập nhật ${formatDateTime(rescueCase.updatedAt)}`
                  : saveState === 'deleted' ? 'Hồ sơ cũ đã được xóa khỏi thiết bị.'
                    : 'Không thể xác nhận lưu cục bộ.'
          }</p>
        </section>
      </section>

      <aside className="case-inspector" aria-labelledby="case-title">
        <div className="inspector-title"><div><p className="workspace-kicker">Lưu trên thiết bị</p><h2 id="case-title">Hồ sơ khẩn cấp</h2></div><span>LOCAL</span></div>
        <div className="case-progress">
          <span style={{'--progress': `${completedCount / actionPlan.length * 360}deg`} as CSSProperties}><b>{completedCount}/{actionPlan.length}</b></span>
          <p><b>{completedCount}/{actionPlan.length} bước hoàn tất</b><small>Chỉ tính bước bạn đã xác nhận</small></p>
        </div>
        <div className="case-rows">
          <div><Clock3 /><span>Thời điểm phát hiện</span><b>{formatDateTime(rescueCase.createdAt)}</b></div>
          <label className="case-amount"><Banknote /><span>Giá trị giao dịch (VND)</span><input name="incident-amount" inputMode="numeric" autoComplete="off" value={rescueCase.amountVnd} onChange={(event) => updateCase((current) => ({...current, amountVnd: event.target.value.replace(/\D/gu, '').slice(0, 15)}))} placeholder="Ví dụ: 18500000…" /></label>
          <div><FileText /><span>Bằng chứng đã lưu</span><b>{rescueCase.evidence.length} tệp</b></div>
        </div>

        <section className="evidence-inventory" aria-labelledby="evidence-title">
          <div className="inspector-section-title"><h3 id="evidence-title">Bằng chứng cục bộ</h3><button type="button" onClick={() => evidenceInput.current?.click()}><FilePlus2 /> Thêm tệp</button></div>
          <input
            className="visually-hidden"
            ref={evidenceInput}
            type="file"
            name="rescue-evidence"
            accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
            multiple
            onChange={(event) => void handleEvidence(event.target.files)}
            aria-label="Chọn tệp bằng chứng để lưu trên thiết bị"
          />
          {rescueCase.evidence.length ? (
            <ul>
              {rescueCase.evidence.map((item) => (
                <li key={item.id}><FileText /><span><b>{item.name}</b><small>{formatBytes(item.size)} · lưu {formatDateTime(item.addedAt)}</small></span><button type="button" onClick={() => void removeEvidence(item.id)} aria-label={`Xóa ${item.name}`}><Trash2 /></button></li>
              ))}
            </ul>
          ) : <p className="empty-evidence"><FolderOpen /> Chưa có tệp. Hỗ trợ ảnh, PDF và TXT tối đa 8 MB/tệp.</p>}
        </section>

        <section className="workspace-connections" aria-labelledby="workspace-title">
          <h3 id="workspace-title">Google Workspace</h3>
          <div className="integration-row planned"><GoogleDriveMark /><span><b>Google Drive</b><small>Chưa cấu hình OAuth · dùng tải xuống cục bộ</small></span><em>Chưa kết nối</em></div>
          <div className="integration-row planned"><GoogleCalendarMark /><span><b>Google Calendar</b><small>Chưa cấu hình OAuth · chưa tạo sự kiện</small></span><em>Chưa kết nối</em></div>
        </section>

        <button className="export-case" type="button" onClick={() => setDialog('report')}><Eye size={19} /> Xem trước hồ sơ</button>
        <button className="privacy-link" type="button" onClick={() => setDialog('privacy')}><LockKeyhole size={15} /> Quyền riêng tư & xóa dữ liệu</button>
        <p className="rescue-status" role="status" aria-live="polite" aria-atomic="true">{statusMessage}</p>
      </aside>

      <RescueDialog open={dialog === 'contact'} title="Liên hệ ngân hàng an toàn" onClose={() => setDialog(null)}>
        <div className="dialog-callout warning"><PhoneCall /><p><b>ScamSignal chưa hiển thị hotline vì chưa có nguồn first-party được xác minh.</b><span>Không dùng số điện thoại trong tin nhắn hoặc website đáng ngờ.</span></p></div>
        <ol className="guide-list">
          <li><b>Mở ứng dụng ngân hàng đã cài từ trước.</b><span>Tìm mục Trợ giúp, Liên hệ hoặc Khóa giao dịch.</span></li>
          <li><b>Nếu dùng web, tự nhập tên miền bạn vẫn sử dụng.</b><span>Không bấm liên kết do người lạ gửi và không tìm qua quảng cáo.</span></li>
          <li><b>Chuẩn bị thông tin không bí mật.</b><span>Thời gian chuyển, số tiền và tài khoản nhận; không đọc OTP, mật khẩu hay CVV.</span></li>
        </ol>
        <p className="dialog-source"><Link2 /> P1 sẽ chỉ bật nút gọi khi số điện thoại có citation trùng domain chính thức.</p>
      </RescueDialog>

      <RescueDialog open={dialog === 'account'} title="Bảo vệ tài khoản" onClose={() => setDialog(null)}>
        <div className="dialog-callout safe"><ShieldCheck /><p><b>Thực hiện trên thiết bị bạn tin cậy.</b><span>Đừng làm theo hướng dẫn chia sẻ màn hình hoặc cài ứng dụng điều khiển từ xa.</span></p></div>
        <ol className="guide-list">
          <li><b>Khóa hoặc đổi mật khẩu tài khoản liên quan.</b><span>Dùng ứng dụng/website chính thức đã tự mở.</span></li>
          <li><b>Đăng xuất phiên và thiết bị lạ.</b><span>Kiểm tra lịch sử đăng nhập nếu dịch vụ hỗ trợ.</span></li>
          <li><b>Đổi mật khẩu email trước nếu email đã bị lộ.</b><span>Email thường là kênh khôi phục cho các tài khoản khác.</span></li>
          <li><b>Tự đánh dấu hoàn tất ở timeline.</b><span>ScamSignal không tự khẳng định bạn đã đổi mật khẩu.</span></li>
        </ol>
      </RescueDialog>

      <RescueDialog open={dialog === 'report'} title="Xem trước hồ sơ hỗ trợ" onClose={() => setDialog(null)}>
        <div className="report-preview">
          <div><span>Mã hồ sơ</span><code>{report.incident.caseId}</code></div>
          <div><span>Tình huống</span><b>{scenarios.find((item) => item.id === report.incident.scenario)?.label}</b></div>
          <div><span>Bước đã xác nhận</span><b>{report.completedActions.length}/{actionPlan.length}</b></div>
          <div><span>Danh mục bằng chứng</span><b>{report.evidenceManifest.length} tệp</b></div>
        </div>
        <p className="report-disclaimer">{report.disclaimer}</p>
        <div className="dialog-actions"><button type="button" className="secondary-action" onClick={() => downloadReport('json')}><Download /> Tải JSON</button><button type="button" className="primary-dialog-action" onClick={() => downloadReport('txt')}><Download /> Tải bản dễ đọc</button></div>
      </RescueDialog>

      <RescueDialog open={dialog === 'privacy'} title="Quyền riêng tư hồ sơ" onClose={() => {setDialog(null); setConfirmDelete(false);}}>
        <dl className="privacy-facts">
          <div><dt><HardDrive /> Đang lưu ở đâu?</dt><dd>Trong IndexedDB của trình duyệt trên thiết bị này.</dd></div>
          <div><dt><Landmark /> Đã gửi ngân hàng?</dt><dd>Chưa. ScamSignal không gửi hồ sơ tới ngân hàng hoặc cơ quan chức năng.</dd></div>
          <div><dt><CalendarDays /> Đã đồng bộ Google?</dt><dd>Chưa. Drive và Calendar chưa được cấu hình OAuth.</dd></div>
        </dl>
        {confirmDelete ? (
          <div className="delete-confirm" role="alert"><p><b>Xóa toàn bộ hồ sơ và tệp trên thiết bị?</b><span>Không thể khôi phục sau khi xác nhận.</span></p><div><button type="button" onClick={() => setConfirmDelete(false)}>Giữ lại</button><button type="button" className="delete-action" onClick={() => void deleteCase()}><Trash2 /> Xóa vĩnh viễn</button></div></div>
        ) : <button type="button" className="delete-case" onClick={() => setConfirmDelete(true)}><Trash2 /> Xóa hồ sơ trên thiết bị</button>}
      </RescueDialog>
    </main>
  );
}
