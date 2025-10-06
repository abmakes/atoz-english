export const ALL_TAG_CATEGORIES = [
  { 
    category: "Topic", 
    tags: [
      "Animals", "Food & Drink", "Travel & Transport", "History & Culture", "Science & Technology",
      "Entertainment", "Sports & Activities", "Family & People", "School & Classroom", 
      "Colors & Numbers", "Feelings & Emotions", "Clothes & Body Parts", 
      "Toys & Games", "Home & Furniture", "Countries & Places", "Weather & Seasons", 
      "Nature & Environment", "Plants & Food Types", "Community & Buildings", 
      "Stories & Fairy Tales", "Health & Daily Life"
    ]
  },
  { 
    category: "Grammar", 
    tags: [
      "Nouns & Articles", "Pronouns", "Adjectives & Adverbs", "Prepositions",
      "Present Simple", "Present Continuous", "Present Perfect",
      "Past Simple", "Past Continuous", "Past Perfect",
      "Future Simple", "Future Continuous", "Future Perfect",
      "Questions & Negatives", "Comparatives & Superlatives", "Quantifiers", 
      "Conditionals", "Relative Clauses", "Gerunds & Infinitives", 
      "Passive Voice", "Reported Speech", "Conjunctions & Linking Words",
      "Modals", "Phrasal Verbs", "Word Order", "Possessives", "Demonstratives",
      "Determiners", "Linking Words of Cause & Result", "Time Expressions", 
      "Direct & Indirect Speech", "Causative"
    ]
  },
  { 
    category: "Level", 
    tags: ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2", "Beginner", "Elementary", "Intermediate", "Upper-Intermediate", "Advanced"] 
  },
];

export const FLATTENED_TAGS: string[] = ALL_TAG_CATEGORIES.flatMap(cat => cat.tags);