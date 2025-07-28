"use client";

import { useEffect, useRef, useMemo } from 'react';

interface RawReportViewerProps {
  html: string;
  onSectionChange: (section: string) => void;
}

export default function RawReportViewer({ html, onSectionChange }: RawReportViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML to remove problematic onclick handlers
  const sanitizedHtml = useMemo(() => {
    // Remove onclick handlers that reference undefined variables
    let cleaned = html.replace(/onclick="javascript:returnLocation\([^)]+\)"/g, '');
    
    // Also remove any inline scripts that might cause errors
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // Remove any remaining onclick attributes to be safe
    cleaned = cleaned.replace(/onclick="[^"]*"/gi, '');
    
    return cleaned;
  }, [html]);

  useEffect(() => {
    // Set up intersection observer for section tracking
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Try to find an h2 element to identify the section
            const h2 = entry.target.querySelector('h2');
            if (h2) {
              const sectionText = h2.textContent || 'unknown';
              onSectionChange(sectionText.toLowerCase().replace(/\s+/g, '-'));
            }
          }
        });
      },
      { 
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
      }
    );

    // Observe all divs that might be sections
    const sections = containerRef.current.querySelectorAll('div');
    sections.forEach(section => {
      if (section.querySelector('h2')) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, [sanitizedHtml, onSectionChange]);

  return (
    <div 
      ref={containerRef}
      className="w-full"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}