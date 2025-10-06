# AI Quiz Generator Setup Guide

## Overview
The AI Quiz Generator allows you to automatically create multiple choice questions based on your quiz title, description, selected tags, CEFR level, and optional book/unit content.

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env` file:

```env
GEMINI_QUIZ_API_KEY="your_gemini_api_key_here"
```

To get a Gemini API key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env` file

### 2. Features

#### Available CEFR Levels:
- **Pre-A1 (Starters)**: Very basic English for young learners
- **A1 (Movers)**: Basic English for elementary learners  
- **A2 (Flyers)**: Elementary English for young learners

#### Supported Books:
- **Macmillan Academy Stars**: 5 levels with 9 units each
- **Cambridge Primary Path**: 5 levels with 9 units each

#### Tag Categories:
- **Topic**: Animals, Food, Travel, History, Science, Movies, Music, Sports
- **Grammar**: Present Simple, Past Simple, Future Simple, Nouns, Verbs, Adjectives, etc.
- **Vocabulary Level**: Beginner, Elementary, Intermediate, Upper-Intermediate, Advanced
- **CEFR Level**: A1, A2, B1, B2, C1, C2
- **Skills**: Reading, Writing, Listening, Speaking

## How to Use

1. **Create a Quiz**: Go to the quiz creation page
2. **Fill Basic Info**: Enter quiz title and description
3. **Select AI Generation**: Click the "Generate with AI" tab
4. **Configure Settings**:
   - Select CEFR level (required)
   - Choose tags (at least one required)
   - Optionally select a book and unit
   - Set number of questions (1-20)
5. **Generate**: Click "Generate Questions" button
6. **Review**: Generated questions will be added to your quiz
7. **Edit**: You can edit the generated questions as needed

## How It Works

The AI generator:
1. Uses your quiz title and description for context
2. Filters vocabulary based on selected CEFR level and tags
3. Incorporates book/unit content if specified
4. Generates appropriate multiple choice questions
5. Returns questions in the correct format for your quiz system

## Example Usage

**Quiz Title**: "Farm Animals for Beginners"
**Description**: "Learn about farm animals and their sounds"
**Level**: Pre-A1 (Starters)
**Tags**: Animals, Farm Animals, Vocabulary
**Book**: Macmillan Academy Stars - Unit: Farm Animals
**Questions**: 5

This will generate 5 multiple choice questions about farm animals appropriate for Pre-A1 level students.

## Troubleshooting

### Common Issues:
1. **"Failed to generate questions"**: Check your GEMINI_QUIZ_API_KEY is correct
2. **"At least one tag is required"**: Select one or more tags before generating
3. **"Invalid response from AI service"**: The AI response couldn't be parsed - try again

### Tips:
- Be specific in your quiz title and description for better results
- Select relevant tags that match your content
- Start with fewer questions (3-5) to test the system
- Review and edit generated questions before publishing

## Technical Details

- Uses Google's Gemini 2.5 Flash Lite model (optimized for cost efficiency and low latency)
- Processes vocabulary from wordlist.json based on CEFR levels
- Incorporates book content from Macmillan and Cambridge JSON files
- Generates questions in JSON format compatible with your quiz system
- Includes proper error handling and loading states
