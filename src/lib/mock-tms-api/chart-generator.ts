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

  // For TMP Wheel, adjust size
  let width = 400;
  let height = 300;
  
  if (chartType === 'CreateTMPQWheel') {
    width = 300;
    height = 300;
  }
  
  // Create a more substantial placeholder PNG
  // This is a valid 1x1 blue pixel PNG that browsers will render
  const bluePixelPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length (13 bytes)
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, // bit depth: 8
    0x02, // color type: 2 (RGB)
    0x00, // compression: 0
    0x00, // filter: 0
    0x00, // interlace: 0
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length (12 bytes)
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00, 0x01, 0x01, 0x01, 0x00, 0x1B, // Blue pixel data
    0x71, 0xE3, 0x65, 0x66, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  // For now, return a simple blue pixel that will scale up
  // In production, this would generate actual charts using Canvas or similar
  return bluePixelPNG;
}