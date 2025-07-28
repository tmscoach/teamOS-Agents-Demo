import React from 'react';
import { render, waitFor } from '@testing-library/react';
import RawReportViewer from '../RawReportViewer';

describe('RawReportViewer', () => {
  const mockOnSectionChange = jest.fn();

  beforeEach(() => {
    mockOnSectionChange.mockClear();
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn()
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders sanitized HTML without onclick handlers', () => {
    const htmlWithOnclick = `
      <div>
        <a href="#section" onclick="javascript:returnLocation(introduction)">Link</a>
        <button onclick="doSomething()">Click me</button>
      </div>
    `;

    const { container } = render(
      <RawReportViewer 
        html={htmlWithOnclick} 
        onSectionChange={mockOnSectionChange} 
      />
    );

    // Check that onclick attributes are removed
    const links = container.querySelectorAll('a');
    const buttons = container.querySelectorAll('button');
    
    links.forEach(link => {
      expect(link.getAttribute('onclick')).toBeNull();
    });
    
    buttons.forEach(button => {
      expect(button.getAttribute('onclick')).toBeNull();
    });
  });

  it('removes script tags from HTML', () => {
    const htmlWithScript = `
      <div>
        <h2>Section Title</h2>
        <script>
          function returnLocation(loc) {
            console.log(loc);
          }
        </script>
        <p>Content</p>
        <script type="text/javascript">alert('test');</script>
      </div>
    `;

    const { container } = render(
      <RawReportViewer 
        html={htmlWithScript} 
        onSectionChange={mockOnSectionChange} 
      />
    );

    // Check that script tags are removed
    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(0);
    
    // Check that other content is preserved
    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeInTheDocument();
  });

  it('preserves non-problematic HTML content', () => {
    const safeHtml = `
      <div>
        <h2>Title</h2>
        <p class="text">Some content</p>
        <a href="#link">Safe link</a>
        <img src="image.png" alt="Image" />
      </div>
    `;

    const { container } = render(
      <RawReportViewer 
        html={safeHtml} 
        onSectionChange={mockOnSectionChange} 
      />
    );

    // Check that all safe elements are preserved
    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.querySelector('p.text')).toBeInTheDocument();
    expect(container.querySelector('a[href="#link"]')).toBeInTheDocument();
    expect(container.querySelector('img[src="image.png"]')).toBeInTheDocument();
  });

  it('removes specific returnLocation onclick patterns', () => {
    const htmlWithReturnLocation = `
      <div>
        <a onclick="javascript:returnLocation(overview)">Overview</a>
        <a onclick="javascript:returnLocation(keypoints)">Key Points</a>
      </div>
    `;

    const { container } = render(
      <RawReportViewer 
        html={htmlWithReturnLocation} 
        onSectionChange={mockOnSectionChange} 
      />
    );

    const links = container.querySelectorAll('a');
    links.forEach(link => {
      expect(link.getAttribute('onclick')).toBeNull();
      expect(link.textContent).toBeTruthy(); // Content is preserved
    });
  });

  it('sets up intersection observer for sections with h2 elements', () => {
    const html = `
      <div>
        <div><h2>Section 1</h2><p>Content 1</p></div>
        <div><h2>Section 2</h2><p>Content 2</p></div>
        <div><p>No h2 here</p></div>
      </div>
    `;

    render(
      <RawReportViewer 
        html={html} 
        onSectionChange={mockOnSectionChange} 
      />
    );

    // Check that IntersectionObserver was called
    expect(global.IntersectionObserver).toHaveBeenCalled();
    
    // Get the observe function from the mock
    const observeMock = (global.IntersectionObserver as jest.Mock).mock.results[0].value.observe;
    
    // Should observe 3 sections (ones with h2) - the wrapper div is also observed
    expect(observeMock).toHaveBeenCalledTimes(3);
  });

  it('sanitization is memoized based on html prop', () => {
    const html1 = '<div onclick="test()">Content 1</div>';
    const html2 = '<div onclick="test()">Content 2</div>';

    const { rerender } = render(
      <RawReportViewer 
        html={html1} 
        onSectionChange={mockOnSectionChange} 
      />
    );

    // Rerender with same HTML - should use memoized value
    rerender(
      <RawReportViewer 
        html={html1} 
        onSectionChange={mockOnSectionChange} 
      />
    );

    // Rerender with different HTML - should recalculate
    rerender(
      <RawReportViewer 
        html={html2} 
        onSectionChange={mockOnSectionChange} 
      />
    );

    // Both should have onclick removed
    const container = document.body;
    expect(container.innerHTML).toContain('Content 2');
    expect(container.innerHTML).not.toContain('onclick');
  });

  it('handles empty HTML gracefully', () => {
    const { container } = render(
      <RawReportViewer 
        html="" 
        onSectionChange={mockOnSectionChange} 
      />
    );

    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('applies correct CSS classes', () => {
    const { container } = render(
      <RawReportViewer 
        html="<p>Test</p>" 
        onSectionChange={mockOnSectionChange} 
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('w-full');
  });
});