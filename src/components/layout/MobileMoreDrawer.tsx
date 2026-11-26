import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Briefcase, ShoppingBag, ShieldCheck, Gift, Clock, Bell, User, Settings, Sparkles, LogOut, ChevronRight, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({ isOpen, onClose }) => {
  const { profile, logout } = useAuth();

  if (!isOpen) return null;

  const categories = [
    {
      title: 'Career & Commerce',
      items: [
        { label: 'Career (Placements & Jobs)', path: '/career', icon: Briefcase },
        { label: 'KAMPUS Market (Buy & Sell)', path: '/market', icon: ShoppingBag },
      ],
    },
    {
      title: 'Student Tools',
      items: [
        { label: 'Student Toolkit (Calculators & Tools)', path: '/tools/toolkit', icon: Wrench },
        { label: 'Digital Locker (Transcripts & ID)', path: '/tools/digital-locker', icon: ShieldCheck },
        { label: 'KAMPUS Rewards (Earn & Redeem)', path: '/tools/rewards', icon: Gift },
        { label: 'KAMPUS Planner (Timetable & Safe Zone)', path: '/tools/planner', icon: Clock },
      ],
    },
    {
      title: 'Account & Settings',
      items: [
        { label: 'Notification Center', path: '/account/notifications', icon: Bell },
        { label: 'Student Profile', path: '/account/profile', icon: User },
        { label: 'Settings & Privacy', path: '/account/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
    >
      <div 
        className="w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              All KAMPUS Modules
            </h3>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
              21 Modules
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Directory links */}
        <div className="space-y-4 my-4">
          {categories.map((cat, idx) => (
            <div key={idx}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                {cat.title}
              </span>
              <div className="space-y-1">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out from KAMPUS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
