import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Users, Building2, MoreHorizontal } from 'lucide-react';
import { MobileMoreDrawer } from './MobileMoreDrawer';

export const MobileBottomNav: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const tabs = [
    { label: 'Home', path: '/', icon: Home, end: true },
    { label: 'Learn', path: '/learn/study-hub', icon: BookOpen },
    { label: 'Connect', path: '/connect/community', icon: Users },
    { label: 'Campus', path: '/campus/campus-pulse', icon: Building2 },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="grid grid-cols-5 h-full max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </div>
                    <span className="text-[10px] tracking-tight mt-1">
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* 5th Tab: More Drawer */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">More</span>
          </button>
        </div>
      </nav>

      <MobileMoreDrawer
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
      />
    </>
  );
};
