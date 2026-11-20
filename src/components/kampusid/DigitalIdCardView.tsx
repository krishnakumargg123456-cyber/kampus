import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  FlipHorizontal,
  Printer,
  QrCode,
  RefreshCw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useKampusId } from '../../context/KampusIdContext';
import { RealQrCode } from '../shared/RealQrCode';
import { resolveAssetUrl } from '../../utils/assetResolver';

interface DigitalIdCardViewProps {
  onNavigateTab: (tab: 'card' | 'verify' | 'public' | 'settings' | 'history' | 'admin') => void;
}

export const DigitalIdCardView: React.FC<DigitalIdCardViewProps> = ({ onNavigateTab }) => {
  const navigate = useNavigate();
  const {
    currentUserId,
    identity,
    connectedSummary,
    communityPostsCount,
    qrToken,
    qrExpiresAt,
    rotateQrToken,
    submitVerificationRequest,
    showToast,
  } = useKampusId();

  const [isFlipped, setIsFlipped] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [instDomain, setInstDomain] = useState('iitb.ac.in');
  const [instNote, setInstNote] = useState('');
  const [submittingVerif, setSubmittingVerif] = useState(false);

  useEffect(() => {
    if (!qrExpiresAt) return;
    const id = window.setInterval(() => {
      const rem = Math.max(0, Math.floor((qrExpiresAt - Date.now()) / 1000));
      setSecondsLeft(rem);
    }, 1000);
    return () => window.clearInterval(id);
  }, [qrExpiresAt]);

  if (!identity) return null;

  const downloadPngCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 920;
    canvas.height = 560;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Deep Navy Card Background
    ctx.fillStyle = '#172554';
    ctx.fillRect(0, 0, 920, 560);

    // Accent strip
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(0, 0, 920, 88);

    // Header Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('KAMPUS · DIGITAL PLATFORM STUDENT ID', 44, 54);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#BFDBFE';
    ctx.fillText(identity.kampusIdNumber, 670, 54);

    // Body details
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(identity.fullName, 44, 164);

    ctx.fillStyle = '#DBEAFE';
    ctx.font = '20px sans-serif';
    ctx.fillText(identity.college, 44, 206);
    ctx.fillText(`${identity.course} · ${identity.academicYearOrSemester}`, 44, 244);
    ctx.fillText(`Department: ${identity.department}`, 44, 282);
    ctx.fillText(`Enrollment Ref: ${identity.enrollmentNo || 'Not provided'}`, 44, 320);

    ctx.fillStyle = '#93C5FD';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(
      `Account: ${identity.accountStatus}  |  Institutional Check: ${identity.verification.institutionalVerification}`,
      44,
      382
    );

    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px sans-serif';
    ctx.fillText(
      `Issued: ${new Date(identity.issuedAt).toDateString()}  ·  Card Version: ${identity.cardVersion}`,
      44,
      444
    );
    ctx.fillStyle = '#FDBA74';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(
      'Platform Digital Identity Only — Not a Government or Official University ID',
      44,
      504
    );

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${identity.kampusIdNumber}.png`;
    a.click();
    showToast('KAMPUS ID card image downloaded');
  };

  const publicShareUrl = `${window.location.origin}/#/campus/kampus-id?public=${encodeURIComponent(
    identity.publicSlug
  )}`;

  const initials = identity.fullName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Front/Back Digital Identity Card */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {isFlipped ? 'Back of Digital Card' : 'Front of Digital Card'} ·{' '}
              <span className="font-mono font-bold text-[#2563EB]">{identity.kampusIdNumber}</span>
            </div>
            <button
              onClick={() => setIsFlipped((f) => !f)}
              className="px-3.5 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#2563EB]"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{isFlipped ? 'Show Front Side' : 'Flip to Back Side'}</span>
            </button>
          </div>

          {!isFlipped ? (
            /* FRONT SIDE */
            <div className="rounded-3xl bg-[#172554] text-white p-6 sm:p-7 border border-blue-900 shadow-lg space-y-5">
              {/* Top Brand Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white font-bold text-sm flex items-center justify-center">
                    K
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-wider uppercase">
                      KAMPUS Platform Identity
                    </div>
                    <div className="text-[11px] text-blue-200">
                      Digital Student Credential · {identity.accountStatus}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-blue-200">
                    Immutable ID
                  </div>
                  <div className="text-sm font-mono font-bold text-white">
                    {identity.kampusIdNumber}
                  </div>
                </div>
              </div>

              {/* Student Identity Details + Live Rotating QR */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {identity.avatarUrl ? (
                    <img
                      src={resolveAssetUrl(identity.avatarUrl)}
                      alt={identity.fullName}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/25 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#2563EB] flex items-center justify-center text-xl font-bold shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <h2 className="text-xl font-bold tracking-tight truncate">
                      {identity.fullName}
                    </h2>
                    <div className="text-xs text-blue-100 font-medium">{identity.college}</div>
                    <div className="text-xs text-blue-200">
                      {identity.course} · {identity.academicYearOrSemester}
                    </div>
                    <div className="text-[11px] text-blue-200/90">
                      Dept: {identity.department} · Roll: {identity.enrollmentNo || 'Not set'}
                    </div>
                  </div>
                </div>

                {/* Real Rotating QR */}
                <div className="bg-white p-2 rounded-2xl shrink-0 text-center">
                  {qrToken ? (
                    <RealQrCode value={qrToken} size={108} />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-slate-400 text-[10px]">
                      Loading QR
                    </div>
                  )}
                  <div className="text-[10px] font-bold text-[#172554] mt-1 tabular-nums">
                    {secondsLeft > 0 ? `QR ${secondsLeft}s` : 'Refresh QR'}
                  </div>
                </div>
              </div>

              {/* Bottom Disclosure */}
              <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-blue-200">
                  Institutional Check:{' '}
                  <span className="font-bold text-white">
                    {identity.verification.institutionalVerification}
                  </span>
                </span>
                <span className="text-amber-200 font-medium">
                  Platform Identity Only · Not a Government or University ID
                </span>
              </div>
            </div>
          ) : (
            /* BACK SIDE */
            <div className="rounded-3xl bg-white dark:bg-slate-900 text-[#172033] dark:text-slate-100 p-6 sm:p-7 border-2 border-[#172554] shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#172554] dark:text-blue-300">
                  KAMPUS Identity Verification Details
                </div>
                <span className="text-xs font-mono font-bold text-[#2563EB]">
                  {identity.cardVersion}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60">
                  <div className="text-slate-500">Issue Date</div>
                  <div className="font-bold mt-0.5">
                    {new Date(identity.issuedAt).toDateString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60">
                  <div className="text-slate-500">Public Profile Slug</div>
                  <div className="font-mono font-bold mt-0.5 truncate">{identity.publicSlug}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 sm:col-span-2">
                  <div className="text-slate-500">How to Verify This Card</div>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    Scan the live rotating QR code on the front side inside KAMPUS ID Verifier.
                    Static screenshots expire automatically after 5 minutes and respect the
                    student's active privacy settings.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200">
                <span className="font-bold">Important Disclosure:</span> This card represents your
                student platform identity inside KAMPUS. It is not an official government identity
                document, Aadhaar, passport, or physical university registrar card.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => rotateQrToken(true)}
              className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rotate QR</span>
            </button>
            <a
              href={`/api/kampus-id/download-pdf?userId=${encodeURIComponent(currentUserId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#172554] hover:bg-blue-950 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <button
              onClick={downloadPngCard}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#2563EB]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Card PNG</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#2563EB]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print View</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(publicShareUrl);
                showToast('Public KAMPUS ID profile link copied');
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#2563EB]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Public Link</span>
            </button>
            <button
              onClick={() => onNavigateTab('verify')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#2563EB]"
            >
              <QrCode className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Open Verifier</span>
            </button>
          </div>
        </div>

        {/* Right: 5-Level Transparent Verification Breakdown */}
        <div className="xl:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Verification Status Transparency</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">5 Checks</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              {
                label: '1. KAMPUS Account',
                status: identity.verification.kampusAccount,
                ok: identity.verification.kampusAccount === 'Active',
              },
              {
                label: '2. Academic Profile Completeness',
                status: identity.verification.profileCompleted ? 'Complete' : 'Incomplete',
                ok: identity.verification.profileCompleted,
              },
              {
                label: '3. Email Verification',
                status: identity.verification.emailVerified ? 'Verified' : 'Not Verified',
                ok: identity.verification.emailVerified,
              },
              {
                label: '4. Institutional Info Provided',
                status: identity.verification.institutionalInfoProvided
                  ? 'Provided'
                  : 'Missing Roll/College',
                ok: identity.verification.institutionalInfoProvided,
              },
              {
                label: '5. Institutional Verification',
                status: identity.verification.institutionalVerification,
                ok: identity.verification.institutionalVerification === 'Verified',
              },
            ].map((row) => (
              <div
                key={row.label}
                className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {row.label}
                </span>
                <span
                  className={`font-bold inline-flex items-center gap-1 ${
                    row.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                  }`}
                >
                  {row.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  <span>{row.status}</span>
                </span>
              </div>
            ))}
          </div>

          {identity.verification.institutionalNote && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] text-slate-700 dark:text-slate-300">
              <span className="font-bold">Verifier Note:</span>{' '}
              {identity.verification.institutionalNote}
            </div>
          )}

          {identity.verification.institutionalVerification !== 'Verified' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingVerif(true);
                await submitVerificationRequest(instDomain, instNote);
                setSubmittingVerif(false);
                setInstNote('');
              }}
              className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Request Institutional Review
              </div>
              <p className="text-[11px] text-slate-500">
                No external registrar API is connected — requests enter our Authorized Verifier
                queue honestly as Pending Review.
              </p>
              <input
                type="text"
                value={instDomain}
                onChange={(e) => setInstDomain(e.target.value)}
                placeholder="Institutional domain (e.g. iitb.ac.in)"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                required
              />
              <input
                type="text"
                value={instNote}
                onChange={(e) => setInstNote(e.target.value)}
                placeholder="Enrollment / Department confirmation note"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                disabled={submittingVerif}
                className="w-full py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold"
              >
                {submittingVerif ? 'Submitting...' : 'Submit Institutional Review Request'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Connected KAMPUS Services & Genuine Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <button
          onClick={() => navigate('/campus/events-clubs')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] space-y-1.5"
        >
          <div className="flex items-center justify-between text-[#2563EB] font-bold">
            <span>Events & Check-Ins</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-[#172033] dark:text-slate-100 tabular-nums">
            {connectedSummary.eventsRegisteredCount} Registered ·{' '}
            {connectedSummary.eventsCheckedInCount} Attended
          </div>
          <div className="text-slate-500">Live records from KAMPUS Events & Clubs</div>
        </button>

        <button
          onClick={() => navigate('/campus/events-clubs')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] space-y-1.5"
        >
          <div className="flex items-center justify-between text-[#2563EB] font-bold">
            <span>Clubs & Certificates</span>
            <Award className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-[#172033] dark:text-slate-100 tabular-nums">
            {connectedSummary.clubsJoined.length} Clubs · {connectedSummary.certificates.length}{' '}
            Certs
          </div>
          <div className="text-slate-500">Only verified issued certificates shown</div>
        </button>

        <button
          onClick={() => navigate('/connect/skillswap')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] space-y-1.5"
        >
          <div className="flex items-center justify-between text-[#2563EB] font-bold">
            <span>SkillSwap Exchange</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-[#172033] dark:text-slate-100 tabular-nums">
            {connectedSummary.skillsOffered.length} Offered ·{' '}
            {connectedSummary.skillSwapCompletedCount} Swaps
          </div>
          <div className="text-slate-500">Synced with KAMPUS SkillSwap listings</div>
        </button>

        <button
          onClick={() => navigate('/connect/community')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] space-y-1.5"
        >
          <div className="flex items-center justify-between text-[#2563EB] font-bold">
            <span>Community & Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-[#172033] dark:text-slate-100 tabular-nums">
            {communityPostsCount} Posts
          </div>
          <div className="text-slate-500">Active KAMPUS Student Community contributions</div>
        </button>
      </div>
    </div>
  );
};
