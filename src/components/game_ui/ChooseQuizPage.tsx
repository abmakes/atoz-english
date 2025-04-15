'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/useGameStore'; // Import the store hook
import styles from '@/styles/themes/themes.module.css'; // Reuse theme styles
import Image from 'next/image';
// TODO: Add specific styles for ChooseQuizPage if needed in themes.module.css

// Mock data structure for a quiz card
interface QuizCardInfo {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  questionCount: number;
  likes: number;
  level?: string; // Optional level filter
}

interface ChooseQuizPageProps {
  // Prop to notify parent component (like GameContainer) to navigate/switch view
  onQuizSelected: () => void;
}

const ChooseQuizPage: React.FC<ChooseQuizPageProps> = ({ onQuizSelected }) => {
  // Zustand actions
  const setSelectedQuiz = useGameStore((state) => state.setSelectedQuiz);

  // Local state for quiz list and potentially filters/search
  const [quizList, setQuizList] = useState<QuizCardInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fetch mock data on mount
  useEffect(() => {
    // Simulate API fetch
    const fetchQuizzes = async () => {
      setIsLoading(true);
      // Replace with actual API call later
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      const mockData: QuizCardInfo[] = [
        { id: 'q1', title: 'A-to-Z Quiz 1', description: 'Basic vocabulary challenge', imageUrl: '/eggs.webp', questionCount: 22, likes: 2, level: 'A1' },
        { id: 'q2', title: 'Animal Fun Facts', description: 'Learn about animals', imageUrl: '/giddy.webp', questionCount: 15, likes: 5, level: 'A2' },
        { id: 'q3', title: 'Movie Characters', description: 'Guess the character', imageUrl: '/batman.webp', questionCount: 10, likes: 8, level: 'B1' },
        { id: 'q4', title: 'A-to-Z Quiz 2', description: 'Raise the stakes!', imageUrl: '/eggs.webp', questionCount: 22, likes: 3, level: 'A1'},
        // Add more mock quizzes...
      ];
      setQuizList(mockData);
      setIsLoading(false);
    };
    fetchQuizzes();
  }, []);

  const handleQuizClick = (id: string, title: string) => {
    console.log(`Quiz selected: ID=${id}, Title=${title}`);
    setSelectedQuiz(id, title); // Update Zustand store
    onQuizSelected(); // Notify parent to switch view
  };

  // Basic filtering logic (replace with more robust implementation)
  const filteredQuizzes = quizList.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || quiz.level === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // --- Render ---
  // Applying basic structure and theme styles
  return (
    <div className={`${styles.panelWrapper} ${styles.themeWrapper} ${styles.themeBasic}`}> {/* Default theme for this page */}
       <div className={styles.panel} style={{ maxWidth: '80rem' }}> {/* Wider panel */}
         <h1 className={`${styles.textHeading1} ${styles.textCenter} mb-6`}>Choose Quiz</h1>

         {/* Search and Filter Bar */}
         <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
           {/* Search Input */}
           <input
             type="text"
             placeholder="Type keywords..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className={`${styles.inputField} flex-grow`} // Use theme input style
             aria-label="Search quizzes"
           />
           {/* Filter Dropdown */}
           <div className={styles.selectionContainer} style={{ marginBottom: 0 }}> {/* Reuse container */}
             <label htmlFor="filter-select" className={styles.textLabel}>Select Filters:</label>
             <select
               id="filter-select"
               value={selectedFilter}
               onChange={(e) => setSelectedFilter(e.target.value)}
               className={styles.selectField} // Use theme select style
             >
               <option value="all">All Levels</option>
               <option value="A1">Pre-A1 Starters</option>
               <option value="A2">A2 Flyers</option>
               <option value="B1">B1 Preliminary</option>
               {/* Add other levels */}
             </select>
           </div>
         </div>

         {/* Quiz Grid */}
         {isLoading ? (
           <div className={styles.textCenter}>Loading Quizzes...</div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {filteredQuizzes.map(quiz => (
               <div
                 key={quiz.id}
                 className={`${styles.optionBox} cursor-pointer transition transform hover:scale-105 hover:shadow-lg`} // Reuse option box style
                 onClick={() => handleQuizClick(quiz.id, quiz.title)}
                 role="button"
                 tabIndex={0}
               >
                 <Image src={quiz.imageUrl} alt={`${quiz.title} cover`} className="w-full h-32 object-cover rounded-t-lg mb-2"/>
                 <h3 className={`${styles.textHeading3} truncate`}>{quiz.title}</h3>
                 <p className={`${styles.textDescription} text-sm mb-2 h-10 overflow-hidden`}>{quiz.description}</p>
                 <div className="flex justify-between items-center text-xs text-gray-500">
                   <span>❤️ {quiz.likes}</span>
                   <span>{quiz.questionCount} questions</span>
                 </div>
               </div>
             ))}
              {/* Optional "See more..." button */}
              {/* <button className="...">See more...</button> */}
           </div>
         )}
       </div>
    </div>
  );
};

export default ChooseQuizPage; 