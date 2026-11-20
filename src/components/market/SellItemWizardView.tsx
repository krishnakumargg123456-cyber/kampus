import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gift,
  ImagePlus,
  MapPin,
  PackagePlus,
  Repeat,
  ShieldAlert,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import {
  ALL_MARKET_CATEGORIES,
  CAMPUS_DIRECTORY,
  MARKET_CONDITIONS,
  MARKET_IMAGE_ASSETS,
  formatMarketINR,
  resolveMarketImage,
} from '../../data/marketData';
import type { MarketCategory, MarketCondition, MarketListingType } from '../../types/market';

interface SellItemWizardViewProps {
  onPublished: () => void;
  onCancel: () => void;
}

const PRESET_STUDIO_KEYS = [
  { key: 'books', label: 'Textbook / Notes' },
  { key: 'calculator', label: 'Calculator / Tech' },
  { key: 'lamp', label: 'Study Lamp' },
  { key: 'drawing_kit', label: 'Stationery / Kit' },
  { key: 'backpack', label: 'Backpack / Bag' },
  { key: 'study_table', label: 'Study Furniture' },
  { key: 'headphones', label: 'Audio / Headphones' },
  { key: 'lab_gear', label: 'Lab Equipment' },
];

export const SellItemWizardView: React.FC<SellItemWizardViewProps> = ({
  onPublished,
  onCancel,
}) => {
  const { profile } = useAuth();
  const { categories, isRestricted, uploadProductImage, createListing, showToast } = useMarket();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Step 1
  const [listingType, setListingType] = useState<MarketListingType>('For Sale');

  // Step 2
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MarketCategory>('Books & Study');
  const [subcategory, setSubcategory] = useState('NCERT Books');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<MarketCondition>('Good');
  const [priceINR, setPriceINR] = useState('');
  const [originalPriceINR, setOriginalPriceINR] = useState('');
  const [negotiable, setNegotiable] = useState(true);
  const [description, setDescription] = useState('');
  const [preferredExchangeItem, setPreferredExchangeItem] = useState('');
  const [exchangeDescription, setExchangeDescription] = useState('');

  // Step 3
  const [images, setImages] = useState<string[]>(['books']);
  const [coverIndex, setCoverIndex] = useState(0);

  // Step 4
  const defaultCampus = CAMPUS_DIRECTORY[1];
  const [sellerCampus, setSellerCampus] = useState(profile.college || defaultCampus.campus);
  const [sellerCity, setSellerCity] = useState(defaultCampus.city);
  const [sellerArea, setSellerArea] = useState('Main Academic Block');
  const [pickupPoint, setPickupPoint] = useState('Central Library Gate (Public Area)');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);

  const availableSubcategories = useMemo(() => {
    const found = categories.find((c) => c.category === category);
    return found?.subcategories || ['General'];
  }, [categories, category]);

  const handleCategoryChange = (nextCat: MarketCategory) => {
    setCategory(nextCat);
    const nextSubs = categories.find((c) => c.category === nextCat)?.subcategories || [];
    setSubcategory(nextSubs[0] || 'General');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingPhoto(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files.slice(0, 6)) {
        const url = await uploadProductImage(file);
        if (url) uploadedUrls.push(url);
      }
      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls].slice(0, 8));
        showToast('success', `Uploaded ${uploadedUrls.length} product photo(s).`);
      }
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[target];
      copy[target] = temp;
      return copy;
    });
    if (coverIndex === idx) setCoverIndex(target);
    else if (coverIndex === target) setCoverIndex(idx);
  };

  const removeImage = (idx: number) => {
    if (images.length <= 1) {
      showToast('error', 'At least one product photo is required.');
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (coverIndex >= images.length - 1) setCoverIndex(0);
  };

  const validateStep = (targetStep: number): boolean => {
    if (targetStep >= 3 && step === 2) {
      if (!title.trim() || !description.trim()) {
        showToast('error', 'Please enter a product title and description.');
        return false;
      }
      if (listingType === 'For Sale') {
        const p = Number(priceINR);
        if (!Number.isFinite(p) || p <= 0) {
          showToast('error', 'Please enter a valid selling price in INR.');
          return false;
        }
      }
    }
    if (targetStep >= 5 && step === 4) {
      if (!sellerCampus.trim() || !sellerCity.trim() || !pickupPoint.trim()) {
        showToast('error', 'Please fill campus, city, and a public pickup point.');
        return false;
      }
    }
    return true;
  };

  const goToStep = (next: 1 | 2 | 3 | 4 | 5) => {
    if (next > step && !validateStep(next)) return;
    setStep(next);
  };

  const handlePublish = async () => {
    if (isRestricted) {
      showToast('error', 'Your account is restricted from publishing marketplace listings.');
      return;
    }
    setSubmitting(true);
    try {
      const parsedPrice = listingType === 'For Sale' ? Number(priceINR) : 0;
      const parsedOrig =
        listingType === 'For Sale' && originalPriceINR.trim()
          ? Number(originalPriceINR)
          : null;
      const created = await createListing({
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory,
        brand: brand.trim() || undefined,
        listingType,
        condition,
        priceINR: parsedPrice,
        originalPriceINR: parsedOrig,
        negotiable: listingType === 'For Sale' ? negotiable : false,
        preferredExchangeItem:
          listingType === 'Exchange' ? preferredExchangeItem.trim() : undefined,
        exchangeDescription: listingType === 'Exchange' ? exchangeDescription.trim() : undefined,
        images,
        coverIndex,
        sellerCampus: sellerCampus.trim(),
        sellerCity: sellerCity.trim(),
        sellerArea: sellerArea.trim(),
        pickupPoint: pickupPoint.trim(),
        deliveryAvailable,
      });
      if (created) {
        onPublished();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isRestricted && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center gap-3 text-xs text-red-700 dark:text-red-300">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Your account is currently restricted from publishing new marketplace listings. Contact a
            platform moderator for review.
          </span>
        </div>
      )}

      {/* Step Indicator */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-blue-600" />
              <span>List an Item on KAMPUS Market</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete all 5 quick steps to publish your listing to fellow students.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Cancel Wizard
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2 text-[11px]">
          {[
            { num: 1, label: 'Type' },
            { num: 2, label: 'Details' },
            { num: 3, label: 'Photos' },
            { num: 4, label: 'Pickup' },
            { num: 5, label: 'Publish' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num <= step) setStep(s.num as 1 | 2 | 3 | 4 | 5);
              }}
              className={`py-2 px-2 rounded-xl font-semibold border text-center transition-colors ${
                step === s.num
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : s.num < step
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="tabular-nums">{s.num}. </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Body */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Step 1: Choose Listing Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  type: 'For Sale' as MarketListingType,
                  icon: Tag,
                  title: 'For Sale',
                  desc: 'Sell books, gadgets, hostel items, or furniture at student-friendly prices.',
                },
                {
                  type: 'Giveaway' as MarketListingType,
                  icon: Gift,
                  title: 'Free Giveaway',
                  desc: 'List in Free Corner so another student can reuse your item at ₹0.',
                },
                {
                  type: 'Exchange' as MarketListingType,
                  icon: Repeat,
                  title: 'Swap / Exchange',
                  desc: 'Trade items directly with another student on campus via Exchange Hub.',
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = listingType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setListingType(opt.type)}
                    className={`p-5 rounded-2xl border text-left space-y-2 transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {opt.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Step 2: Add Product Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="sm:col-span-2 block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Product Title *
                </span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Casio fx-991EX Scientific Calculator"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Category</span>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as MarketCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {ALL_MARKET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Subcategory
                </span>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Condition
                </span>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as MarketCondition)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {MARKET_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Brand / Publisher (Optional)
                </span>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., NCERT, Casio, Logitech, Mi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              {listingType === 'For Sale' && (
                <>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Selling Price (₹ INR) *
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={priceINR}
                      onChange={(e) => setPriceINR(e.target.value)}
                      placeholder="e.g., 550"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Original Price (Optional MRP ₹)
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={originalPriceINR}
                      onChange={(e) => setOriginalPriceINR(e.target.value)}
                      placeholder="Only enter genuine MRP if known"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
                    />
                  </label>

                  <label className="sm:col-span-2 flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={negotiable}
                      onChange={(e) => setNegotiable(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Price is open to student offers (Negotiable)
                    </span>
                  </label>
                </>
              )}

              {listingType === 'Exchange' && (
                <>
                  <label className="sm:col-span-2 block space-y-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Preferred Item in Exchange
                    </span>
                    <input
                      type="text"
                      value={preferredExchangeItem}
                      onChange={(e) => setPreferredExchangeItem(e.target.value)}
                      placeholder="e.g., Desk lamp, reference textbooks, wireless keyboard"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </label>
                  <label className="sm:col-span-2 block space-y-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Exchange Terms / Preferences
                    </span>
                    <input
                      type="text"
                      value={exchangeDescription}
                      onChange={(e) => setExchangeDescription(e.target.value)}
                      placeholder="Describe condition expectations or flexible swap options"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </label>
                </>
              )}

              <label className="sm:col-span-2 block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Product Description *
                </span>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe usage history, included accessories, and condition honestly..."
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 text-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 3: Upload Product Images
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Upload PNG, JPG, JPEG, or WEBP photos (up to 5 MB each), reorder photos, and choose
                your cover image.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-2 cursor-pointer">
                <ImagePlus className="w-4 h-4" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Upload Product Photos'}</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  multiple
                  disabled={uploadingPhoto}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-slate-400 tabular-nums">
                {images.length} / 8 photos attached
              </span>
            </div>

            {/* Uploaded / Active Photo Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((imgKey, idx) => (
                <div
                  key={`${imgKey}-${idx}`}
                  className={`rounded-xl border overflow-hidden bg-slate-50 dark:bg-slate-800 ${
                    idx === coverIndex
                      ? 'border-blue-600 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900">
                    <img
                      src={resolveMarketImage(imgKey)}
                      alt={`Upload preview ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => setCoverIndex(idx)}
                      className={`px-2 py-1 rounded-md font-semibold inline-flex items-center gap-1 ${
                        idx === coverIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Star className="w-3 h-3" />
                      <span>{idx === coverIndex ? 'Cover' : 'Set Cover'}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, -1)}
                        aria-label="Move photo left"
                        className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => moveImage(idx, 1)}
                        aria-label="Move photo right"
                        className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label="Remove photo"
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Studio Reference Photos (if student hasn't taken a photo yet) */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Or pick a studio placeholder photo while drafting:
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_STUDIO_KEYS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => {
                      if (!images.includes(preset.key)) {
                        setImages((prev) => [...prev, preset.key].slice(0, 8));
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-500 flex items-center gap-2"
                  >
                    <img
                      src={MARKET_IMAGE_ASSETS[preset.key]}
                      alt={preset.label}
                      className="w-5 h-5 rounded object-cover"
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Step 4: Pickup &amp; Location</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              For your privacy, only your campus and public meetup point are displayed publicly.
              Exact hostel room numbers or personal addresses are never exposed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Campus / University *
                </span>
                <input
                  type="text"
                  value={sellerCampus}
                  onChange={(e) => setSellerCampus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">City *</span>
                <input
                  type="text"
                  value={sellerCity}
                  onChange={(e) => setSellerCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Campus Zone / Area
                </span>
                <input
                  type="text"
                  value={sellerArea}
                  onChange={(e) => setSellerArea(e.target.value)}
                  placeholder="e.g., Main Academic Zone / North Gate"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Preferred Public Pickup Point *
                </span>
                <input
                  type="text"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  placeholder="e.g., Central Library Gate / Student Center"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <label className="sm:col-span-2 flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={deliveryAvailable}
                  onChange={(e) => setDeliveryAvailable(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  I can hand-deliver within campus public areas
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Step 5: Preview &amp; Publish
            </h3>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 overflow-hidden grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-5 aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                <img
                  src={resolveMarketImage(images[coverIndex] || images[0])}
                  alt={title || 'Listing preview'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:col-span-7 p-5 space-y-3 text-xs">
                <div className="flex flex-wrap gap-2 font-semibold">
                  <span className="px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                    {listingType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {category} · {subcategory}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {condition}
                  </span>
                </div>

                <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {title || 'Untitled Listing'}
                </h4>

                <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                  {formatMarketINR(
                    listingType === 'For Sale' ? Number(priceINR) || 0 : 0,
                    listingType
                  )}
                </p>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {description}
                </p>

                {listingType === 'Exchange' && preferredExchangeItem && (
                  <p className="text-slate-700 dark:text-slate-200">
                    <strong>Preferred in exchange:</strong> {preferredExchangeItem}
                  </p>
                )}

                <p className="text-slate-500 dark:text-slate-400">
                  Pickup: {pickupPoint} · {sellerCampus}, {sellerCity}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 font-semibold"
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 font-semibold"
                  >
                    Edit Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 font-semibold"
                  >
                    Edit Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => goToStep((step + 1) as 1 | 2 | 3 | 4 | 5)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || isRestricted}
              onClick={handlePublish}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Publishing...' : 'Publish Listing'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
