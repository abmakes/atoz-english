'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
const STORAGE_KEY = 'image-curator-progress-v1';

type ProgressMap = Record<string, number>;

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

function readProgress(): ProgressMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgress(progress: ProgressMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
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
  const [progress, setProgress] = useState<ProgressMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const words = useMemo(() => wordsByCefr[level] ?? [], [level]);

  useEffect(() => {
    setProgress(readProgress());
    setHydrated(true);
  }, []);

  const bumpProgress = (wordCounts: Record<string, number>) => {
    setProgress((prev) => {
      const next = { ...prev };
      for (const [word, add] of Object.entries(wordCounts)) {
        next[word] = (next[word] ?? 0) + add;
      }
      writeProgress(next);
      return next;
    });
  };

  const filteredWords = useMemo(() => {
    return words.filter((word) => {
      const count = progress[word] ?? 0;
      if (filter === 'missing') return count === 0;
      if (filter === 'has') return count > 0;
      return true;
    });
  }, [words, progress, filter]);

  const coveredCount = useMemo(
    () => words.filter((w) => (progress[w] ?? 0) > 0).length,
    [words, progress]
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
    const savedByWord: Record<string, number> = {};

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
            savedByWord[item.word] = (savedByWord[item.word] ?? 0) + 1;
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
          await tagStoredImage(result.image.id, item.word, item.metadata.tags);
          saved += 1;
          savedByWord[item.word] = (savedByWord[item.word] ?? 0) + 1;
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
      bumpProgress(savedByWord);
      addToast(
        `Saved ${saved} image(s)${failed ? `, ${failed} failed` : ''}.`,
        { variant: failed ? 'info' : 'success' }
      );
      setBasket([]);
    } else {
      addToast('No images were saved. Try again.', { variant: 'error' });
    }
  };

  const resetLocalProgress = () => {
    if (
      !window.confirm(
        'Clear local progress counts for this browser? Images already in the library stay saved.'
      )
    ) {
      return;
    }
    writeProgress({});
    setProgress({});
    addToast('Local progress cleared.', { variant: 'info' });
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
          Word list with a count. Click a word, pick Pixabay photos, save the
          basket. Counts live in this browser&apos;s localStorage — not a
          coverage database query.
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
          {hydrated ? `${coveredCount}/${words.length} marked done` : '…'}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-xs text-slate-500"
          onClick={resetLocalProgress}
        >
          Reset local counts
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ['missing', 'Not done'],
            ['has', 'Done'],
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
          {!hydrated ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading list…
            </div>
          ) : filteredWords.length === 0 ? (
            <p className="py-12 text-center text-slate-500 inclusive-sans">
              No words match this filter.
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredWords.map((word) => {
                const count = progress[word] ?? 0;
                return (
                  <li key={word}>
                    <button
                      type="button"
                      onClick={() => openPickerForWord(word)}
                      className="w-full text-left rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-[#49c8ff] hover:shadow-sm transition-all flex items-center justify-between gap-2"
                    >
                      <span className="font-medium text-[#114257] text-sm leading-tight truncate">
                        {word}
                      </span>
                      <span
                        className={`shrink-0 text-xs tabular-nums px-1.5 py-0.5 rounded ${
                          count > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
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
