'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomToast } from '@/components/ui/CustomToast';
import ImageSelectModal from '@/components/management_ui/ImageSelectModal';
import wordsByCefr from '@/json/words_by_cefr.json';

type CefrLevel = keyof typeof wordsByCefr;

const LEVELS: { id: CefrLevel; label: string }[] = [
  { id: 'pre_a1', label: 'Pre-A1' },
  { id: 'a1', label: 'A1' },
  { id: 'a2', label: 'A2' },
];

const BASKET_LIMIT = 10;
const COVERAGE_CHUNK = 150;

type CoverageImage = {
  id: string;
  blobUrl: string;
  searchTerm: string | null;
  tags: string[];
};

type CoverageEntry = {
  count: number;
  images: CoverageImage[];
};

type ImageMetadata = {
  pixabayId: number;
  pixabayUser: string;
  tags: string[];
  searchTerm: string;
  width: number;
  height: number;
};

type BasketItem = {
  id: string;
  word: string;
  imageUrl: string;
  metadata: ImageMetadata;
};

type FilterMode = 'all' | 'missing' | 'has';

async function fetchCoverageForWords(
  words: string[]
): Promise<Record<string, CoverageEntry>> {
  const merged: Record<string, CoverageEntry> = {};

  for (let i = 0; i < words.length; i += COVERAGE_CHUNK) {
    const chunk = words.slice(i, i + COVERAGE_CHUNK);
    const response = await fetch('/api/images/coverage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: chunk }),
    });
    if (!response.ok) {
      throw new Error(`Coverage request failed (${response.status})`);
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Coverage request failed');
    }
    Object.assign(merged, result.data);
  }

  return merged;
}

