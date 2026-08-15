"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  SORTING = "SORTING",
  MATCHING = "MATCHING",
}

interface QuizTypeSelectorProps {
  quizType: QuestionType
  setQuizType: (type: QuestionType) => void
}

/** Two autoplay cycles on select; replay on hover / click. Never infinite. */
function useCappedPreviewPlay(isSelected: boolean) {
  const [cyclesLeft, setCyclesLeft] = useState(0)

  useEffect(() => {
    setCyclesLeft(isSelected ? 2 : 0)
  }, [isSelected])

  const playing = isSelected && cyclesLeft > 0

  const onCycleComplete = useCallback(() => {
    setCyclesLeft((prev) => Math.max(0, prev - 1))
  }, [])

  const replay = useCallback(() => {
    if (isSelected) setCyclesLeft(2)
  }, [isSelected])

  return {
    playing,
    onCycleComplete,
    replay,
  }
}

const MultipleChoicePreview = ({
  isSelected,
  playing,
  onCycleComplete,
}: {
  isSelected: boolean
  playing: boolean
  onCycleComplete: () => void
}) => {
  const [selectedOption, setSelectedOption] = useState(1)

  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => {
      setSelectedOption((prev) => (prev + 1) % 4)
      onCycleComplete()
    }, 900)
    return () => window.clearTimeout(id)
  }, [playing, selectedOption, onCycleComplete])

  return (
    <div className="space-y-2">
      <div className="mb-3 h-2 w-3/4 rounded bg-slate-300"></div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className="flex items-center space-x-1.5"
            animate={isSelected ? { opacity: 1 } : { opacity: 0.7 }}
            transition={{ delay: index * 0.05 }}
          >
            <motion.div
              className={cn(
                "flex h-2.5 w-2.5 items-center justify-center rounded-full border-2",
                selectedOption === index && isSelected
                  ? "border-[var(--primary-accent)] bg-[var(--primary-accent)]"
                  : "border-slate-300",
              )}
              animate={
                playing && selectedOption === index ? { scale: [1, 1.25, 1] } : { scale: 1 }
              }
              transition={{ duration: 0.35 }}
            >
              {selectedOption === index && isSelected && (
                <div className="h-1 w-1 rounded-full bg-white" />
              )}
            </motion.div>
            <div className="h-1 flex-1 rounded bg-slate-300"></div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const SortingPreview = ({
  isSelected,
  playing,
  onCycleComplete,
}: {
  isSelected: boolean
  playing: boolean
  onCycleComplete: () => void
}) => {
  const [items, setItems] = useState([0, 1, 2])

  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => {
      setItems((prev) => [...prev].sort(() => Math.random() - 0.5))
      onCycleComplete()
    }, 1100)
    return () => window.clearTimeout(id)
  }, [playing, items, onCycleComplete])

  return (
    <div className="space-y-1">
      <div className="mb-2 h-1.5 w-2/3 rounded bg-slate-300"></div>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item}
            className="flex items-center space-x-1 rounded bg-slate-100 p-1"
            layout
            animate={
              isSelected
                ? {
                    y: 0,
                    opacity: 1,
                    transition: { delay: index * 0.08 },
                  }
                : { y: 0, opacity: 0.7 }
            }
            whileHover={isSelected ? { scale: 1.02 } : {}}
          >
            <div className="grid h-1.5 w-1.5 grid-cols-2 gap-0.5 rounded bg-slate-400">
              <div className="h-0.5 w-0.5 rounded-full bg-slate-600"></div>
              <div className="h-0.5 w-0.5 rounded-full bg-slate-600"></div>
              <div className="h-0.5 w-0.5 rounded-full bg-slate-600"></div>
              <div className="h-0.5 w-0.5 rounded-full bg-slate-600"></div>
            </div>
            <div className="h-1 flex-1 rounded bg-slate-300"></div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

