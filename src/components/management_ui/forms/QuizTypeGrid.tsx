"use client"

import { useState } from "react"
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

const MultipleChoicePreview = ({ isSelected }: { isSelected: boolean }) => {
  const [selectedOption, setSelectedOption] = useState(1)

  return (
    <div className="space-y-2">
      <div className="h-2 bg-gray-300 rounded w-3/4 mb-3"></div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className="flex items-center space-x-1.5"
            animate={isSelected ? { opacity: 1 } : { opacity: 0.7 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className={cn(
                "w-2.5 h-2.5 rounded-full border-2 flex items-center justify-center",
                selectedOption === index && isSelected ? "border-violet-500 bg-violet-500" : "border-gray-300",
              )}
              animate={isSelected && selectedOption === index ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3, repeat: isSelected ? Number.POSITIVE_INFINITY : 0, repeatDelay: 2 }}
              onAnimationComplete={() => {
                if (isSelected) {
                  setTimeout(() => setSelectedOption((prev) => (prev + 1) % 4), 2000)
                }
              }}
            >
              {selectedOption === index && isSelected && <div className="w-1 h-1 bg-white rounded-full" />}
            </motion.div>
            <div className="h-1 bg-gray-300 rounded flex-1"></div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const SortingPreview = ({ isSelected }: { isSelected: boolean }) => {
  const [items, setItems] = useState([0, 1, 2])

  return (
    <div className="space-y-2">
      <div className="h-2 bg-gray-300 rounded w-2/3 mb-3"></div>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item}
            className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded"
            layout
            animate={
              isSelected
                ? {
                    y: 0,
                    opacity: 1,
                    transition: { delay: index * 0.2 },
                  }
                : { y: 0, opacity: 0.7 }
            }
            whileHover={isSelected ? { scale: 1.02 } : {}}
            onAnimationComplete={() => {
              if (isSelected && index === items.length - 1) {
                setTimeout(() => {
                  setItems([...items].sort(() => Math.random() - 0.5))
                }, 3000)
              }
            }}
          >
            <div className="w-2 h-2 bg-gray-400 rounded grid grid-cols-2 gap-0.5">
              <div className="w-0.5 h-0.5 bg-gray-600 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-600 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-600 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-600 rounded-full"></div>
            </div>
            <div className="h-1.5 bg-gray-300 rounded flex-1"></div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

const MatchingPreview = ({ isSelected }: { isSelected: boolean }) => {
  const [selectedLeft, setSelectedLeft] = useState(0)
  const [selectedRight, setSelectedRight] = useState(0)

  return (
    <div className="space-y-2">
      <div className="h-2 bg-gray-300 rounded w-2/3 mb-3"></div>
      <div className="flex justify-between gap-3">
        <div className="space-y-2 flex-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={cn(
                "h-1.5 rounded w-4/5 transition-colors duration-300",
                isSelected && selectedLeft === index ? "bg-violet-500" : "bg-gray-300",
              )}
              animate={isSelected && selectedLeft === index ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{
                duration: 0.3,
                repeat: isSelected && selectedLeft === index ? Number.POSITIVE_INFINITY : 0,
                repeatDelay: 2,
              }}
              onAnimationComplete={() => {
                if (isSelected && selectedLeft === index) {
                  setTimeout(() => {
                    const newLeft = (selectedLeft + 1) % 3
                    const newRight = (selectedRight + 1) % 3
                    setSelectedLeft(newLeft)
                    setSelectedRight(newRight)
                  }, 2000)
                }
              }}
            />
          ))}
        </div>
        <div className="space-y-2 flex-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={cn(
                "h-1.5 rounded w-4/5 ml-auto transition-colors duration-300",
                isSelected && selectedRight === index ? "bg-violet-500" : "bg-gray-300",
              )}
              animate={isSelected && selectedRight === index ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{
                duration: 0.3,
                repeat: isSelected && selectedRight === index ? Number.POSITIVE_INFINITY : 0,
                repeatDelay: 2,
              }}
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

export default function QuizTypeSelector({ quizType, setQuizType }: QuizTypeSelectorProps) {
  return (
    <div className="flex flex-row bg-gray-50 p-6 rounded-lg">
      <Label className="pr-4 block text-lg text-nowrap text-[--text-color] font-medium mb-4">Select Quiz Type:</Label>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(QuestionType).map((type) => {
          const config = questionTypeConfig[type]
          const PreviewComponent = config.component
          const isSelected = quizType === type

          return (
            <motion.div
              key={type}
              className={cn(
                "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                isSelected
                  ? "border-violet-500 bg-violet-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
              )}
              onClick={() => setQuizType(type)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              {isSelected && (
                <motion.div
                  className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              )}

              <div className="mb-3">
                <h3 className={cn("font-medium text-sm mb-1", isSelected ? "text-violet-700" : "text-gray-700")}>
                  {config.title}
                </h3>
                <p className={cn("text-xs", isSelected ? "text-violet-600" : "text-gray-500")}>{config.description}</p>
              </div>

              <div className="h-20 flex items-center justify-center">
                <div className="w-full max-w-[120px]">
                  <PreviewComponent isSelected={isSelected} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
