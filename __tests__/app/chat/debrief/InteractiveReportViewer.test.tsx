import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveReportViewer from '@/app/chat/debrief/components/InteractiveReportViewer';

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

describe('InteractiveReportViewer', () => {
  const mockOnSectionChange = jest.fn();
  const mockOnImageClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with enhanced HTML and interactive images', () => {
    const testHtml = '<section id="work-preference"><h2>Work Preference Measures</h2><img src="test.png" alt="test" /></section>';
    
    render(
      <InteractiveReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
        onImageClick={mockOnImageClick}
      />
    );

    const viewer = screen.getByTestId('raw-report-viewer');
    expect(viewer.innerHTML).toContain('data-interactive="true"');
    expect(viewer.innerHTML).toContain('cursor: pointer;');
    expect(viewer.innerHTML).toContain('title="Click to learn more"');
  });

  it('handles image clicks and generates contextual questions', () => {
    const testHtml = `
      <section id="work-preference">
        <h2>Work Preference Measures</h2>
        <div>
          <h3>RELATIONSHIPS</h3>
          <h4>How you Relate to others</h4>
          <img src="relationships.png" alt="Extrovert/Introvert scale" />
        </div>
      </section>
    `;
    
    const { container } = render(
      <InteractiveReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
        onImageClick={mockOnImageClick}
      />
    );

    const image = container.querySelector('img[data-interactive="true"]');
    expect(image).toBeInTheDocument();
    
    fireEvent.click(image!);
    
    expect(mockOnImageClick).toHaveBeenCalledWith(
      expect.stringContaining('Extrovert/Introvert scale')
    );
  });

  it('generates specific questions for different Work Preference sections', () => {
    const sections = [
      { heading: 'INFORMATION', expectedKeyword: 'Practical/Creative' },
      { heading: 'DECISIONS', expectedKeyword: 'Analytical/Beliefs' },
      { heading: 'ORGANISATION', expectedKeyword: 'Structured/Flexible' }
    ];

    sections.forEach(({ heading, expectedKeyword }) => {
      jest.clearAllMocks();
      
      const testHtml = `
        <section id="work-preference">
          <h2>Work Preference Measures</h2>
          <div>
            <h3>${heading}</h3>
            <img src="test.png" alt="scale" />
          </div>
        </section>
      `;
      
      const { container } = render(
        <InteractiveReportViewer 
          html={testHtml}
          onSectionChange={mockOnSectionChange}
          onImageClick={mockOnImageClick}
        />
      );

      const image = container.querySelector('img[data-interactive="true"]');
      fireEvent.click(image!);
      
      expect(mockOnImageClick).toHaveBeenCalledWith(
        expect.stringContaining(expectedKeyword)
      );
    });
  });

  it('generates generic questions for non-specific images', () => {
    const testHtml = `
      <section id="overview">
        <h2>Overview</h2>
        <img src="generic.png" alt="chart" />
      </section>
    `;
    
    const { container } = render(
      <InteractiveReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
        onImageClick={mockOnImageClick}
      />
    );

    const image = container.querySelector('img[data-interactive="true"]');
    fireEvent.click(image!);
    
    expect(mockOnImageClick).toHaveBeenCalledWith(
      expect.stringContaining('tell me more about what this image')
    );
  });

  it('does not trigger callbacks when onImageClick is not provided', () => {
    const testHtml = '<section><img src="test.png" /></section>';
    
    const { container } = render(
      <InteractiveReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
      />
    );

    const image = container.querySelector('img');
    expect(() => fireEvent.click(image!)).not.toThrow();
  });

  it('handles role-related images', () => {
    const testHtml = `
      <section id="team-roles">
        <h2>Team Roles</h2>
        <img src="role-wheel.png" alt="role wheel" />
      </section>
    `;
    
    const { container } = render(
      <InteractiveReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
        onImageClick={mockOnImageClick}
      />
    );

    const image = container.querySelector('img[data-interactive="true"]');
    fireEvent.click(image!);
    
    expect(mockOnImageClick).toHaveBeenCalledWith(
      expect.stringContaining('team role visual')
    );
  });

  it('preserves all styling enhancements from StyledReportViewer', () => {
    const testHtml = `
      <section id="test">
        <div class="introductionsummary">Summary</div>
        <div class="border">Card</div>
        <div class="rolestable">Table</div>
        <div class="bargraph">Graph</div>
      </section>
    `;
    
    render(
      <InteractiveReportViewer 
        html={testHtml}
        onSectionChange={mockOnSectionChange}
        onImageClick={mockOnImageClick}
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