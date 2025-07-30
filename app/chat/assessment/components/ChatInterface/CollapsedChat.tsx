"use client";

import { RefObject, useState, useEffect, useRef } from 'react';
import OscarIcon from './OscarIcon';
import { ChevronRight } from 'lucide-react';

interface CollapsedChatProps {
  onToggle: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'collapsed-chat-position';

export default function CollapsedChat({ onToggle, inputRef }: CollapsedChatProps) {
  const [position, setPosition] = useState<Position>({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved position on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedPosition = JSON.parse(saved);
        setPosition(savedPosition);
      } catch (e) {
        console.error('Failed to parse saved position:', e);
      }
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking the button itself
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 200);
    const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 60);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div 
      ref={containerRef}
      id="chat-interface"
      className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 group backdrop-blur-sm cursor-default"
        style={{
          background: 'linear-gradient(158deg, rgba(255,243,3,0.05) 0%, rgba(251,169,61,0.05) 15%, rgba(237,1,145,0.05) 30%, rgba(167,99,173,0.05) 45%, rgba(1,133,198,0.05) 60%, rgba(2,181,230,0.05) 75%, rgba(1,161,114,0.05) 90%, rgba(162,211,111,0.05) 100%)'
        }}
      >
        <div className="relative">
          <OscarIcon className="!w-6 !h-6" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          Ask Oskar about your profile
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
      </button>
    </div>
  );
}