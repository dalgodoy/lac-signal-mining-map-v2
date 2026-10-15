import React, { useMemo, useState } from 'react';
import { Initiative } from '../types';
import { 
  getCountryInfo, 
  SUBREGION_PRESETS, 
  CountryMetadata,
  countryNameToCode 
} from '../data/countries';
import { Check, X, RotateCcw, Share2, Layers } from 'lucide-react';

export interface CountryFilterChipsProps {
  initiatives: Initiative[];
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  variant?: 'sidebar' | 'horizontal' | 'compact';
  onShareLink?: () => void;
}

interface CountryStats {
  info: CountryMetadata;
  count: number;
}

export const CountryFilterChips: React.FC<CountryFilterChipsProps> = ({
  initiatives,
  selectedCodes,
  onChange,
  variant = 'sidebar',
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  // Compute unique countries present in the dataset and their counts
  const countryList: CountryStats[] = useMemo(() => {
    const counts: Record<string, { info: CountryMetadata; count: number }> = {};

    initiatives.forEach((item) => {
      const countryRaw = (item.country || '').trim();
      if (!countryRaw) return;
      const info = getCountryInfo(countryRaw);
      if (!counts[info.code]) {
        counts[info.code] = { info, count: 0 };
      }
      counts[info.code].count += 1;
    });

    // Sort descending by count, then by country name
    return Object.values(counts).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.info.name.localeCompare(b.info.name);
    });
  }, [initiatives]);

  const allAvailableCodes = useMemo(() => countryList.map((c) => c.info.code), [countryList]);

  // Toggle an individual country chip
  const handleToggleCountry = (code: string) => {
    if (selectedCodes.includes(code)) {
      onChange(selectedCodes.filter((c) => c !== code));
    } else {
      onChange([...selectedCodes, code]);
    }
  };

  // "All" button: selects all available country codes
  const handleSelectAll = () => {
    onChange([...allAvailableCodes]);
  };

  // "Clear" button: resets selection to empty (showing all countries)
  const handleClear = () => {
    onChange([]);
  };

  // Sub-region preset selection
  const handleApplyPreset = (presetCodes: string[]) => {
    // Select only codes that exist in the current dataset
    const matchingInDataset = presetCodes.filter((code) => allAvailableCodes.includes(code));
    
    // Check if preset is already fully selected
    const isAlreadyFullySelected = 
      matchingInDataset.length > 0 &&
      matchingInDataset.every((code) => selectedCodes.includes(code)) &&
      selectedCodes.length === matchingInDataset.length;

    if (isAlreadyFullySelected) {
      // Toggle off preset if clicked again
      onChange([]);
    } else {
      onChange(matchingInDataset);
    }
  };

  // Copy shareable URL
  const handleCopyShareLink = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    });
  };

  const isFiltered = selectedCodes.length > 0;
  const isAllExplicitlySelected = 
    selectedCodes.length > 0 && 
    allAvailableCodes.every((c) => selectedCodes.includes(c));

  return (
    <div className="space-y-2.5">
      {/* Header and Shortcuts Row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Country Filter
            </span>
            {isFiltered && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {selectedCodes.length} active
              </span>
            )}
            {!isFiltered && (
              <span className="text-[10px] text-slate-400 font-medium">
                (showing all)
              </span>
            )}
          </div>

          {/* Share View Action */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            title="Copy shareable link with current country filters"
            className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3 text-slate-400 hover:text-indigo-600" />
                <span>Share view</span>
              </>
            )}
          </button>
        </div>

        {/* Shortcuts Bar: All, Clear, and Sub-region Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* All Button */}
          <button
            type="button"
            onClick={handleSelectAll}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isAllExplicitlySelected
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Select all countries"
          >
            All
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            disabled={!isFiltered}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 ${
              isFiltered
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer'
                : 'opacity-40 bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Clear country filters (show all)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>

          <span className="text-slate-300 font-light select-none">|</span>

          {/* Presets */}
          {SUBREGION_PRESETS.map((preset) => {
            const relevantPresetCodes = preset.codes.filter((c) => allAvailableCodes.includes(c));
            if (relevantPresetCodes.length === 0) return null;

            const isPresetActive =
              relevantPresetCodes.every((c) => selectedCodes.includes(c)) &&
              selectedCodes.length === relevantPresetCodes.length;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.codes)}
                title={`${preset.description}`}
                className={`px-2 py-0.8 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isPresetActive
                    ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-300 ring-1 ring-indigo-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Flag Chips Grid / Wrapped Column */}
      <div 
        className={`flex flex-wrap gap-1.5 ${
          variant === 'sidebar' ? 'max-h-56 overflow-y-auto pr-1 py-1' : ''
        }`}
      >
        {countryList.map(({ info, count }) => {
          const isSelected = selectedCodes.includes(info.code);
          const isDimmed = isFiltered && !isSelected;

          return (
            <button
              key={info.code}
              type="button"
              onClick={() => handleToggleCountry(info.code)}
              title={`${info.name}: ${count} initiative${count === 1 ? '' : 's'}${
                isSelected ? ' (Click to remove)' : ' (Click to select)'
              }`}
              className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-all select-none cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200 font-bold scale-[1.02]'
                  : isDimmed
                  ? 'bg-slate-50/80 text-slate-400 border-slate-200/60 opacity-45 hover:opacity-85 hover:border-slate-300 grayscale-[35%]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300 shadow-2xs font-semibold'
              }`}
            >
              {/* Flag Emoji */}
              <span className="text-sm leading-none shrink-0" role="img" aria-label={info.name}>
                {info.flag}
              </span>

              {/* ISO Code */}
              <span className="tracking-tight uppercase">
                {info.code}
              </span>

              {/* Small Badge showing initiative count */}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                  isSelected
                    ? 'bg-white text-indigo-700'
                    : isDimmed
                    ? 'bg-slate-200/60 text-slate-400'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