async function tagStoredImage(
  imageId: string,
  word: string,
  extraTags: string[]
) {
  let existingTags: string[] = [];
  try {
    const getRes = await fetch(`/api/images/${imageId}`);
    if (getRes.ok) {
      const getJson = await getRes.json();
      existingTags = getJson.image?.tags || [];
    }
  } catch {
    // proceed with merge from metadata only
  }

  const tags = Array.from(
    new Set([...existingTags, ...extraTags, word].filter(Boolean))
  );

  await fetch(`/api/images/${imageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchTerm: word,
      tags,
    }),
  });
}

export default function ImageCurator() {
  const { addToast } = useCustomToast();
  const [level, setLevel] = useState<CefrLevel>('pre_a1');
  const [filter, setFilter] = useState<FilterMode>('missing');
  const [coverage, setCoverage] = useState<Record<string, CoverageEntry>>({});
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(false);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const words = useMemo(() => wordsByCefr[level] ?? [], [level]);

  const loadCoverage = useCallback(
    async (wordList: string[]) => {
      setIsLoadingCoverage(true);
      try {
        const data = await fetchCoverageForWords(wordList);
        setCoverage(data);
      } catch (error) {
        console.error(error);
        addToast('Could not load image coverage for this level.', {
          variant: 'error',
        });
        setCoverage({});
      } finally {
        setIsLoadingCoverage(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    void loadCoverage(words);
  }, [words, loadCoverage]);

  const filteredWords = useMemo(() => {
    return words.filter((word) => {
      const count = coverage[word]?.count ?? 0;
      if (filter === 'missing') return count === 0;
      if (filter === 'has') return count > 0;
      return true;
    });
  }, [words, coverage, filter]);

  const coveredCount = useMemo(
    () => words.filter((w) => (coverage[w]?.count ?? 0) > 0).length,
    [words, coverage]
  );

  const openPickerForWord = (word: string) => {
    if (basket.length >= BASKET_LIMIT) {
      addToast(`Basket is full (${BASKET_LIMIT}). Save or remove items first.`, {
        variant: 'error',
      });
      return;
    }
    setActiveWord(word);
    setIsModalOpen(true);
  };

  const handleImageSelect = (
    imageUrl: string,
    metadata?: ImageMetadata,
    localFile?: File | null
  ) => {
    if (localFile) {
      addToast('Uploads are not used in the curator — pick a Pixabay photo.', {
        variant: 'error',
      });
      return;
    }

    if (!activeWord) return;

    if (!metadata?.pixabayId) {
      addToast(
        'Pick a Pixabay image to add to the basket. Collection images are already saved.',
        { variant: 'info' }
      );
      setIsModalOpen(false);
      setActiveWord(null);
      return;
    }

    if (basket.length >= BASKET_LIMIT) {
      addToast(`Basket is full (${BASKET_LIMIT}).`, { variant: 'error' });
      return;
    }

    const item: BasketItem = {
      id: `${activeWord}-${metadata.pixabayId}-${Date.now()}`,
      word: activeWord,
      imageUrl,
      metadata,
    };
    setBasket((prev) => [...prev, item]);
    addToast(
      `Added “${activeWord}” to basket (${basket.length + 1}/${BASKET_LIMIT}).`,
      { variant: 'success' }
    );
    setIsModalOpen(false);
    setActiveWord(null);
  };

  const removeBasketItem = (id: string) => {
    setBasket((prev) => prev.filter((item) => item.id !== id));
  };

  const saveBasket = async () => {
    if (basket.length === 0 || isSaving) return;
    setIsSaving(true);

    let saved = 0;
    let failed = 0;

    addToast(`Saving ${basket.length} image(s)...`, {
      variant: 'info',
      position: 'top-center',
    });

    for (const item of basket) {
      try {
        const checkResponse = await fetch('/api/images/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalUrl: item.imageUrl }),
        });

        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          if (checkResult.exists && checkResult.image?.id) {
            await tagStoredImage(
              checkResult.image.id,
              item.word,
              item.metadata.tags
            );
            saved += 1;
            continue;
          }
        }

        const tags = Array.from(
          new Set([...item.metadata.tags, item.word].filter(Boolean))
        );

        const response = await fetch('/api/images/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: item.imageUrl,
            pixabayId: item.metadata.pixabayId,
            pixabayUser: item.metadata.pixabayUser || 'unknown',
            searchTerm: item.word,
            tags,
            width: item.metadata.width || 640,
            height: item.metadata.height || 360,
            mimeType: 'image/jpeg',
          }),
        });

        if (!response.ok) {
          failed += 1;
          continue;
        }

        const result = await response.json();
        if (result.success && result.image?.id) {
          // Ensure word tagging even when download hit an existing pixabayId
          await tagStoredImage(result.image.id, item.word, item.metadata.tags);
          saved += 1;
        } else {
          failed += 1;
        }
      } catch (error) {
        console.error('Failed to save curated image:', error);
        failed += 1;
      }
    }

    setIsSaving(false);

    if (saved > 0) {
      addToast(
        `Saved ${saved} image(s)${failed ? `, ${failed} failed` : ''}.`,
        { variant: failed ? 'info' : 'success' }
      );
      setBasket([]);
      await loadCoverage(words);
    } else {
      addToast('No images were saved. Try again.', { variant: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grandstander">
      <header className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-wide text-amber-700">
          Dev only — temporary curator
        </p>
        <h1 className="text-3xl font-semibold text-[#114257]">
          Pixabay image curator
        </h1>
        <p className="text-sm text-slate-600 inclusive-sans max-w-2xl">
          Pick photos for CEFR vocabulary words (your list). Searches our
          collection and Pixabay only — not Giphy. Save up to {BASKET_LIMIT} at a
          time into the shared image library.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {LEVELS.map((l) => (
          <Button
            key={l.id}
            type="button"
            variant={level === l.id ? 'default' : 'outline'}
            onClick={() => setLevel(l.id)}
            className="rounded-full"
          >
            {l.label}
          </Button>
        ))}
        <span className="ml-auto text-sm text-slate-500 inclusive-sans">
          {coveredCount}/{words.length} words have images
          {isLoadingCoverage ? ' · loading…' : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ['missing', 'Missing'],
            ['has', 'Has images'],
            ['all', 'All'],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={filter === id ? 'secondary' : 'ghost'}
            onClick={() => setFilter(id)}
            className="rounded-full"
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <section className="min-h-[40vh]">
          {isLoadingCoverage && Object.keys(coverage).length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading coverage…
            </div>
          ) : filteredWords.length === 0 ? (
            <p className="py-12 text-center text-slate-500 inclusive-sans">
              No words match this filter.
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredWords.map((word) => {
                const entry = coverage[word];
                const count = entry?.count ?? 0;
                const thumbs = entry?.images?.slice(0, 3) ?? [];
                return (
                  <li key={word}>
                    <button
                      type="button"
                      onClick={() => openPickerForWord(word)}
                      className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-[#49c8ff] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-medium text-[#114257] text-sm leading-tight">
                          {word}
                        </span>
                        <span
                          className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                            count > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                      {thumbs.length > 0 ? (
                        <div className="flex gap-1">
                          {thumbs.map((img) => (
                            <div
                              key={img.id}
                              className="relative h-10 w-10 rounded overflow-hidden bg-slate-100"
                            >
                              <Image
                                src={img.blobUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 inclusive-sans">
                          Click to add
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 h-fit sticky top-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#114257]">
              Basket ({basket.length}/{BASKET_LIMIT})
            </h2>
            {basket.length > 0 ? (
              <button
                type="button"
                onClick={() => setBasket([])}
                className="text-xs text-slate-500 hover:text-slate-800"
                disabled={isSaving}
              >
                Clear
              </button>
            ) : null}
          </div>

          {basket.length === 0 ? (
            <p className="text-sm text-slate-500 inclusive-sans mb-4">
              Select words and pick Pixabay photos. Save when ready.
            </p>
          ) : (
            <ul className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
              {basket.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 p-2"
                >
                  <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden bg-slate-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.word}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                  <span className="flex-1 text-sm text-[#114257] truncate">
                    {item.word}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.word}`}
                    onClick={() => removeBasketItem(item.id)}
                    disabled={isSaving}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            className="w-full rounded-full"
            disabled={basket.length === 0 || isSaving}
            onClick={() => void saveBasket()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save {basket.length || ''} to library
              </>
            )}
          </Button>
        </aside>
      </div>

      <ImageSelectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveWord(null);
        }}
        onImageSelect={handleImageSelect}
        initialQuery={activeWord ?? undefined}
        enableGiphy={false}
        showQuizSaveHint={false}
      />
    </div>
  );
}
