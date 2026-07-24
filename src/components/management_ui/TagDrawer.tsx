'use client'

import React, { useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTrigger,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { normalizeCefrLevel } from '@/lib/taxonomy/quiz-taxonomy'

export interface TagGroup {
  id: string
  label: string
  tags: string[]
}

export interface TagCategory {
  category: string
  tags: string[]
  groups?: TagGroup[]
  selectionMode?: 'single' | 'multiple'
}

interface TagDrawerProps {
  allTags: TagCategory[]
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  /** Preferred for Level single-select — replaces the full tag list atomically */
  onSelectedTagsChange?: (tags: string[]) => void
  triggerElement: React.ReactNode
  title?: string
  description?: string
}

export function TagDrawer({
  allTags,
  selectedTags,
  onTagToggle,
  onSelectedTagsChange,
  triggerElement,
  title,
  description = 'Choose tags that best describe your quiz.',
}: TagDrawerProps) {
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null)

  const levelCategory = allTags.find((category) => category.category === 'Level')
  const topicCategory = allTags.find((category) => category.category === 'Topic')
  const grammarCategory = allTags.find((category) => category.category === 'Grammar')
  const otherCategories = allTags.filter(
    (category) =>
      category.category !== 'Level' &&
      category.category !== 'Topic' &&
      category.category !== 'Grammar'
  )

  const handleToggle = (category: TagCategory, tag: string) => {
    if (category.selectionMode === 'single' || category.category === 'Level') {
      const withoutLevels = selectedTags.filter((selected) => !normalizeCefrLevel(selected))
      const next = selectedTags.includes(tag)
        ? withoutLevels
        : [...withoutLevels, tag]
      if (onSelectedTagsChange) {
        onSelectedTagsChange(next)
        return
      }
      for (const selected of selectedTags) {
        if (normalizeCefrLevel(selected) && selected !== tag) {
          onTagToggle(selected)
        }
      }
      if (selectedTags.includes(tag) !== next.includes(tag)) {
        onTagToggle(tag)
      }
      return
    }
    onTagToggle(tag)
  }

  const renderChips = (category: TagCategory, tags: string[]) => (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <Badge
            key={tag}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => handleToggle(category, tag)}
            className={`cursor-pointer text-sm font-medium transition-all text-nowrap duration-150 border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] ease-in-out hover:shadow-md ${
              isSelected
                ? 'bg-[--primary-accent] text-[--text-color]'
                : 'bg-[--background-color] text-[--text-color]'
            }`}
          >
            {tag}
          </Badge>
        )
      })}
    </div>
  )

  return (
    <Drawer>
      <DrawerTrigger asChild>{triggerElement}</DrawerTrigger>
      <DrawerContent className="h-[75vh] text-[--text-color] grandstander">
        <DrawerHeader className="sticky top-0 z-10 border-b bg-[--background] px-4 pb-3 pt-4 md:px-8">
          <DrawerTitle className="hidden">{title || 'Select Tags'}</DrawerTitle>
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">Selected:</h3>
              {selectedTags.length === 0 ? (
                <span className="text-sm text-gray-500">None yet</span>
              ) : (
                selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="h-8 cursor-pointer p-2 text-sm font-medium"
                    onClick={() => onTagToggle(tag)}
                  >
                    {tag} <span className="ml-1">&times;</span>
                  </Badge>
                ))
              )}
            </div>
            <DrawerClose asChild>
              <Button
                variant="outline"
                className="h-11 border border-[#1F6E91] bg-[--text-color] px-6 font-semibold text-white shadow-[4px_4px_0px_0px_#1F6E91]"
              >
                Apply {selectedTags.length} selected
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-grow px-4 md:px-8">
          <div className="py-4">
            <DrawerDescription className="mb-4 text-base">{description}</DrawerDescription>

            {levelCategory && (
              <section className="mb-4 rounded-xl border border-[--primary-accent] bg-white/80 p-4">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold">Level</h3>
                  <p className="text-xs text-gray-500">Choose one</p>
                </div>
                {renderChips(levelCategory, levelCategory.tags)}
              </section>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {topicCategory && (
                <section className="rounded-xl border border-[--primary-accent] bg-white/80 p-4">
                  <h3 className="mb-1 text-lg font-semibold">Topic</h3>
                  <p className="mb-3 text-xs text-gray-500">Choose a classroom theme</p>
                  {renderChips(topicCategory, topicCategory.tags)}
                </section>
              )}

              {grammarCategory && (
                <section className="rounded-xl border border-[--primary-accent] bg-white/80 p-4">
                  <h3 className="mb-1 text-lg font-semibold">Grammar</h3>
                  <p className="mb-3 text-xs text-gray-500">
                    Choose structures from English coursebooks
                  </p>
                  <div className="space-y-4">
                    {(grammarCategory.groups ?? [
                      { id: 'all', label: 'All', tags: grammarCategory.tags },
                    ]).map((group) => {
                      const isOpen = mobileOpenGroup === group.id
                      return (
                        <div key={group.id}>
                          <button
                            type="button"
                            className="mb-2 flex w-full items-center justify-between text-left text-sm font-semibold text-gray-700 md:cursor-default"
                            onClick={() =>
                              setMobileOpenGroup((current) =>
                                current === group.id ? null : group.id
                              )
                            }
                          >
                            <span>{group.label}</span>
                            <span className="md:hidden">{isOpen ? '−' : '+'}</span>
                          </button>
                          <div className={`${isOpen ? 'block' : 'hidden'} md:block`}>
                            {renderChips(grammarCategory, [...group.tags])}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            {otherCategories.map((category) => (
              <section
                key={category.category}
                className="mt-4 rounded-xl border border-[--primary-accent] bg-white/80 p-4"
              >
                <h3 className="mb-3 text-lg font-semibold">{category.category}</h3>
                {renderChips(category, category.tags)}
              </section>
            ))}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
