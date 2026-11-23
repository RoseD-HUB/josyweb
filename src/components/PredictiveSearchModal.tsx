import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { CATEGORIES, formatMoney } from '../data/catalog';
import { useStore } from '../context/StoreContext';

const POPULAR_TERMS = ['Ankara Bomber', 'Senator', 'Agbada', 'Adire', 'Cashmere Suit', 'Aso-Oke'];

export function PredictiveSearchModal() {
  const {
    isSearchOpen,
    setIsSearchOpen,
    products,
    currency,
    setSelectedProduct,
    setActiveCategoryFilter,
    setActivePage,
  } = useStore();
  const [queryText, setQueryText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQueryText('');
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const results = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return products.slice(0, 4);
    return products.filter((p) => {
      const swatchText = p.swatches.map((s) => `${s.name} ${s.material} ${s.patternType}`).join(' ');
      const haystack = `${p.name} ${p.sku} ${p.categoryName} ${p.description} ${swatchText}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [products, queryText]);

  const matchedCategories = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return [];
    return CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.scope.toLowerCase().includes(q) ||
        c.code.includes(q)
    );
  }, [queryText]);

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="bg-white w-full max-w-3xl border border-[#E4E4E0] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E4E4E0]">
          <Search className="w-5 h-5 text-[#71717A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search garments, Nigerian styles, or textiles (e.g., Ankara, Senator, Adire, Wool)..."
            className="w-full text-sm sm:text-base text-[#111113] placeholder:text-[#A1A1AA] focus:outline-none"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => setQueryText('')}
              className="text-xs text-[#71717A] hover:text-[#111113] cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Close search"
            className="p-1.5 text-[#71717A] hover:text-[#111113] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Fabric & Style Terms */}
        <div className="px-6 py-3 bg-[#F7F7F5] border-b border-[#E4E4E0] flex items-center gap-4 overflow-x-auto text-xs">
          <span className="text-[#71717A] shrink-0">Popular searches:</span>
          {POPULAR_TERMS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQueryText(term)}
              className="text-[#27272A] hover:text-[#1B365D] underline-offset-4 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Predictive Results */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {matchedCategories.length > 0 && (
            <div>
              <p className="text-xs text-[#71717A] mb-3">Matching Categories</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {matchedCategories.map((cat) => (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => {
                      setActiveCategoryFilter(cat.code);
                      setActivePage('home');
                      setIsSearchOpen(false);
                      window.setTimeout(() => {
                        document
                          .getElementById('new-arrivals-catalog')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }, 80);
                    }}
                    className="flex items-center justify-between p-3 border border-[#E4E4E0] hover:border-[#111113] transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="font-mono text-xs text-[#71717A] mr-2">{cat.code}</span>
                      <span className="text-sm font-medium text-[#111113]">{cat.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#71717A]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-[#71717A] mb-3">
              {queryText.trim()
                ? `${results.length} matching garment${results.length === 1 ? '' : 's'}`
                : 'Featured Textiles & Silhouettes'}
            </p>
            {results.length === 0 ? (
              <p className="text-sm text-[#52525B] py-8 text-center">
                No garments matched &ldquo;{queryText}&rdquo;. Try searching for Ankara, Senator, Agbada, Suit, or Adire.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center gap-4 p-2.5 border border-[#E4E4E0] hover:border-[#111113] transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-20 object-cover bg-[#F2F2F0] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-[#71717A] truncate">
                        {product.categoryCode} · {product.categoryName}
                      </p>
                      <p className="text-sm font-medium text-[#111113] truncate mt-0.5">
                        {product.name}
                      </p>
                      <p className="font-mono text-xs text-[#1B365D] tabular-nums mt-1">
                        {formatMoney(product.priceNGN, currency)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
