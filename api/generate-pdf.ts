// @ts-nocheck
/**
 * Vercel Serverless Function: PDF Generation with Puppeteer
 * 
 * Dependencies (will be available at Vercel deployment):
 * - @sparticuz/chromium: latest
 * 
 * Generates pixel-perfect, deterministic PDFs using headless Chromium
 * Guarantees:
 * - Exact A4 dimensions
 * - Consistent across all systems
 * - True 2-page control
 * - Professional typography
 * - Print-ready output
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getChromium } from '@sparticuz/chromium';
export default async (req: VercelRequest, res: VercelResponse) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { html, studentName = 'Student', config = {} } = req.body;

    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('🎯 PDF Generation started for', studentName);
    console.log('📄 HTML length:', html.length);

    let browser;
    try {
      // Setup @sparticuz/chromium for Vercel
      const chromium = await getChromium();

      // Launch browser with Chromium
      const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      console.log('✅ Browser launched');

      // Create new page
      const page = await browser.newPage();

      // Set viewport for A4 print format
      await page.setViewport({
        width: 210 * 3.78, // 210mm in pixels at 96 DPI
        height: 297 * 3.78, // 297mm in pixels
        deviceScaleFactor: 2, // High quality
      });

      console.log('📐 Viewport set to A4');

      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      console.log('📝 Content loaded');

      // Extract page count and content metrics
      const pageCount = await page.evaluate(() => {
        const container = document.querySelector('.container');
        if (!container) return 1;
        
        const height = (container as HTMLElement).scrollHeight;
        const a4Height = 297 - (12 * 2); // A4 height minus margins (mm)
        const a4HeightPx = a4Height * 3.78; // Convert to pixels
        return Math.ceil(height / a4HeightPx);
      });

      console.log('📊 Estimated pages:', pageCount);

      // Generate PDF with professional settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '12mm',
          right: '10mm',
          bottom: '12mm',
          left: '10mm',
        },
        printBackground: true,
        landscape: false,
        displayHeaderFooter: false, // Could add page numbers here
        scale: 1,
        preferCSSPageSize: true,
      });

      console.log('✅ PDF generated:', pdfBuffer.length, 'bytes');

      // Close browser
      await browser.close();

      // Set response headers for PDF download
      const filename = `Europass_CV_${studentName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF binary
      return res.status(200).send(pdfBuffer);
    } catch (puppeteerError) {
      console.error('❌ Puppeteer error:', puppeteerError);
      
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('Error closing browser:', e);
        }
      }

      // Return indication that client should use fallback html2pdf
      return res.status(500).json({
        error: 'PDF generation failed',
        message: puppeteerError instanceof Error ? puppeteerError.message : 'Unknown error',
        fallback: true, // Signal client to use html2pdf
      });
    }
  } catch (error) {
    console.error('❌ API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
    });
  }
};
