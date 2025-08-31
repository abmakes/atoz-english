export const ALL_TAG_CATEGORIES = [
  { category: "Topic", tags: ["Animals", "Food", "Travel", "History", "Science", "Movies", "Music", "Sports"] },
  { category: "Grammar", tags: ["Present Simple", "Past Simple", "Future Simple", "Nouns", "Verbs", "Adjectives", "Adverbs", "Prepositions", "Conditionals"] },
  { category: "Vocabulary Level", tags: ["Beginner", "Elementary", "Intermediate", "Upper-Intermediate", "Advanced"] },
  { category: "CEFR Level", tags: ["A1", "A2", "B1", "B2", "C1", "C2"] },
  { category: "Skills", tags: ["Reading", "Writing", "Listening", "Speaking"] },
  { category: "Quiz Type", tags: ["Multiple Choice", "True/False", "Fill in the Blanks", "Matching"] },
];

export const FLATTENED_TAGS: string[] = ALL_TAG_CATEGORIES.flatMap(cat => cat.tags); 