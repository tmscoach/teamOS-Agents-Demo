// Mock generateObject and generateEmbedding from 'ai' package
const mockGenerateObject = jest.fn();
const mockGenerateEmbedding = jest.fn();

jest.mock('ai', () => ({
  generateObject: jest.fn(),
  generateEmbedding: jest.fn()
}));

// Mock openai provider
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(() => ({}))
}));

import { VisionAnalysisService } from '../vision-analysis.service';
import { generateObject, generateEmbedding } from 'ai';

// Set up mocks
(generateObject as jest.Mock).mockImplementation(mockGenerateObject);
(generateEmbedding as jest.Mock).mockImplementation(mockGenerateEmbedding);

describe('VisionAnalysisService', () => {
  let service: VisionAnalysisService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VisionAnalysisService();
  });

  describe('analyzeImage', () => {
    it('should analyze a wheel image successfully', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const mockMetadata = { reportType: 'TMP' };

      mockGenerateObject.mockResolvedValueOnce({
        object: {
          description: 'Team Management Wheel with 8 sectors',
          dominantSectors: [
            { name: 'Maintaining', percentage: 19 },
            { name: 'Inspecting', percentage: 15 }
          ],
          pattern: 'focused on maintaining',
          insights: ['High maintaining preference']
        }
      });

      mockGenerateEmbedding.mockResolvedValueOnce({
        embedding: new Array(1536).fill(0.1)
      });

      const result = await service.analyzeImage(mockImageBuffer, 'wheel', mockMetadata);

      expect(result).toEqual({
        detailedDescription: 'Team Management Wheel with 8 sectors',
        extractedData: {
          sectors: [
            { name: 'Maintaining', percentage: 19 },
            { name: 'Inspecting', percentage: 15 }
          ],
          pattern: 'focused on maintaining'
        },
        insights: ['High maintaining preference'],
        imageType: 'wheel'
      });

      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
      // Note: embeddings are not generated in the current implementation
    });

    it('should analyze a graph image successfully', async () => {
      const mockImageBuffer = Buffer.from('fake-graph-data');
      
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          description: 'Horizontal bar graph showing RIDO scores',
          chartType: 'horizontal bar chart',
          dataPoints: [
            { label: 'Relationships', value: 22 },
            { label: 'Information', value: 18 }
          ],
          trends: ['Balanced distribution'],
          insights: ['Strong relationship focus']
        }
      });

      const result = await service.analyzeImage(mockImageBuffer, 'graph');

      expect(result).toEqual({
        detailedDescription: 'Horizontal bar graph showing RIDO scores',
        extractedData: {
          chartType: 'horizontal bar chart',
          dataPoints: [
            { label: 'Relationships', value: 22 },
            { label: 'Information', value: 18 }
          ],
          trends: ['Balanced distribution']
        },
        insights: ['Strong relationship focus'],
        imageType: 'graph'
      });
    });

    it('should handle analysis errors gracefully', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      
      mockGenerateObject.mockRejectedValueOnce(new Error('API error'));

      const result = await service.analyzeImage(mockImageBuffer, 'wheel');
      
      // Service returns fallback on error
      expect(result).toEqual({
        detailedDescription: expect.stringContaining('Team Management Profile Wheel'),
        extractedData: {},
        insights: [],
        imageType: 'wheel'
      });
    });

    it('should handle invalid JSON response', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      
      mockGenerateObject.mockRejectedValueOnce(new Error('Invalid response'));

      const result = await service.analyzeImage(mockImageBuffer, 'wheel');
      
      // Service returns fallback on error
      expect(result).toEqual({
        detailedDescription: expect.stringContaining('Team Management Profile Wheel'),
        extractedData: {},
        insights: [],
        imageType: 'wheel'
      });
    });
  });
});