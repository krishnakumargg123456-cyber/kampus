import React, { useMemo, useState } from 'react';
import { Check, Plus, Search, Users, X } from 'lucide-react';
import { COMMUNITY_CATEGORIES } from '../../data/communityData';
import { useCommunity } from '../../context/CommunityContext';
import { CommunityCategory } from '../../types/community';

interface ExploreCommunitiesViewProps {
  onSelectCommunity: (communityId: string) => void;
}

export const ExploreCommunitiesView: React.FC<ExploreCommunitiesViewProps> = ({
  onSelectCommunity,
}) => {
  const {
    state,
    visiblePosts,
    isMemberOfCommunity,
    joinCommunity,
    leaveCommunity,
    createCommunity,
  } = useCommunity();

  const [category, setCategory] = useState<'All' | CommunityCategory>('All');
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState<'members' | 'active' | 'alpha'>('members');
  const [createOpen, setCreateOpen] = useState(false);

  // Create community form
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<CommunityCategory>('Academic');
  const [newDesc, setNewDesc] = useState('');
  const [newRules, setNewRules] = useState('');
  const [formErr, setFormErr] = useState<string | null>(null);

  const postCounts = useMemo(() => {
    const map = new Map<string, number>();
    visiblePosts.forEach((p) => map.set(p.communityId, (map.get(p.communityId) || 0) + 1));
    return map;
  }, [visiblePosts]);

  const filtered = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    return state.communities
      .filter((c) => (category === 'All' ? true : c.category === category))
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'alpha') return a.name.localeCompare(b.name);
        if (sortBy === 'active') return (postCounts.get(b.id) || 0) - (postCounts.get(a.id) || 0);
        return b.members.length - a.members.length;
      });
  }, [state.communities, category, localSearch, sortBy, postCounts]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 3 || newDesc.trim().length < 10) {
      setFormErr('Enter a community name (3+ chars) and description (10+ chars).');
      return;
    }
    const id = createCommunity({
      name: newName,
      category: newCat,
      description: newDesc,
      rules: newRules
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
    });
    setCreateOpen(false);
    setNewName('');
    setNewDesc('');
    setNewRules('');
    setFormErr(null);
    onSelectCommunity(id);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Explore Academic & Campus Communities
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {state.communities.length} communities across 5 academic and student life categories
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Community
        </button>
      </div>

      {/* Category & Search Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', ...COMMUNITY_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter communities..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="members">Most Members</option>
            <option value="active">Most Active</option>
            <option value="alpha">A – Z</option>
          </select>
        </div>
      </div>

      {/* Community Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((comm) => {
          const joined = isMemberOfCommunity(comm.id);
          const countPosts = postCounts.get(comm.id) || 0;

          return (
            <div
              key={comm.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <button
                  type="button"
                  onClick={() => onSelectCommunity(comm.id)}
                  className="block w-full h-36 overflow-hidden cursor-pointer"
                >
                  <img
                    src={comm.coverImage}
                    alt={comm.name}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform"
                  />
                </button>
                <div className="p-4">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {comm.category}
                    {comm.isDemoCommunity ? ' · Demo' : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectCommunity(comm.id)}
                    className="mt-1 text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 text-left cursor-pointer"
                  >
                    {comm.name}
                  </button>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {comm.description}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 tabular-nums">
                  <Users className="w-3.5 h-3.5" />
                  {comm.members.length} members · {countPosts} posts
                </span>

                <button
                  type="button"
                  onClick={() => (joined ? leaveCommunity(comm.id) : joinCommunity(comm.id))}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    joined
                      ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {joined ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Joined
                    </>
                  ) : (
                    'Join'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Community Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create New Student Community
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {formErr && <p className="text-xs text-red-600">{formErr}</p>}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Data Science & ML Learners"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as CommunityCategory)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  {COMMUNITY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What will students learn and discuss here?"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Community Rules (one per line)
                </label>
                <textarea
                  rows={3}
                  value={newRules}
                  onChange={(e) => setNewRules(e.target.value)}
                  placeholder="Keep discussions helpful and constructive&#10;Cite sources for shared study material"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
