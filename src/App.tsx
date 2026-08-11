import {useEffect, useMemo, useRef, useState} from 'react';
import type {CapabilitiesResponseV1} from '@scamsignal/core/capabilities';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  FileImage,
  Info,
  Lightbulb,
  LifeBuoy,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Mic,
  Paperclip,
  PhoneCall,
  Plus,
  RotateCcw,
  ScanSearch,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Upload,
} from 'lucide-react';
import type {Analysis, Evidence} from './data';
import {DEMO_EXTRA_INFO, DEMO_MESSAGE} from './data';
import {analyzeWithGemini, getRedactionSummary, getRuntimeCapabilities, probeAnalysisTransport} from './gemini';
import {sanitizeImageFile} from './image-privacy';
import {RescueView} from './features/rescue/RescueView';

type Mode = 'text' | 'image';
type AppState = 'idle' | 'loading' | 'result' | 'error';
type Journey = 'check' | 'verify' | 'rescue';
type TransportState = 'checking' | 'ready' | 'unavailable';

const fallbackLoadingSteps = ['Che dữ liệu nhạy cảm', 'Kiểm tra cấu trúc URL', 'Gemini tổng hợp bằng chứng'];
const localLoadingSteps = ['Che dữ liệu nhạy cảm', 'Kiểm tra cấu trúc URL', 'Tổng hợp cảnh báo cục bộ'];

function getLoadingSteps(capabilities: CapabilitiesResponseV1 | null, preferLocal: boolean) {
  if (preferLocal) return localLoadingSteps;
  if (!capabilities) return fallbackLoadingSteps;
  return [
    'Che dữ liệu nhạy cảm',
    'Kiểm tra cấu trúc URL',
    ...(['available', 'configured'].includes(capabilities.webRisk.state) ? ['Đối chiếu Google Web Risk'] : []),
    'Gemini tổng hợp bằng chứng',
  ];
}

const evidenceSourceLabel = {
  deterministic: 'URL Engine',
  google_web_risk: 'Google Web Risk',
  gemini: 'Gemini',
} as const;

function Brand({onHome}: {onHome: () => void}) {
  return (
    <button className="brand" type="button" onClick={onHome} aria-label="ScamSignal AI — về trang kiểm tra">
      <span className="brand-symbol" aria-hidden="true"><ShieldCheck size={24} strokeWidth={1.8} /></span>
      <span className="brand-copy"><b>ScamSignal AI</b><small>Decision safety</small></span>
    </button>
  );
}

