/**
 * Vision Analysis Service
 * Analyzes report images using multimodal AI to generate descriptions and extract data
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for wheel analysis
const WheelAnalysisSchema = z.object({
  description: z.string().describe('Natural language description of the wheel'),
  dominantSectors: z.array(z.object({
    name: z.string(),
    percentage: z.number()
  })).describe('Top 3-4 sectors by percentage'),
  pattern: z.string().describe('Overall pattern description (e.g., "balanced", "focused on maintaining/inspecting")'),
  insights: z.array(z.string()).describe('Key insights from the wheel distribution')
});

// Schema for graph/chart analysis
const GraphAnalysisSchema = z.object({
  description: z.string().describe('Natural language description of the graph'),
  chartType: z.string().describe('Type of chart (bar, line, pie, etc.)'),
  dataPoints: z.array(z.object({
    label: z.string(),
    value: z.union([z.number(), z.string()])
  })).describe('Key data points extracted from the graph'),
  trends: z.array(z.string()).describe('Notable trends or patterns'),
  insights: z.array(z.string()).describe('Key insights from the data')
});

export interface ImageAnalysisResult {
  detailedDescription: string;
  extractedData: any;
  insights: string[];
  imageType: 'wheel' | 'graph' | 'other';
}

export class VisionAnalysisService {
  /**
   * Analyze a report image and extract meaningful information
   */
  async analyzeImage(imageBuffer: Buffer, imageType: string, metadata?: any): Promise<ImageAnalysisResult> {
    try {
      // Convert buffer to base64 for vision API
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/png;base64,${base64Image}`;
      
      if (imageType === 'wheel') {
        return await this.analyzeWheel(imageUrl, metadata);
      } else if (imageType === 'graph') {
        return await this.analyzeGraph(imageUrl, metadata);
      } else {
        return await this.analyzeGenericImage(imageUrl);
      }
    } catch (error) {
      console.error('Vision analysis failed:', error);
      // Return fallback description
      return {
        detailedDescription: this.getFallbackDescription(imageType, metadata),
        extractedData: {},
        insights: [],
        imageType: imageType as any
      };
    }
  }

  /**
   * Analyze a Team Management Wheel image
   */
  private async analyzeWheel(imageUrl: string, metadata?: any): Promise<ImageAnalysisResult> {
    const systemPrompt = `You are analyzing a Team Management Wheel from a TMS (Team Management Systems) report. 
    The wheel shows 8 work preference sectors: Advising, Innovating, Promoting, Developing, Organizing, Producing, Inspecting, and Maintaining.
    Extract the percentages for each sector and describe the overall work preference pattern.`;

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: WheelAnalysisSchema,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this Team Management Wheel and extract the work preference distribution.' },
          { type: 'image', image: imageUrl }
        ]
      }],
      temperature: 0.1, // Low temperature for accurate data extraction
    });

    return {
      detailedDescription: result.object.description,
      extractedData: {
        sectors: result.object.dominantSectors,
        pattern: result.object.pattern
      },
      insights: result.object.insights,
      imageType: 'wheel'
    };
  }

  /**
   * Analyze a graph or chart image
   */
  private async analyzeGraph(imageUrl: string, metadata?: any): Promise<ImageAnalysisResult> {
    const systemPrompt = `You are analyzing a graph or chart from a TMS assessment report.
    Extract the data points, identify the chart type, and describe any trends or patterns.
    Common charts include score comparisons, preference distributions, and team dynamics visualizations.`;

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: GraphAnalysisSchema,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this chart and extract the data and insights.' },
          { type: 'image', image: imageUrl }
        ]
      }],
      temperature: 0.1,
    });

    return {
      detailedDescription: result.object.description,
      extractedData: {
        chartType: result.object.chartType,
        dataPoints: result.object.dataPoints,
        trends: result.object.trends
      },
      insights: result.object.insights,
      imageType: 'graph'
    };
  }

  /**
   * Analyze a generic image
   */
  private async analyzeGenericImage(imageUrl: string): Promise<ImageAnalysisResult> {
    const response = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        description: z.string(),
        elements: z.array(z.string()).describe('Key elements visible in the image'),
        relevance: z.string().describe('How this image relates to the TMS assessment')
      }),
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image from a TMS assessment report.' },
          { type: 'image', image: imageUrl }
        ]
      }],
      temperature: 0.3,
    });

    return {
      detailedDescription: response.object.description,
      extractedData: {
        elements: response.object.elements
      },
      insights: [response.object.relevance],
      imageType: 'other'
    };
  }

  /**
   * Generate fallback description when vision analysis fails
   */
  private getFallbackDescription(imageType: string, metadata?: any): string {
    switch (imageType) {
      case 'wheel':
        return 'Team Management Profile Wheel showing work preference distribution across eight sectors';
      case 'graph':
        const chartType = metadata?.chartType || 'data visualization';
        return `${chartType} showing assessment results and patterns`;
      default:
        return 'Assessment report visualization';
    }
  }

  /**
   * Generate embedding for image description
   */
  async generateImageEmbedding(description: string): Promise<number[]> {
    try {
      const response = await openai.embedding('text-embedding-3-small').doEmbed({
        values: [description]
      });
      
      return response.embeddings[0];
    } catch (error) {
      console.error('Failed to generate image embedding:', error);
      // Return empty embedding as fallback
      return new Array(1536).fill(0);
    }
  }
}