import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  AdmissionTrackerEntry,
  AdmissionUpdateItem,
  CollegeRecord,
  CollegeReview,
  CollegeType,
  ComparisonHistoryItem,
  ExplorerRole,
  ExplorerScholarship,
  ReviewReportItem,
  SavedCollegeEntry,
  ShortlistCollection,
  StandaloneCourse,
} from '../src/types/collegeExplorer.ts';

// Clean pluggable Data Provider interface
export interface CollegeDataProvider {
  providerId: string;
  providerName: string;
  isVerifiedOfficialFeed: boolean;
  getColleges(): CollegeRecord[];
  getCourses(): StandaloneCourse[];
  getScholarships(): ExplorerScholarship[];
  getAdmissionUpdates(): AdmissionUpdateItem[];
}

interface StoredAdmissionDoc {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64Data: string;
  ownerId: string;
  createdAt: string;
}

interface CollegeExplorerDatabase {
  colleges: CollegeRecord[];
  courses: StandaloneCourse[];
  scholarships: ExplorerScholarship[];
  admissionUpdates: AdmissionUpdateItem[];
  reviews: CollegeReview[];
  reports: ReviewReportItem[];
  recentlyViewedByUser: Record<string, string[]>;
  collectionsByUser: Record<string, ShortlistCollection[]>;
  savedCollegesByUser: Record<string, SavedCollegeEntry[]>;
  admissionTracker: AdmissionTrackerEntry[];
  comparisonHistoryByUser: Record<string, ComparisonHistoryItem[]>;
  sharedComparisons: Record<string, ComparisonHistoryItem>;
  uploadedDocs: Record<string, StoredAdmissionDoc>;
  roleOverrides: Record<string, { role: ExplorerRole; label: string }>;
}

