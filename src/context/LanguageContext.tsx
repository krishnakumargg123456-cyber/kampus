import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'header.search': 'Search anything in KAMPUS',
    'header.ai': 'KAMPUS AI',
    'header.notifications': 'Notifications',
    'header.profile': 'Profile',
    'header.settings': 'Settings',
    'header.logout': 'Sign Out',
    'header.lang': 'हिन्दी',

    // Hero Section
    'hero.badge': 'The All-in-One Indian Student Super App',
    'hero.headline': 'Your Student Life, Connected.',
    'hero.description': 'Study smarter, connect with students, explore opportunities and manage your entire college life in one place.',
    'hero.btn.explore': 'Explore KAMPUS',
    'hero.btn.discover': 'Discover Features',
    'hero.stat.students': 'Active Scholars',
    'hero.stat.universities': 'Indian Universities',
    'hero.stat.modules': 'All 21 Features Active',

    // Feature Explorer
    'features.badge': 'Complete Super App Directory',
    'features.heading': 'Everything You Need, All in One Place',
    'features.subtitle': 'Explore tools designed to make student life easier.',
    'features.cat1': 'CATEGORY 1: LEARN & STUDY',
    'features.cat1.sub': 'Access academic materials, study resources and AI tutoring',
    'features.cat2': 'CATEGORY 2: CONNECT & COLLABORATE',
    'features.cat2.sub': 'Find study partners, chat and study together in virtual rooms',
    'features.cat3': 'CATEGORY 3: CAMPUS LIFE',
    'features.cat3.sub': 'Real-time circulars, digital identity and campus fests',
    'features.cat4': 'CATEGORY 4: CAREER & COLLEGES',
    'features.cat4.sub': 'Explore internships, jobs, scholarships and college guides',
    'features.cat5': 'CATEGORY 5: STUDENT SERVICES',
    'features.cat5.sub': 'Peer marketplace, encrypted digital locker and timetable planner',
    'features.cat6': 'CATEGORY 6: PERSONAL SPACE',
    'features.cat6.sub': 'Notification center, verified student profile and account settings',

    // Feature One-Lines
    'feat.study-hub.name': 'Study Hub',
    'feat.study-hub.desc': 'Access study materials, subjects and learning resources.',
    'feat.kampus-ai.name': 'KAMPUS AI',
    'feat.kampus-ai.desc': 'Get AI-powered study assistance and explanations.',
    'feat.notes-exchange.name': 'Notes Exchange',
    'feat.notes-exchange.desc': 'Share and discover useful student notes.',

    'feat.study-partner.name': 'Study Partner',
    'feat.study-partner.desc': 'Find students with similar learning goals.',
    'feat.community.name': 'Student Community',
    'feat.community.desc': 'Connect with students and discuss ideas.',
    'feat.chat.name': 'Chat',
    'feat.chat.desc': 'Communicate with other students.',
    'feat.study-rooms.name': 'Study Rooms',
    'feat.study-rooms.desc': 'Join collaborative study sessions.',
    'feat.skillswap.name': 'SkillSwap',
    'feat.skillswap.desc': 'Learn and exchange useful skills.',

    'feat.campus-pulse.name': 'Campus Pulse',
    'feat.campus-pulse.desc': 'Get the latest campus updates.',
    'feat.events-clubs.name': 'Events & Clubs',
    'feat.events-clubs.desc': 'Discover college events and student clubs.',
    'feat.kampus-id.name': 'KAMPUS ID',
    'feat.kampus-id.desc': 'Access your digital student identity.',
    'feat.student-voice.name': 'Student Voice',
    'feat.student-voice.desc': 'Share opinions and campus feedback.',

    'feat.career.name': 'Career',
    'feat.career.desc': 'Explore internships, jobs and career opportunities.',
    'feat.college-explorer.name': 'College Explorer',
    'feat.college-explorer.desc': 'Discover and compare colleges.',

    'feat.market.name': 'KAMPUS Market',
    'feat.market.desc': 'Buy, sell and discover student essentials.',
    'feat.digital-locker.name': 'Digital Locker',
    'feat.digital-locker.desc': 'Keep important digital documents organized.',
    'feat.rewards.name': 'KAMPUS Rewards',
    'feat.rewards.desc': 'Explore student rewards and benefits.',
    'feat.planner.name': 'KAMPUS Planner',
    'feat.planner.desc': 'Organize schedules, tasks and deadlines.',

    'feat.notifications.name': 'Notification Center',
    'feat.notifications.desc': 'Stay updated with important notifications.',
    'feat.profile.name': 'Student Profile',
    'feat.profile.desc': 'Manage your student information.',
    'feat.settings.name': 'Settings',
    'feat.settings.desc': 'Customize your KAMPUS experience.',
    'feat.btn.open': 'Open',

    // KAMPUS AI Showcase
    'ai.heading': 'Meet Your Study Companion',
    'ai.description': 'Learn difficult topics, create notes and prepare smarter with KAMPUS AI.',
    'ai.input.placeholder': 'What would you like to learn today?',
    'ai.btn.explore': 'Explore KAMPUS AI',
    'ai.feat1.title': 'Explain Topics',
    'ai.feat1.desc': 'Break down complex math, algorithms and theories with clear step-by-step intuition.',
    'ai.feat2.title': 'Create Notes',
    'ai.feat2.desc': 'Generate concise revision notes, formula cheat sheets and high-yield flashcards.',
    'ai.feat3.title': 'Generate Quizzes',
    'ai.feat3.desc': 'Practice with automated multiple-choice and conceptual exam-prep quizzes.',
    'ai.feat4.title': 'Solve Questions',
    'ai.feat4.desc': 'Get structured assistance for textbook problems and numerical derivations.',

    // Campus Life Showcase
    'campus.heading': 'Make Your Campus Life Count',
    'campus.description': 'Discover events, meet students, join communities and experience more of college life.',
    'campus.btn.events': 'Explore Events',
    'campus.btn.community': 'Join Community',

    // Career Showcase
    'career.heading': 'Your Future Starts Here',
    'career.description': 'Explore high-stipend internships, government scholarships, workshops and career pathways curated for collegiate scholars.',
    'career.internships': 'Internships',
    'career.internships.desc': 'Verified summer research fellowships and corporate internships.',
    'career.scholarships': 'Scholarships',
    'career.scholarships.desc': 'National STEM merit grants and fee-waiver fellowships.',
    'career.guidance': 'Career Guidance',
    'career.guidance.desc': 'AI ATS resume scoring, placement shortlists and mock interviews.',
    'career.workshops': 'Workshops',
    'career.workshops.desc': 'Hands-on masterclasses on GenAI, Cloud and Quant Trading.',
    'career.btn.explore': 'Explore Opportunities',

    // Student Dashboard
    'dash.heading': 'Student Academic Cockpit',
    'dash.disclaimer': 'LIVE ACADEMIC SYNC · REAL-TIME',
    'dash.progress': 'Study Progress',
    'dash.schedule': "Today's Schedule",
    'dash.tasks': 'Upcoming Tasks',
    'dash.attendance': 'Attendance',
    'dash.continue': 'Continue Learning',
    'dash.btn.planner': 'Open Full Planner',

    // Footer
    'footer.tagline': 'Your Student Life, Connected.',
    'footer.desc': 'KAMPUS is the unified super app engineered for Indian college students, bringing together academics, peer collaboration, campus life, career discovery and student services in one seamless experience.',
    'footer.col.features': 'Platform Features',
    'footer.col.support': 'Help & Support',
    'footer.col.legal': 'Legal & Privacy',
    'footer.about': 'About KAMPUS',
    'footer.support': 'Help & Support',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms & Conditions',
    'footer.contact': 'Contact Us',
    'footer.rights': 'All rights reserved. Made with pride for Indian collegiate scholars.',
  },

  hi: {
    // Header
    'header.search': 'KAMPUS में कुछ भी खोजें',
    'header.ai': 'कैम्पस AI',
    'header.notifications': 'सूचनाएं',
    'header.profile': 'प्रोफाइल',
    'header.settings': 'सेटिंग्स',
    'header.logout': 'लॉग आउट',
    'header.lang': 'English',

    // Hero Section
    'hero.badge': 'भारतीय छात्रों का ऑल-इन-वन सुपर ऐप',
    'hero.headline': 'आपका छात्र जीवन, जुड़ा हुआ।',
    'hero.description': 'समझदारी से सीखें, छात्रों से जुड़ें, अवसरों की खोज करें और अपने पूरे कॉलेज जीवन को एक ही जगह प्रबंधित करें।',
    'hero.btn.explore': 'KAMPUS एक्सप्लोर करें',
    'hero.btn.discover': 'फीचर्स देखें',
    'hero.stat.students': 'सक्रिय छात्र',
    'hero.stat.universities': 'भारतीय विश्वविद्यालय',
    'hero.stat.modules': 'सभी 21 फीचर्स सक्रिय',

    // Feature Explorer
    'features.badge': 'कम्पलीट सुपर ऐप डायरेक्टरी',
    'features.heading': 'सब कुछ जो आपको चाहिए, एक ही जगह पर',
    'features.subtitle': 'छात्र जीवन को आसान बनाने के लिए डिज़ाइन किए गए टूल्स देखें।',
    'features.cat1': 'कैटेगरी 1: अध्ययन और शिक्षा (LEARN & STUDY)',
    'features.cat1.sub': 'अध्ययन सामग्री, नोट्स और AI ट्यूटरिंग तक पहुंचें',
    'features.cat2': 'कैटेगरी 2: जुड़ें और सहयोग करें (CONNECT & COLLABORATE)',
    'features.cat2.sub': 'अध्ययन साथी खोजें, चैट करें और लाइव स्टडी रूम्स में साथ पढ़ें',
    'features.cat3': 'कैटेगरी 3: कैम्पस जीवन (CAMPUS LIFE)',
    'features.cat3.sub': 'कॉलेज नोटिस, डिजिटल पहचान पत्र और कैम्पस फेस्ट',
    'features.cat4': 'कैटेगरी 4: करियर और कॉलेज (CAREER & COLLEGES)',
    'features.cat4.sub': 'इंटर्नशिप, स्कॉलरशिप, जॉब्स और कॉलेज गाइड खोजें',
    'features.cat5': 'कैटेगरी 5: छात्र सेवाएं (STUDENT SERVICES)',
    'features.cat5.sub': 'छात्र बाज़ार, डिजिटल लॉकर और टाइमटेबल प्लानर',
    'features.cat6': 'कैटेगरी 6: व्यक्तिगत स्पेस (PERSONAL SPACE)',
    'features.cat6.sub': 'सूचना केंद्र, सत्यापित छात्र प्रोफाइल और सेटिंग्स',

    // Feature One-Lines
    'feat.study-hub.name': 'Study Hub',
    'feat.study-hub.desc': 'अध्ययन सामग्री, विषय और शिक्षण संसाधन प्राप्त करें।',
    'feat.kampus-ai.name': 'KAMPUS AI',
    'feat.kampus-ai.desc': 'AI-संचालित अध्ययन सहायता और स्पष्टीकरण प्राप्त करें।',
    'feat.notes-exchange.name': 'Notes Exchange',
    'feat.notes-exchange.desc': 'उपयोगी छात्र नोट्स साझा करें और खोजें।',

    'feat.study-partner.name': 'Study Partner',
    'feat.study-partner.desc': 'समान अध्ययन लक्ष्यों वाले छात्रों को खोजें।',
    'feat.community.name': 'Student Community',
    'feat.community.desc': 'छात्रों से जुड़ें और विचारों पर चर्चा करें।',
    'feat.chat.name': 'Chat',
    'feat.chat.desc': 'अन्य छात्रों और समूहों के साथ बातचीत करें।',
    'feat.study-rooms.name': 'Study Rooms',
    'feat.study-rooms.desc': 'सहयोगात्मक अध्ययन सत्रों में शामिल हों।',
    'feat.skillswap.name': 'SkillSwap',
    'feat.skillswap.desc': 'उपयोगी कौशल सीखें और एक दूसरे से बदलें।',

    'feat.campus-pulse.name': 'Campus Pulse',
    'feat.campus-pulse.desc': 'कॉलेज के ताज़ा अपडेट और नोटिस प्राप्त करें।',
    'feat.events-clubs.name': 'Events & Clubs',
    'feat.events-clubs.desc': 'कॉलेज इवेंट्स और छात्र क्लबों की खोज करें।',
    'feat.kampus-id.name': 'KAMPUS ID',
    'feat.kampus-id.desc': 'अपने डिजिटल छात्र पहचान पत्र तक पहुंचें।',
    'feat.student-voice.name': 'Student Voice',
    'feat.student-voice.desc': 'अपनी राय और कैम्पस फीडबैक साझा करें।',

    'feat.career.name': 'Career',
    'feat.career.desc': 'इंटर्नशिप, नौकरियों और करियर के अवसरों का अन्वेषण करें।',
    'feat.college-explorer.name': 'College Explorer',
    'feat.college-explorer.desc': 'कॉलेजों की खोज करें और तुलना करें।',

    'feat.market.name': 'KAMPUS Market',
    'feat.market.desc': 'छात्रों के लिए ज़रूरी सामान खरीदें और बेचें।',
    'feat.digital-locker.name': 'Digital Locker',
    'feat.digital-locker.desc': 'महत्वपूर्ण डिजिटल दस्तावेज़ व्यवस्थित रखें।',
    'feat.rewards.name': 'KAMPUS Rewards',
    'feat.rewards.desc': 'छात्र पुरस्कार और लाभ प्राप्त करें।',
    'feat.planner.name': 'KAMPUS Planner',
    'feat.planner.desc': 'शेड्यूल, कार्य और समय-सीमा व्यवस्थित करें।',

    'feat.notifications.name': 'Notification Center',
    'feat.notifications.desc': 'महत्वपूर्ण सूचनाओं से अपडेट रहें।',
    'feat.profile.name': 'Student Profile',
    'feat.profile.desc': 'अपनी छात्र जानकारी प्रबंधित करें।',
    'feat.settings.name': 'Settings',
    'feat.settings.desc': 'अपने KAMPUS अनुभव को कस्टमाइज़ करें।',
    'feat.btn.open': 'ओपन करें',

    // KAMPUS AI Showcase
    'ai.heading': 'अपने अध्ययन साथी से मिलें',
    'ai.description': 'कठिन विषयों को समझें, नोट्स बनाएं और KAMPUS AI के साथ स्मार्ट तैयारी करें।',
    'ai.input.placeholder': 'आज आप क्या सीखना चाहते हैं?',
    'ai.btn.explore': 'KAMPUS AI एक्सप्लोर करें',
    'ai.feat1.title': 'विषय समझें',
    'ai.feat1.desc': 'कठिन सिद्धांतों की सरल व्याख्या और गणितीय सूत्र कुछ ही सेकंड में।',
    'ai.feat2.title': 'नोट्स बनाएं',
    'ai.feat2.desc': 'मुख्य बुलेट पॉइंट्स, फॉर्मूला चीट शीट और रिवीजन नोट्स तुरंत निकालें।',
    'ai.feat3.title': 'क्विज़ तैयार करें',
    'ai.feat3.desc': 'परीक्षा की तैयारी के लिए बहुविकल्पीय प्रश्न और अभ्यास सेट बनाएं।',
    'ai.feat4.title': 'प्रश्न हल करें',
    'ai.feat4.desc': 'एल्गोरिदम, कैलकुलस, सर्किट और फिजिक्स का चरण-दर-चरण समाधान।',

    // Campus Life Showcase
    'campus.heading': 'अपने कैम्पस जीवन को सार्थक बनाएं',
    'campus.description': 'इवेंट्स खोजें, छात्रों से मिलें, समुदायों से जुड़ें और कॉलेज जीवन का पूरा अनुभव करें।',
    'campus.btn.events': 'इवेंट्स एक्सप्लोर करें',
    'campus.btn.community': 'कम्युनिटी से जुड़ें',

    // Career Showcase
    'career.heading': 'आपका भविष्य यहीं से शुरू होता है',
    'career.description': 'कॉलेज छात्रों के लिए विशेष रूप से क्यूरेट की गई इंटर्नशिप, छात्रवृत्तियां, कार्यशालाएं और करियर मार्गदर्शन देखें।',
    'career.internships': 'इंटर्नशिप',
    'career.internships.desc': 'सत्यापित समर रिसर्च फेलोशिप और कॉरपोरेट इंटर्नशिप लिस्टिंग।',
    'career.scholarships': 'छात्रवृत्तियां',
    'career.scholarships.desc': 'राष्ट्रीय मेरिट अनुदान और ट्यूशन फीस में छूट के अवसर।',
    'career.guidance': 'करियर मार्गदर्शन',
    'career.guidance.desc': 'AI रिज्यूमे एनालिसिस, प्लेसमेंट शॉर्टलिस्ट और मॉक इंटरव्यू।',
    'career.workshops': 'कार्यशालाएं',
    'career.workshops.desc': 'GenAI, क्लाउड सिस्टम्स और टेक पर लाइव हैंड्स-ऑन मास्टरक्लास।',
    'career.btn.explore': 'अवसर एक्सप्लोर करें',

    // Student Dashboard
    'dash.heading': 'विद्यार्थी एकेडमिक कॉकपिट',
    'dash.disclaimer': 'लाइव एकेडमिक सिंक · सक्रिय',
    'dash.progress': 'अध्ययन प्रगति',
    'dash.schedule': 'आज की कक्षाएं',
    'dash.tasks': 'आगामी कार्य',
    'dash.attendance': 'उपस्थिति',
    'dash.continue': 'पढ़ाई जारी रखें',
    'dash.btn.planner': 'पूरा प्लानर खोलें',

    // Footer
    'footer.tagline': 'आपका छात्र जीवन, जुड़ा हुआ।',
    'footer.desc': 'KAMPUS भारतीय कॉलेज छात्रों के लिए बनाया गया ऑल-इन-वन सुपर ऐप है, जो शिक्षा, सहपाठियों, कैम्पस जीवन, करियर और छात्र सेवाओं को एक साथ जोड़ता है।',
    'footer.col.features': 'प्लेटफॉर्म फीचर्स',
    'footer.col.support': 'सहायता और संपर्क',
    'footer.col.legal': 'कानूनी और गोपनीयता',
    'footer.about': 'KAMPUS के बारे में',
    'footer.support': 'सहायता और संपर्क',
    'footer.privacy': 'गोपनीयता नीति',
    'footer.terms': 'नियम और शर्तें',
    'footer.contact': 'संपर्क करें',
    'footer.rights': 'सर्वाधिकार सुरक्षित। भारतीय विश्वविद्यालय के छात्रों के लिए गर्व से निर्मित।',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('kampus_language');
      return (saved === 'hi' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('kampus_language', lang);
      document.documentElement.lang = lang;
      if (lang === 'hi') {
        document.body.classList.add('font-hindi');
      } else {
        document.body.classList.remove('font-hindi');
      }
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'hi') {
      document.body.classList.add('font-hindi');
    } else {
      document.body.classList.remove('font-hindi');
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
