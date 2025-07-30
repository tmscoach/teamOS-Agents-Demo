"use client";

import { useEffect, useRef, useMemo, memo } from 'react';
import DOMPurify from 'dompurify';

interface RawReportViewerProps {
  html: string;
  onSectionChange: (section: string) => void;
}

const RawReportViewer = memo(function RawReportViewer({ html, onSectionChange }: RawReportViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML using DOMPurify
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(html, {
      // Allow all HTML tags but remove dangerous attributes
      FORBID_ATTR: ['onclick', 'onload', 'onerror'],
      FORBID_TAGS: ['script', 'style'],
      // Keep classes and IDs for styling
      ALLOWED_ATTR: ['class', 'id', 'href', 'src', 'alt', 'title', 'data-*']
    });
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
  }, [onSectionChange]);

  return (
    <div 
      ref={containerRef}
      className="w-full"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
});

export default RawReportViewer;