const DB_FILE = path.join(process.cwd(), '.kampus_college_explorer_db.json');
const KAMPUS_ID_DB_FILE = path.join(process.cwd(), '.kampus_kampus_id_db.json');
const CAREER_DB_FILE = path.join(process.cwd(), '.kampus_career_db.json');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const EXPLORER_PASSKEYS: Record<string, { role: ExplorerRole; label: string }> = {
  'KMP-EXPLORER-ADMIN-2026': {
    role: 'Platform Admin',
    label: 'College Explorer Platform Administrator',
  },
  'KMP-EXPLORER-EDITOR-2026': {
    role: 'Education Data Editor',
    label: 'Institutional & Academic Data Curator',
  },
  'KMP-EXPLORER-MOD-2026': {
    role: 'Moderator',
    label: 'Student Experience & Review Moderator',
  },
};

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function validateDocMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) return false;
  if (ext === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (ext === '.png')
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  if (ext === '.jpg' || ext === '.jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (ext === '.webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  return false;
}

class SampleDevelopmentProvider implements CollegeDataProvider {
  providerId = 'sample_dev_provider_v1';
  providerName = 'KAMPUS Sample Development Dataset';
  isVerifiedOfficialFeed = false;

  getCourses(): StandaloneCourse[] {
    return [
      {
        id: 'crs_btech_cse',
        name: 'B.Tech in Computer Science & Engineering',
        degreeType: 'Undergraduate',
        degreeShort: 'B.Tech',
        stream: 'Engineering & Technology',
        duration: '4 Years (8 Semesters)',
        eligibility: '10+2 with Physics, Chemistry, Mathematics; qualifying entrance score',
        requiredSubjects: ['Physics', 'Chemistry', 'Mathematics'],
        entranceExams: ['JEE Main', 'JEE Advanced', 'MHT-CET', 'Institute Entrance'],
        careerOpportunities: ['Software Development', 'Data Engineering', 'Systems Architecture', 'AI Research'],
        typicalFeeRangeLabel: 'Varies widely by Govt vs Private (verify per institution)',
        description: 'Core computing systems, algorithms, databases, operating systems, networks, and software engineering foundations.',
      },
      {
        id: 'crs_mbbs',
        name: 'Bachelor of Medicine and Bachelor of Surgery (MBBS)',
        degreeType: 'Undergraduate',
        degreeShort: 'MBBS',
        stream: 'Medicine & Health Sciences',
        duration: '5.5 Years (4.5 Academic + 1 Year Rotating Internship)',
        eligibility: '10+2 with Physics, Chemistry, Biology/Biotechnology; NEET-UG qualification',
        requiredSubjects: ['Physics', 'Chemistry', 'Biology'],
        entranceExams: ['NEET-UG'],
        careerOpportunities: ['Clinical Medicine', 'Residency Specialization (MD/MS)', 'Public Health', 'Medical Research'],
        typicalFeeRangeLabel: 'Subsidized in Govt Medical Colleges; higher in Private/Deemed institutions',
        description: 'Foundational pre-clinical, para-clinical, and clinical medical training with supervised hospital rotations.',
      },
      {
        id: 'crs_bpharm',
        name: 'Bachelor of Pharmacy (B.Pharm)',
        degreeType: 'Undergraduate',
        degreeShort: 'B.Pharm',
        stream: 'Pharmacy & Pharmaceutical Sciences',
        duration: '4 Years (8 Semesters)',
        eligibility: '10+2 with Physics, Chemistry and Biology or Mathematics',
        requiredSubjects: ['Physics', 'Chemistry', 'Biology or Mathematics'],
        entranceExams: ['MHT-CET', 'CUET-UG', 'State Pharmacy Entrance'],
        careerOpportunities: ['Formulation R&D', 'Regulatory Affairs', 'Clinical Trials', 'Pharmacovigilance'],
        typicalFeeRangeLabel: 'Verify state fee regulatory committee schedule per college',
        description: 'Study of pharmaceutics, pharmacology, medicinal chemistry, pharmacognosy, and quality assurance.',
      },
      {
        id: 'crs_mba',
        name: 'Master of Business Administration (MBA / PGDM)',
        degreeType: 'Postgraduate',
        degreeShort: 'MBA',
        stream: 'Management & Commerce',
        duration: '2 Years',
        eligibility: 'Recognized Bachelor degree (typically minimum 50% or equivalent); valid management score',
        requiredSubjects: ['Undergraduate degree in any discipline'],
        entranceExams: ['CAT', 'XAT', 'GMAT', 'CMAT'],
        careerOpportunities: ['Product Management', 'Strategy & Consulting', 'Corporate Finance', 'Operations'],
        typicalFeeRangeLabel: 'Program fees depend on University vs Autonomous Business School',
        description: 'Graduate management curriculum covering finance, marketing, organizational behavior, economics, and strategy.',
      },
      {
        id: 'crs_ballb',
        name: 'Integrated B.A. LL.B. (Hons.)',
        degreeType: 'Professional',
        degreeShort: 'B.A. LL.B.',
        stream: 'Law & Legal Studies',
        duration: '5 Years',
        eligibility: '10+2 in any stream; qualifying national or university law test',
        requiredSubjects: ['Any recognized 10+2 stream'],
        entranceExams: ['CLAT', 'AILET', 'SLAT', 'State Law CET'],
        careerOpportunities: ['Litigation', 'Corporate Legal Counsel', 'Judicial Services Prep', 'Public Policy'],
        typicalFeeRangeLabel: 'Check National Law University or Bar Council approved institution fee chart',
        description: 'Integrated humanities and statutory law training covering constitutional, contract, criminal, and corporate law.',
      },
      {
        id: 'crs_bsc_nursing',
        name: 'B.Sc. in Nursing',
        degreeType: 'Undergraduate',
        degreeShort: 'B.Sc Nursing',
        stream: 'Nursing & Allied Health',
        duration: '4 Years (including clinical internship)',
        eligibility: '10+2 with Physics, Chemistry, Biology and English (minimum aggregate per INC norms)',
        requiredSubjects: ['Physics', 'Chemistry', 'Biology', 'English'],
        entranceExams: ['NEET-UG (selected states)', 'State Nursing Entrance', 'AIIMS Nursing'],
        careerOpportunities: ['Registered Clinical Nurse', 'ICU & Critical Care', 'Community Health Officer', 'Nursing Education'],
        typicalFeeRangeLabel: 'Check state nursing council & college prospectus',
        description: 'Clinical nursing practice, anatomy, physiology, pharmacology, community health, and hospital ward training.',
      },
      {
        id: 'crs_ba_econ',
        name: 'B.A. (Hons.) Economics & Social Sciences',
        degreeType: 'Undergraduate',
        degreeShort: 'B.A. (Hons)',
        stream: 'Arts, Humanities & Social Sciences',
        duration: '3 or 4 Years (per NEP structure)',
        eligibility: '10+2 qualification; university merit or CUET-UG score',
        requiredSubjects: ['Class 12 Mathematics recommended for Honors tracks'],
        entranceExams: ['CUET-UG', 'Institution Admission Test'],
        careerOpportunities: ['Economic Policy Research', 'Financial Analysis', 'Civil Services Prep', 'Graduate Economics'],
        typicalFeeRangeLabel: 'Highly accessible in public central/state universities',
        description: 'Microeconomics, macroeconomics, econometrics, development policy, and quantitative social research.',
      },
      {
        id: 'crs_dip_mech',
        name: 'Diploma in Mechanical & Mechatronics Engineering',
        degreeType: 'Diploma',
        degreeShort: 'Diploma',
        stream: 'Polytechnic & Applied Engineering',
        duration: '3 Years',
        eligibility: 'Class 10 pass (SSC) with Mathematics and Science',
        requiredSubjects: ['Mathematics', 'Science (Class 10)'],
        entranceExams: ['State Polytechnic Entrance / SSC Merit'],
        careerOpportunities: ['Manufacturing Technician', 'CAD Design Engineer', 'Lateral Entry to B.Tech'],
        typicalFeeRangeLabel: 'Subsidized in Government Polytechnics',
        description: 'Hands-on workshop practice, thermodynamics, CAD/CAM, machine design, and industrial automation fundamentals.',
      },
      {
        id: 'crs_cert_data',
        name: 'Certificate Program in Applied Data Analytics & Ethics',
        degreeType: 'Certificate',
        degreeShort: 'Certificate',
        stream: 'Interdisciplinary Computing',
        duration: '6 Months',
        eligibility: 'Enrolled undergraduate or graduate from any quantitative discipline',
        requiredSubjects: ['Basic quantitative reasoning'],
        entranceExams: ['Direct / Institutional Screening'],
        careerOpportunities: ['Data Analyst Trainee', 'Operations Research Support', 'Academic Data Assistant'],
        typicalFeeRangeLabel: 'Check continuing education department page',
        description: 'Practical statistical modeling, SQL querying, visualization ethics, and reproducible empirical reporting.',
      },
    ];
  }

  getColleges(): CollegeRecord[] {
    return [
      {
        id: 'col_western_tech',
        name: 'Western Institute of Engineering & Computing (Sample)',
        shortName: 'WIEC Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Academic Ring Road, Powai Area, Mumbai, Maharashtra 400076',
        nearbyTransport: '2.5 km from Kanjurmarg Suburban Rail · Metro Line 6 corridor',
        mapCoordinates: { lat: 19.1334, lng: 72.9133 },
        collegeTypes: ['Engineering College', 'Autonomous College', 'University'],
        primaryCategory: 'Engineering College',
        establishmentYear: 1958,
        officialWebsite: 'https://www.aicte-india.org',
        affiliatedUniversity: 'Autonomous Public Technical Institute (Sample)',
        accreditation: 'NBA Accredited Programs · NAAC A+ Framework (Sample Ref)',
        contactEmail: 'admissions-sample@kampus.edu.in',
        contactPhone: '+91-22-0000-1100 (Sample)',
        overview:
          'Public autonomous engineering institution emphasizing undergraduate engineering research, open-source labs, and interdisciplinary sciences. Listed for development testing — confirm current year schedules directly via official institute portals.',
        photoKey: 'tech_campus',
        galleryPhotoKeys: ['tech_campus', 'hackathon_center', 'stem_lab'],
        featured: true,
        admissionStatus: 'Upcoming',
        admissionProcess: [
          'Register for national entrance exam (JEE Main / JEE Advanced / State CET as applicable).',
          'Participate in centralized counseling seat allocation round.',
          'Complete physical document verification on reporting window.',
        ],
        applicationProcedure: 'Centralized counseling registration followed by institute portal fee confirmation.',
        importantDates: [
          { label: 'Counseling Registration Window (Sample)', dateISO: addDaysISO(28) },
          { label: 'Document Verification Checklist Review', dateISO: addDaysISO(45) },
        ],
        nextDeadlineISO: addDaysISO(28),
        requiredDocuments: ['Class 10 & 12 Marksheets', 'Entrance Scorecard', 'Category Certificate (if applicable)', 'Photo ID'],
        entranceExams: ['JEE Main', 'JEE Advanced', 'MHT-CET'],
        officialApplicationUrl: 'https://josaa.nic.in',
        courses: [
          {
            courseId: 'crs_btech_cse',
            name: 'B.Tech in Computer Science & Engineering',
            degreeType: 'Undergraduate',
            degreeShort: 'B.Tech',
            stream: 'Engineering & Technology',
            department: 'Computer Science & Engineering',
            duration: '4 Years',
            eligibility: '10+2 PCM with qualifying rank in national entrance exam',
            entranceExams: ['JEE Advanced', 'JEE Main'],
            annualTuitionFeeINR: 200000,
            intakeSeats: 180,
          },
          {
            courseId: 'crs_cert_data',
            name: 'Certificate Program in Applied Data Analytics & Ethics',
            degreeType: 'Certificate',
            degreeShort: 'Certificate',
            stream: 'Interdisciplinary Computing',
            department: 'Center for Data Systems',
            duration: '6 Months',
            eligibility: 'Enrolled UG/PG learners with basic Python & math',
            entranceExams: ['Direct / Institutional Screening'],
            annualTuitionFeeINR: 24000,
            intakeSeats: null,
          },
        ],
        feeInfo: {
          tuitionRangeLabel: '₹24,000 – ₹2,00,000 / year (Sample)',
          minAnnualTuitionINR: 24000,
          maxAnnualTuitionINR: 200000,
          admissionFeeLabel: 'One-time caution & registration deposit per published schedule',
          hostelFeeLabel: 'Approx. ₹38,000 – ₹54,000 / year excluding mess (Sample)',
          otherChargesLabel: 'Student gymkhana & medical insurance fee as per prospectus',
          scholarshipsSummary: 'Tuition waivers based on family income slabs and merit-cum-means policies.',
          sourceName: 'Sample Development Record (Check official prospectus)',
          lastUpdatedISO: addDaysISO(-5),
        },
        facilities: {
          library: true,
          laboratories: true,
          hostel: true,
          sports: true,
          cafeteria: true,
          wifi: true,
          transportation: true,
          medical: true,
          accessibility: true,
          highlights: ['24-hour exam reading rooms', 'Campus hospital unit', 'Electric shuttle loops'],
        },
        placementInfo: {
          hasPlacementSupport: true,
          supportDescription: 'Dedicated student placement & internship office hosting transparent campus drives.',
          recruiterExamples: ['Public Research Labs', 'Software Product Organizations', 'Core Engineering Firms'],
          placementReportSummary: 'Sample placement entry — verify latest audited annual placement report on official cell page.',
          internshipOpportunities: 'Third-year summer research & industry internship cycles coordinated through campus cell.',
          averagePackageLabel: null,
          highestPackageLabel: null,
          reportingYear: 'Not published in sample dataset',
          sourceCitation: 'Verify audited placement report directly on institution website',
        },
        scholarshipAvailable: true,
        dataVerificationStatus: 'Sample Development Record',
        dataSourceLabel: 'KAMPUS Sample Development Dataset',
        providerId: 'sample_dev_provider_v1',
        lastUpdatedISO: addDaysISO(-5),
      },
      {
        id: 'col_delhi_medical',
        name: 'Capital Institute of Medical Sciences & Teaching Hospital (Sample)',
        shortName: 'CIMST New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        address: 'Ansari Nagar Medical Enclave, New Delhi 110029',
        nearbyTransport: 'AIIMS Metro Station (Yellow Line) · Ring Road Bus Terminal',
        mapCoordinates: { lat: 28.5672, lng: 77.21 },
        collegeTypes: ['Medical College', 'Government College', 'Nursing College'],
        primaryCategory: 'Medical College',
        establishmentYear: 1956,
        officialWebsite: 'https://www.nmc.org.in',
        affiliatedUniversity: 'Statutory Autonomous Medical Institute (Sample)',
        accreditation: 'National Medical Commission Recognized Framework (Sample Ref)',
        contactEmail: 'registrar-sample@kampus.edu.in',
        contactPhone: '+91-11-0000-2200 (Sample)',
        overview:
          'Government teaching hospital, undergraduate medical college, and B.Sc. Nursing school focused on public healthcare training and biomedical research.',
        photoKey: 'medical_campus',
        galleryPhotoKeys: ['medical_campus', 'stem_lab', 'library_desk'],
        featured: true,
        admissionStatus: 'Open',
        admissionProcess: [
          'Qualify NEET-UG medical entrance examination.',
          'Apply via centralized Medical Counselling Committee (MCC) / Institute portal.',
          'Complete medical fitness check & original certificate verification.',
        ],
        applicationProcedure: 'Centralized counseling registration matching NEET-UG roll number.',
        importantDates: [
          { label: 'Round 1 Counseling Window (Sample)', dateISO: addDaysISO(14) },
          { label: 'B.Sc Nursing Entrance Window (Sample)', dateISO: addDaysISO(32) },
        ],
        nextDeadlineISO: addDaysISO(14),
        requiredDocuments: ['NEET-UG Admit Card & Scorecard', '10+2 PCB Certificate', 'Migration Certificate', 'Medical Fitness Form'],
        entranceExams: ['NEET-UG', 'AIIMS Nursing'],
        officialApplicationUrl: 'https://mcc.nic.in',
        courses: [
          {
            courseId: 'crs_mbbs',
            name: 'Bachelor of Medicine and Bachelor of Surgery (MBBS)',
            degreeType: 'Undergraduate',
            degreeShort: 'MBBS',
            stream: 'Medicine & Health Sciences',
            department: 'Faculty of Medicine',
            duration: '5.5 Years',
            eligibility: '10+2 PCB with minimum qualifying percentage; valid NEET-UG score',
            entranceExams: ['NEET-UG'],
            annualTuitionFeeINR: 6800,
            intakeSeats: 125,
          },
          {
            courseId: 'crs_bsc_nursing',
            name: 'B.Sc. in Nursing',
            degreeType: 'Undergraduate',
            degreeShort: 'B.Sc Nursing',
            stream: 'Nursing & Allied Health',
            department: 'College of Nursing',
            duration: '4 Years',
            eligibility: '10+2 with PCB & English per INC guidelines',
            entranceExams: ['AIIMS Nursing'],
            annualTuitionFeeINR: 4500,
            intakeSeats: 96,
          },
        ],
        feeInfo: {
          tuitionRangeLabel: '₹4,500 – ₹6,800 / year (Sample Govt Fee)',
          minAnnualTuitionINR: 4500,
          maxAnnualTuitionINR: 6800,
          admissionFeeLabel: 'Nominal govt enrollment deposit',
          hostelFeeLabel: 'Subsidized hostel accommodation per semester norms',
          otherChargesLabel: 'Mess charges billed at actuals',
          scholarshipsSummary: 'Central Sector & state health scholarships applicable.',
          sourceName: 'Sample Development Record (Check MCC / official prospectus)',
          lastUpdatedISO: addDaysISO(-2),
        },
        facilities: {
          library: true,
          laboratories: true,
          hostel: true,
          sports: true,
          cafeteria: true,
          wifi: true,
          transportation: false,
          medical: true,
          accessibility: true,
          highlights: ['1,800-bed teaching hospital rotation', '24x7 Central Medical Library'],
        },
        placementInfo: {
          hasPlacementSupport: true,
          supportDescription: 'Compulsory paid clinical rotating internship and residency pathway advising.',
          recruiterExamples: ['Public Teaching Hospitals', 'National Health Mission Units'],
          placementReportSummary: 'Graduates progress to paid clinical internships and PG NEET residency tracks.',
          internshipOpportunities: 'Mandatory 1-year supervised clinical internship.',
          averagePackageLabel: null,
          highestPackageLabel: null,
          reportingYear: null,
          sourceCitation: 'Medical careers follow statutory internship/residency pathways rather than corporate CTC',
        },
        scholarshipAvailable: true,
        dataVerificationStatus: 'Sample Development Record',
        dataSourceLabel: 'KAMPUS Sample Development Dataset',
        providerId: 'sample_dev_provider_v1',
        lastUpdatedISO: addDaysISO(-2),
      },
      {
        id: 'col_ahmedabad_mgmt',
        name: 'Sabarmati School of Management & Public Policy (Sample)',
        shortName: 'SSMP Ahmedabad',
        city: 'Ahmedabad',
        state: 'Gujarat',
        address: 'Vastrapur Academic Sector, Ahmedabad, Gujarat 380015',
        nearbyTransport: 'BRTS Vastrapur Stop · 6 km from Sabarmati Railway Station',
        mapCoordinates: { lat: 23.0338, lng: 72.5326 },
        collegeTypes: ['Management College', 'Autonomous College'],
        primaryCategory: 'Management College',
        establishmentYear: 1961,
        officialWebsite: 'https://www.education.gov.in',
        affiliatedUniversity: 'Autonomous Institute of Management (Sample)',
        accreditation: 'National Management Accreditation Ref (Sample)',
        contactEmail: 'pgp-sample@kampus.edu.in',
        contactPhone: '+91-79-0000-3300 (Sample)',
        overview:
          'Case-study driven graduate school specializing in MBA/PGDM, public systems management, economics, and executive analytics.',
        photoKey: 'management_campus',
        galleryPhotoKeys: ['management_campus', 'seminar_hall', 'library_desk'],
        featured: true,
        admissionStatus: 'Closing Soon',
        admissionProcess: [
          'Appear in CAT / GMAT examination.',
          'Submit institute shortlisting essay and academic dossier.',
          'Attend Analytical Writing & Personal Interview (AW-PI) rounds.',
        ],
        applicationProcedure: 'Online application linked to valid CAT registration ID.',
        importantDates: [
          { label: 'PGP Application Deadline (Sample)', dateISO: addDaysISO(9) },
          { label: 'Shortlist Interviews Window (Sample)', dateISO: addDaysISO(40) },
        ],
        nextDeadlineISO: addDaysISO(9),
        requiredDocuments: ['CAT Scorecard', 'Graduation Marksheets (All Semesters)', 'Work Experience Letters (if applicable)'],
        entranceExams: ['CAT', 'GMAT'],
        officialApplicationUrl: 'https://iimcat.ac.in',
        courses: [
          {
            courseId: 'crs_mba',
            name: 'Master of Business Administration (MBA / PGDM)',
            degreeType: 'Postgraduate',
            degreeShort: 'MBA',
            stream: 'Management & Commerce',
            department: 'Post Graduate Programme in Management',
            duration: '2 Years',
            eligibility: 'Recognized Bachelor degree + valid CAT/GMAT percentile',
            entranceExams: ['CAT', 'GMAT'],
            annualTuitionFeeINR: 1150000,
            intakeSeats: 380,
          },
        ],
        feeInfo: {
          tuitionRangeLabel: '₹11,50,000 / year (Sample)',
          minAnnualTuitionINR: 1150000,
          maxAnnualTuitionINR: 1150000,
          admissionFeeLabel: 'Included in semester fee confirmation',
          hostelFeeLabel: 'Residential campus housing included / itemized per term',
          otherChargesLabel: 'International exchange travel optional',
          scholarshipsSummary: 'Need-based financial aid & alumni scholarship grants available for eligible admits.',
          sourceName: 'Sample Development Record (Check official PGDM prospectus)',
          lastUpdatedISO: addDaysISO(-4),
        },
        facilities: {
          library: true,
          laboratories: false,
          hostel: true,
          sports: true,
          cafeteria: true,
          wifi: true,
          transportation: true,
          medical: true,
          accessibility: true,
          highlights: ['Case study seminar amphitheaters', 'Financial data terminal lab', 'On-campus student dorms'],
        },
        placementInfo: {
          hasPlacementSupport: true,
          supportDescription: 'Student-coordinated placement committee and summer internship cluster process.',
          recruiterExamples: ['Management Consulting Firms', 'Financial Institutions', 'Technology Product Teams'],
          placementReportSummary: 'Audited IPRS-style reports are published separately each year; sample data omits unverified CTC figures.',
          internshipOpportunities: 'Mandatory 8–10 week summer corporate internship between Year 1 and Year 2.',
          averagePackageLabel: null,
          highestPackageLabel: null,
          reportingYear: 'Refer official audited annual report',
          sourceCitation: 'Sample Development Record — consult official audited IPRS placement PDF',
        },
        scholarshipAvailable: true,
        dataVerificationStatus: 'Sample Development Record',
        dataSourceLabel: 'KAMPUS Sample Development Dataset',
        providerId: 'sample_dev_provider_v1',
        lastUpdatedISO: addDaysISO(-4),
      },
      {
        id: 'col_heritage_arts_law',
        name: 'Presidency College of Arts, Sciences & Law (Sample)',
        shortName: 'PCASL Kolkata',
        city: 'Kolkata',
        state: 'West Bengal',
        address: '86 College Street, Heritage Academic Square, Kolkata 700073',
        nearbyTransport: 'MG Road Metro Station · Tram Corridor College Street',
        mapCoordinates: { lat: 22.5769, lng: 88.3629 },
        collegeTypes: ['Arts and Science College', 'Law College', 'Government College', 'University'],
        primaryCategory: 'Arts and Science College',
        establishmentYear: 1817,
        officialWebsite: 'https://www.ugc.gov.in',
        affiliatedUniversity: 'State Public Unitary University (Sample)',
        accreditation: 'NAAC Accredited State University Framework (Sample Ref)',
        contactEmail: 'ug-admissions-sample@kampus.edu.in',
        contactPhone: '+91-33-0000-4400 (Sample)',
        overview:
          'Historic public university college housing undergraduate honors in economics, humanities, natural sciences, and a five-year B.A. LL.B. legal studies school.',
        photoKey: 'arts_heritage',
        galleryPhotoKeys: ['arts_heritage', 'law_library', 'hero_quad'],
        featured: true,
        admissionStatus: 'Open',
        admissionProcess: [
          'Register on centralized state/university admission portal.',
          'Select subject combination or law entrance track.',
          'Appear for entrance test where applicable and complete fee challan.',
        ],
        applicationProcedure: 'Direct university admission portal + merit counseling.',
        importantDates: [
          { label: 'UG Merit Application Close (Sample)', dateISO: addDaysISO(19) },
        ],
        nextDeadlineISO: addDaysISO(19),
        requiredDocuments: ['Class 12 Final Statement of Marks', 'Character Certificate', 'Domicile Certificate (if state quota)'],
        entranceExams: ['CUET-UG', 'CLAT', 'University Entrance Test'],
        officialApplicationUrl: 'https://cuet.nta.nic.in',
        courses: [
          {
            courseId: 'crs_ba_econ',
            name: 'B.A. (Hons.) Economics & Social Sciences',
            degreeType: 'Undergraduate',
            degreeShort: 'B.A. (Hons)',
            stream: 'Arts, Humanities & Social Sciences',
            department: 'Department of Economics',
            duration: '4 Years',
            eligibility: '10+2 with minimum required aggregate and Mathematics score',
            entranceExams: ['CUET-UG', 'University Entrance Test'],
            annualTuitionFeeINR: 4200,
            intakeSeats: 75,
          },
          {
            courseId: 'crs_ballb',
            name: 'Integrated B.A. LL.B. (Hons.)',
            degreeType: 'Professional',
            degreeShort: 'B.A. LL.B.',
            stream: 'Law & Legal Studies',
            department: 'School of Law & Policy',
            duration: '5 Years',
            eligibility: '10+2 in any recognized board + valid law entrance test',
            entranceExams: ['CLAT', 'University Entrance Test'],
            annualTuitionFeeINR: 18500,
            intakeSeats: 120,
          },
        ],
        feeInfo: {
          tuitionRangeLabel: '₹4,200 – ₹18,500 / year (Sample)',
          minAnnualTuitionINR: 4200,
          maxAnnualTuitionINR: 18500,
          admissionFeeLabel: 'Nominal public university registration charge',
          hostelFeeLabel: 'Govt Eden Hostel allotment based on distance & merit',
          otherChargesLabel: 'Annual library & laboratory caution fee',
          scholarshipsSummary: 'State Swami Vivekananda Merit-cum-Means & university fee concessions.',
          sourceName: 'Sample Development Record',
          lastUpdatedISO: addDaysISO(-7),
        },
        facilities: {
          library: true,
          laboratories: true,
          hostel: true,
          sports: true,
          cafeteria: true,
          wifi: true,
          transportation: false,
          medical: true,
          accessibility: true,
          highlights: ['Archival Central Library', 'Moot Court Hall', 'Economics Seminar Wing'],
        },
        placementInfo: {
          hasPlacementSupport: true,
          supportDescription: 'Career counseling, legal chamber clerkship cell, and higher-studies guidance desk.',
          recruiterExamples: ['Advocacy Chambers', 'Policy Think Tanks', 'Academic Fellowships'],
          placementReportSummary: 'Many graduates proceed to graduate research or judicial/civil service preparation.',
          internshipOpportunities: 'Winter court & think-tank internships.',
          averagePackageLabel: null,
          highestPackageLabel: null,
          reportingYear: null,
          sourceCitation: 'Salary data not published in sample record',
        },
        scholarshipAvailable: true,
        dataVerificationStatus: 'Sample Development Record',
        dataSourceLabel: 'KAMPUS Sample Development Dataset',
        providerId: 'sample_dev_provider_v1',
        lastUpdatedISO: addDaysISO(-7),
      },
      {
        id: 'col_ict_pharmacy',
        name: 'Deccan College of Pharmaceutical Sciences & Biotech (Sample)',
        shortName: 'DCPSB Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Knowledge Corridor, Tarnaka Campus, Hyderabad 500007',
        nearbyTransport: 'Tarnaka Metro Station · 4 km from Secunderabad Jn',
        mapCoordinates: { lat: 17.4239, lng: 78.532 },
        collegeTypes: ['Pharmacy College', 'Deemed University', 'Private College'],
        primaryCategory: 'Pharmacy College',
        establishmentYear: 1994,
        officialWebsite: 'https://www.pci.nic.in',
        affiliatedUniversity: 'Deemed University of Health & Life Sciences (Sample)',
        accreditation: 'PCI & NBA Framework (Sample Ref)',
        contactEmail: 'pharmacy-admissions-sample@kampus.edu.in',
        contactPhone: '+91-40-0000-5500 (Sample)',
        overview:
          'Specialized pharmacy and biotechnology institution featuring medicinal chemistry labs, formulation testing units, and regulatory science coursework.',
        photoKey: 'pharmacy_research',
        galleryPhotoKeys: ['pharmacy_research', 'stem_lab', 'campus_life'],
        featured: false,
        admissionStatus: 'Open',
        admissionProcess: [
          'Complete online deemed university entrance registration.',
          'Submit 10+2 PCB/PCM scores or state EAPCET rank.',
          'Participate in seat confirmation counseling.',
        ],
        applicationProcedure: 'Online application on institution admission page.',
        importantDates: [
          { label: 'B.Pharm Counseling Round (Sample)', dateISO: addDaysISO(22) },
        ],
        nextDeadlineISO: addDaysISO(22),
        requiredDocuments: ['10+2 Marksheet', 'Entrance Rank Card', 'Transfer Certificate'],
        entranceExams: ['MHT-CET', 'CUET-UG', 'State Pharmacy Entrance'],
        officialApplicationUrl: 'https://www.pci.nic.in',
        courses: [
          {
            courseId: 'crs_bpharm',
            name: 'Bachelor of Pharmacy (B.Pharm)',
            degreeType: 'Undergraduate',
            degreeShort: 'B.Pharm',
            stream: 'Pharmacy & Pharmaceutical Sciences',
            department: 'Faculty of Pharmaceutical Sciences',
            duration: '4 Years',
            eligibility: '10+2 with Physics, Chemistry & Biology or Maths (min 50%)',
            entranceExams: ['CUET-UG', 'State Pharmacy Entrance'],
            annualTuitionFeeINR: 135000,
            intakeSeats: 100,
          },
        ],
        feeInfo: {
          tuitionRangeLabel: '₹1,35,000 / year (Sample)',
          minAnnualTuitionINR: 135000,
          maxAnnualTuitionINR: 135000,
          admissionFeeLabel: '₹5,000 one-time registration (Sample)',
          hostelFeeLabel: '₹82,000 / year shared residential accommodation + mess (Sample)',
          otherChargesLabel: 'Lab coat & safety kit charges per syllabus',
          scholarshipsSummary: 'Merit fee remission for top GPAT/entrance rankers.',
          sourceName: 'Sample Development Record',
          lastUpdatedISO: addDaysISO(-6),
        },
        facilities: {
          library: true,
          laboratories: true,
          hostel: true,
          sports: false,
          cafeteria: true,
          wifi: true,
          transportation: true,
          medical: true,
          accessibility: true,
          highlights: ['HPLC & Spectrometry Labs', 'Medicinal Botanical Garden', 'Campus Bus Routes'],
        },
        placementInfo: {
          hasPlacementSupport: true,
          supportDescription: 'Industry liaison desk connecting students to pharmaceutical QA/QC and clinical trials.',
          recruiterExamples: ['Formulation Labs', 'Clinical Research Organizations'],
          placementReportSummary: 'Recent annual median package published separately by placement office.',
          internshipOpportunities: 'Mandatory 6-week industrial hospital/pharma training in Semester 7.',
          averagePackageLabel: null,
          highestPackageLabel: null,
          reportingYear: null,
          sourceCitation: 'Consult institution NIRF/NBA filing for audited salary medians',
        },
        scholarshipAvailable: true,
        dataVerificationStatus: 'Sample Development Record',
        dataSourceLabel: 'KAMPUS Sample Development Dataset',
        providerId: 'sample_dev_provider_v1',
        lastUpdatedISO: addDaysISO(-6),
      },
      {
        id: 'col_pune_polytechnic',
        name: 'Sahyadri Government Polytechnic & Technical Training Center (Sample)',
        shortName: 'SGP Pune',
        city: 'Pune',
        state: 'Maharashtra',
        address: 'Ganeshkhind Technical Campus, Pune, Maharashtra 411016',
        nearbyTransport: 'Shivajinagar Railway Station (3 km) · PMPML Bus Gate',
        mapCoordinates: { lat: 18.5289, lng: 73.847 },
        collegeTypes: ['Polytechnic Institution', 'Government College'],
        primaryCategory: 'Polytechnic Institution',
        establishmentYear: 1957,
        officialWebsite: 'https://dte.maharashtra.gov.in',
        affiliatedUniversity: 'State Board of Technical Education (Sample)',
        accreditation: 'AICTE Approved State Polytechnic Framework (Sample)',
        contactEmail: 'poly-office-sample@kampus.edu.in',
        contactPhone: '+91-20-0000-6600 (Sample)',
        overview:
          'State government polytechnic institute offering three-year post-SSC engineering diplomas, workshop apprenticeships, and direct lateral-entry progression.',
        photoKey: 'stem_lab',
        galleryPhotoKeys: ['stem_lab', 'hero_quad'],
        featured: false,
        admissionStatus: 'Check Official Portal',
        admissionProcess: [
          'Register through State Centralized Polytechnic Admission Process (CAP).',
          'Submit Class 10 marksheet and opt preferred technical branches.',
        ],
        applicationProcedure: 'Centralized DTE Polytechnic CAP Portal.',
        importantDates: [
          { label: 'DTE CAP Merit Display (Sample)', dateISO: addDaysISO(35) },
        ],
        nextDeadlineISO: addDaysISO(35),
        requiredDocuments: ['Class 10 (SSC) Marksheet', 'School Leaving Certificate', 'Domicile Proof'],
        entranceExams: ['State Polytechnic Entrance / SSC Merit'],
        officialApplicationUrl: 'https://dte.maharashtra.gov.in',
        courses: [
          {
            courseId: 'crs_dip_mech',
            name: 'Diploma in Mechanical & Mechatronics Engineering',
            degreeType: 'Diploma',
            degreeShort: 'Diploma',
            stream: 'Polytechnic & Applied Engineering',
            department: 'Department of Mechanical Engineering',
            duration: '3 Years',
            eligibility: 'Passed Class 10 SSC with Maths & Science',
            entranceExams: ['State Polytechnic Entrance / SSC Merit'],
            annualTuitionFeeINR: 7800,
            intakeSeats: 120,
          },
        ],
        feeInfo: {
          tuitionRangeLabel: '₹7,800 / year (Sample Govt Tuition)',
          minAnnualTuitionINR: 7800,
          maxAnnualTuitionINR: 7800,
          admissionFeeLabel: 'Statutory state board exam fee',
          hostelFeeLabel: 'Govt Polytechnic Hostel available for outstation scholars',
          otherChargesLabel: 'Workshop safety gear nominal charge',
          scholarshipsSummary: 'Post-matric EBC/OBC/SC/ST tuition reimbursement schemes applicable.',
          sourceName: 'Sample Development Record',
          lastUpdatedISO: addDaysISO(-9),
        },
        facilities: {
          library: true,
          laboratories: true,
          hostel: true,
          sports: true,
          cafeteria: true,
          wifi: false,
          transportation: true,
          medical: false,
          accessibility: true,
          highlights: ['CNC & Foundry Workshop', 'Apprenticeship Training Cell'],
        },
        placementInfo: {
          hasPlacementSupport: true,
          supportDescription: 'Industrial apprenticeship & diploma technician placement coordination.',
          recruiterExamples: ['Automotive Manufacturing Plants', 'Precision Tooling Units'],
          placementReportSummary: 'Supports direct B.Tech 2nd-year lateral entry and industrial apprenticeships.',
          internshipOpportunities: '6-month in-plant apprenticeship module.',
          averagePackageLabel: null,
          highestPackageLabel: null,
          reportingYear: null,
          sourceCitation: 'Apprenticeship stipends governed by NAPS norms',
        },
        scholarshipAvailable: true,
        dataVerificationStatus: 'Sample Development Record',
        dataSourceLabel: 'KAMPUS Sample Development Dataset',
        providerId: 'sample_dev_provider_v1',
        lastUpdatedISO: addDaysISO(-9),
      },
      {
        id: 'col_bengaluru_law_private',
        name: 'Deccan Institute of Legal Studies & Public Governance (Sample)',
        shortName: 'DILSP Bengaluru',
        city: 'Bengaluru',
        state: 'Karnataka',
        address: 'Nagarbhavi Academic Enclave, Bengaluru, Karnataka 560072',
        nearbyTransport: 'Vijayanagar Metro (5 km) · BMTC University Ring Bus',
        mapCoordinates: { lat: 12.9616, lng: 77.5082 },
        collegeTypes: ['Law College', 'Private College'],
        primaryCategory: 'Law College',
        establishmentYear: 2005,
        officialWebsite: 'https://www.barcouncilofindia.org',
        affiliatedUniversity: 'Karnataka State Law University Affiliation (Sample)',
        accreditation: 'BCI Approved Legal Education Framework (Sample)',
        contactEmail: 'law-admissions-sample@kampus.edu.in',
        contactPhone: '+91-80-0000-7700 (Sample)',
        overview:
          'Private autonomous legal education institution focused on moot court advocacy, technology law clinics, and constitutional policy research.',
        photoKey: 'law_library',
        galleryPhotoKeys: ['law_library', 'seminar_hall'],
        featured: false,
        admissionStatus: 'Open',
        admissionProcess: [
          'Apply via CLAT / SLAT or institutional legal aptitude interview.',
          'Complete personal statement review & document verification.',
        ],
        applicationProcedure: 'Online admissions form with CLAT score upload.',
        importantDates: [
          { label: 'Phase 2 Application Close (Sample)', dateISO: addDaysISO(17) },
        ],
        nextDeadlineISO: addDaysISO(17),
        requiredDocuments: ['CLAT/Entrance Scorecard', '10+2 Transcript', 'ID Proof'],
        entranceExams: ['CLAT', 'SLAT'],
        officialApplicationUrl: 'https://consortiumofnlus.ac.in',
        courses: [
          {
            courseId: 'crs_ballb',
            name: 'Integrated B.A. LL.B. (Hons.)',
            degreeType: 'Professional',
            degreeShort: 'B.A. LL.B.',
            stream: 'Law & Legal Studies',
            department: 'School of Legal Studies',
            duration: '5 Years',
            eligibility: '10+2 minimum 45% + CLAT/institutional screening',
            entranceExams: ['CLAT', 'SLAT'],
            annualTuitionFeeINR: 225000,
            intakeSeats: 120,
          },
        ],
        feeInfo: {
          tuitionRangeLabel: '₹2,25,000 / year (Sample)',
          minAnnualTuitionINR: 225000,
          maxAnnualTuitionINR: 225000,
          admissionFeeLabel: '₹15,000 one-time academic enrollment deposit (Sample)',
          hostelFeeLabel: 'Private partner residence options nearby',
          otherChargesLabel: 'Moot court society & legal database access fee included',
          scholarshipsSummary: 'Merit entrance waivers up to 30% tuition based on CLAT percentile.',
          sourceName: 'Sample Development Record',
          lastUpdatedISO: addDaysISO(-3),
        },
        facilities: {
          library: true,
          laboratories: false,
          hostel: false,
          sports: true,
          cafeteria: true,
          wifi: true,
          transportation: true,
          medical: true,
          accessibility: true,
          highlights: ['Moot Courtroom Complex', 'Legal Aid Clinic', 'Digital Case Law Databases'],
        },
        placementInfo: {
          hasPlacementSupport: true,
          supportDescription: 'Legal placement & judicial mentorship committee facilitating firm and chamber internships.',
          recruiterExamples: ['Litigation Chambers', 'Corporate Legal Teams', 'Legal Tech Initiatives'],
          placementReportSummary: 'Verify bar exam & firm absorption records directly on campus career page.',
          internshipOpportunities: 'Mandatory semester-break court/NGO legal internships.',
          averagePackageLabel: null,
          highestPackageLabel: null,
          reportingYear: null,
          sourceCitation: 'Not published in sample record',
        },
        scholarshipAvailable: true,
        dataVerificationStatus: 'Sample Development Record',
        dataSourceLabel: 'KAMPUS Sample Development Dataset',
        providerId: 'sample_dev_provider_v1',
        lastUpdatedISO: addDaysISO(-3),
      },
      {
        id: 'col_chennai_nursing',
        name: 'Coromandel College of Nursing & Community Health (Sample)',
        shortName: 'CCNH Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        address: 'Guindy Health Campus Road, Chennai, Tamil Nadu 600032',
        nearbyTransport: 'Guindy Metro & Suburban Rail (1.8 km)',
        mapCoordinates: { lat: 13.0067, lng: 80.2206 },
        collegeTypes: ['Nursing College', 'Deemed University'],
        primaryCategory: 'Nursing College',
        establishmentYear: 1989,
        officialWebsite: 'https://www.indiannursingcouncil.org',
        affiliatedUniversity: 'Medical & Allied Sciences Deemed University (Sample)',
        accreditation: 'INC Recognized Nursing Curriculum (Sample)',
        contactEmail: 'nursing-sample@kampus.edu.in',
        contactPhone: '+91-44-0000-8800 (Sample)',
        overview:
          'Clinical nursing institution integrated with multi-specialty hospital wards offering high-acuity simulation training and public health fieldwork.',
        photoKey: 'campus_life',
        galleryPhotoKeys: ['campus_life', 'medical_campus'],
        featured: false,
        admissionStatus: 'Open',
        admissionProcess: [
          'Complete online health sciences entrance application.',
          'Verify 10+2 PCB grades and attend clinical aptitude interview.',
        ],
        applicationProcedure: 'Institute admissions portal + state nursing counseling.',
        importantDates: [
          { label: 'UG Nursing Form Close (Sample)', dateISO: addDaysISO(24) },
        ],
        nextDeadlineISO: addDaysISO(24),
        requiredDocuments: ['10+2 PCB Certificate', 'Hepatitis-B & Immunization Record', 'ID Proof'],
        entranceExams: ['State Nursing Entrance', 'NEET-UG'],
        officialApplicationUrl: 'https://www.indiannursingcouncil.org',
        courses: [
          {
            courseId: 'crs_bsc_nursing',
            name: 'B.Sc. in Nursing',
            degreeType: 'Undergraduate',
            degreeShort: 'B.Sc Nursing',
            stream: 'Nursing & Allied Health',
            department: 'Department of Medical-Surgical Nursing',
            duration: '4 Years',
            eligibility: '10+2 PCB & English with minimum 45%',
            entranceExams: ['State Nursing Entrance', 'NEET-UG'],
            annualTuitionFeeINR: 95000,
            intakeSeats: 80,
          },
        ],
        feeInfo: {
          tuitionRangeLabel: '₹95,000 / year (Sample)',
          minAnnualTuitionINR: 95000,
          maxAnnualTuitionINR: 95000,
          admissionFeeLabel: 'Uniform & clinical kit fees itemized at enrollment',
          hostelFeeLabel: 'On-campus supervised nursing residence available',
          otherChargesLabel: 'Hospital clinical rotation insurance included',
          scholarshipsSummary: 'State social welfare & healthcare merit stipends.',
          sourceName: 'Sample Development Record',
          lastUpdatedISO: addDaysISO(-8),
        },
        facilities: {
          library: true,
          laboratories: true,
          hostel: true,
          sports: true,
          cafeteria: true,
          wifi: true,
          transportation: true,
          medical: true,
          accessibility: true,
          highlights: ['Clinical Simulation Ward', 'On-Site Teaching Hospital', 'Dedicated Study Library'],
        },
        placementInfo: {
          hasPlacementSupport: true,
          supportDescription: 'Direct hospital staff nurse recruitment coordination upon state nursing council registration.',
          recruiterExamples: ['Multi-Specialty Teaching Hospitals', 'Community Health Trusts'],
          placementReportSummary: 'High clinical absorption across partner regional hospitals.',
          internshipOpportunities: 'Final-year integrated hospital clinical internship.',
          averagePackageLabel: null,
          highestPackageLabel: null,
          reportingYear: null,
          sourceCitation: 'Salary data not published in sample record',
        },
        scholarshipAvailable: true,
        dataVerificationStatus: 'Sample Development Record',
        dataSourceLabel: 'KAMPUS Sample Development Dataset',
        providerId: 'sample_dev_provider_v1',
        lastUpdatedISO: addDaysISO(-8),
      },
    ];
  }

  getScholarships(): ExplorerScholarship[] {
    return [
      {
        id: 'sch_nsp_central',
        title: 'National Scholarship Portal — Central Sector Scheme (Reference Summary)',
        provider: 'Department of Higher Education, Govt. of India',
        category: 'Government',
        eligibility: 'Top percentile Class 12 graduates from recognized boards pursuing regular UG/PG programs within parental income limits.',
        benefits: 'Annual college/university tuition & maintenance stipend transferred via DBT.',
        deadlineISO: addDaysISO(34),
        requiredDocuments: ['Class 12 Marksheet', 'Income Certificate', 'Bonafide College Verification', 'Aadhaar-linked Bank Account'],
        officialSourceUrl: 'https://scholarships.gov.in',
        lastUpdatedISO: addDaysISO(-5),
        dataVerificationStatus: 'Sample Development Record',
      },
      {
        id: 'sch_pragati_aicte',
        title: 'AICTE Pragati Scholarship for Technical Education (Reference Summary)',
        provider: 'All India Council for Technical Education (AICTE)',
        category: 'Category-Specific',
        eligibility: 'Female students admitted to AICTE-approved technical degree or diploma institutions in first year (max two per family, income cap applies).',
        benefits: 'Annual academic contingency & tuition assistance per official AICTE scheme circular.',
        deadlineISO: addDaysISO(29),
        requiredDocuments: ['Institute Admission Letter', 'Family Income Proof', 'Bank Passbook', 'AICTE Approval Code'],
        officialSourceUrl: 'https://www.aicte-india.org',
        lastUpdatedISO: addDaysISO(-4),
        dataVerificationStatus: 'Sample Development Record',
      },
      {
        id: 'sch_merit_univ',
        title: 'University Honors & Academic Excellence Tuition Waiver (Sample)',
        provider: 'Partner Public Universities',
        category: 'Merit-Based',
        eligibility: 'Top 10% semester GPA rank holders enrolled across full-time UG/PG university tracks.',
        benefits: '50% to 100% semester tuition remission subject to academic standing.',
        deadlineISO: addDaysISO(20),
        requiredDocuments: ['Semester Transcripts', 'Department Head Endorsement', 'KAMPUS ID Verification'],
        officialSourceUrl: 'https://www.ugc.gov.in',
        lastUpdatedISO: addDaysISO(-3),
        dataVerificationStatus: 'Sample Development Record',
      },
      {
        id: 'sch_need_means',
        title: 'Institute Merit-Cum-Means Financial Aid Program (Sample)',
        provider: 'Campus Financial Aid Offices',
        category: 'Need-Based',
        eligibility: 'Full-time undergraduate students with verified family annual income below institution aid threshold and clean academic standing.',
        benefits: 'Partial/full tuition grant + subsidized mess fee support.',
        deadlineISO: addDaysISO(18),
        requiredDocuments: ['ITR / Tehsildar Income Certificate', 'Bank Statements (6 months)', 'Enrollment Proof'],
        officialSourceUrl: 'https://scholarships.gov.in',
        lastUpdatedISO: addDaysISO(-2),
        dataVerificationStatus: 'Sample Development Record',
      },
      {
        id: 'sch_univ_fellowship',
        title: 'Undergraduate Research & Innovation Stipend (Sample)',
        provider: 'University Deans of Research',
        category: 'University',
        eligibility: '2nd and 3rd year undergraduates submitting faculty-mentored semester research proposals.',
        benefits: 'Project consumables grant and monthly academic assistantship.',
        deadlineISO: addDaysISO(41),
        requiredDocuments: ['2-Page Research Proposal', 'Faculty Supervisor Consent', 'Transcript'],
        officialSourceUrl: 'https://www.education.gov.in',
        lastUpdatedISO: addDaysISO(-6),
        dataVerificationStatus: 'Sample Development Record',
      },
      {
        id: 'sch_private_foundation',
        title: 'Independent Stem & Healthcare Scholar Trust Grant (Sample)',
        provider: 'Public Charitable Education Trusts',
        category: 'Private',
        eligibility: 'First-generation undergraduate applicants entering Engineering, Medicine, Nursing, or Pharmacy.',
        benefits: 'Book allowance and partial tuition reimbursement upon receipt submission.',
        deadlineISO: addDaysISO(26),
        requiredDocuments: ['Fee Receipt', 'Admission Confirmation Letter', 'Personal Statement'],
        officialSourceUrl: 'https://www.vidyalakshmi.co.in',
        lastUpdatedISO: addDaysISO(-7),
        dataVerificationStatus: 'Sample Development Record',
      },
    ];
  }

  getAdmissionUpdates(): AdmissionUpdateItem[] {
    return [
      {
        id: 'aupd_1',
        title: 'Sample Counseling Timeline Reminder: Verify Original Transcripts Early',
        collegeId: 'col_western_tech',
        collegeName: 'Western Institute of Engineering & Computing (Sample)',
        summary: 'Ensure Class 10/12 marksheets, category certificates, and entrance rank cards are digitized before counseling windows open.',
        publishedISO: addDaysISO(-2),
        sourceLabel: 'Sample Development Guidance',
      },
      {
        id: 'aupd_2',
        title: 'Medical & Nursing Seat Allocation Schedule Notice',
        collegeId: 'col_delhi_medical',
        collegeName: 'Capital Institute of Medical Sciences (Sample)',
        summary: 'Check official MCC and INC websites for current-year round counseling updates. Sample dates are placeholders for testing reminders.',
        publishedISO: addDaysISO(-1),
        sourceLabel: 'Sample Development Guidance',
      },
      {
        id: 'aupd_3',
        title: 'Management & Law Written Interview Essay Preparation',
        collegeId: 'col_ahmedabad_mgmt',
        collegeName: 'Sabarmati School of Management (Sample)',
        summary: 'PGP/MBA and Law shortlists review academic consistency and analytical writing during personal interview phases.',
        publishedISO: addDaysISO(-3),
        sourceLabel: 'Sample Development Guidance',
      },
    ];
  }
}

const sampleProvider = new SampleDevelopmentProvider();

function createSeedDatabase(): CollegeExplorerDatabase {
  return {
    colleges: sampleProvider.getColleges(),
    courses: sampleProvider.getCourses(),
    scholarships: sampleProvider.getScholarships(),
    admissionUpdates: sampleProvider.getAdmissionUpdates(),
    reviews: [], // Strictly zero fabricated testimonials/ratings!
    reports: [],
    recentlyViewedByUser: {},
    collectionsByUser: {},
    savedCollegesByUser: {},
    admissionTracker: [],
    comparisonHistoryByUser: {},
    sharedComparisons: {},
    uploadedDocs: {},
    roleOverrides: {},
  };
}

function loadDb(): CollegeExplorerDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (parsed && Array.isArray(parsed.colleges)) {
        return { ...createSeedDatabase(), ...parsed };
      }
    }
  } catch (err) {
    console.error('Failed to read College Explorer DB:', err);
  }
  const seeded = createSeedDatabase();
  saveDb(seeded);
  return seeded;
}

