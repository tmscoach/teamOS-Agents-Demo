/**
 * Tests for Report Processing Service
 */

import { ReportProcessingService } from '../report-processing.service';

describe('ReportProcessingService', () => {
  let service: ReportProcessingService;

  beforeEach(() => {
    service = new ReportProcessingService();
  });

  describe('extractMetadata', () => {
    it('should extract basic metadata from TMP report', () => {
      const html = `
        <h1>Team Management Profile</h1>
        <label>Name</label><p>John Doe</p>
        <label>Organisation</label><p>Acme Corp</p>
        <label>Major Role</label><p>Upholder Maintainer</p>
      `;

      const metadata = service.extractMetadata(html, 'TMP');

      expect(metadata.title).toBe('Team Management Profile');
      expect(metadata.userName).toBe('John Doe');
      expect(metadata.organizationName).toBe('Acme Corp');
      expect(metadata.profile?.name).toBe('Upholder Maintainer');
      expect(metadata.profile?.majorRole).toBe('Upholder Maintainer');
    });

    it('should extract sections from table of contents', () => {
      const html = `
        <div class="contents">
          <a href="#introduction">Introduction</a>
          <a href="#overview">Overview</a>
          <a href="#keypoints">Key Points</a>
        </div>
      `;

      const metadata = service.extractMetadata(html, 'TMP');

      expect(metadata.sections).toHaveLength(3);
      expect(metadata.sections?.[0]).toEqual({ id: 'introduction', title: 'Introduction' });
      expect(metadata.sections?.[1]).toEqual({ id: 'overview', title: 'Overview' });
      expect(metadata.sections?.[2]).toEqual({ id: 'keypoints', title: 'Key Points' });
    });

    it('should extract TMP scores', () => {
      const html = `
        <p>These are I: 7; C: 3; B: 5; S: 9 and are the foundation of your major role preference.</p>
      `;

      const metadata = service.extractMetadata(html, 'TMP');

      expect(metadata.scores).toEqual({
        I: 7,
        C: 3,
        B: 5,
        S: 9
      });
    });
  });

  describe('replaceImageUrls', () => {
    it('should replace image URLs with local paths', () => {
      const html = `
        <img src="https://api-test.tms.global/GetGraph?CreateTMPQWheel&mr=8">
        <img src="https://api-test.tms.global/Asset/Get/logo">
      `;

      const imageMap = new Map([
        ['https://api-test.tms.global/GetGraph?CreateTMPQWheel&mr=8', {
          storagePath: 'reports/123/wheel_1.png',
          imageType: 'wheel'
        }],
        ['https://api-test.tms.global/Asset/Get/logo', {
          storagePath: 'reports/123/asset_logo.png',
          imageType: 'asset'
        }]
      ]);

      const processed = service.replaceImageUrls(html, imageMap);

      expect(processed).toContain('/api/reports/images/reports/123/wheel_1.png');
      expect(processed).toContain('/api/reports/images/reports/123/asset_logo.png');
      expect(processed).not.toContain('https://api-test.tms.global');
    });
  });

  describe('extractChunks', () => {
    it('should extract chunks from sections', () => {
      const html = `
        <section id="introduction">
          <h2>Introduction</h2>
          <p>This is the introduction section with some content.</p>
        </section>
        <section id="overview">
          <h2>Overview</h2>
          <p>This is the overview section with different content.</p>
        </section>
      `;

      const chunks = service.extractChunks(html, 'TMP');

      expect(chunks).toHaveLength(2);
      expect(chunks[0].sectionId).toBe('introduction');
      expect(chunks[0].sectionTitle).toBe('Introduction');
      expect(chunks[0].content).toContain('introduction section');
      expect(chunks[1].sectionId).toBe('overview');
      expect(chunks[1].sectionTitle).toBe('Overview');
      expect(chunks[1].content).toContain('overview section');
    });

    it('should handle large sections by chunking', () => {
      const longContent = 'A'.repeat(1500); // Longer than max chunk size
      const html = `
        <section id="long">
          <h2>Long Section</h2>
          <p>${longContent}</p>
        </section>
      `;

      const chunks = service.extractChunks(html, 'TMP');

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].metadata?.chunkStart).toBe(0);
      expect(chunks[0].metadata?.totalLength).toBe(longContent.length + 14); // Including "Long Section" + spaces
    });
  });
});