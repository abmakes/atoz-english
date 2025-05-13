"use client";

import { useState, useEffect, useRef } from "react";
import { Task } from "@/lib/tasks";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TaskCard from "./TaskCard";
import TaskDetailModal from "./TaskDetailModal";
import { getTasksAction } from "./actions";
import { getPixiThemeConfig } from '@/lib/themes';
import type { PixiSpecificConfig } from '@/lib/themes';

// List of CSS variables to visualize (from globals.css)
const cssVariablesToTrack = [
    '--primary-bg',
    '--secondary-bg',
    '--panel-bg',
    '--text-color',
    '--text-light',
    '--heading-color',
    '--primary-accent',
    '--primary-accent-hover',
    '--secondary-accent',
    '--secondary-accent-hover',
    '--danger-color',
    '--danger-color-hover',
    '--input-bg',
    '--input-border',
    '--input-shadow',
    '--input-text',
    '--button-text-light',
    '--button-text-dark',
    '--box-bg',
    '--box-border',
    '--active-button-bg',
    '--inactive-button-bg',
    '--inactive-button-border',
    '--inactive-button-hover-bg',
    '--checkbox-accent',
    '--border-dark', // Used for shadow-solid
];

// Helper to check if a string is likely a color
const isColor = (value: string): boolean => {
    if (typeof value !== 'string') return false;
    return value.startsWith('#') || value.startsWith('rgb') || value.startsWith('rgba');
};

// Helper to determine text color based on background luminance
const getTextColorForBackground = (hexColor: string): string => {
    try {
        const rgb = parseInt(hexColor.slice(1), 16); // Convert hex to integer
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b; // Standard luminance calculation
        return luminance > 140 ? '#000000' : '#FFFFFF'; // Threshold might need adjustment
    } catch (e) {
        console.error('Error in getTextColorForBackground:', e);
        return '#000000'; // Default to black on error
    }
};

export default function TasksPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const statusFilter = searchParams.status?.toLowerCase();
  
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const data = await getTasksAction();
        setTasks(data);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTasks();
  }, []);
  
  // Filter tasks by status if a filter is applied
  const filteredTasks = statusFilter
    ? tasks.filter(task => task.status.toLowerCase() === statusFilter)
    : tasks;

  // State for modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const allStatuses = [...new Set(tasks.map(task => task.status.toLowerCase()))];

  const [selectedTheme, setSelectedTheme] = useState<string>('basic');
  const [pixiColors, setPixiColors] = useState<Record<string, string>>({});
  const [cssColors, setCssColors] = useState<Record<string, string>>({});
  const themeRef = useRef<HTMLDivElement>(null); // Ref for applying theme class

  // Effect to update colors when theme changes
  useEffect(() => {
    // --- Get Pixi Colors ---
    const pixiConfig = getPixiThemeConfig(selectedTheme);
    const filteredPixiColors: Record<string, string> = {};
    for (const key in pixiConfig) {
      if (Object.prototype.hasOwnProperty.call(pixiConfig, key)) {
        const value = pixiConfig[key as keyof PixiSpecificConfig];
        if (typeof value === 'string' && isColor(value)) {
          filteredPixiColors[key] = value;
        }
      }
    }
    setPixiColors(filteredPixiColors);

    // --- Get CSS Colors ---
    const computedCssColors: Record<string, string> = {};
    const element = themeRef.current;
    if (element) {
      // Apply the theme class temporarily to the ref element
      let themeClass = '';
      if (selectedTheme === 'dark') themeClass = 'dark';
      else if (selectedTheme === 'forest') themeClass = 'themeForest';

      // Reset classes before applying new one
      element.className = 'hidden'; // Keep it hidden
      if (themeClass) {
        element.classList.add(themeClass);
      }

      const computedStyles = window.getComputedStyle(element);
      cssVariablesToTrack.forEach(varName => {
        computedCssColors[varName] = computedStyles.getPropertyValue(varName).trim();
      });
    }
    setCssColors(computedCssColors);

  }, [selectedTheme]);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTheme(event.target.value);
  };

  const renderColorGrid = (title: string, colors: Record<string, string>) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {Object.entries(colors).map(([name, color]) => {
          const textColor = isColor(color) ? getTextColorForBackground(color) : '#000000';
          return (
            <div
              key={name}
              className="h-24 rounded-lg shadow-md flex flex-col items-center justify-center p-2 text-center border"
              style={{ backgroundColor: color, borderColor: textColor === '#FFFFFF' ? '#AAAAAA' : '#555555' }}
            >
              <span
                className="text-xs font-mono break-all"
                style={{ color: textColor }}
              >
                {name}
              </span>
              <span
                className="text-[10px] font-mono break-all mt-1"
                style={{ color: textColor }}
              >
                {color}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Simple navigation */}
      <div className="border-b border-border bg-white py-3 px-6 shadow-sm mb-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-primary hover:text-primary/80 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
      <main className="container mx-auto py-6 px-4 text-foreground">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Project Tasks</h1>
          
          <div className="flex gap-2">
            <Link href="/task">
              <Button 
                variant={!statusFilter ? "default" : "outline"} 
                className="text-sm"
              >
                All
              </Button>
            </Link>
            {allStatuses.map(status => (
              <Link key={status} href={`/task?status=${status}`}>
                <Button 
                  variant={statusFilter === status ? "default" : "outline"} 
                  className="text-sm capitalize"
                >
                  {status}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={handleTaskClick}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-xl font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  No tasks matching the selected filter.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Task Detail Modal */}
        <TaskDetailModal 
          task={selectedTask}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />

        <div className="flex flex-col justify-center items-center">
          {/* Hidden div for applying theme class and reading computed styles */}
          <div ref={themeRef} className="hidden"></div>
          
          <div className="w-full flex justify-between gap-4 items-center">
            <div className=" mb-6 flex justify-center h-12 ">
              <label htmlFor="theme-select" className="mr-2 font-semibold self-center">Select Theme:</label>
              <select
                id="theme-select"
                value={selectedTheme}
                onChange={handleThemeChange}
                className="p-2 border rounded bg-white text-black"
              >
                {/* Explicitly list themes */}
                <option value="basic">Basic (Default)</option>
                <option value="dark">Dark</option>
                <option value="forest">Forest</option>
              </select>
            </div>

            {/* Grid for Pixi Colors */}
            {renderColorGrid("Pixi Colors (from themes.ts)", pixiColors)}
          </div>
          {/* Grid for CSS Variables */}
          {renderColorGrid("CSS Variables (Computed from globals.css)", cssColors)}
        </div>
      </main>
    </>
  );
} 