function saveDb(db: CollegeExplorerDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write College Explorer DB:', err);
  }
}

function isPrivilegedExplorerRole(role: ExplorerRole): boolean {
  return ['Education Data Editor', 'Moderator', 'Platform Admin'].includes(role);
}

function readCrossModuleStudentContext(userId: string) {
  let isKampusIdVerified = false;
  let kampusIdNumber: string | null = null;
  let careerTargetRoles: string[] = [];

  try {
    if (fs.existsSync(KAMPUS_ID_DB_FILE)) {
      const kidDb = JSON.parse(fs.readFileSync(KAMPUS_ID_DB_FILE, 'utf-8'));
      const rec = Array.isArray(kidDb?.records)
        ? kidDb.records.find((r: any) => r.userId === userId)
        : null;
      if (rec) {
        isKampusIdVerified = Boolean(rec.isVerified || rec.status === 'Verified');
        kampusIdNumber = rec.kampusIdCode || null;
      }
    }
  } catch {
    // non-fatal cross-module check
  }

  try {
    if (fs.existsSync(CAREER_DB_FILE)) {
      const cDb = JSON.parse(fs.readFileSync(CAREER_DB_FILE, 'utf-8'));
      const pref = cDb?.preferencesByUser?.[userId];
      if (pref && Array.isArray(pref.targetRoles)) {
        careerTargetRoles = pref.targetRoles;
      }
    }
  } catch {
    // non-fatal cross-module check
  }

  return { isKampusIdVerified, kampusIdNumber, careerTargetRoles };
}

