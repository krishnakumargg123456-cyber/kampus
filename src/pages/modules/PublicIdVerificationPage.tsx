import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Building2,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  Sparkles,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import type { PublicStudentProfilePayload } from '../../types/kampusId';

export const PublicIdVerificationPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicStudentProfilePayload | null>(null);

  useEffect(() => {
    if (!identifier) {
      setError('No identification parameter provided.');
      setLoading(false);
      return;
    }

    const fetchPublicId = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/kampus-id/public/${encodeURIComponent(identifier)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Identity record could not be verified.');
        }
        setProfile(data.profile);
      } catch (err: any) {
        setError(err.message || 'Could not verify student identity.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicId();
  }, [identifier]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full">
        {/* Top Branding Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-bold text-xl tracking-wider transition-colors mb-2"
          >
            <Sparkles className="w-6 h-6 text-sky-400" />
            <span>KAMPUS VERIFY</span>
          </Link>
          <p className="text-xs text-slate-400 font-medium">
            Cryptographic Digital Student Identity Verification
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-12 h-12 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-200">Verifying Digital Identity...</h3>
            <p className="text-xs text-slate-400 mt-1">
              Querying platform verification registry and checking cryptographic nonces.
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-red-200">Verification Unsuccessful</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">{error}</p>
            <p className="text-xs text-slate-500 mt-4">
              This KAMPUS ID or QR token may have expired, rotated, or does not exist.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/modules/id"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to KAMPUS
              </Link>
            </div>
          </div>
        )}

        {/* Verified Student Identity Card */}
        {!loading && !error && profile && (
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Card Top Banner */}
            <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 p-6 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-300" />
                  <span className="text-xs font-bold tracking-widest uppercase">
                    Verified Digital Identity
                  </span>
                </div>
                <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full font-mono font-bold">
                  {profile.kampusIdNumber}
                </span>
              </div>
            </div>

            {/* Student Info Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Photo & Basic Details */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName || 'Student'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-slate-300">
                      {profile.fullName ? profile.fullName.charAt(0) : 'S'}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {profile.fullName}
                  </h2>
                  <p className="text-xs text-sky-400 font-medium">@{profile.username}</p>
                  <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{profile.statusBadge}</span>
                  </div>
                </div>
              </div>

              {/* Academic Affiliation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    College / University
                  </span>
                  <p className="font-semibold text-slate-200">{profile.college}</p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    Program / Degree
                  </span>
                  <p className="font-semibold text-slate-200">
                    {profile.course}
                    {profile.specialization ? ` (${profile.specialization})` : ''}
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Academic Year
                  </span>
                  <p className="font-semibold text-slate-200">
                    {profile.yearOfStudy ? `Year ${profile.yearOfStudy}` : 'Current Student'}
                    {profile.graduationYear ? ` · Class of ${profile.graduationYear}` : ''}
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    Issue Date & Validity
                  </span>
                  <p className="font-semibold text-slate-200">
                    {profile.issueDate
                      ? `Issued ${new Date(profile.issueDate).toLocaleDateString([], { month: 'short', year: 'numeric' })}`
                      : 'Issued Recently'}
                    {profile.validUntil
                      ? ` · Valid until ${new Date(profile.validUntil).toLocaleDateString([], { month: 'short', year: 'numeric' })}`
                      : ''}
                  </p>
                </div>
              </div>

              {/* Skills and Achievements */}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Verified Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill: string, sIdx: number) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Platform Disclaimer Notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-1">
                    Institutional Verification Notice
                  </strong>
                  KAMPUS ID is a cryptographic platform identity issued to verified members of the
                  KAMPUS collegiate network. It serves as student platform proof and does not
                  replace a government-issued identity card or formal university accreditation
                  unless explicitly verified by authorized college administrators.
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                HMAC-SHA256 Signed Security Token
              </span>
              <Link
                to="/"
                className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1"
              >
                Open KAMPUS
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
