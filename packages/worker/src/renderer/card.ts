import sharp from 'sharp';
import {
  IMAGE_RENDER_WIDTH,
  IMAGE_RENDER_HEIGHT,
  REEL_RECOMMENDED_WIDTH,
  REEL_RECOMMENDED_HEIGHT,
} from '@ig-auto/core';

export interface CardRenderOptions {
  imageUrl: string;
  quoteText: string;
  authorOrBrand?: string;
  aspectRatio?: '4/5' | '9/16';
  scrimOpacity?: number; // 0.0 to 1.0
  fontFamily?: string;
  textColor?: string;
}

export interface RenderResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: 'jpeg';
  sizeBytes: number;
}

export class CardRenderer {
  /**
   * Render a quote card from an image URL and quote text
   */
  async render(options: CardRenderOptions): Promise<RenderResult> {
    const {
      imageUrl,
      quoteText,
      authorOrBrand,
      aspectRatio = '4/5',
      scrimOpacity = 0.55,
      fontFamily = 'Playfair Display, Georgia, serif',
      textColor = '#FFFFFF',
    } = options;

    const width = aspectRatio === '4/5' ? IMAGE_RENDER_WIDTH : REEL_RECOMMENDED_WIDTH;
    const height = aspectRatio === '4/5' ? IMAGE_RENDER_HEIGHT : REEL_RECOMMENDED_HEIGHT;

    // 1. Fetch background image buffer
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: status ${imgResponse.status}`);
    }
    const rawImageBuffer = Buffer.from(await imgResponse.arrayBuffer());

    // 2. Format quote text into wrapped SVG lines
    const maxCharsPerLine = aspectRatio === '4/5' ? 24 : 20;
    const words = quoteText.trim().split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > maxCharsPerLine && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = `${currentLine} ${word}`.trim();
      }
    }
    if (currentLine) {
      lines.push(currentLine.trim());
    }

    const fontSize = lines.length > 4 ? 46 : 56;
    const lineHeight = fontSize * 1.35;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (height - totalTextHeight) / 2 + fontSize * 0.8;

    // Build SVG overlay with gradient scrim and typography
    const textSpans = lines
      .map(
        (line, index) =>
          `<tspan x="${width / 2}" dy="${index === 0 ? 0 : lineHeight}">${this.escapeXml(line)}</tspan>`,
      )
      .join('\n');

    const authorSvg = authorOrBrand
      ? `<text x="${width / 2}" y="${startY + totalTextHeight + 40}" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-size="20" font-weight="600" letter-spacing="4" fill="${textColor}" fill-opacity="0.85" text-transform="uppercase">${this.escapeXml(authorOrBrand)}</text>`
      : '';

    const svgOverlay = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="scrimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#000000" stop-opacity="${(scrimOpacity * 0.7).toFixed(2)}" />
            <stop offset="50%" stop-color="#000000" stop-opacity="${scrimOpacity.toFixed(2)}" />
            <stop offset="100%" stop-color="#000000" stop-opacity="${Math.min(scrimOpacity * 1.3, 0.95).toFixed(2)}" />
          </linearGradient>
          <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.8" />
          </filter>
        </defs>

        <!-- Scrim Rect -->
        <rect width="${width}" height="${height}" fill="url(#scrimGrad)" />

        <!-- Aesthetic Quote Text -->
        <text
          x="${width / 2}"
          y="${startY}"
          text-anchor="middle"
          font-family="${fontFamily}"
          font-size="${fontSize}"
          font-weight="600"
          fill="${textColor}"
          filter="url(#textShadow)"
        >
          ${textSpans}
        </text>

        ${authorSvg}
      </svg>
    `;

    // 3. Composite using Sharp
    const finalBuffer = await sharp(rawImageBuffer)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 92, chromaSubsampling: '4:2:0' })
      .toBuffer();

    return {
      buffer: finalBuffer,
      width,
      height,
      format: 'jpeg',
      sizeBytes: finalBuffer.length,
    };
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
