"use client";

import { useMemo, useEffect, useRef } from 'react';
import RawReportViewer from './RawReportViewer';
import styles from './StyledReportViewer.module.css';

interface InteractiveReportViewerProps {
  html: string;
  onSectionChange: (section: string) => void;
  onImageClick?: (question: string) => void;
}

export default function InteractiveReportViewer({ 
  html, 
  onSectionChange,
  onImageClick 
}: InteractiveReportViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Enhance HTML with additional classes for styling
  const enhancedHtml = useMemo(() => {
    let enhanced = html;
    
    // Add classes to sections for styling
    enhanced = enhanced.replace(
      /<section id="([^"]+)">/g, 
      '<section id="$1" class="report-section">'
    );
    
    // Add classes to bordered divs (often used for cards in TMP reports)
    enhanced = enhanced.replace(
      /<div class="border">/g,
      '<div class="border report-card">'
    );
    
    // Add classes to main content areas
    enhanced = enhanced.replace(
      /<div class="introductionsummary">/g,
      '<div class="introductionsummary report-intro-summary">'
    );
    
    // Enhance table styling
    enhanced = enhanced.replace(
      /<div class="rolestable">/g,
      '<div class="rolestable report-roles-table">'
    );
    
    // Add wrapper class to bargraph sections
    enhanced = enhanced.replace(
      /<div class="bargraph">/g,
      '<div class="bargraph report-bar-graph">'
    );
    
    // Make images interactive with data attributes
    enhanced = enhanced.replace(
      /<img([^>]*?)>/g,
      '<img$1 data-interactive="true" style="cursor: pointer;" title="Click to learn more">'
    );
    
    return enhanced;
  }, [html]);
  
  // Set up click handlers for interactive elements
  useEffect(() => {
    if (!containerRef.current || !onImageClick) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element is an interactive image
      if (target.tagName === 'IMG' && target.dataset.interactive === 'true') {
        e.preventDefault();
        
        // Find the containing section and context
        const section = target.closest('section');
        const sectionId = section?.id || '';
        const sectionHeading = section?.querySelector('h2')?.textContent || '';
        
        // Look for nearby text that provides context
        const parentDiv = target.closest('div');
        const nearbyHeadings = parentDiv?.querySelectorAll('h3, h4');
        const nearbyText: string[] = [];
        
        nearbyHeadings?.forEach(heading => {
          nearbyText.push(heading.textContent || '');
        });
        
        // Look for specific patterns in the HTML structure
        let contextualQuestion = '';
        
        // Check if this is a Work Preference Measures graph
        if (sectionId.includes('work-preference') || sectionHeading.includes('Work Preference')) {
          // Find the specific measure (Relationships, Information, Decisions, Organisation)
          const measureHeading = Array.from(nearbyHeadings || [])
            .find(h => h.textContent?.includes('RELATIONSHIPS') || 
                      h.textContent?.includes('INFORMATION') || 
                      h.textContent?.includes('DECISIONS') || 
                      h.textContent?.includes('ORGANISATION'));
          
          if (measureHeading?.textContent?.includes('RELATIONSHIPS')) {
            contextualQuestion = "Can you explain what the Extrovert/Introvert scale means in my Work Preference Measures? What do the scores E:15 and I:22 indicate about how I relate to others?";
          } else if (measureHeading?.textContent?.includes('INFORMATION')) {
            contextualQuestion = "Can you explain the Practical/Creative scale in my Work Preference Measures? What does this dimension tell me about how I gather and use information?";
          } else if (measureHeading?.textContent?.includes('DECISIONS')) {
            contextualQuestion = "What does the Analytical/Beliefs scale mean in my Work Preference Measures? How should I interpret my scores on this decision-making dimension?";
          } else if (measureHeading?.textContent?.includes('ORGANISATION')) {
            contextualQuestion = "Can you explain the Structured/Flexible scale in my Work Preference Measures? What does this tell me about how I organize myself and others?";
          } else {
            contextualQuestion = `Can you explain more about the ${sectionHeading} section, particularly what this visual representation shows and how to interpret it?`;
          }
        } 
        // Check if this is a role wheel or other TMP visual
        else if (sectionId.includes('role') || sectionHeading.includes('Role')) {
          contextualQuestion = "Can you explain what this team role visual means and how to interpret my position on it?";
        }
        // Generic question for other images
        else {
          contextualQuestion = `Can you tell me more about what this image in the ${sectionHeading || 'report'} section represents and how to interpret it?`;
        }
        
        // Trigger the question in the chat
        onImageClick(contextualQuestion);
      }
    };
    
    // Add click listener to the container
    containerRef.current.addEventListener('click', handleClick);
    
    return () => {
      containerRef.current?.removeEventListener('click', handleClick);
    };
  }, [onImageClick]);
  
  return (
    <div ref={containerRef} className={styles.reportContainer}>
      <RawReportViewer 
        html={enhancedHtml}
        onSectionChange={onSectionChange}
      />
    </div>
  );
}