const MatchingPreview = ({
  isSelected,
  playing,
  onCycleComplete,
}: {
  isSelected: boolean
  playing: boolean
  onCycleComplete: () => void
}) => {
  const [selectedLeft, setSelectedLeft] = useState(0)
  const [selectedRight, setSelectedRight] = useState(0)

  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => {
      setSelectedLeft((prev) => (prev + 1) % 3)
      setSelectedRight((prev) => (prev + 1) % 3)
      onCycleComplete()
    }, 900)
    return () => window.clearTimeout(id)
  }, [playing, selectedLeft, selectedRight, onCycleComplete])

  return (
    <div className="space-y-2">
      <div className="mb-3 h-2 w-2/3 rounded bg-slate-300"></div>
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={cn(
                "h-1.5 w-4/5 rounded transition-colors duration-300",
                isSelected && selectedLeft === index
                  ? "bg-[var(--primary-accent)]"
                  : "bg-slate-300",
              )}
              animate={
                playing && selectedLeft === index ? { scale: [1, 1.05, 1] } : { scale: 1 }
              }
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <div className="flex-1 space-y-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={cn(
                "ml-auto h-1.5 w-4/5 rounded transition-colors duration-300",
                isSelected && selectedRight === index
                  ? "bg-[var(--primary-accent)]"
                  : "bg-slate-300",
              )}
              animate={
                playing && selectedRight === index ? { scale: [1, 1.05, 1] } : { scale: 1 }
              }
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const questionTypeConfig = {
  [QuestionType.MULTIPLE_CHOICE]: {
    title: "Multiple Choice",
    description: "Select one correct answer",
    component: MultipleChoicePreview,
  },
  [QuestionType.SORTING]: {
    title: "Sorting",
    description: "Arrange items in order",
    component: SortingPreview,
  },
  [QuestionType.MATCHING]: {
    title: "Matching",
    description: "Connect related items",
    component: MatchingPreview,
  },
}

function TypeCard({
  type,
  quizType,
  setQuizType,
}: {
  type: QuestionType
  quizType: QuestionType
  setQuizType: (type: QuestionType) => void
}) {
  const config = questionTypeConfig[type]
  const PreviewComponent = config.component
  const isSelected = quizType === type
  const { playing, onCycleComplete, replay } = useCappedPreviewPlay(isSelected)

  return (
    <motion.div
      className={cn(
        "relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-200",
        isSelected
          ? "border-[var(--primary-accent)] bg-[var(--surface-cloud)] shadow-[3px_3px_0px_0px_var(--border-dark)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      )}
      onClick={() => {
        setQuizType(type)
        if (isSelected) replay()
      }}
      onMouseEnter={() => {
        if (isSelected) replay()
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {isSelected && (
        <motion.div
          className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary-accent)]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </motion.div>
      )}

      <div className="flex h-20 flex-row items-center gap-3 p-2">
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3
            className={cn(
              "mb-0.5 truncate text-xs font-medium",
              isSelected ? "text-[var(--text-color)]" : "text-slate-700",
            )}
          >
            {config.title}
          </h3>
          <p
            className={cn(
              "line-clamp-2 text-xs",
              isSelected ? "text-[var(--text-light)]" : "text-slate-500",
            )}
          >
            {config.description}
          </p>
        </div>

        <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center">
          <div className="h-12 w-16 overflow-hidden">
            <PreviewComponent
              isSelected={isSelected}
              playing={playing}
              onCycleComplete={onCycleComplete}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function QuizTypeSelector({ quizType, setQuizType }: QuizTypeSelectorProps) {
  return (
    <div className="flex flex-col rounded-lg bg-[var(--surface-cloud)] lg:flex-row">
      <Label className="mb-2 block pr-4 text-nowrap text-base font-medium text-[--text-color] lg:mb-0">
        Select Quiz Type:
      </Label>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        {Object.values(QuestionType).map((type) => (
          <TypeCard key={type} type={type} quizType={quizType} setQuizType={setQuizType} />
        ))}
      </div>
    </div>
  )
}
