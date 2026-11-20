import React, { useEffect, useState } from 'react';
import {
  Building,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
  ImagePlus,
  Lock,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Link } from 'react-router-dom';
import { useAccountProfileSettings } from '../../context/AccountProfileSettingsContext';
import type { ProfileVisibility, StudentProfileRecord } from '../../types/accountProfileSettings';
import { getBundledImage, resolveAssetUrl } from '../../utils/assetResolver';

const AVATAR_PRESETS = [
  { id: 'av1', url: getBundledImage('avatar_priya_1794407582447.jpg'), label: 'Priya' },
  { id: 'av2', url: getBundledImage('peer_ananya_avatar_1794551403770.jpg'), label: 'Ananya' },
  { id: 'av3', url: getBundledImage('peer_aditya_avatar_1794550951152.jpg'), label: 'Aditya' },
  { id: 'av4', url: getBundledImage('peer_meera_avatar_1794551404021.jpg'), label: 'Meera' },
];

const COVER_PRESETS = [
  { id: 'cov1', url: getBundledImage('college_iit_tech_campus_1794572775766.jpg'), label: 'Tech Campus' },
  { id: 'cov2', url: getBundledImage('hero_students_campus_1794449577723.jpg'), label: 'University Quad' },
  { id: 'cov3', url: getBundledImage('studyhub_desk_hero_1794549223041.jpg'), label: 'Study Workspace' },
];

interface Props {
  onNavigateTab: (tab: 'overview' | 'academic' | 'skills' | 'achievements' | 'projects' | 'activity' | 'public') => void;
}

