import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Sparkles, User, Building, BookOpen, Heart, Camera, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import avatarPriyaImg from '../../assets/images/avatar_priya_1794407582447.jpg';
import avatarAnanyaImg from '../../assets/images/peer_ananya_avatar_1794551403770.jpg';
import avatarAdityaImg from '../../assets/images/peer_aditya_avatar_1794550951152.jpg';

const AVAILABLE_INTERESTS = [
  'Artificial Intelligence',
  'Competitive Programming',
  'Distributed Systems',
  'Cloud Architecture',
  'Robotics & Hardware',
  'UI/UX & Product Design',
  'Quantitative Finance',
  'Cybersecurity & Cryptography',
  'Mobile App Development',
  'DevOps & Linux',
  'Open Source Software',
  'Blockchain & Web3',
];

const AVATAR_OPTIONS = [
  { id: 'av1', url: avatarPriyaImg, label: 'Student Scholar' },
  { id: 'av2', url: avatarAnanyaImg, label: 'Tech Lead' },
  { id: 'av3', url: avatarAdityaImg, label: 'Innovator' },
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, completeOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 6;

  const pendingMeta = (() => {
    try {
      const raw = localStorage.getItem('kampus_pending_registration_meta');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const isDemoProfile = profile.email === 'priya.sharma@cse.iitb.ac.in' || profile.name === 'Priya Sharma';

  // Onboarding form state initialized with user's actual registration details
  const [personalInfo, setPersonalInfo] = useState({
    bio: !isDemoProfile && profile.bio ? profile.bio : 'Passionate student navigating campus life & academic excellence.',
    gender: 'Prefer not to say',
    preferredLanguage: 'English & Hindi',
    hostel: !isDemoProfile && profile.hostel ? profile.hostel : '',
  });

  const [collegeDetails, setCollegeDetails] = useState({
    college: (user?.college && user.college !== 'Indian Institute of Technology, Bombay' ? user.college : '') || pendingMeta?.college || (!isDemoProfile ? profile.college : '') || '',
    campusWing: 'Main Campus',
    enrollmentNo: (user?.enrollmentNo && user.enrollmentNo !== '22B030149' ? user.enrollmentNo : '') || pendingMeta?.enrollmentNo || (!isDemoProfile ? profile.enrollmentNo : '') || '',
  });

  const [courseDetails, setCourseDetails] = useState({
    course: user?.course || pendingMeta?.course || (!isDemoProfile ? profile.course : '') || '',
    semester: user?.semester || pendingMeta?.semester || (!isDemoProfile ? profile.semester : 'Semester 1') || 'Semester 1',
    targetCgpa: '8.50',
    targetGoal: 'Academic Excellence & Tier-1 Software Engineering',
  });

  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Artificial Intelligence',
    'Competitive Programming',
    'Distributed Systems',
  ]);

  const [selectedAvatar, setSelectedAvatar] = useState((!isDemoProfile && profile.avatarUrl ? profile.avatarUrl : '') || AVATAR_OPTIONS[0].url);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const realName = (user?.name && user.name !== 'Priya Sharma' ? user.name : '') || pendingMeta?.name;
      const realEmail = (user?.email && user.email !== 'priya.sharma@cse.iitb.ac.in' ? user.email : '') || pendingMeta?.email;

      await completeOnboarding({
        name: realName,
        email: realEmail,
        bio: personalInfo.bio,
        hostel: personalInfo.hostel,
        college: collegeDetails.college,
        enrollmentNo: collegeDetails.enrollmentNo,
        course: courseDetails.course,
        semester: courseDetails.semester,
        interests: selectedInterests,
        avatarUrl: selectedAvatar,
        isVerified: true,
      });
      navigate('/', { replace: true });
    } catch {
      navigate('/', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Connected Student Identity Badge */}
        <div className="mb-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {((user?.name && user.name !== 'Priya Sharma' ? user.name : '') || pendingMeta?.name || user?.email || 'S')[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{(user?.name && user.name !== 'Priya Sharma' ? user.name : '') || pendingMeta?.name || 'Verified Student'}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Connected
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {(user?.email && user.email !== 'priya.sharma@cse.iitb.ac.in' ? user.email : '') || pendingMeta?.email || 'Student Email'}
              </div>
            </div>
          </div>
          {collegeDetails.college && (
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Campus</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {collegeDetails.college}
              </div>
            </div>
          )}
        </div>

        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>Student Onboarding</span>
            <span>Step {step} of {totalSteps}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Frame */}
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80 dark:border-slate-800">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <User className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Step 1</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Personal Information
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Tell your classmates and professors a little bit about yourself.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Bio / Short Headline
                  </label>
                  <textarea
                    rows={3}
                    value={personalInfo.bio}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                    className="w-full p-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. CS Junior interested in Distributed Systems..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Campus Hostel / Residence
                    </label>
                    <input
                      type="text"
                      value={personalInfo.hostel}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, hostel: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Language for Study Partners
                    </label>
                    <input
                      type="text"
                      value={personalInfo.preferredLanguage}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, preferredLanguage: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select College / University */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <Building className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Step 2</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Verify College & Campus Details
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                This enables automated syncing with your university ERP timetable and mess passes.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    University
                  </label>
                  <input
                    type="text"
                    value={collegeDetails.college}
                    onChange={(e) => setCollegeDetails({ ...collegeDetails, college: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Student Roll / Enrollment No.
                    </label>
                    <input
                      type="text"
                      value={collegeDetails.enrollmentNo}
                      onChange={(e) => setCollegeDetails({ ...collegeDetails, enrollmentNo: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department Wing
                    </label>
                    <input
                      type="text"
                      value={collegeDetails.campusWing}
                      onChange={(e) => setCollegeDetails({ ...collegeDetails, campusWing: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Course & Semester */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Step 3</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Select Course & Target Goals
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                KAMPUS configures your syllabus and calculates exam countdowns from these selections.
              </p>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Academic Degree
                    </label>
                    <input
                      type="text"
                      value={courseDetails.course}
                      onChange={(e) => setCourseDetails({ ...courseDetails, course: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Current Semester
                    </label>
                    <input
                      type="text"
                      value={courseDetails.semester}
                      onChange={(e) => setCourseDetails({ ...courseDetails, semester: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Post-Graduation Career Ambition
                  </label>
                  <input
                    type="text"
                    value={courseDetails.targetGoal}
                    onChange={(e) => setCourseDetails({ ...courseDetails, targetGoal: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Choose Academic Interests */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <Heart className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Step 4</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Choose Academic Interests
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Select topics you want to explore with study partners, hackathons, and research projects.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {interest} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Upload Profile Photo (Optional) */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <Camera className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Step 5 (Optional)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Choose Student Avatar
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                This image will appear on your digital KAMPUS ID and study room focus seats.
              </p>

              <div className="flex items-center justify-center gap-5 pt-3">
                {AVATAR_OPTIONS.map((av) => (
                  <div
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`cursor-pointer text-center group ${
                      selectedAvatar === av.url ? 'scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={av.url}
                        alt={av.label}
                        referrerPolicy="no-referrer"
                        className={`w-20 h-20 rounded-2xl object-cover ring-4 transition-all ${
                          selectedAvatar === av.url
                            ? 'ring-blue-600 shadow-md'
                            : 'ring-transparent'
                        }`}
                      />
                      {selectedAvatar === av.url && (
                        <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mt-2">
                      {av.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Complete Profile */}
          {step === 6 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                You&apos;re All Set, Scholar! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Your profile has been created and verified with {collegeDetails.college}. Your dashboard timetable, campus pass, and AI assistant are primed.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-1.5 max-w-md mx-auto">
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Name:</span> {user?.name || profile.name}</div>
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Degree:</span> {courseDetails.course} ({courseDetails.semester})</div>
                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Interests:</span> {selectedInterests.join(', ')}</div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-3 py-2 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {step < totalSteps && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-2"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {step === totalSteps
                    ? isSubmitting
                      ? 'Launching Dashboard...'
                      : 'Launch KAMPUS Dashboard'
                    : 'Next Step'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
