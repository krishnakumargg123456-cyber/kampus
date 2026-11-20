import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, User, Phone, GraduationCap, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthFormContainer } from '../../components/auth/AuthFormContainer';
import { AuthInput } from '../../components/auth/AuthInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { PasswordStrengthIndicator, evaluatePassword } from '../../components/auth/PasswordStrengthIndicator';
import { PrimaryAuthButton } from '../../components/auth/PrimaryAuthButton';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { AuthDivider } from '../../components/auth/AuthDivider';
import { AuthErrorMessage } from '../../components/auth/AuthErrorMessage';
import { AuthProgressIndicator } from '../../components/auth/AuthProgressIndicator';
import { ClerkSetupNotice } from '../../components/auth/ClerkSetupNotice';

const INDIAN_COLLEGES = [
  'Indian Institute of Technology, Bombay',
  'Indian Institute of Technology, Delhi',
  'Indian Institute of Technology, Madras',
  'Delhi Technological University (DTU)',
  'BITS Pilani',
  'National Institute of Technology, Tiruchirappalli',
  'Vellore Institute of Technology (VIT)',
  'College of Engineering, Pune (COEP)',
  'Jadavpur University, Kolkata',
  'Anna University, Chennai',
  'Banaras Hindu University (BHU)',
  'University of Delhi (DU)',
  'SRM Institute of Science and Technology',
  'Manipal Academy of Higher Education',
  'Other University / College',
];

const DEGREES = [
  'B.Tech in Computer Science & AI',
  'B.Tech in Electronics & Communication',
  'B.Tech in Mechanical Engineering',
  'B.Tech in Electrical Engineering',
  'B.Sc in Data Science & Mathematics',
  'B.Sc in Computer Science / IT',
  'Bachelor of Computer Applications (BCA)',
  'Master of Computer Applications (MCA)',
  'M.Tech in Artificial Intelligence',
  'MBA in Technology Management',
  'Bachelor of Commerce (B.Com / BBA)',
  'B.Des in Product & UI/UX Design',
  'Other Program / Degree',
];

const SEMESTERS = [
  'Semester 1 (1st Year)',
  'Semester 2 (1st Year)',
  'Semester 3 (2nd Year)',
  'Semester 4 (2nd Year)',
  'Semester 5 (3rd Year)',
  'Semester 6 (3rd Year)',
  'Semester 7 (4th Year)',
  'Semester 8 (4th Year)',
];