export const ProfileOverviewAndPersonalView: React.FC<Props> = ({ onNavigateTab }) => {
  const { profileRecord, completion, saving, saveProfilePatch } = useAccountProfileSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    headline: '',
    avatarUrl: '',
    coverUrl: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: 'India',
    preferredLanguage: 'English',
    bio: '',
    careerGoals: '',
    showEmail: false,
    showPhone: false,
    showDob: false,
    showGender: false,
  });

  useEffect(() => {
    if (!profileRecord) return;
    setForm({
      fullName: profileRecord.fullName || '',
      username: profileRecord.username || '',
      headline: profileRecord.headline || '',
      avatarUrl: profileRecord.avatarUrl || '',
      coverUrl: profileRecord.coverUrl || '',
      dateOfBirth: profileRecord.dateOfBirth || '',
      gender: profileRecord.gender || '',
      email: profileRecord.email || '',
      phone: profileRecord.phone || '',
      city: profileRecord.city || '',
      state: profileRecord.state || '',
      country: profileRecord.country || 'India',
      preferredLanguage: profileRecord.preferredLanguage || 'English',
      bio: profileRecord.bio || '',
      careerGoals: profileRecord.careerGoals || '',
      showEmail: Boolean(profileRecord.privacy?.showEmail),
      showPhone: Boolean(profileRecord.privacy?.showPhone),
      showDob: Boolean(profileRecord.privacy?.showDob),
      showGender: Boolean(profileRecord.privacy?.showGender),
    });
  }, [profileRecord]);

  const publicProfileUrl = profileRecord
    ? `${window.location.origin}/#/profile/${profileRecord.username}`
    : '';

  useEffect(() => {
    if (!shareModalOpen || !publicProfileUrl) return;
    QRCode.toDataURL(publicProfileUrl, { width: 220, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [shareModalOpen, publicProfileUrl]);

  if (!profileRecord) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">
        Loading student profile...
      </div>
    );
  }

  const handleImageUpload = (file: File | undefined, field: 'avatarUrl' | 'coverUrl') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'err', text: 'Please upload a valid image file (PNG, JPG, WEBP).' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: 'err', text: 'Image must be 2 MB or smaller.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setForm((prev) => ({ ...prev, [field]: dataUrl }));
      if (!isEditing) {
        const res = await saveProfilePatch({ [field]: dataUrl } as Partial<StudentProfileRecord>);
        setStatusMessage(
          res.ok
            ? { type: 'ok', text: field === 'avatarUrl' ? 'Profile photo updated.' : 'Cover banner updated.' }
            : { type: 'err', text: res.error || 'Upload failed.' }
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async (field: 'avatarUrl' | 'coverUrl') => {
    setForm((prev) => ({ ...prev, [field]: '' }));
    if (!isEditing) {
      const res = await saveProfilePatch({ [field]: '' } as Partial<StudentProfileRecord>);
      setStatusMessage(
        res.ok
          ? { type: 'ok', text: field === 'avatarUrl' ? 'Profile photo removed.' : 'Cover banner removed.' }
          : { type: 'err', text: res.error || 'Could not remove photo.' }
      );
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    const res = await saveProfilePatch({
      fullName: form.fullName,
      username: form.username,
      headline: form.headline,
      avatarUrl: form.avatarUrl,
      coverUrl: form.coverUrl,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      email: form.email,
      phone: form.phone,
      city: form.city,
      state: form.state,
      country: form.country,
      preferredLanguage: form.preferredLanguage,
      bio: form.bio,
      careerGoals: form.careerGoals,
      privacy: {
        ...profileRecord.privacy,
        showEmail: form.showEmail,
        showPhone: form.showPhone,
        showDob: form.showDob,
        showGender: form.showGender,
      },
    });
    if (res.ok) {
      setIsEditing(false);
      setStatusMessage({ type: 'ok', text: 'Personal profile details saved.' });
    } else {
      setStatusMessage({ type: 'err', text: res.error || 'Could not save changes.' });
    }
  };

  const handleVisibilityChange = async (visibility: ProfileVisibility) => {
    const res = await saveProfilePatch({
      privacy: { ...profileRecord.privacy, visibility },
    });
    setStatusMessage(
      res.ok
        ? { type: 'ok', text: `Profile visibility set to ${visibility}.` }
        : { type: 'err', text: res.error || 'Failed to update visibility.' }
    );
  };

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(false);
    }
  };

  const completionPct = completion?.percentage ?? 0;

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            statusMessage.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="p-1 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Profile Identity Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Cover Banner */}
        <div className="relative h-36 sm:h-48 bg-blue-950">
          {profileRecord.coverUrl ? (
            <img
              src={resolveAssetUrl(profileRecord.coverUrl)}
              alt="Profile cover"
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full bg-blue-950 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-200/70 tracking-wide">
                KAMPUS Academic Identity Banner
              </span>
            </div>
          )}

          {/* Cover Upload Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-sm cursor-pointer hover:bg-white">
              <ImagePlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Cover Photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0], 'coverUrl')}
              />
            </label>
            {profileRecord.coverUrl && (
              <button
                type="button"
                onClick={() => handleRemoveImage('coverUrl')}
                className="p-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 text-rose-600 shadow-sm hover:bg-white"
                title="Remove cover photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Identity Row */}
        <div className="px-5 sm:px-7 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 relative z-10">
            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                {profileRecord.avatarUrl ? (
                  <img
                    src={resolveAssetUrl(profileRecord.avatarUrl)}
                    alt={profileRecord.fullName}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900 bg-slate-100 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-white dark:ring-slate-900 bg-blue-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-md">
                    {(profileRecord.fullName || 'S').charAt(0).toUpperCase()}
                  </div>
                )}

                <label
                  title="Upload profile photo"
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0], 'avatarUrl')}
                  />
                </label>
              </div>

              <div className="pt-2 sm:pt-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {profileRecord.fullName}
                  </h2>
                  {profileRecord.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Student</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  @{profileRecord.username} · {profileRecord.headline || 'KAMPUS Scholar'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Close Editor' : 'Edit Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Share Profile</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('public')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Public Preview</span>
              </button>
            </div>
          </div>

          {/* Academic & Location Summary */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate font-medium">
                {profileRecord.college || 'Add your college or university'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">
                {[profileRecord.course, profileRecord.semester].filter(Boolean).join(' · ') ||
                  'Add course & semester'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="truncate">
                {[profileRecord.city, profileRecord.state, profileRecord.country].filter(Boolean).join(', ') ||
                  'Location not set'}
              </span>
            </div>
          </div>

          {/* Bio & Career Goals */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                About Me
              </p>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {profileRecord.bio.trim() || 'No bio added yet. Share your academic focus and interests.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Career Goals & Aspirations
              </p>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {profileRecord.careerGoals.trim() || 'Add your career direction, target roles, or research goals.'}
              </p>
            </div>
          </div>

          {/* Visibility Strip + KAMPUS ID Link */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                <span>Visibility:</span>
              </span>
              {(['Public', 'KAMPUS Members', 'Private'] as ProfileVisibility[]).map((vis) => (
                <button
                  key={vis}
                  type="button"
                  onClick={() => handleVisibilityChange(vis)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    profileRecord.privacy.visibility === vis
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {vis}
                </button>
              ))}
            </div>

            <Link
              to="/campus/kampus-id"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Open KAMPUS Digital ID</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Completion Meter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Profile Completion</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete your identity, skills, projects, and academic records to unlock peer discovery.
            </p>
          </div>
          <span className="text-xl font-extrabold text-blue-600 tabular-nums">{completionPct}%</span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {completion && completion.suggestedActions.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {completion.suggestedActions.map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => {
                  const low = act.toLowerCase();
                  if (low.includes('academic')) onNavigateTab('academic');
                  else if (low.includes('skill') || low.includes('interest')) onNavigateTab('skills');
                  else if (low.includes('achievement')) onNavigateTab('achievements');
                  else if (low.includes('project')) onNavigateTab('projects');
                  else setIsEditing(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-400 cursor-pointer"
              >
                + {act}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Your student profile is 100% complete.</span>
          </p>
        )}
      </div>

      {/* Personal Information Editor / Read View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Personal Information & Contact Privacy</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sensitive fields like email, phone, date of birth, and gender remain private unless explicitly shown.
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Edit Details
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSavePersonal} className="space-y-5">
            {/* Avatar & Cover Preset Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Profile Photo Presets</span>
                  {form.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, avatarUrl: '' }))}
                      className="text-[11px] font-semibold text-rose-600"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {AVATAR_PRESETS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, avatarUrl: av.url }))}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        form.avatarUrl === av.url ? 'border-blue-600 scale-105' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-12 h-12 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Cover Banner Presets</span>
                  {form.coverUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, coverUrl: '' }))}
                      className="text-[11px] font-semibold text-rose-600"
                    >
                      Remove Cover
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COVER_PRESETS.map((cv) => (
                    <button
                      key={cv.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, coverUrl: cv.url }))}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        form.coverUrl === cv.url ? 'border-blue-600 scale-105' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={cv.url} alt={cv.label} className="w-20 h-12 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unique Username *
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech CSE Scholar · Distributed Systems & AI"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showEmail}
                      onChange={(e) => setForm({ ...form, showEmail: e.target.checked })}
                    />
                    <span>Show publicly</span>
                  </label>
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showPhone}
                      onChange={(e) => setForm({ ...form, showPhone: e.target.checked })}
                    />
                    <span>Show publicly</span>
                  </label>
                </div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showDob}
                      onChange={(e) => setForm({ ...form, showDob: e.target.checked })}
                    />
                    <span>Show publicly</span>
                  </label>
                </div>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm tabular-nums"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gender (Optional)</label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showGender}
                      onChange={(e) => setForm({ ...form, showGender: e.target.checked })}
                    />
                    <span>Show publicly</span>
                  </label>
                </div>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Language
                </label>
                <select
                  value={form.preferredLanguage}
                  onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="English & Hindi">English & Hindi</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">About / Bio</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Share your academic focus, coursework, or research interests..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Career Goals & Aspirations
                </label>
                <textarea
                  rows={2}
                  value={form.careerGoals}
                  onChange={(e) => setForm({ ...form, careerGoals: e.target.value })}
                  placeholder="What roles, fellowships, or higher studies are you working toward?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Personal Details'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>
                {profileRecord.privacy.showEmail ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {profileRecord.email || 'Not set'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</span>
                {profileRecord.privacy.showPhone ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                {profileRecord.phone || 'Not set'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 flex items-center justify-between mb-1">
                <span>Date of Birth</span>
                {profileRecord.privacy.showDob ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                {profileRecord.dateOfBirth || 'Not set'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 flex items-center justify-between mb-1">
                <span>Gender</span>
                {profileRecord.privacy.showGender ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {profileRecord.gender || 'Not specified'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 mb-1">Preferred Language</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {profileRecord.preferredLanguage || 'English'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Enrollment Number</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {profileRecord.enrollmentNo || 'Not set'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Share Profile QR Modal */}
      {shareModalOpen && (
        <div
          onClick={() => setShareModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>Share Student Profile</span>
              </h3>
              <button onClick={() => setShareModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visibility is currently <strong>{profileRecord.privacy.visibility}</strong>. Only sections permitted by your privacy controls are displayed.
            </p>

            {qrDataUrl && (
              <div className="flex justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img src={qrDataUrl} alt="Profile QR Code" className="w-44 h-44 rounded-lg" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicProfileUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
