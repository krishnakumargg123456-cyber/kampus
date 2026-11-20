import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import {
  DELIVERY_MODES,
  EXCHANGE_PREFERENCES,
  EXPERIENCE_DURATIONS,
  GROUP_TEACHING_MODES,
  SKILLSWAP_LANGUAGES,
  SKILL_PROFICIENCIES,
  WEEKDAYS,
  getCategoryName,
} from '../../data/skillSwapData';
import { useSkillSwap } from '../../context/SkillSwapContext';
import {
  DeliveryMode,
  ExchangePreference,
  ExperienceDuration,
  GroupTeachingMode,
  ListingIntent,
  SkillCategoryId,
  SkillListing,
  SkillProficiency,
} from '../../types/skillSwap';

interface OfferSkillWizardModalProps {
  isOpen: boolean;
  editingListing?: SkillListing | null;
  defaultIntent?: ListingIntent;
  onClose: () => void;
}

const STEPS = [
  'Skill Details',
  'Teaching Details',
  'Exchange Preference',
  'What I Want to Learn',
  'Availability',
  'Preview & Publish',
];

export const OfferSkillWizardModal: React.FC<OfferSkillWizardModalProps> = ({
  isOpen,
  editingListing = null,
  defaultIntent = 'Teaching Offer',
  onClose,
}) => {
  const { categories, createListing, updateListing, addCategorySkill, uploadSkillFile, showToast } =
    useSkillSwap();

  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<ListingIntent>(defaultIntent);
  const [categoryId, setCategoryId] = useState<SkillCategoryId>('technology');
  const [skillName, setSkillName] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [description, setDescription] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [proficiency, setProficiency] = useState<SkillProficiency>('Intermediate');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceDuration>('1-2 Years');

  const [whatStudentsLearn, setWhatStudentsLearn] = useState('');
  const [teachingApproach, setTeachingApproach] = useState(
    'Interactive walkthroughs with hands-on exercises and live Q&A.'
  );
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(60);
  const [language, setLanguage] = useState('English');
  const [groupMode, setGroupMode] = useState<GroupTeachingMode>('Individual (1-on-1)');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('Online');

  const [exchangePreference, setExchangePreference] =
    useState<ExchangePreference>('Skill Exchange');

  const [desiredSkill, setDesiredSkill] = useState('');
  const [desiredProficiency, setDesiredProficiency] = useState<SkillProficiency>('Beginner');
  const [learningGoals, setLearningGoals] = useState('');
  const [preferredPartner, setPreferredPartner] = useState(
    'Fellow student looking for consistent weekly sessions.'
  );

  const [availableDays, setAvailableDays] = useState<string[]>(['Tue', 'Thu', 'Sat']);
  const [preferredTime, setPreferredTime] = useState('6:00 PM - 8:00 PM');
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [portfolioPreviewUrl, setPortfolioPreviewUrl] = useState<string | undefined>(undefined);

  const [uploadingImg, setUploadingImg] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setErr(null);
    if (editingListing) {
      setIntent(editingListing.intent);
      setCategoryId(editingListing.categoryId);
      setSkillName(editingListing.skillName);
      setDescription(editingListing.description);
      setTopics(editingListing.topics);
      setProficiency(editingListing.proficiency);
      setExperienceLevel(editingListing.experienceLevel);
      setWhatStudentsLearn(editingListing.whatStudentsLearn);
      setTeachingApproach(editingListing.teachingApproach);
      setSessionDurationMinutes(editingListing.sessionDurationMinutes);
      setLanguage(editingListing.language);
      setGroupMode(editingListing.groupMode);
      setDeliveryMode(editingListing.deliveryMode);
      setExchangePreference(editingListing.exchangePreference);
      setDesiredSkill(editingListing.desiredSkill);
      setDesiredProficiency(editingListing.desiredProficiency);
      setLearningGoals(editingListing.learningGoals);
      setPreferredPartner(editingListing.preferredPartner);
      setAvailableDays(editingListing.availableDays);
      setPreferredTime(editingListing.preferredTime);
      setWeeklyHours(editingListing.weeklyHours);
      setPortfolioPreviewUrl(editingListing.portfolioPreviewUrl);
    } else {
      setIntent(defaultIntent);
      setCategoryId('technology');
      setSkillName('');
      setDescription('');
      setTopics([]);
      setProficiency(defaultIntent === 'Learning Request' ? 'Beginner' : 'Intermediate');
      setExperienceLevel(defaultIntent === 'Learning Request' ? '< 6 Months' : '1-2 Years');
      setWhatStudentsLearn('');
      setSessionDurationMinutes(60);
      setLanguage('English');
      setGroupMode('Individual (1-on-1)');
      setDeliveryMode('Online');
      setExchangePreference('Skill Exchange');
      setDesiredSkill('');
      setDesiredProficiency('Beginner');
      setLearningGoals('');
      setAvailableDays(['Tue', 'Thu', 'Sat']);
      setPreferredTime('6:00 PM - 8:00 PM');
      setWeeklyHours(3);
      setPortfolioPreviewUrl(undefined);
    }
  }, [isOpen, editingListing, defaultIntent]);

  if (!isOpen) return null;

  const activeCategory = categories.find((c) => c.id === categoryId) || categories[0];

  const handleAddTopic = () => {
    const clean = topicInput.trim();
    if (!clean || topics.includes(clean)) return;
    setTopics((prev) => [...prev, clean]);
    setTopicInput('');
  };

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleUploadPreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingImg(true);
    try {
      const uploaded = await uploadSkillFile(file);
      setPortfolioPreviewUrl(uploaded.url);
    } catch (uploadErr) {
      showToast(uploadErr instanceof Error ? uploadErr.message : 'Upload failed.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleNext = () => {
    setErr(null);
    if (step === 0) {
      if (!skillName.trim()) {
        setErr('Please select or enter a skill name.');
        return;
      }
      if (!description.trim()) {
        setErr('Please add a brief description of your skill or learning need.');
        return;
      }
    }
    if (step === 4 && availableDays.length === 0) {
      setErr('Select at least one available day.');
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const handlePublish = async () => {
    setSubmitting(true);
    setErr(null);
    const payload = {
      intent,
      skillName: skillName.trim(),
      categoryId,
      description: description.trim(),
      topics,
      proficiency,
      experienceLevel,
      whatStudentsLearn:
        whatStudentsLearn.trim() ||
        `Practical foundation and applied exercises in ${skillName.trim()}.`,
      teachingApproach: teachingApproach.trim(),
      sessionDurationMinutes,
      language,
      groupMode,
      deliveryMode,
      exchangePreference,
      desiredSkill: desiredSkill.trim(),
      desiredProficiency,
      learningGoals: learningGoals.trim(),
      preferredPartner: preferredPartner.trim(),
      availableDays,
      preferredTime,
      weeklyHours,
      portfolioPreviewUrl,
    };

    const ok = editingListing
      ? await updateListing(editingListing.id, payload)
      : Boolean(await createListing(payload));

    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {editingListing
                ? 'Edit Skill Listing'
                : intent === 'Learning Request'
                  ? 'Post a Learning Request'
                  : 'Offer a Skill on SkillSwap'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-6 gap-1.5">
            {STEPS.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => idx < step && setStep(idx)}
                className="text-left group cursor-pointer"
              >
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    idx <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
                <span
                  className={`hidden sm:block text-[10px] mt-1 truncate ${
                    idx === step
                      ? 'font-bold text-blue-600 dark:text-blue-400'
                      : 'text-slate-400'
                  }`}
                >
                  {idx + 1}. {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs">
          {err && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
              {err}
            </div>
          )}

          {/* STEP 1: SKILL DETAILS */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {(['Teaching Offer', 'Learning Request'] as ListingIntent[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setIntent(opt)}
                    className={`py-2 rounded-lg font-semibold cursor-pointer transition-colors ${
                      intent === opt
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt === 'Teaching Offer' ? 'I Want to Teach / Share' : 'I Want to Request a Skill'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Skill Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value as SkillCategoryId);
                      setSkillName('');
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Select Skill
                  </label>
                  <select
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  >
                    <option value="">Choose a skill...</option>
                    {activeCategory?.skills.map((sk) => (
                      <option key={sk} value={sk}>
                        {sk}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add custom expandable skill */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="Or add a specialized skill to this category..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!customSkillInput.trim()) return;
                    await addCategorySkill(categoryId, customSkillInput.trim());
                    setSkillName(customSkillInput.trim());
                    setCustomSkillInput('');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Skill
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Skill Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your practical experience, tools you use, and who this session helps most..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Topics Covered
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    placeholder="Add a topic (e.g. Figma Components, Loops & Functions)..."
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => setTopics((prev) => prev.filter((x) => x !== t))}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Skill Proficiency (Self-Reported)
                  </label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value as SkillProficiency)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  >
                    {SKILL_PROFICIENCIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Experience Duration
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as ExperienceDuration)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  >
                    {EXPERIENCE_DURATIONS.map((ex) => (
                      <option key={ex} value={ex}>
                        {ex}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TEACHING DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  What Students Will Learn
                </label>
                <textarea
                  rows={3}
                  value={whatStudentsLearn}
                  onChange={(e) => setWhatStudentsLearn(e.target.value)}
                  placeholder="Describe concrete outcomes learners will gain after 2–3 sessions..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Teaching Approach
                </label>
                <input
                  type="text"
                  value={teachingApproach}
                  onChange={(e) => setTeachingApproach(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Preferred Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  >
                    {SKILLSWAP_LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Session Duration (minutes)
                  </label>
                  <select
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  >
                    {[30, 45, 60, 90].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Individual or Group Teaching
                  </label>
                  <select
                    value={groupMode}
                    onChange={(e) => setGroupMode(e.target.value as GroupTeachingMode)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  >
                    {GROUP_TEACHING_MODES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Delivery Mode
                  </label>
                  <select
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  >
                    {DELIVERY_MODES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EXCHANGE PREFERENCE */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-slate-500 dark:text-slate-400">
                Choose how you want to collaborate with peers on this skill.
              </p>
              <div className="space-y-3">
                {(
                  [
                    {
                      id: 'Skill Exchange',
                      desc: 'Teach your skill and learn another skill from a peer in return.',
                    },
                    {
                      id: 'Teaching Only',
                      desc: 'Offer to mentor and teach students without requiring a skill trade.',
                    },
                    {
                      id: 'Learning Collaboration',
                      desc: 'Co-learn and build projects together as accountable peer learners.',
                    },
                  ] as Array<{ id: ExchangePreference; desc: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExchangePreference(opt.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      exchangePreference === opt.id
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{opt.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                    </div>
                    {exchangePreference === opt.id && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: WHAT I WANT TO LEARN */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Desired Skill {exchangePreference === 'Teaching Only' && '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={desiredSkill}
                    onChange={(e) => setDesiredSkill(e.target.value)}
                    placeholder="e.g. Graphic Design, Python, Public Speaking..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Desired Proficiency Level
                  </label>
                  <select
                    value={desiredProficiency}
                    onChange={(e) => setDesiredProficiency(e.target.value as SkillProficiency)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  >
                    {SKILL_PROFICIENCIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Learning Goals
                </label>
                <textarea
                  rows={3}
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  placeholder="What do you hope to build or understand through this exchange?"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Preferred Learning Partner
                </label>
                <input
                  type="text"
                  value={preferredPartner}
                  onChange={(e) => setPreferredPartner(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                />
              </div>
            </div>
          )}

          {/* STEP 5: AVAILABILITY */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Available Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const active = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3.5 py-2 rounded-xl font-semibold border cursor-pointer ${
                          active
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Preferred Time Window
                  </label>
                  <input
                    type="text"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="e.g. 6:00 PM - 8:30 PM"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Weekly Availability (hours/week)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                  />
                </div>
              </div>

              {/* Optional Genuine Portfolio Sample Upload */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Optional Project / Portfolio Sample Image
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Attach an image of your work (max 5 MB) so learners can preview your craft.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImg ? 'Uploading...' : portfolioPreviewUrl ? 'Change Image' : 'Upload Sample'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPreview}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: PREVIEW & PUBLISH */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {intent} · {getCategoryName(categoryId)} · Self-Reported
                    </p>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {skillName}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {exchangePreference}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Teaching Setup</p>
                    <p className="text-slate-500 mt-0.5">
                      {proficiency} ({experienceLevel}) · {sessionDurationMinutes} min · {deliveryMode} ·{' '}
                      {groupMode} · {language}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Availability & Goal</p>
                    <p className="text-slate-500 mt-0.5">
                      {availableDays.join(', ')} ({preferredTime}) · {weeklyHours}h/wk
                      {desiredSkill ? ` · Wants ${desiredSkill}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{step === 0 ? 'Cancel' : 'Back'}</span>
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Publishing...' : editingListing ? 'Save Changes' : 'Publish Listing'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
