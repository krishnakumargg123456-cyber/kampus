import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Bookmark,
  Flag,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  HelpCircle,
  FileUp,
  X,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import { FlashcardDeck, FlashcardItem } from '../../types/kampusAi';
import { runStructuredAiTool, uploadAndExtractDocument } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';

type StudyMode = 'Learn' | 'Practice' | 'Revision' | 'Difficult Cards';

export const FlashcardStudioTool: React.FC = () => {
  const {
    preferences,
    flashcardDecks,
    saveFlashcardDeck,
    deleteFlashcardDeck,
    addHistoryEntry,
    saveItem,
    getStudyHubSnapshot,
    pendingReopenData,
    clearPendingReopenData,
  } = useKampusAi();

  const studyHubSnap = getStudyHubSnapshot();

  const [sourceType, setSourceType] = useState<
    'Topic' | 'Chapter' | 'Study Hub Notes' | 'Uploaded Document' | 'Custom Text'
  >('Topic');
  const [topic, setTopic] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [count, setCount] = useState(8);
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(
    flashcardDecks[0] || null
  );
  const [mode, setMode] = useState<StudyMode>('Learn');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardHint, setCardHint] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingReopenData?.toolId === 'flashcards') {
      const p = pendingReopenData.payload || {};
      if (p.deck) {
        setActiveDeck(p.deck);
        setCardIndex(0);
        setIsFlipped(false);
      } else {
        if (p.topic) setTopic(p.topic);
        if (p.sourceType) setSourceType(p.sourceType);
        if (p.sourceText) setSourceText(p.sourceText);
      }
      clearPendingReopenData();
    }
  }, [pendingReopenData]);

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const att = await uploadAndExtractDocument(file);
      if (att.extractedText) {
        setSourceText(att.extractedText);
        if (!topic.trim()) setTopic(file.name.replace(/\.[^/.]+$/, ''));
      } else {
        setError('Please upload a text-extractable DOCX, PPTX, or TXT file for direct flashcard parsing.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to parse file.');
    } finally {
      setUploading(false);
    }
  };

  const generateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !sourceText.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await runStructuredAiTool<{
        deckTitle: string;
        cards: Array<{ front: string; back: string; hint?: string; difficulty: 'Easy' | 'Medium' | 'Hard' }>;
      }>('generate-flashcards', {
        sourceType,
        topic: topic.trim() || 'Custom Study Deck',
        sourceText: sourceText.trim(),
        count,
        language: preferences.language,
      });

      const deck: FlashcardDeck = {
        id: `deck_${Date.now()}`,
        title: res.deckTitle || topic.trim(),
        sourceLabel: sourceType,
        createdAt: new Date().toISOString(),
        cards: res.cards.map((c, idx) => ({
          id: `fc_${Date.now()}_${idx}`,
          front: c.front,
          back: c.back,
          hint: c.hint,
          difficulty: c.difficulty || 'Medium',
          mastered: false,
          markedDifficult: false,
          bookmarked: false,
        })),
      };

      saveFlashcardDeck(deck);
      setActiveDeck(deck);
      setCardIndex(0);
      setIsFlipped(false);
      setShowHint(false);

      addHistoryEntry({
        category: 'Flashcards',
        toolId: 'flashcards',
        title: deck.title,
        subtitle: `${deck.cards.length} cards · ${sourceType}`,
        payload: { deck },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to generate flashcards.');
    } finally {
      setLoading(false);
    }
  };

  const visibleCards = activeDeck
    ? mode === 'Difficult Cards'
      ? activeDeck.cards.filter((c) => c.markedDifficult || c.difficulty === 'Hard')
      : mode === 'Revision'
      ? activeDeck.cards.filter((c) => !c.mastered || c.bookmarked)
      : activeDeck.cards
    : [];

  const safeIndex = visibleCards.length > 0 ? Math.min(cardIndex, visibleCards.length - 1) : 0;
  const currentCard = visibleCards[safeIndex];

  const updateCurrentDeckCards = (updater: (cards: FlashcardItem[]) => FlashcardItem[]) => {
    if (!activeDeck) return;
    const updated: FlashcardDeck = { ...activeDeck, cards: updater(activeDeck.cards) };
    setActiveDeck(updated);
    saveFlashcardDeck(updated);
  };

  const openCustomCardModal = (existing?: FlashcardItem) => {
    if (existing) {
      setEditingCardId(existing.id);
      setCardFront(existing.front);
      setCardBack(existing.back);
      setCardHint(existing.hint || '');
    } else {
      setEditingCardId(null);
      setCardFront('');
      setCardBack('');
      setCardHint('');
    }
    setShowCardModal(true);
  };

  const handleSaveCardModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFront.trim() || !cardBack.trim() || !activeDeck) return;

    if (editingCardId) {
      updateCurrentDeckCards((cards) =>
        cards.map((c) =>
          c.id === editingCardId
            ? { ...c, front: cardFront.trim(), back: cardBack.trim(), hint: cardHint.trim() || undefined }
            : c
        )
      );
    } else {
      const newCard: FlashcardItem = {
        id: `fc_custom_${Date.now()}`,
        front: cardFront.trim(),
        back: cardBack.trim(),
        hint: cardHint.trim() || undefined,
        difficulty: 'Medium',
        mastered: false,
        markedDifficult: false,
        bookmarked: false,
      };
      updateCurrentDeckCards((cards) => [...cards, newCard]);
    }
    setShowCardModal(false);
  };

  const masteredCount = activeDeck ? activeDeck.cards.filter((c) => c.mastered).length : 0;

  return (
    <div className="space-y-6">
      <AiStatusBanner compact={!error} errorOverride={error} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Generator & Saved Decks */}
        <div className="lg:col-span-4 space-y-4">
          <form
            onSubmit={generateDeck}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3.5"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                AI Flashcard Generator
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
              >
                <option value="Topic">Topic</option>
                <option value="Chapter">Chapter</option>
                <option value="Study Hub Notes">Study Hub Notes</option>
                <option value="Uploaded Document">Uploaded Document</option>
                <option value="Custom Text">Custom Text</option>
              </select>
            </div>

            {sourceType === 'Study Hub Notes' && (
              <select
                onChange={(e) => {
                  const found = studyHubSnap.notes.find((n) => n.id === e.target.value);
                  if (found) {
                    setTopic(found.title);
                    setSourceText(found.content);
                  }
                }}
                defaultValue=""
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="">Select Study Hub Note...</option>
                {studyHubSnap.notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            )}

            {sourceType === 'Uploaded Document' && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx,.pptx,.txt,.md"
                  onChange={handleUploadDoc}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5 text-blue-600" />}
                  <span>Upload DOCX / PPTX / TXT</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Topic / Deck Title
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Organic Name Reactions, SQL Joins"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
              />
            </div>

            {(sourceType === 'Custom Text' || sourceText) && (
              <textarea
                rows={3}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste chapter text or revision notes..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cards to Generate ({count})
              </label>
              <input
                type="range"
                min={4}
                max={16}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!topic.trim() && !sourceText.trim())}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Building Deck...' : 'Generate Flashcards'}</span>
            </button>
          </form>

          {/* Saved Decks List */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              My Flashcard Decks ({flashcardDecks.length})
            </h3>
            {flashcardDecks.length === 0 ? (
              <p className="text-xs text-slate-400">
                No decks yet. Generate a flashcard deck above to begin practicing.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {flashcardDecks.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setActiveDeck(d);
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-2 ${
                      activeDeck?.id === d.id
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {d.title}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        {d.cards.filter((c) => c.mastered).length}/{d.cards.length} mastered
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFlashcardDeck(d.id);
                        if (activeDeck?.id === d.id) setActiveDeck(null);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Interactive Flip Card Workspace */}
        <div className="lg:col-span-8">
          {!activeDeck ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-10 text-center space-y-2 shadow-2xs">
              <Layers className="w-8 h-8 text-indigo-500 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Select or Generate a Flashcard Deck
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Practice active recall using flip cards, hints, difficult-card filtering, and custom card authoring.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
              {/* Deck Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    {activeDeck.title}
                  </h3>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Mastery: {masteredCount} of {activeDeck.cards.length} cards mastered
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openCustomCardModal()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      saveItem({
                        collection: 'Flashcards',
                        title: activeDeck.title,
                        summary: `${activeDeck.cards.length} flashcards (${masteredCount} mastered)`,
                        toolId: 'flashcards',
                        data: { deck: activeDeck },
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-orange-500" />
                    <span>Save Deck</span>
                  </button>
                </div>
              </div>

              {/* Study Mode Tabs */}
              <div className="flex flex-wrap gap-2">
                {(['Learn', 'Practice', 'Revision', 'Difficult Cards'] as StudyMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      mode === m
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {!currentCard ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
                  No cards match the "{mode}" filter right now. Switch back to Learn mode or mark cards as difficult/unmastered.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Interactive Flip Card */}
                  <div
                    onClick={() => setIsFlipped((f) => !f)}
                    className={`min-h-[250px] p-6 sm:p-8 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isFlipped
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-blue-600">
                        {isFlipped ? 'Answer / Back' : 'Prompt / Front'}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        Card {safeIndex + 1} / {visibleCards.length} · {currentCard.difficulty}
                      </span>
                    </div>

                    <div className="my-6 text-center space-y-3">
                      <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                        {isFlipped ? currentCard.back : currentCard.front}
                      </p>
                      {showHint && currentCard.hint && !isFlipped && (
                        <p className="text-xs text-orange-600 dark:text-orange-300 font-medium">
                          Hint: {currentCard.hint}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Click card to flip</span>
                    </div>
                  </div>

                  {/* Card Actions & Navigation */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {currentCard.hint && (
                        <button
                          type="button"
                          onClick={() => setShowHint((h) => !h)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                          <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          updateCurrentDeckCards((cards) =>
                            cards.map((c) =>
                              c.id === currentCard.id ? { ...c, mastered: !c.mastered } : c
                            )
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          currentCard.mastered
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{currentCard.mastered ? 'Mastered' : 'Mark Mastered'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateCurrentDeckCards((cards) =>
                            cards.map((c) =>
                              c.id === currentCard.id
                                ? { ...c, markedDifficult: !c.markedDifficult }
                                : c
                            )
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          currentCard.markedDifficult
                            ? 'bg-rose-50 border-rose-500 text-rose-700'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Difficult</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateCurrentDeckCards((cards) =>
                            cards.map((c) =>
                              c.id === currentCard.id ? { ...c, bookmarked: !c.bookmarked } : c
                            )
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          currentCard.bookmarked
                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Bookmark</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openCustomCardModal(currentCard)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Edit card"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateCurrentDeckCards((cards) =>
                            cards.filter((c) => c.id !== currentCard.id)
                          )
                        }
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 cursor-pointer"
                        title="Delete card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeIndex === 0}
                        onClick={() => {
                          setCardIndex((i) => Math.max(0, i - 1));
                          setIsFlipped(false);
                          setShowHint(false);
                        }}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={safeIndex >= visibleCards.length - 1}
                        onClick={() => {
                          setCardIndex((i) => Math.min(visibleCards.length - 1, i + 1));
                          setIsFlipped(false);
                          setShowHint(false);
                        }}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Flashcard Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCardModal}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editingCardId ? 'Edit Flashcard' : 'Add Custom Flashcard'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Front (Question / Prompt)</label>
              <textarea
                rows={2}
                required
                value={cardFront}
                onChange={(e) => setCardFront(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Back (Answer / Explanation)</label>
              <textarea
                rows={3}
                required
                value={cardBack}
                onChange={(e) => setCardBack(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Optional Hint</label>
              <input
                type="text"
                value={cardHint}
                onChange={(e) => setCardHint(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Save Card
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
