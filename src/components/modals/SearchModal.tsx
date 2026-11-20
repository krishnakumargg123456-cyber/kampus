import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  BookOpen,
  Sparkles,
  Calendar,
  Briefcase,
  Shield,
  Clock,
  Users,
  Award,
  ArrowRight,
  CornerDownLeft,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { SEARCH_INDEX, SearchResultItem } from '../../data/searchIndex';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAi: (query?: string) => void;
}

type FilterCategory = 'all' | 'modules' | 'study' | 'campus' | 'career';

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onOpenAi,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  // Reset query and selectedIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveFilter('all');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter items based on query and active category tab
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    let items = SEARCH_INDEX;
    if (activeFilter !== 'all') {
      items = items.filter((item) => item.category === activeFilter);
    }

    if (!q) {
      return items.slice(0, 10);
    }

    return items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchTitleHi = item.titleHi.toLowerCase().includes(q);
      const matchSub = item.subtitle.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchTitleHi || matchSub || matchKeywords;
    });
  }, [query, activeFilter]);

  // Ensure selectedIndex stays in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeFilter]);

  // Handle keyboard navigation (Arrow Up, Down, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex].path);
        } else if (query.trim()) {
          onClose();
          onOpenAi(query.trim());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredResults, query, onClose, onOpenAi]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  const getIcon = (type: SearchResultItem['iconType']) => {
    switch (type) {
      case 'book':
        return BookOpen;
      case 'sparkles':
        return Sparkles;
      case 'calendar':
        return Calendar;
      case 'briefcase':
        return Briefcase;
      case 'shield':
        return Shield;
      case 'clock':
        return Clock;
      case 'users':
        return Users;
      case 'award':
        return Award;
      default:
        return Layers;
    }
  };

  const categories: { id: FilterCategory; label: string; count?: number }[] = [
    { id: 'all', label: language === 'hi' ? 'सभी (All)' : 'All Results' },
    { id: 'modules', label: language === 'hi' ? '21 मॉड्यूल्स' : 'Modules (21)' },
    { id: 'study', label: language === 'hi' ? 'स्टडी नोट्स' : 'Study & Notes' },
    { id: 'campus', label: language === 'hi' ? 'कैम्पस और इवेंट्स' : 'Campus & Events' },
    { id: 'career', label: language === 'hi' ? 'करियर और ग्रांट्स' : 'Career & Grants' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header Search Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder={
              language === 'hi'
                ? 'KAMPUS में खोजें: मॉड्यूल्स, नोट्स, टाइमटेबल, स्कॉलरशिप, इवेंट्स...'
                : 'Search anything in KAMPUS: 21 modules, courses, notes, hackathons, grants...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Quick Filter Tabs */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content list */}
        <div ref={listRef} className="p-3 overflow-y-auto flex-1 space-y-1">
          {/* Ask AI Dynamic Card */}
          {query.trim() && (
            <div
              onClick={() => {
                onClose();
                onOpenAi(query.trim());
              }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 hover:shadow-xs cursor-pointer transition-all mb-2 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div className="truncate">
                  <div className="text-sm font-bold truncate">
                    Ask KAMPUS AI: &ldquo;{query}&rdquo;
                  </div>
                  <div className="text-xs text-blue-600/80 dark:text-blue-400">
                    Get instant 24/7 academic tutoring, notes, formula derivation & answers
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                <span className="hidden sm:inline">Ask AI</span>
                <CornerDownLeft className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Section Indicator */}
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>
              {query.trim()
                ? `Search Matches (${filteredResults.length})`
                : activeFilter === 'all'
                ? 'Quick Navigation & Popular Tools'
                : `Filtered Results (${filteredResults.length})`}
            </span>
            <span className="text-[10px] font-normal text-slate-400">
              {filteredResults.length} items
            </span>
          </div>

          {/* Zero Results State */}
          {filteredResults.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No matching results found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Try searching for Study Hub, Digital Locker, Scholarships, or ask AI.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenAi(query.trim());
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ask KAMPUS AI about &ldquo;{query}&rdquo;</span>
              </button>
            </div>
          )}

          {/* Result Items */}
          {filteredResults.map((item, idx) => {
            const Icon = getIcon(item.iconType);
            const isSelected = idx === selectedIndex;
            const displayTitle = language === 'hi' ? item.titleHi : item.title;

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item.path)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all group ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs'
                    : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold truncate transition-colors ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      >
                        {displayTitle}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {item.categoryLabel}
                      </span>{' '}
                      · {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {isSelected && (
                    <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 hidden sm:inline-block">
                      ↵ Enter
                    </span>
                  )}
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400 translate-x-1'
                        : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & keyboard shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono shadow-2xs">
                ↓
              </kbd>
              <span className="text-[11px] ml-0.5">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono shadow-2xs">
                ↵
              </kbd>
              <span className="text-[11px] ml-0.5">Open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono shadow-2xs">
                ESC
              </kbd>
              <span className="text-[11px] ml-0.5">Close</span>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>KAMPUS FastSearch</span>
          </span>
        </div>
      </div>
    </div>
  );
};
