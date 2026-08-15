'use client'

import React from 'react'
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

const pillClass = (isSelected: boolean) =>
  `cursor-pointer px-2 pt-1 h-8 text-sm font-medium transition-all text-nowrap duration-150 border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)] ease-in-out hover:shadow-md ${
    isSelected
      ? 'bg-[--primary-accent] text-[--text-color]'
      : 'bg-[--background-color] text-[--text-color]'
  }`

export function TagDrawer({
  allTags,
  selectedTags,
  onTagToggle,
  onSelectedTagsChange,
  triggerElement,
  title,
  description = 'Choose tags that best describe your quiz.',
}: TagDrawerProps) {
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
      const withoutLevels = selectedTags.filter(
        (selected) => !normalizeCefrLevel(selected)
      )
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
            className={pillClass(isSelected)}
          >
            {tag}
          </Badge>
        )
      })}
    </div>
  )

  const grammarGroups =
    grammarCategory?.groups ??
    (grammarCategory
      ? [{ id: 'all', label: 'All', tags: grammarCategory.tags }]
      : [])
  const grammarMid = Math.ceil(grammarGroups.length / 2)
  const grammarColumns = [
    grammarGroups.slice(0, grammarMid),
    grammarGroups.slice(grammarMid),
  ]

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
                    className={pillClass(true)}
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
            <DrawerDescription className="mb-4 text-base">
              {description}
            </DrawerDescription>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-6 lg:items-stretch">
              {levelCategory && (
                <section className="rounded-xl border border-[--primary-accent] bg-white/80 p-4 lg:col-span-1">
                  <div className="mb-2 flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">Level</h3>
                    <p className="text-xs text-gray-500">Choose one</p>
                  </div>
                  <div className="flex flex-row flex-wrap gap-2">
                    {levelCategory.tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag)
                      return (
                        <Badge
                          key={tag}
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => handleToggle(levelCategory, tag)}
                          className={`${pillClass(isSelected)} w-fit`}
                        >
                          {tag}
                        </Badge>
                      )
                    })}
                  </div>
                </section>
              )}

              {topicCategory && (
                <section className="rounded-xl border border-[--primary-accent] bg-white/80 p-4 lg:col-span-2">
                  <h3 className="mb-1 text-lg font-semibold">Topic</h3>
                  <p className="mb-3 text-xs text-gray-500">
                    Choose a classroom theme
                  </p>
                  {renderChips(topicCategory, topicCategory.tags)}
                </section>
              )}

              {grammarCategory && (
                <section className="rounded-xl border border-[--primary-accent] bg-white/80 p-4 lg:col-span-3">
                  <h3 className="mb-1 text-lg font-semibold">Grammar</h3>
                  <p className="mb-3 text-xs text-gray-500">
                    Coursebook structures
                  </p>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    {grammarColumns.map((column, columnIndex) => (
                      <div key={`grammar-col-${columnIndex}`} className="space-y-3">
                        {column.map((group) => (
                          <div key={group.id}>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {group.label}
                            </p>
                            {renderChips(grammarCategory, [...group.tags])}
                          </div>
                        ))}
                      </div>
                    ))}
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
