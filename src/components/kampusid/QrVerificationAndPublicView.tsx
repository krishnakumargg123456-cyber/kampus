import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Copy,
  Eye,
  Lock,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useKampusId } from '../../context/KampusIdContext';
import { RealQrCode } from '../shared/RealQrCode';
import type { PublicVerifiedIdentityPayload } from '../../types/kampusId';
import { resolveAssetUrl } from '../../utils/assetResolver';

export const QrVerificationView: React.FC<{ initialPublicIdentifier?: string }> = ({
  initialPublicIdentifier,
}) => {
  const {
    identity,
    qrToken,
    qrExpiresAt,
    rotateQrToken,
    verifyQrToken,
    lookupPublicProfile,
    showToast,
  } = useKampusId();

  const [tokenInput, setTokenInput] = useState('');
  const [slugInput, setSlugInput] = useState(initialPublicIdentifier || '');
  const [verifyOutput, setVerifyOutput] = useState<PublicVerifiedIdentityPayload | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (initialPublicIdentifier) {
      setSlugInput(initialPublicIdentifier);
      lookupPublicProfile(initialPublicIdentifier).then(setVerifyOutput);
    }
  }, [initialPublicIdentifier, lookupPublicProfile]);

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setVerifying(true);
    const out = await verifyQrToken(tokenInput);
    setVerifying(false);
    setVerifyOutput(out);
  };

  const handleLookupId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugInput.trim()) return;
    setVerifying(true);
    const out = await lookupPublicProfile(slugInput);
    setVerifying(false);
    setVerifyOutput(out);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Student's Live Rotating Verification Credential */}
      <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-center">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
            Live Rotating QR Identity Token
          </div>
          <h3 className="text-base font-bold text-[#172033] dark:text-slate-100 mt-0.5">
            {identity?.fullName} · <span className="font-mono">{identity?.kampusIdNumber}</span>
          </h3>
        </div>

        <div className="inline-block p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200">
          {qrToken ? (
            <RealQrCode value={qrToken} size={188} />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
              Generating token...
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500">
          {qrExpiresAt
            ? `Token valid until ${new Date(qrExpiresAt).toLocaleTimeString()} (5-minute lifetime)`
            : 'Token expiry pending'}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => rotateQrToken(true)}
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rotate QR Now</span>
          </button>
          {qrToken && (
            <button
              onClick={() => {
                setTokenInput(qrToken);
                navigator.clipboard?.writeText(qrToken);
                showToast('Copied QR token to verifier input');
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy & Test Token</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          QR tokens contain only a signed ephemeral credential — private email, phone, and internal
          account IDs are never embedded.
        </p>
      </div>

      {/* Right: Interactive Verifier Scanner & Public ID Lookup */}
      <div className="lg:col-span-7 space-y-5">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-[#172033] dark:text-slate-100">
            <QrCode className="w-4 h-4 text-[#2563EB]" />
            <span>Verify Student QR Credential or Public ID</span>
          </div>

          <form onSubmit={handleVerifyToken} className="space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              1. Verify Signed Rotating QR Token (KMP-ID...)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste scanned KMP-ID... token"
                className="flex-1 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
              <button
                type="submit"
                disabled={verifying}
                className="px-4 py-2 rounded-xl bg-[#172554] text-white font-semibold shrink-0"
              >
                {verifying ? 'Verifying...' : 'Verify QR Token'}
              </button>
            </div>
          </form>

          <form onSubmit={handleLookupId} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              2. Lookup by KAMPUS ID Number or Public Slug
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="e.g. KMP-26-XXXXXX"
                className="flex-1 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
              <button
                type="submit"
                disabled={verifying}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Lookup Profile</span>
              </button>
            </div>
          </form>

          {verifyOutput && (
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                verifyOutput.status === 'Valid'
                  ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : verifyOutput.status === 'Private'
                    ? 'bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  {verifyOutput.status === 'Valid' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : verifyOutput.status === 'Private' ? (
                    <Lock className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                  )}
                  <span>Verification Result: {verifyOutput.status}</span>
                </span>
                {verifyOutput.kampusIdNumber && (
                  <span className="font-mono font-bold text-[#2563EB]">
                    {verifyOutput.kampusIdNumber}
                  </span>
                )}
              </div>

              <p className="text-slate-700 dark:text-slate-300">{verifyOutput.message}</p>

              {verifyOutput.status === 'Valid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/50">
                  <div>
                    <span className="text-slate-500">Student Name:</span>{' '}
                    <span className="font-bold">{verifyOutput.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Account Status:</span>{' '}
                    <span className="font-bold">{verifyOutput.accountStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">College:</span>{' '}
                    <span className="font-semibold">
                      {verifyOutput.college || 'Hidden by student privacy'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Academic Info:</span>{' '}
                    <span className="font-semibold">
                      {verifyOutput.course
                        ? `${verifyOutput.course} (${verifyOutput.academicYearOrSemester})`
                        : 'Hidden by student privacy'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Institutional Verification:</span>{' '}
                    <span className="font-bold">{verifyOutput.verificationState}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Email Check:</span>{' '}
                    <span className="font-semibold">
                      {verifyOutput.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-500 pt-1">{verifyOutput.disclaimer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PublicProfilePreviewView: React.FC = () => {
  const { identity, connectedSummary } = useKampusId();
  if (!identity) return null;

  const p = identity.privacy;

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB]">
          <Eye className="w-4 h-4" />
          <span>Public KAMPUS ID Profile Preview (Visibility: {p.profileVisibility})</span>
        </div>
        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
          {identity.kampusIdNumber}
        </span>
      </div>

      {p.profileVisibility === 'Private' ? (
        <div className="p-8 text-center space-y-2">
          <Lock className="w-7 h-7 text-slate-400 mx-auto" />
          <div className="text-sm font-bold">Profile Set to Private</div>
          <p className="text-xs text-slate-500">
            Visitors scanning or opening your public link only see that this KAMPUS ID is active
            and private.
          </p>
        </div>
      ) : (
        <div className="space-y-5 text-xs">
          <div className="flex items-center gap-4">
            {p.photoVisibility && identity.avatarUrl ? (
              <img
                src={resolveAssetUrl(identity.avatarUrl)}
                alt={identity.fullName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#172554] text-white flex items-center justify-center font-bold text-lg">
                {identity.fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100">
                {identity.fullName}
              </h3>
              {p.collegeVisibility && (
                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {identity.college}
                </div>
              )}
              {p.academicVisibility && (
                <div className="text-slate-500">
                  {identity.course} · {identity.department} · {identity.academicYearOrSemester}
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Institutional Status: {identity.verification.institutionalVerification}
            </span>
            <span className="text-slate-500">
              Email, phone, and private notes are never publicly exposed
            </span>
          </div>

          {p.skillsVisibility && (
            <div className="space-y-2">
              <div className="font-bold text-sm">Skills & Academic Interests</div>
              {identity.skills.length === 0 && connectedSummary.skillsOffered.length === 0 ? (
                <p className="text-slate-500">No skills added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    new Set([...identity.skills, ...connectedSummary.skillsOffered])
                  ).map((sk) => (
                    <span
                      key={sk}
                      className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] font-semibold"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {p.achievementsVisibility && (
            <div className="space-y-2">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#2563EB]" />
                <span>Verified Event Certificates ({connectedSummary.certificates.length})</span>
              </div>
              {connectedSummary.certificates.length === 0 ? (
                <p className="text-slate-500">No verified certificates issued yet.</p>
              ) : (
                <div className="space-y-2">
                  {connectedSummary.certificates.map((c) => (
                    <div
                      key={c.certificateRef}
                      className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold">{c.eventTitle}</div>
                        <div className="text-slate-500">{c.certificateType} Certificate</div>
                      </div>
                      <span className="font-mono font-bold text-[#2563EB]">{c.certificateRef}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {p.clubsVisibility && (
            <div className="space-y-2">
              <div className="font-bold text-sm">
                Active Club Memberships ({connectedSummary.clubsJoined.length})
              </div>
              {connectedSummary.clubsJoined.length === 0 ? (
                <p className="text-slate-500">No active club memberships.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {connectedSummary.clubsJoined.map((cl, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="font-bold">{cl.clubName}</div>
                      <div className="text-slate-500">
                        {cl.role} · {cl.category}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
