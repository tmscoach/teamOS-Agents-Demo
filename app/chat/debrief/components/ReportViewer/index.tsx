"use client";

import { useEffect, useRef, useState } from 'react';
import MainCard from './sections/MainCard';
import NavigationMenu from './sections/NavigationMenu';
import Frame from './sections/Frame';
import DbMainCard from './sections/DbMainCard';
import ReportSection from './sections/ReportSection';
import { ParsedReport } from '@/src/lib/utils/report-parser';
import './report-styles.css';

interface ReportViewerProps {
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
  reportData: ParsedReport;
  onSectionChange: (section: string) => void;
}

export default function ReportViewer({ reportType, reportData, onSectionChange }: ReportViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement>>({});

  useEffect(() => {
    // Track visible section on scroll using Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id');
            if (sectionId) {
              onSectionChange(sectionId);
            }
          }
        });
      },
      { 
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
      }
    );

    // Observe all section elements
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [onSectionChange, reportData.sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Initialize only overview/introduction sections as expanded
  useEffect(() => {
    if (reportData.sections) {
      const initialState = reportData.sections.reduce((acc, section) => ({
        ...acc,
        [section.id]: section.id === 'overview' || section.id === 'introduction' || section.title.toLowerCase().includes('overview') || section.title.toLowerCase().includes('introduction')
      }), {});
      setExpandedSections(initialState);
    }
  }, [reportData.sections]);

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Clean Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{reportData.title}</h1>
            <p className="text-lg text-gray-600 mt-1">
              {reportData.profile.majorRole || reportData.profile.name}
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Subscription: {reportData.subscriptionId}</p>
            <p>{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Navigation */}
      {reportData.sections && reportData.sections.length > 0 && (
        <>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {reportData.sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => {
                    document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="text-left px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors flex items-center gap-2"
                >
                  <span className="section-number">{index + 1}</span>
                  <span className="truncate">{section.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Report Sections */}
          <div className="flex flex-col gap-4">
            {reportData.sections.map((section, index) => (
              <div
                key={section.id}
                id={`section-${section.id}`}
                ref={el => { if (el) sectionRefs.current[section.id] = el; }}
                data-section-id={section.id}
                className={index % 2 === 0 ? '' : 'bg-gray-50 p-4 rounded-lg'}
              >
                <ReportSection
                  section={section}
                  sectionNumber={index + 1}
                  isExpanded={expandedSections[section.id] ?? false}
                  onToggle={() => toggleSection(section.id)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}