const STEPS = [
  { id: 1, title: 'Personal', shortTitle: '1' },
  { id: 2, title: 'Security', shortTitle: '2' },
  { id: 3, title: 'Academic', shortTitle: '3' },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, signInWithGoogle, isClerkConfigured, setPendingEmail, isAuthenticated, isLoaded } = useAuth();
  const { config } = usePlatformConfig();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Automatically redirect if already authenticated
  React.useEffect(() => {
    if (isLoaded && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoaded, isAuthenticated, navigate]);

  // Step 1: Personal
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3: Academic
  const [collegeChoice, setCollegeChoice] = useState(INDIAN_COLLEGES[0]);
  const [customCollege, setCustomCollege] = useState('');
  const [courseChoice, setCourseChoice] = useState(DEGREES[0]);
  const [customCourse, setCustomCourse] = useState('');
  const [semester, setSemester] = useState(SEMESTERS[4]); // Sem 5
  const [mobile, setMobile] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  const validateStep1 = () => {
    if (!fullName.trim()) {
      setError('Please enter your full legal or student name.');
      return false;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Please provide a valid university or personal email address.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!password) {
      setError('Please choose a secure password.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    const analysis = evaluatePassword(password);
    if (analysis.score < 2) {
      setError('Please choose a stronger password containing numbers or uppercase letters.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return false;
    }
    return true;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setError('');

    if (config?.website?.allowRegistration === false) {
      setError('New student registration is temporarily closed by platform administration.');
      return;
    }

    const effectiveCollege = collegeChoice === 'Other University / College' ? customCollege.trim() : collegeChoice;
    const effectiveCourse = courseChoice === 'Other Program / Degree' ? customCourse.trim() : courseChoice;

    if (!effectiveCollege) {
      setError('Please provide your college or university name.');
      return;
    }
    if (!effectiveCourse) {
      setError('Please provide your degree or academic program.');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the KAMPUS Campus Code of Conduct and Terms.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        name: fullName.trim(),
        email: email.trim(),
        password,
        mobile: mobile.trim(),
        college: effectiveCollege,
        course: effectiveCourse,
        semester,
        enrollmentNo: enrollmentNo.trim(),
      });

      setIsLoading(false);

      if (result.success) {
        if (result.requiresVerification === false) {
          navigate('/onboarding', { replace: true });
        } else {
          setPendingEmail(email.trim());
          navigate('/verify-email');
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Unable to complete registration. Please retry.');
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    if (config?.website?.allowRegistration === false) {
      setError('New student registration is temporarily closed by platform administration.');
      return;
    }

    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    setIsGoogleLoading(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <AuthLayout
      brandQuote="Join a verified network of students sharing notes, forming study squads, and advancing careers."
      brandAuthor="KAMPUS Community"
      highlightTag="Student Registration"
    >
      <AuthFormContainer
        heading="Create your KAMPUS account"
        subheading="Join your campus community and unlock your university experience."
        maxWidth="lg"
        footer={
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        }
      >
        <ClerkSetupNotice isConfigured={isClerkConfigured} />

        {/* Multi-Step Indicator */}
        <AuthProgressIndicator
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(id) => setCurrentStep(id)}
        />

        <AuthErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Step 1 allows Google OAuth quick signup */}
        {currentStep === 1 && (
          <>
            <GoogleSignInButton
              isLoading={isGoogleLoading}
              onClick={handleGoogleSignUp}
              text="Sign up with Google"
            />
            <AuthDivider text="or register with email" />
          </>
        )}

        <form onSubmit={handleNextStep} className="space-y-4" noValidate>
          {/* STEP 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <AuthInput
                label="Full name"
                placeholder="e.g. Priya Sharma"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError('');
                }}
                icon={<User className="w-4 h-4" />}
                autoComplete="name"
                required
                autoFocus
              />

              <AuthInput
                label="Email address"
                type="email"
                placeholder="name@college.edu.in or personal email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                icon={<Mail className="w-4 h-4" />}
                autoComplete="email"
                hint="Verification code will be sent here"
                required
              />

              <div className="pt-2">
                <PrimaryAuthButton
                  type="submit"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Security
                </PrimaryAuthButton>
              </div>
            </div>
          )}

          {/* STEP 2: Account Security */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <PasswordInput
                label="Choose a password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="new-password"
                required
                autoFocus
              />

              <PasswordStrengthIndicator password={password} />

              <PasswordInput
                label="Confirm password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="new-password"
                required
              />

              <div className="flex items-center gap-3 pt-2">
                <PrimaryAuthButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError('');
                    setCurrentStep(1);
                  }}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </PrimaryAuthButton>
                <PrimaryAuthButton
                  type="submit"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Academic Info
                </PrimaryAuthButton>
              </div>
            </div>
          )}

          {/* STEP 3: Academic Profile */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* College Dropdown */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  College / University <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    value={collegeChoice}
                    onChange={(e) => setCollegeChoice(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15 outline-hidden"
                  >
                    {INDIAN_COLLEGES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {collegeChoice === 'Other University / College' && (
                <AuthInput
                  label="Enter your University / College Name"
                  placeholder="e.g. St. Xavier's Autonomous College"
                  value={customCollege}
                  onChange={(e) => setCustomCollege(e.target.value)}
                  required
                />
              )}

              {/* Course & Semester in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Degree / Program <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <select
                      value={courseChoice}
                      onChange={(e) => setCourseChoice(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15 outline-hidden"
                    >
                      {DEGREES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Current Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15 outline-hidden"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {courseChoice === 'Other Program / Degree' && (
                <AuthInput
                  label="Enter your Program / Degree"
                  placeholder="e.g. B.A. in Psychology & Media"
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  required
                />
              )}

              {/* Mobile & Enrollment in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AuthInput
                  label="Mobile number (optional)"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  icon={<Phone className="w-4 h-4" />}
                />

                <AuthInput
                  label="Student Enrollment / Roll No (optional)"
                  placeholder="e.g. 22B030149"
                  value={enrollmentNo}
                  onChange={(e) => setEnrollmentNo(e.target.value)}
                />
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-left">
                  I agree to the KAMPUS Campus Code of Conduct, Academic Integrity Guidelines, and Privacy Policy.
                </span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <PrimaryAuthButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError('');
                    setCurrentStep(2);
                  }}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </PrimaryAuthButton>
                <PrimaryAuthButton
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                >
                  Create Student Account
                </PrimaryAuthButton>
              </div>
            </div>
          )}
        </form>
      </AuthFormContainer>
    </AuthLayout>
  );
};
