import { readFileSync } from 'fs';
import { join } from 'path';

describe('TMP Report Template', () => {
  let template: string;

  beforeAll(() => {
    const templatePath = join(__dirname, '../tmp-report.html');
    template = readFileSync(templatePath, 'utf8');
  });

  describe('URL Formatting', () => {
    it('should not contain backslashes in Asset URLs', () => {
      const backslashMatches = template.match(/Asset\\Get/g);
      expect(backslashMatches).toBeNull();
    });

    it('should use forward slashes in Asset URLs', () => {
      const forwardSlashMatches = template.match(/Asset\/Get/g);
      expect(forwardSlashMatches).not.toBeNull();
      expect(forwardSlashMatches?.length).toBeGreaterThan(0);
    });

    it('should not have double quotes in img src attributes', () => {
      const doubleQuoteMatches = template.match(/src="[^"]+""\/>/g);
      expect(doubleQuoteMatches).toBeNull();
    });

    it('should have properly formatted img tags', () => {
      const imgTags = template.match(/<img[^>]+>/g) || [];
      imgTags.forEach(tag => {
        // Check that src attribute is properly quoted
        const srcMatch = tag.match(/src="([^"]+)"/);
        expect(srcMatch).not.toBeNull();
        
        // Check that tag ends properly
        expect(tag).toMatch(/\/?>$/);
        
        // Check no double quotes after src
        expect(tag).not.toMatch(/src="[^"]+""/);
      });
    });
  });

  describe('Image URLs', () => {
    it('should contain role circle images with placeholders', () => {
      expect(template).toContain('{{BASE_URL}}/Asset/Get/mr_circle_{{MAJOR_ROLE_CODE}}');
      expect(template).toContain('{{BASE_URL}}/Asset/Get/rr_circle_{{RELATED_ROLE_1_CODE}}');
      expect(template).toContain('{{BASE_URL}}/Asset/Get/rr_circle_{{RELATED_ROLE_2_CODE}}');
    });

    it('should contain GetGraph URLs with proper query parameters', () => {
      expect(template).toContain('GetGraph?CreateTMPQWheel&mr={{MAJOR_ROLE_SCORE}}&rr1={{RELATED_ROLE_1_SCORE}}&rr2={{RELATED_ROLE_2_SCORE}}');
      expect(template).toContain('GetGraph?CreateTMPQIntroWheel&mr=8&rr1=7&rr2=5');
    });

    it('should use & not &amp; in query parameters', () => {
      const graphUrls = template.match(/GetGraph\?[^"]+/g) || [];
      graphUrls.forEach(url => {
        expect(url).not.toContain('&amp;');
        expect(url).toContain('&');
      });
    });
  });

  describe('CSS Classes', () => {
    it('should have imgholder classes for role images', () => {
      expect(template).toContain('class="imgholder"');
      expect(template).toContain('class="imgholder2"');
    });

    it('should have graphwheel classes for wheel charts', () => {
      expect(template).toContain('class="graphwheel"');
      expect(template).toContain('class="graphwheel2"');
    });
  });

  describe('Template Placeholders', () => {
    it('should contain all required placeholders', () => {
      const requiredPlaceholders = [
        '{{BASE_URL}}',
        '{{RESPONDENT_NAME}}',
        '{{ORGANIZATION_NAME}}',
        '{{REPORT_DATE}}',
        '{{MAJOR_ROLE}}',
        '{{MAJOR_ROLE_CODE}}',
        '{{RELATED_ROLE_1}}',
        '{{RELATED_ROLE_1_CODE}}',
        '{{RELATED_ROLE_2}}',
        '{{RELATED_ROLE_2_CODE}}',
        '{{MAJOR_ROLE_SCORE}}',
        '{{RELATED_ROLE_1_SCORE}}',
        '{{RELATED_ROLE_2_SCORE}}'
      ];

      requiredPlaceholders.forEach(placeholder => {
        expect(template).toContain(placeholder);
      });
    });
  });
});