function SiteHeader({journey, capabilities, capabilityError, transportState, onNavigate}: {
  journey: Journey;
  capabilities: CapabilitiesResponseV1 | null;
  capabilityError: boolean;
  transportState: TransportState;
  onNavigate: (next: Journey) => void;
}) {
  const analysisState = capabilities?.analysis.state;
  const analysisConfigured = ['available', 'configured'].includes(analysisState || '');
  const statusLabel = transportState === 'unavailable'
    ? 'AI gián đoạn · có kiểm tra cục bộ'
    : capabilityError ? 'Không kiểm tra được AI'
      : !capabilities || transportState === 'checking' ? 'Đang kiểm tra AI'
        : analysisConfigured ? 'Kênh phân tích sẵn sàng' : 'AI chưa cấu hình';
  const statusClass = transportState === 'unavailable' || capabilityError
    ? 'unavailable'
    : analysisConfigured && transportState === 'ready' ? 'available' : 'pending';
  return (
    <header className={journey === 'rescue' ? 'site-header emergency' : 'site-header'}>
      <div className="header-inner">
        <Brand onHome={() => onNavigate('check')} />
        {journey === 'rescue' ? (
          <><span className="emergency-state"><i /> Chế độ khẩn cấp</span><button className="exit-emergency" onClick={() => onNavigate('check')}>Thoát chế độ <ArrowRight size={17} /></button></>
        ) : (
          <>
            <nav aria-label="Điều hướng chính">
              <button aria-current={journey === 'check' ? 'page' : undefined} className={journey === 'check' ? 'active' : ''} onClick={() => onNavigate('check')}>Kiểm tra</button>
              <a href="#method">Cách hoạt động</a>
              <a href="#privacy">An toàn dữ liệu</a>
            </nav>
            <div className="header-actions">
              <span className={`service-state ${statusClass}`} role="status"><i /> {statusLabel}</span>
              <button className="report-link" onClick={() => onNavigate('rescue')}><AlertTriangle size={17} /> Báo lừa đảo</button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function JourneySelector({journey, onSelect}: {journey: Journey; onSelect: (next: Journey) => void}) {
  return (
    <div className="journey-selector" role="group" aria-label="Chọn tình huống">
      <button aria-pressed={journey === 'check'} className={journey === 'check' ? 'active' : ''} onClick={() => onSelect('check')}><ScanSearch size={20} /> Kiểm tra</button>
      <button aria-pressed={journey === 'verify'} className={journey === 'verify' ? 'active' : ''} onClick={() => onSelect('verify')}><ShieldCheck size={20} /> Xác minh</button>
      <button aria-pressed={false} className="urgent" onClick={() => onSelect('rescue')}><PhoneCall size={19} /> Khẩn cấp</button>
    </div>
  );
}

function LoadingPanel({step, steps}: {step: number; steps: string[]}) {
  return (
    <section className="loading-panel" aria-live="polite" aria-busy="true">
      <div className="loading-title"><LoaderCircle className="spin" size={23} /><div><b>{steps[step]}</b><small>Đang xử lý theo capability thực tế</small></div></div>
      <div className="loading-track"><i style={{width: `${((step + 1) / steps.length) * 100}%`}} /></div>
      <span>{step + 1}/{steps.length}</span>
    </section>
  );
}

function AnalysisWorkspace({
  journey,
  mode,
  message,
  extraInfo,
  imageName,
  imagePreview,
  imageDetails,
  imageConsent,
  imageProcessing,
  state,
  canAnalyze,
  errorMessage,
  serviceMessage,
  onMode,
  onMessage,
  onExtraInfo,
  onImage,
  onImageConsent,
  onDemo,
  onReset,
  onAnalyze,
}: {
  journey: Exclude<Journey, 'rescue'>;
  mode: Mode;
  message: string;
  extraInfo: string;
  imageName: string;
  imagePreview: string;
  imageDetails: string;
  imageConsent: boolean;
  imageProcessing: boolean;
  state: AppState;
  canAnalyze: boolean;
  errorMessage: string;
  serviceMessage: string;
  onMode: (mode: Mode) => void;
  onMessage: (value: string) => void;
  onExtraInfo: (value: string) => void;
  onImage: (file?: File) => void;
  onImageConsent: (value: boolean) => void;
  onDemo: () => void;
  onReset: () => void;
  onAnalyze: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const redactionSummary = getRedactionSummary(message, extraInfo);
  const title = journey === 'verify' ? 'Thông tin cần xác minh' : 'Nội dung cần kiểm tra';
  const placeholder = journey === 'verify'
    ? 'Tên tổ chức, số điện thoại, tài khoản hoặc tên miền cần đối chiếu…'
    : 'Dán tin nhắn, liên kết hoặc nội dung cần kiểm tra…';

  useEffect(() => {
    if (state === 'error') errorRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (!imageName && fileInput.current) fileInput.current.value = '';
  }, [imageName]);

  return (
    <section className="analysis-workspace" aria-labelledby="analysis-title">
      <div className="workspace-heading">
        <div><p className="workspace-kicker">Phân tích bảo mật</p><h2 id="analysis-title">{title}</h2></div>
        <button className="demo-button" onClick={onDemo}><Sparkles size={16} /> Nạp tình huống mẫu</button>
      </div>

      <div className="input-mode" role="group" aria-label="Loại bằng chứng">
        <button aria-pressed={mode === 'text'} className={mode === 'text' ? 'active' : ''} onClick={() => onMode('text')}><MessageSquareText size={17} /> Văn bản hoặc link</button>
        <button aria-pressed={mode === 'image'} className={mode === 'image' ? 'active' : ''} onClick={() => onMode('image')}><FileImage size={17} /> Ảnh hoặc QR</button>
      </div>

      {mode === 'text' ? (
        <div className="message-field">
          <textarea
            id="scam-message"
            name="scam-message"
            value={message}
            onChange={(event) => onMessage(event.target.value.slice(0, 1500))}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            aria-label={title}
            aria-invalid={state === 'error'}
            aria-describedby={state === 'error' ? 'analysis-error' : undefined}
          />
          <span className="character-count">{message.length}/1500</span>
        </div>
      ) : (
        <div className="image-intake">
          <label className={imageProcessing ? 'upload-field processing' : 'upload-field'} htmlFor="scam-image">
            <input id="scam-image" name="scam-image" ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onImage(event.target.files?.[0])} aria-describedby="image-privacy-disclosure" />
            {imageProcessing ? <LoaderCircle className="spin" size={25} /> : <Upload size={25} />}
            <b>{imageProcessing ? 'Đang làm sạch metadata và tối ưu ảnh…' : imageName || 'Chọn ảnh chụp màn hình hoặc mã QR'}</b>
            <small>PNG, JPG, WEBP · tối đa 8 MB</small>
          </label>
          {imagePreview ? (
            <figure className="image-preview"><img src={imagePreview} alt="Bản xem trước ảnh sẽ gửi để phân tích" width="88" height="88" /><figcaption><b>{imageName}</b><span>{imageDetails}</span></figcaption></figure>
          ) : null}
          <div className="image-privacy-disclosure" id="image-privacy-disclosure">
            <LockKeyhole />
            <p><b>Kiểm tra trước khi gửi</b><span>ScamSignal đã re-encode ảnh để loại metadata và giới hạn kích thước. Nội dung nhạy cảm còn nhìn thấy trong ảnh chưa được tự động che và ảnh sẽ được gửi tới Gemini để trích xuất.</span></p>
            <label><input type="checkbox" checked={imageConsent} onChange={(event) => onImageConsent(event.target.checked)} disabled={!imagePreview} /> Tôi đã kiểm tra preview và đồng ý gửi ảnh này để phân tích.</label>
          </div>
        </div>
      )}

      <div className="workspace-toolbar">
        <div className="attachment-actions">
          <button onClick={() => {onMode('image'); window.setTimeout(() => fileInput.current?.click(), 0);}}><Paperclip size={18} /> Ảnh chụp</button>
          <button type="button" disabled title="Sắp hỗ trợ ghi âm trực tiếp"><Mic size={18} /> Ghi âm</button>
        </div>
        <span className={redactionSummary.count > 0 ? 'privacy-inline active' : 'privacy-inline'} id="privacy"><LockKeyhole size={16} /> {mode === 'image' ? 'Ảnh chỉ gửi sau khi bạn xác nhận preview' : redactionSummary.count > 0 ? `Sẽ che ${redactionSummary.count} dữ liệu nhạy cảm trong văn bản` : 'Dữ liệu nhạy cảm trong văn bản sẽ được che'}</span>
      </div>

      <details className="additional-context">
        <summary><Plus size={17} /> Thêm thông tin bổ sung <small>Tùy chọn</small></summary>
        <input
          id="extra-info"
          name="extra-info"
          value={extraInfo}
          onChange={(event) => onExtraInfo(event.target.value.slice(0, 200))}
          placeholder="Kênh nhận, tên người gửi hoặc tên miền chính thức nếu biết…"
          autoComplete="off"
          aria-label="Thông tin bổ sung"
        />
      </details>

      {state === 'error' ? <div className="inline-error" id="analysis-error" ref={errorRef} role="alert" tabIndex={-1}><AlertCircle size={18} /><span><b>Chưa thể hoàn tất phân tích.</b> {errorMessage || 'Vui lòng thử lại sau ít phút.'}</span></div> : null}
      {serviceMessage ? <div className="service-notice" role="status"><Info size={17} /><span>{serviceMessage}</span></div> : null}

      <div className="workspace-actions">
        <button className="reset-button" onClick={onReset} disabled={!message && !extraInfo && !imageName}><RotateCcw size={17} /> Làm lại</button>
        <button className="analyze-button" onClick={onAnalyze} disabled={!canAnalyze || state === 'loading' || imageProcessing}>
          {state === 'loading' ? <><LoaderCircle className="spin" size={19} /> Đang phân tích…</> : <>Phân tích rủi ro <ArrowRight size={19} /></>}
        </button>
      </div>
    </section>
  );
}

function MethodStrip() {
  const steps = ['Thu thập bằng chứng', 'Đối chiếu nguồn thật', 'Đề xuất hành động'];
  return (
    <section className="method-strip" id="method" aria-label="Quy trình phân tích">
      {steps.map((item, index) => <div key={item}><span>{index + 1}</span><b>{item}</b></div>)}
    </section>
  );
}

function EvidenceDisclosure({item, index}: {item: Evidence; index: number}) {
  const [open, setOpen] = useState(index === 0);
  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>
        <span className={`evidence-index ${item.severity}`}>{index + 1}</span>
        <span><b>{item.label}</b><small>{evidenceSourceLabel[item.source]}</small></span>
        <span className="severity-label">{item.severity === 'critical' ? 'Nguy hiểm' : item.severity === 'warning' ? 'Cần chú ý' : 'Thông tin'}</span>
        <ChevronDown size={18} />
      </summary>
      <p>{item.value ? <strong>{item.value}. </strong> : null}{item.detail}</p>
    </details>
  );
}

function EvidenceRows({title, tone, items}: {title: string; tone: string; items: Evidence[]}) {
  if (items.length === 0) return null;
  return (
    <section className={`evidence-section ${tone}`}>
      <div className="evidence-group-title"><h3>{title}</h3><span>{items.length}</span></div>
      <div className="evidence-rows">
        {items.slice(0, 6).map((item, index) => <EvidenceDisclosure item={item} index={index} key={item.id} />)}
      </div>
    </section>
  );
}

function UrlRows({analysis}: {analysis: Analysis}) {
  if (analysis.urlInspections.length === 0) return null;
  return (
    <section className="url-section">
      <div className="evidence-group-title"><h3>Liên kết đã kiểm tra</h3><span>{analysis.urlInspections.length}</span></div>
      <div className="url-rows">
        {analysis.urlInspections.slice(0, 3).map((inspection) => (
          <div className={`url-row ${inspection.structuralRisk}`} key={inspection.normalizedUrl}>
            <Link2 size={19} /><div><code>{inspection.registrableDomain}</code><small>{inspection.hostname}</small></div>
            <span>{inspection.webRisk.status === 'threat' ? 'Có trong danh sách đe dọa' : inspection.structuralRisk === 'critical' ? 'Cấu trúc nguy hiểm' : 'Cần đối chiếu thêm'}</span>
          </div>
        ))}
      </div>
      <p className="source-note"><Info size={15} /> “Chưa có trong danh sách” không đồng nghĩa liên kết an toàn.</p>
    </section>
  );
}

function LearningLoop({analysis}: {analysis: Analysis}) {
  const [feedback, setFeedback] = useState<'helpful' | 'unclear' | null>(null);
  const domain = analysis.domain;
  const isInconclusive = analysis.level === 'Chưa đủ dữ kiện';
  const observedDomain = domain ? `${domain.prefix}${domain.changed}${domain.suffix}` : analysis.urlInspections[0]?.registrableDomain;
  const lessonTitle = isInconclusive
    ? 'Xin thêm bằng chứng có thể kiểm tra'
    : domain ? 'Đọc tên miền từ phải sang trái' : analysis.level === 'Ít rủi ro'
      ? 'Không biến thiếu cảnh báo thành bằng chứng an toàn'
      : 'Tách áp lực cảm xúc khỏi bằng chứng';
  const lessonDetail = isInconclusive
    ? 'Bổ sung toàn bộ tin nhắn, liên kết, ảnh chụp hoặc yêu cầu cụ thể. Chưa đủ dữ kiện không đồng nghĩa nội dung an toàn.'
    : domain
      ? `So sánh phần tên miền gốc, không dựa vào logo hoặc giao diện. Ở đây “${domain.changed}” là ký tự làm ${observedDomain} khác ${domain.claimed}.`
      : analysis.level === 'Ít rủi ro'
        ? 'Chưa thấy dấu hiệu mạnh không đồng nghĩa đã xác minh an toàn. Hãy tiếp tục trên ứng dụng hoặc website chính thức.'
        : 'Tin nhắn thúc giục không tự chứng minh là lừa đảo. Hãy dừng lại, tìm kênh chính thức độc lập rồi mới hành động.';

  const saveFeedback = (value: 'helpful' | 'unclear') => {
    setFeedback(value);
    try {
      window.sessionStorage.setItem('scamsignal-demo-feedback', value);
    } catch {
      // Feedback remains in component state when browser storage is unavailable.
    }
  };

  return (
    <section className="learning-loop" aria-labelledby="learning-title">
      <div className="learning-heading"><span><Lightbulb size={20} /></span><div><p className="workspace-kicker">Bài học 20 giây</p><h2 id="learning-title">{lessonTitle}</h2></div></div>
      <div className="learning-content">
        <div className="lesson-character" aria-hidden="true">{domain?.changed || (isInconclusive ? '?' : '!')}</div>
        <p>{lessonDetail}</p>
        {domain ? <code><del>{observedDomain}</del><ArrowRight size={15} />{domain.claimed}</code> : null}
      </div>
      <div className="feedback-row">
        <p><b>Kết quả này có giúp bạn chọn hành động an toàn hơn không?</b><small>Phản hồi chỉ được lưu trong phiên demo này.</small></p>
        <div role="group" aria-label="Đánh giá mức độ hữu ích">
          <button aria-pressed={feedback === 'helpful'} className={feedback === 'helpful' ? 'active' : ''} onClick={() => saveFeedback('helpful')}><ThumbsUp size={17} /> Hữu ích</button>
          <button aria-pressed={feedback === 'unclear'} className={feedback === 'unclear' ? 'active' : ''} onClick={() => saveFeedback('unclear')}><ThumbsDown size={17} /> Chưa rõ</button>
        </div>
      </div>
      <p className="feedback-status" role="status" aria-live="polite">{feedback ? 'Đã ghi nhận trong phiên. Chưa có dữ liệu nào được gửi ra ngoài.' : ''}</p>
    </section>
  );
}

function ResultView({analysis, onReset, onRescue}: {analysis: Analysis; onReset: () => void; onRescue: () => void}) {
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const domain = analysis.domain;
  const isLocalFallback = analysis.pipeline.model === 'deterministic-safety-engine-v1';
  const isInconclusive = analysis.level === 'Chưa đủ dữ kiện';
  const riskClass = analysis.level === 'Nguy hiểm' ? 'danger' : analysis.level === 'Đáng ngờ' ? 'suspicious' : isInconclusive ? 'unknown' : 'safe';
  const riskTitle = analysis.level === 'Nguy hiểm' ? 'Tên miền hoặc nội dung có dấu hiệu giả mạo' : analysis.level === 'Đáng ngờ' ? 'Có dấu hiệu cần xác minh' : isInconclusive ? 'Chưa thể kết luận đáng tin cậy' : 'Chưa thấy rủi ro mạnh';
  const instruction = analysis.level === 'Nguy hiểm' ? 'Không nhập OTP hoặc chuyển tiền qua liên kết này.' : analysis.level === 'Đáng ngờ' ? 'Tạm dừng và xác minh qua kênh độc lập.' : isInconclusive ? 'Chưa hành động; hãy bổ sung liên kết, ảnh hoặc yêu cầu cụ thể.' : 'Tiếp tục thận trọng trong ứng dụng chính thức.';
  const evidenceGroups = useMemo(() => ({
    verified: analysis.evidence.filter((item) => item.verification === 'verified'),
    inferred: analysis.evidence.filter((item) => item.verification === 'inferred'),
    unknown: analysis.evidence.filter((item) => item.verification === 'unknown'),
  }), [analysis.evidence]);

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scamsignal-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyWarning = async () => {
    try {
      if (!navigator.clipboard) throw new Error('clipboard_unavailable');
      await navigator.clipboard.writeText(instruction);
      setCopyState('success');
    } catch {
      setCopyState('error');
    }
  };

  const runtimeLabels = {local: 'Local', ai_studio: 'AI Studio', cloud_run: 'Cloud Run'} as const;

  return (
    <main className={`result-page ${riskClass}`} id="main-content" tabIndex={-1}>
      <button className="back-button" onClick={onReset}><ArrowLeft size={18} /> Kết quả kiểm tra</button>
      <header className="result-hero">
        <div className="risk-glyph">{riskClass === 'safe' ? <ShieldCheck /> : riskClass === 'unknown' ? <CircleHelp /> : <AlertTriangle />}</div>
        <div><p className="risk-eyebrow">{analysis.level === 'Nguy hiểm' ? 'Rủi ro cao' : analysis.level}</p><h1>{riskTitle}</h1><p>{analysis.summary}</p></div>
        <span className="ai-confidence">
          {isLocalFallback ? 'Kiểm tra cục bộ · chưa có điểm AI' : `AI: ${analysis.confidence}%`} <Info size={15} />
        </span>
      </header>

      {isLocalFallback ? (
        <section className="warning-strip fallback-notice" aria-live="polite">
          <CircleHelp size={22} />
          <b>Gemini đang gián đoạn. Kết quả dưới đây chỉ gồm tín hiệu kiểm chứng trên thiết bị và không giả lập điểm AI.</b>
        </section>
      ) : null}

      <section className="warning-strip" aria-live="polite"><AlertCircle size={22} /><b>{instruction}</b><button onClick={() => void copyWarning()}><Copy size={17} /> {copyState === 'success' ? 'Đã sao chép' : copyState === 'error' ? 'Không thể sao chép' : 'Sao chép cảnh báo'}</button></section>

      {domain ? (
        <section className="trust-twin">
          <div className="section-title"><h2>Trust Twin — so sánh tên miền</h2><span><SearchCheck size={16} /> So sánh cấu trúc</span></div>
          <div className="twin-columns">
            <article className="observed-twin"><small>Liên kết đang kiểm tra</small><code>{domain.prefix}<mark>{domain.changed}</mark>{domain.suffix}</code><span><AlertCircle size={17} /> Không xác minh</span></article>
            <article className="official-twin"><small>Nguồn tham chiếu</small><code>{domain.claimed}</code><span><CheckCircle2 size={17} /> Do người dùng cung cấp</span></article>
          </div>
          <p className="mismatch-note">{domain.explanation}</p>
        </section>
      ) : null}

      <LearningLoop analysis={analysis} />

      <div className="evidence-heading"><div><p className="workspace-kicker">Bằng chứng</p><h2>Vì sao có kết luận này?</h2></div><span>{analysis.evidence.length} tín hiệu</span></div>
      <EvidenceRows title="Đã kiểm chứng" tone="verified" items={evidenceGroups.verified} />
      <EvidenceRows title="AI suy luận" tone="inferred" items={evidenceGroups.inferred} />
      <EvidenceRows title="Chưa đủ dữ kiện" tone="unknown" items={evidenceGroups.unknown} />
      <UrlRows analysis={analysis} />

      <details className="technical-details">
        <summary>Cách kết quả được tạo <ChevronDown size={17} /></summary>
        <div><span>Runtime: {runtimeLabels[analysis.pipeline.backend]}</span><span>Web Risk: {analysis.pipeline.webRisk}</span><span>Thời gian: {(analysis.pipeline.durationMs / 1000).toFixed(1)} giây</span><span>Model: {analysis.pipeline.model}</span></div>
      </details>

      <div className="result-action-rail">
        <button className="danger-action" onClick={isInconclusive ? onReset : onRescue}>{isInconclusive ? <Plus size={19} /> : <ShieldAlert size={19} />} {analysis.level === 'Nguy hiểm' ? 'Mở hướng dẫn xử lý' : isInconclusive ? 'Bổ sung bằng chứng' : 'Bắt đầu xác minh'}</button>
        <button className="secondary-action" onClick={downloadReport}><Download size={18} /> Lưu bằng chứng</button>
        <button className="text-action" onClick={onRescue}><LifeBuoy size={18} /> Bắt đầu chế độ khẩn cấp</button>
      </div>
    </main>
  );
}

function MobileTabBar({journey, onNavigate}: {journey: Journey; onNavigate: (next: Journey) => void}) {
  return (
    <nav className="mobile-tabbar" aria-label="Điều hướng trên điện thoại">
      <button aria-current={journey === 'check' ? 'page' : undefined} className={journey === 'check' ? 'active' : ''} onClick={() => onNavigate('check')}><ScanSearch />Kiểm tra</button>
      <button aria-current={journey === 'verify' ? 'page' : undefined} className={journey === 'verify' ? 'active' : ''} onClick={() => onNavigate('verify')}><SearchCheck />Xác minh</button>
      <button aria-current={journey === 'rescue' ? 'page' : undefined} className={journey === 'rescue' ? 'active danger' : ''} onClick={() => onNavigate('rescue')}><ShieldCheck />An toàn</button>
    </nav>
  );
}

function App() {
  const [journey, setJourney] = useState<Journey>('check');
  const [mode, setMode] = useState<Mode>('text');
  const [message, setMessage] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [state, setState] = useState<AppState>('idle');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [imageName, setImageName] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imageDetails, setImageDetails] = useState('');
  const [imageConsent, setImageConsent] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [capabilities, setCapabilities] = useState<CapabilitiesResponseV1 | null>(null);
  const [capabilityError, setCapabilityError] = useState(false);
  const [transportState, setTransportState] = useState<TransportState>('checking');

  const preferLocal = transportState === 'unavailable';
  const loadingSteps = useMemo(() => getLoadingSteps(capabilities, preferLocal), [capabilities, preferLocal]);
  const analysisConfigured = ['available', 'configured'].includes(capabilities?.analysis.state || '');
  const hasEvidence = mode === 'text' ? message.trim().length >= 16 : Boolean(imageDataUrl && imageConsent);
  const canUseRemoteAnalysis = analysisConfigured && transportState !== 'unavailable';
  const canUseLocalTextChecks = mode === 'text' && message.trim().length >= 16 && transportState === 'unavailable';
  const canAnalyze = hasEvidence && (canUseRemoteAnalysis || canUseLocalTextChecks);
  const serviceMessage = transportState === 'unavailable'
    ? mode === 'image'
      ? 'Kênh AI đang gián đoạn. Phân tích ảnh tạm khóa vì không có OCR cục bộ; hãy dán phần chữ hoặc liên kết để kiểm tra trên thiết bị.'
      : 'Kênh AI đang gián đoạn. Văn bản vẫn được kiểm tra cục bộ và kết quả sẽ không hiển thị điểm AI.'
    : capabilityError
      ? 'Không thể xác nhận cấu hình AI. Tính năng phân tích được tạm khóa để tránh hiển thị kết quả giả.'
      : !capabilities ? 'Đang kiểm tra khả năng phân tích của máy chủ…'
        : analysisConfigured ? '' : 'Máy chủ chưa được cấu hình Gemini. ScamSignal sẽ không tạo điểm hoặc kết quả mẫu.';

  useEffect(() => {
    const controller = new AbortController();
    getRuntimeCapabilities(controller.signal)
      .then((value) => {
        setCapabilities(value);
        setCapabilityError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCapabilityError(true);
      });
    probeAnalysisTransport(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setTransportState('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setTransportState('unavailable');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (state !== 'loading') return;
    const timer = window.setInterval(() => setLoadingStep((current) => Math.min(current + 1, loadingSteps.length - 1)), 540);
    return () => window.clearInterval(timer);
  }, [loadingSteps.length, state]);

  const scrollToTop = () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top: 0, behavior: reducedMotion ? 'auto' : 'smooth'});
  };

  const clearResult = () => {
    setState('idle');
    setAnalysis(null);
    setErrorMessage('');
  };

  const changeJourney = (next: Journey) => {
    setJourney(next);
    if (next !== 'rescue') clearResult();
    scrollToTop();
  };

  const loadDemo = () => {
    setJourney('check');
    setMode('text');
    setMessage(DEMO_MESSAGE);
    setExtraInfo(DEMO_EXTRA_INFO);
    setImageName('');
    setImageDataUrl('');
    setImageDetails('');
    setImageConsent(false);
    clearResult();
  };

  const runAnalysis = async () => {
    if (!canAnalyze) return;
    setState('loading');
    setLoadingStep(0);
    setAnalysis(null);
    setErrorMessage('');
    try {
      const minimumDelay = new Promise((resolve) => window.setTimeout(resolve, new URLSearchParams(window.location.search).has('instant') ? 80 : 900));
      const [result] = await Promise.all([
        analyzeWithGemini(
          {message, extraInfo, imageDataUrl: imageDataUrl || undefined},
          {preferLocal},
        ),
        minimumDelay,
      ]);
      setAnalysis(result);
      setState('result');
      scrollToTop();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gemini chưa thể hoàn tất phân tích.');
      setState('error');
    }
  };

  const handleImage = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrorMessage('Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP.');
      setState('error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Ảnh vượt quá giới hạn 8 MB.');
      setState('error');
      return;
    }
    setImageProcessing(true);
    setImageConsent(false);
    setErrorMessage('');
    try {
      const sanitized = await sanitizeImageFile(file);
      setMessage('');
      setImageDataUrl(sanitized.dataUrl);
      setImageName(file.name);
      setImageDetails(`${sanitized.width}×${sanitized.height}px · ${Math.round(sanitized.encodedBytes / 1024)} KB sau khi làm sạch`);
      clearResult();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể xử lý ảnh này. Vui lòng chọn tệp khác.');
      setState('error');
    } finally {
      setImageProcessing(false);
    }
  };

  const reset = () => {
    setMessage('');
    setExtraInfo('');
    setImageName('');
    setImageDataUrl('');
    setImageDetails('');
    setImageConsent(false);
    clearResult();
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <SiteHeader journey={journey} capabilities={capabilities} capabilityError={capabilityError} transportState={transportState} onNavigate={changeJourney} />

      {journey === 'rescue' ? (
        <RescueView onBack={() => changeJourney('check')} />
      ) : state === 'result' && analysis ? (
        <ResultView analysis={analysis} onReset={() => {reset(); changeJourney('check');}} onRescue={() => changeJourney('rescue')} />
      ) : (
        <main className="home-page" id="main-content" tabIndex={-1}>
          <section className="home-hero">
            <h1>{journey === 'verify' ? 'Xác minh trước khi tin tưởng.' : 'Dừng lại trước khi chuyển tiền.'}</h1>
            <p>{journey === 'verify' ? 'Đối chiếu tổ chức, tài khoản hoặc kênh liên hệ với nguồn tham chiếu bạn cung cấp.' : 'Kiểm tra link, tin nhắn hoặc bằng chứng trong vài giây.'}</p>
          </section>
          <JourneySelector journey={journey} onSelect={changeJourney} />
          <AnalysisWorkspace
            journey={journey}
            mode={mode}
            message={message}
            extraInfo={extraInfo}
            imageName={imageName}
            imagePreview={imageDataUrl}
            imageDetails={imageDetails}
            imageConsent={imageConsent}
            imageProcessing={imageProcessing}
            state={state}
            canAnalyze={canAnalyze}
            errorMessage={errorMessage}
            serviceMessage={serviceMessage}
            onMode={(nextMode) => {setMode(nextMode); setMessage(''); setImageName(''); setImageDataUrl(''); setImageDetails(''); setImageConsent(false); clearResult();}}
            onMessage={(value) => {setMessage(value); clearResult();}}
            onExtraInfo={setExtraInfo}
            onImage={(file) => void handleImage(file)}
            onImageConsent={setImageConsent}
            onDemo={loadDemo}
            onReset={reset}
            onAnalyze={runAnalysis}
          />
          {state === 'loading' ? <LoadingPanel step={loadingStep} steps={loadingSteps} /> : null}
          <MethodStrip />
          <p className="privacy-footnote"><LockKeyhole size={16} /> Văn bản được che cục bộ · ảnh chỉ gửi sau khi bạn xác nhận preview</p>
        </main>
      )}

      <footer><span><ShieldCheck size={16} /> ScamSignal AI · AI Riser Vietnam 2026</span><span>NovaBank là dữ liệu hư cấu dùng cho mục đích minh họa.</span></footer>
      <MobileTabBar journey={journey} onNavigate={changeJourney} />
    </div>
  );
}

export default App;
