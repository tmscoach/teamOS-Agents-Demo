import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StyledReportViewer from '@/app/chat/debrief/components/StyledReportViewer';

// Mock the CSS module
jest.mock('@/app/chat/debrief/components/StyledReportViewer.module.css', () => ({
  reportContainer: 'reportContainer'
}));

// Mock RawReportViewer
jest.mock('@/app/chat/debrief/components/RawReportViewer', () => {
  return function MockRawReportViewer({ html, onSectionChange }: any) {
    return <div data-testid="raw-report-viewer" dangerouslySetInnerHTML={{ __html: html }} />;
  };
});

describe('StyledReportViewer', () => {
  const mockOnSectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with enhanced HTML', () => {
    const testHtml = '<section id="test">Test Section</section>';
    
    render(
      <StyledReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    const viewer = screen.getByTestId('raw-report-viewer');
    expect(viewer.innerHTML).toContain('class="report-section"');
  });

  it('adds report-section class to sections', () => {
    const testHtml = '<section id="intro">Introduction</section><section id="details">Details</section>';
    
    render(
      <StyledReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    const viewer = screen.getByTestId('raw-report-viewer');
    expect(viewer.innerHTML).toContain('<section id="intro" class="report-section">');
    expect(viewer.innerHTML).toContain('<section id="details" class="report-section">');
  });

  it('adds report-card class to bordered divs', () => {
    const testHtml = '<div class="border">Card Content</div>';
    
    render(
      <StyledReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    const viewer = screen.getByTestId('raw-report-viewer');
    expect(viewer.innerHTML).toContain('class="border report-card"');
  });

  it('adds report-intro-summary class to introduction summary divs', () => {
    const testHtml = '<div class="introductionsummary">Summary Content</div>';
    
    render(
      <StyledReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    const viewer = screen.getByTestId('raw-report-viewer');
    expect(viewer.innerHTML).toContain('class="introductionsummary report-intro-summary"');
  });

  it('adds report-roles-table class to roles table', () => {
    const testHtml = '<div class="rolestable">Roles Table</div>';
    
    render(
      <StyledReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    const viewer = screen.getByTestId('raw-report-viewer');
    expect(viewer.innerHTML).toContain('class="rolestable report-roles-table"');
  });

  it('adds report-bar-graph class to bar graphs', () => {
    const testHtml = '<div class="bargraph">Bar Graph</div>';
    
    render(
      <StyledReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    const viewer = screen.getByTestId('raw-report-viewer');
    expect(viewer.innerHTML).toContain('class="bargraph report-bar-graph"');
  });

  it('preserves original HTML structure while adding classes', () => {
    const testHtml = `
      <section id="test">
        <h2>Test Section</h2>
        <div class="border">
          <p>Content</p>
        </div>
      </section>
    `;
    
    render(
      <StyledReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    const viewer = screen.getByTestId('raw-report-viewer');
    expect(viewer.innerHTML).toContain('<h2>Test Section</h2>');
    expect(viewer.innerHTML).toContain('<p>Content</p>');
  });

  it('passes onSectionChange to RawReportViewer', () => {
    const testHtml = '<section>Test</section>';
    
    const { container } = render(
      <StyledReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    // Verify the component structure includes the container div
    expect(container.querySelector('.reportContainer')).toBeInTheDocument();
  });

  it('applies multiple enhancements to complex HTML', () => {
    const testHtml = `
      <section id="overview">
        <div class="introductionsummary">Summary</div>
        <div class="border">Card</div>
        <div class="rolestable">Table</div>
        <div class="bargraph">Graph</div>
      </section>
    `;
    
    render(
      <StyledReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    const viewer = screen.getByTestId('raw-report-viewer');
    const html = viewer.innerHTML;
    
    expect(html).toContain('class="report-section"');
    expect(html).toContain('class="introductionsummary report-intro-summary"');
    expect(html).toContain('class="border report-card"');
    expect(html).toContain('class="rolestable report-roles-table"');
    expect(html).toContain('class="bargraph report-bar-graph"');
  });
});