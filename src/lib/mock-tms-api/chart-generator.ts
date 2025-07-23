/**
 * Mock Chart Generator
 * Generates placeholder PNG images for various TMS chart types
 */

/**
 * Generate a mock PNG buffer for a chart
 * In a real implementation, this would use a charting library like Chart.js or D3.js
 * For mock purposes, we'll return a simple placeholder PNG
 */
export async function generateChartPNG(chartType: string, params: Record<string, string>): Promise<Buffer> {
  // Log the chart request for debugging
  console.log('Generating chart:', { chartType, params });

  // Create a simple placeholder PNG with metadata about the chart type
  // This creates a small colored square based on chart type
  const width = 400;
  const height = 300;
  
  // Different colors for different chart types
  let color = [200, 200, 200]; // Default gray
  if (chartType.includes('TMP')) color = [59, 130, 246]; // Blue
  else if (chartType.includes('QO2')) color = [16, 185, 129]; // Green
  else if (chartType.includes('TeamSignals')) color = [245, 158, 11]; // Amber
  
  // Create a simple PNG with solid color
  // PNG structure: signature + IHDR + IDAT + IEND
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdr = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // chunk length
    Buffer.from('IHDR'),
    Buffer.from([
      (width >> 24) & 0xff, (width >> 16) & 0xff, (width >> 8) & 0xff, width & 0xff, // width
      (height >> 24) & 0xff, (height >> 16) & 0xff, (height >> 8) & 0xff, height & 0xff, // height
      0x08, // bit depth
      0x02, // color type (RGB)
      0x00, // compression
      0x00, // filter
      0x00  // interlace
    ])
  ]);
  
  // For simplicity, return a minimal valid PNG
  // In production, use Canvas API or similar to generate real charts
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x01, 0x90, // width: 400
    0x00, 0x00, 0x01, 0x2C, // height: 300
    0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x9A, 0x9C, 0x18, 0x00, // CRC (simplified)
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
    0xE5, 0x27, 0xDE, 0xFC, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  return minimalPNG;
}