export function registerCollegeExplorerBackend(app: Express) {
  const db = loadDb();

  // 1. Bootstrap Workspace
  app.post('/api/explorer/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.body?.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    if (!db.collectionsByUser[userId]) {
      db.collectionsByUser[userId] = [
        { id: 'col_list_dream', name: 'Dream Picks', createdAt: new Date().toISOString() },
        { id: 'col_list_target', name: 'Target List', createdAt: new Date().toISOString() },
        { id: 'col_list_safe', name: 'Safe Options', createdAt: new Date().toISOString() },
      ];
      saveDb(db);
    }

    const roleInfo = db.roleOverrides[userId] || { role: 'Student' as ExplorerRole, label: null };
    const isAdmin = isPrivilegedExplorerRole(roleInfo.role);
    const crossModule = readCrossModuleStudentContext(userId);

    const visibleReviews = db.reviews.filter(
      (rv) => rv.moderationStatus === 'Published' || rv.authorId === userId || isAdmin
    );

    return res.json({
      providerInfo: {
        id: sampleProvider.providerId,
        name: sampleProvider.providerName,
        isVerifiedOfficialFeed: sampleProvider.isVerifiedOfficialFeed,
      },
      colleges: db.colleges,
      courses: db.courses,
      scholarships: db.scholarships,
      admissionUpdates: db.admissionUpdates,
      reviews: visibleReviews,
      reports: isAdmin ? db.reports : [],
      recentlyViewedIds: db.recentlyViewedByUser[userId] || [],
      collections: db.collectionsByUser[userId] || [],
      savedColleges: db.savedCollegesByUser[userId] || [],
      admissions: db.admissionTracker.filter((a) => a.userId === userId),
      comparisonHistory: db.comparisonHistoryByUser[userId] || [],
      roleInfo,
      crossModule,
    });
  });

  // 2. Role Switching (Strict RBAC)
  app.post('/api/explorer/auth/role-session', (req: Request, res: Response) => {
    const { userId, passkey, revert } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (revert) {
      delete db.roleOverrides[userId];
      saveDb(db);
      return res.json({ ok: true, roleInfo: { role: 'Student', label: null } });
    }
    const matched = EXPLORER_PASSKEYS[String(passkey || '').trim().toUpperCase()];
    if (!matched) {
      return res.status(403).json({ message: 'Invalid College Explorer admin/editor passkey.' });
    }
    db.roleOverrides[userId] = matched;
    saveDb(db);
    return res.json({ ok: true, roleInfo: matched });
  });

  // 3. Track Recently Viewed College
  app.post('/api/explorer/viewed', (req: Request, res: Response) => {
    const { userId, collegeId } = req.body || {};
    if (!userId || !collegeId) return res.status(400).json({ message: 'Missing fields.' });
    const list = (db.recentlyViewedByUser[userId] || []).filter((id) => id !== collegeId);
    db.recentlyViewedByUser[userId] = [collegeId, ...list].slice(0, 8);
    saveDb(db);
    return res.json({ recentlyViewedIds: db.recentlyViewedByUser[userId] });
  });

  // 4. Shortlist & Custom Collections
  app.post('/api/explorer/collections', (req: Request, res: Response) => {
    const { userId, name } = req.body || {};
    const trimmed = String(name || '').trim();
    if (!userId || !trimmed) {
      return res.status(400).json({ message: 'Collection name is required.' });
    }
    const existing = db.collectionsByUser[userId] || [];
    if (existing.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return res.status(400).json({ message: 'Collection with this name already exists.' });
    }
    const next: ShortlistCollection = {
      id: `col_list_${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    db.collectionsByUser[userId] = [...existing, next];
    saveDb(db);
    return res.status(201).json({ collections: db.collectionsByUser[userId] });
  });

  app.post('/api/explorer/shortlist', (req: Request, res: Response) => {
    const { userId, collegeId, action, collectionName, personalNote, reminderDateISO } = req.body || {};
    if (!userId || !collegeId) {
      return res.status(400).json({ message: 'userId and collegeId are required.' });
    }
    const list = db.savedCollegesByUser[userId] || [];
    if (action === 'remove') {
      db.savedCollegesByUser[userId] = list.filter((x) => x.collegeId !== collegeId);
      saveDb(db);
      return res.json({ savedColleges: db.savedCollegesByUser[userId] });
    }

    const existingIdx = list.findIndex((x) => x.collegeId === collegeId);
    if (existingIdx >= 0) {
      const updated = { ...list[existingIdx] };
      if (typeof collectionName === 'string' && collectionName.trim()) {
        updated.collectionName = collectionName.trim();
      }
      if (typeof personalNote === 'string') {
        updated.personalNote = personalNote;
      }
      if (typeof reminderDateISO === 'string') {
        updated.reminderDateISO = reminderDateISO || undefined;
      }
      list[existingIdx] = updated;
      db.savedCollegesByUser[userId] = list;
    } else {
      db.savedCollegesByUser[userId] = [
        {
          collegeId,
          collectionName: String(collectionName || 'Target List'),
          personalNote: String(personalNote || ''),
          reminderDateISO: reminderDateISO || undefined,
          savedAt: new Date().toISOString(),
        },
        ...list,
      ];
    }
    saveDb(db);
    return res.json({ savedColleges: db.savedCollegesByUser[userId] });
  });

  // 5. Comparison Save & Share
  app.post('/api/explorer/comparisons', (req: Request, res: Response) => {
    const { userId, collegeIds, title } = req.body || {};
    if (!userId || !Array.isArray(collegeIds) || collegeIds.length < 2 || collegeIds.length > 4) {
      return res.status(400).json({ message: 'Select 2 to 4 colleges to save comparison.' });
    }
    const shareCode = `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const item: ComparisonHistoryItem = {
      id: `cmpid_${Date.now()}`,
      shareCode,
      title: String(title || `${collegeIds.length}-College Side-by-Side Comparison`),
      collegeIds: collegeIds.slice(0, 4),
      createdAt: new Date().toISOString(),
    };
    const prev = db.comparisonHistoryByUser[userId] || [];
    db.comparisonHistoryByUser[userId] = [item, ...prev].slice(0, 15);
    db.sharedComparisons[shareCode] = item;
    saveDb(db);
    return res.status(201).json({ comparison: item, history: db.comparisonHistoryByUser[userId] });
  });

  app.get('/api/explorer/comparisons/shared/:code', (req: Request, res: Response) => {
    const comp = db.sharedComparisons[String(req.params.code || '')];
    if (!comp) return res.status(404).json({ message: 'Shared comparison not found.' });
    const colleges = comp.collegeIds
      .map((id) => db.colleges.find((c) => c.id === id))
      .filter(Boolean);
    return res.json({ comparison: comp, colleges });
  });

  // 6. My Admissions Tracker & Document Upload
  app.post('/api/explorer/upload-doc', (req: Request, res: Response) => {
    const { userId, fileName, mimeType, base64Data } = req.body || {};
    if (!userId || !fileName || !base64Data) {
      return res.status(400).json({ message: 'Document payload is missing.' });
    }
    const ext = path.extname(String(fileName)).toLowerCase();
    if (!['.pdf', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      return res.status(400).json({ message: 'Only PDF, PNG, JPG, and WEBP documents are accepted.' });
    }
    const clean = String(base64Data).includes(',')
      ? String(base64Data).split(',')[1]
      : String(base64Data);
    const buffer = Buffer.from(clean, 'base64');
    if (!validateDocMagicBytes(buffer, ext)) {
      return res.status(400).json({ message: 'Invalid or oversized (>5 MB) document signature.' });
    }
    const id = `exdoc_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    db.uploadedDocs[id] = {
      id,
      fileName: String(fileName),
      mimeType: String(mimeType || 'application/octet-stream'),
      sizeBytes: buffer.length,
      base64Data: clean,
      ownerId: String(userId),
      createdAt: new Date().toISOString(),
    };
    saveDb(db);
    return res.status(201).json({
      doc: {
        id,
        fileName: String(fileName),
        url: `/api/explorer/docs/${id}`,
        sizeBytes: buffer.length,
      },
    });
  });

  app.get('/api/explorer/docs/:id', (req: Request, res: Response) => {
    const doc = db.uploadedDocs[req.params.id];
    if (!doc) return res.status(404).send('Document not found');
    const requester = String(req.query.userId || '');
    if (requester !== doc.ownerId) {
      return res.status(403).send('Private admission document: owner access only.');
    }
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    return res.send(Buffer.from(doc.base64Data, 'base64'));
  });

  app.post('/api/explorer/admissions', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const college = db.colleges.find((c) => c.id === b.collegeId);
    if (!userId || !college) {
      return res.status(400).json({ message: 'Valid userId and collegeId are required.' });
    }
    const entry: AdmissionTrackerEntry = {
      id: `adm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      userId,
      collegeId: college.id,
      collegeName: college.name,
      courseName: String(b.courseName || college.courses[0]?.name || 'General Admission'),
      status: b.status || 'Interested',
      deadlineISO: b.deadlineISO || college.nextDeadlineISO,
      reminderDateISO: b.reminderDateISO || undefined,
      notes: String(b.notes || ''),
      checklist: college.requiredDocuments.map((docLabel, i) => ({
        id: `chk_${i}_${Date.now()}`,
        label: docLabel,
        completed: false,
      })),
      documents: [],
      updatedAt: new Date().toISOString(),
    };
    db.admissionTracker.unshift(entry);
    saveDb(db);
    return res.status(201).json({ entry });
  });

  app.patch('/api/explorer/admissions/:id', (req: Request, res: Response) => {
    const entry = db.admissionTracker.find((a) => a.id === req.params.id);
    if (!entry) return res.status(404).json({ message: 'Admission tracker item not found.' });
    const b = req.body || {};
    if (entry.userId !== String(b.userId || '')) {
      return res.status(403).json({ message: 'Not authorized to edit this admission record.' });
    }
    if (b.status) entry.status = b.status;
    if (typeof b.courseName === 'string') entry.courseName = b.courseName;
    if (typeof b.deadlineISO === 'string') entry.deadlineISO = b.deadlineISO || undefined;
    if (typeof b.reminderDateISO === 'string') entry.reminderDateISO = b.reminderDateISO || undefined;
    if (typeof b.notes === 'string') entry.notes = b.notes;
    if (Array.isArray(b.checklist)) entry.checklist = b.checklist;
    if (Array.isArray(b.documents)) entry.documents = b.documents;
    entry.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ entry });
  });

  app.delete('/api/explorer/admissions/:id', (req: Request, res: Response) => {
    const entry = db.admissionTracker.find((a) => a.id === req.params.id);
    if (!entry) return res.status(404).json({ message: 'Not found.' });
    if (entry.userId !== String(req.query.userId || '')) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    db.admissionTracker = db.admissionTracker.filter((a) => a.id !== entry.id);
    saveDb(db);
    return res.json({ ok: true });
  });

  // 7. Student Experience Reviews & Community Safety
  app.post('/api/explorer/reviews', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const college = db.colleges.find((c) => c.id === b.collegeId);
    if (!userId || !college || !String(b.title || '').trim() || !String(b.experienceText || '').trim()) {
      return res.status(400).json({ message: 'College, review title, and experience details are required.' });
    }
    const rating = Math.min(5, Math.max(1, Number(b.rating) || 4));
    const ctx = readCrossModuleStudentContext(userId);
    const rv: CollegeReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      collegeId: college.id,
      collegeName: college.name,
      authorId: userId,
      authorName: String(b.authorName || 'Student').trim(),
      isVerifiedStudent: ctx.isKampusIdVerified,
      verificationBasis: ctx.isKampusIdVerified
        ? `Verified KAMPUS ID (${ctx.kampusIdNumber || 'Active'})`
        : 'Unverified Experience (Standard Campus Account without verified KAMPUS ID)',
      category: b.category || 'Academics',
      rating,
      title: String(b.title).trim(),
      experienceText: String(b.experienceText).trim(),
      helpfulVoterIds: [],
      moderationStatus: 'Published',
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(rv);
    saveDb(db);
    return res.status(201).json({ review: rv });
  });

  app.post('/api/explorer/reviews/:id/helpful', (req: Request, res: Response) => {
    const rv = db.reviews.find((r) => r.id === req.params.id);
    const userId = String(req.body?.userId || '').trim();
    if (!rv || !userId) return res.status(404).json({ message: 'Review not found.' });
    if (rv.helpfulVoterIds.includes(userId)) {
      rv.helpfulVoterIds = rv.helpfulVoterIds.filter((id) => id !== userId);
    } else {
      rv.helpfulVoterIds.push(userId);
    }
    saveDb(db);
    return res.json({ review: rv });
  });

  app.post('/api/explorer/reviews/:id/report', (req: Request, res: Response) => {
    const rv = db.reviews.find((r) => r.id === req.params.id);
    const { userId, reason, details } = req.body || {};
    if (!rv || !userId || !String(reason || '').trim()) {
      return res.status(400).json({ message: 'Valid review and report reason are required.' });
    }
    const rp: ReviewReportItem = {
      id: `rrp_${Date.now()}`,
      reviewId: rv.id,
      collegeId: rv.collegeId,
      reviewTitle: rv.title,
      reporterId: String(userId),
      reason: String(reason).trim(),
      details: String(details || '').trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    rv.moderationStatus = 'Flagged';
    db.reports.unshift(rp);
    saveDb(db);
    return res.status(201).json({ report: rp });
  });

  // 8. Admin / Editor / Moderator RBAC Endpoints (Strict 403 for Students)
  app.post('/api/explorer/admin/colleges', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (role !== 'Platform Admin' && role !== 'Education Data Editor') {
      return res.status(403).json({ message: '403 Forbidden: Admin or Education Data Editor access required.' });
    }
    if (!String(b.name || '').trim() || !String(b.city || '').trim() || !String(b.state || '').trim()) {
      return res.status(400).json({ message: 'College name, city, and state are required.' });
    }
    const primaryCat = (b.primaryCategory || 'University') as CollegeType;
    const newCol: CollegeRecord = {
      id: `col_adm_${Date.now()}`,
      name: String(b.name).trim(),
      shortName: String(b.shortName || b.name).trim().slice(0, 24),
      city: String(b.city).trim(),
      state: String(b.state).trim(),
      address: String(b.address || `${b.city}, ${b.state}`),
      nearbyTransport: String(b.nearbyTransport || 'Check official campus website for transit details'),
      collegeTypes: Array.isArray(b.collegeTypes) && b.collegeTypes.length > 0 ? b.collegeTypes : [primaryCat],
      primaryCategory: primaryCat,
      establishmentYear: Number(b.establishmentYear) || 2000,
      officialWebsite: String(b.officialWebsite || 'https://www.education.gov.in'),
      affiliatedUniversity: String(b.affiliatedUniversity || 'Autonomous / State University'),
      accreditation: String(b.accreditation || 'Verify current cycle'),
      contactEmail: String(b.contactEmail || 'admissions@institution.edu.in'),
      contactPhone: String(b.contactPhone || 'Listed on official portal'),
      overview: String(b.overview || 'Managed institution record added by Education Data Editor.'),
      photoKey: String(b.photoKey || 'hero_quad'),
      galleryPhotoKeys: [String(b.photoKey || 'hero_quad')],
      featured: Boolean(b.featured),
      admissionStatus: b.admissionStatus || 'Check Official Portal',
      admissionProcess: Array.isArray(b.admissionProcess)
        ? b.admissionProcess
        : ['Follow official institution portal admission notification.'],
      applicationProcedure: String(b.applicationProcedure || 'Official institution portal registration.'),
      importantDates: b.nextDeadlineISO
        ? [{ label: 'Published Application Target', dateISO: String(b.nextDeadlineISO) }]
        : [],
      nextDeadlineISO: b.nextDeadlineISO || undefined,
      requiredDocuments: ['Marksheets', 'ID Proof', 'Entrance Scorecard (if applicable)'],
      entranceExams: Array.isArray(b.entranceExams) ? b.entranceExams : ['Institution Entrance / Merit'],
      officialApplicationUrl: String(b.officialApplicationUrl || b.officialWebsite || 'https://www.education.gov.in'),
      courses: Array.isArray(b.courses) ? b.courses : [],
      feeInfo: {
        tuitionRangeLabel: String(b.tuitionRangeLabel || 'Not published — check official prospectus'),
        minAnnualTuitionINR: typeof b.minAnnualTuitionINR === 'number' ? b.minAnnualTuitionINR : null,
        maxAnnualTuitionINR: typeof b.maxAnnualTuitionINR === 'number' ? b.maxAnnualTuitionINR : null,
        admissionFeeLabel: 'Check institution prospectus',
        hostelFeeLabel: b.hostelAvailable ? 'Hostel available — confirm current room tariff' : 'Not available / External',
        otherChargesLabel: 'Check institution fee rules',
        scholarshipsSummary: b.scholarshipAvailable ? 'Scholarships listed by institution/government' : 'Check aid office',
        sourceName: String(b.dataSourceLabel || 'Admin Managed Record'),
        lastUpdatedISO: new Date().toISOString().slice(0, 10),
      },
      facilities: {
        library: true,
        laboratories: true,
        hostel: Boolean(b.hostelAvailable),
        sports: Boolean(b.sportsAvailable ?? true),
        cafeteria: true,
        wifi: true,
        transportation: false,
        medical: false,
        accessibility: true,
        highlights: ['Library & Academic Wing'],
      },
      placementInfo: {
        hasPlacementSupport: Boolean(b.hasPlacementSupport ?? true),
        supportDescription: 'Official career & placement guidance details maintained per institutional filing.',
        recruiterExamples: [],
        placementReportSummary: 'Placement statistics not invented; refer to official institutional report.',
        internshipOpportunities: 'Verify departmental internship structure on portal.',
        averagePackageLabel: null,
        highestPackageLabel: null,
        reportingYear: null,
        sourceCitation: null,
      },
      scholarshipAvailable: Boolean(b.scholarshipAvailable),
      dataVerificationStatus: b.dataVerificationStatus || 'Admin Managed Record',
      dataSourceLabel: String(b.dataSourceLabel || role),
      providerId: 'admin_managed',
      lastUpdatedISO: new Date().toISOString().slice(0, 10),
    };
    db.colleges.unshift(newCol);
    saveDb(db);
    return res.status(201).json({ college: newCol });
  });

  app.patch('/api/explorer/admin/colleges/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (role !== 'Platform Admin' && role !== 'Education Data Editor') {
      return res.status(403).json({ message: '403 Forbidden: Admin or Education Data Editor access required.' });
    }
    const col = db.colleges.find((c) => c.id === req.params.id);
    if (!col) return res.status(404).json({ message: 'College not found.' });

    if (typeof b.name === 'string' && b.name.trim()) col.name = b.name.trim();
    if (typeof b.officialWebsite === 'string') col.officialWebsite = b.officialWebsite;
    if (typeof b.officialApplicationUrl === 'string') col.officialApplicationUrl = b.officialApplicationUrl;
    if (typeof b.overview === 'string') col.overview = b.overview;
    if (typeof b.photoKey === 'string') col.photoKey = b.photoKey;
    if (b.admissionStatus) col.admissionStatus = b.admissionStatus;
    if (b.dataVerificationStatus) col.dataVerificationStatus = b.dataVerificationStatus;
    if (typeof b.nextDeadlineISO === 'string') {
      col.nextDeadlineISO = b.nextDeadlineISO || undefined;
    }
    if (b.newCourse && b.newCourse.name) {
      col.courses.push({
        courseId: `crs_custom_${Date.now()}`,
        name: String(b.newCourse.name),
        degreeType: b.newCourse.degreeType || 'Undergraduate',
        degreeShort: String(b.newCourse.degreeShort || 'UG'),
        stream: String(b.newCourse.stream || 'General'),
        department: String(b.newCourse.department || 'Academic Department'),
        duration: String(b.newCourse.duration || '4 Years'),
        eligibility: String(b.newCourse.eligibility || 'Verify on institution portal'),
        entranceExams: Array.isArray(b.newCourse.entranceExams)
          ? b.newCourse.entranceExams
          : ['Check Portal'],
        annualTuitionFeeINR:
          typeof b.newCourse.annualTuitionFeeINR === 'number'
            ? b.newCourse.annualTuitionFeeINR
            : null,
      });
    }
    col.lastUpdatedISO = new Date().toISOString().slice(0, 10);
    saveDb(db);
    return res.json({ college: col });
  });

  app.post('/api/explorer/admin/scholarships', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (role !== 'Platform Admin' && role !== 'Education Data Editor') {
      return res.status(403).json({ message: '403 Forbidden: Editor or Admin role required.' });
    }
    if (!String(b.title || '').trim() || !String(b.provider || '').trim()) {
      return res.status(400).json({ message: 'Scholarship title and provider are required.' });
    }
    const item: ExplorerScholarship = {
      id: `sch_adm_${Date.now()}`,
      title: String(b.title).trim(),
      provider: String(b.provider).trim(),
      category: b.category || 'University',
      eligibility: String(b.eligibility || 'Check official scholarship notice.'),
      benefits: String(b.benefits || 'Specified on official source portal.'),
      deadlineISO: String(b.deadlineISO || addDaysISO(30)),
      requiredDocuments: Array.isArray(b.requiredDocuments)
        ? b.requiredDocuments
        : ['Enrollment Proof', 'Income/Merit Proof'],
      officialSourceUrl: String(b.officialSourceUrl || 'https://scholarships.gov.in'),
      lastUpdatedISO: new Date().toISOString().slice(0, 10),
      dataVerificationStatus: b.dataVerificationStatus || 'Admin Managed Record',
    };
    db.scholarships.unshift(item);
    saveDb(db);
    return res.status(201).json({ scholarship: item });
  });

  app.patch('/api/explorer/admin/reviews/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!isPrivilegedExplorerRole(role)) {
      return res.status(403).json({ message: '403 Forbidden: Moderator or Admin role required.' });
    }
    const rv = db.reviews.find((r) => r.id === req.params.id);
    if (!rv) return res.status(404).json({ message: 'Review not found.' });
    if (b.moderationStatus) rv.moderationStatus = b.moderationStatus;
    saveDb(db);
    return res.json({ review: rv });
  });

  app.patch('/api/explorer/admin/reports/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!isPrivilegedExplorerRole(role)) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    const rp = db.reports.find((r) => r.id === req.params.id);
    if (!rp) return res.status(404).json({ message: 'Report not found.' });
    rp.status = 'Reviewed';
    saveDb(db);
    return res.json({ report: rp });
  });
}
