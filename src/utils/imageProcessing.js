/**
 * ULTRA-SHARP ID CARD SCANNER ENGINE WITH FAIL-SAFE DOWNLOAD
 */

// Dimension Presets at 300 DPI
export const CARD_PRESETS = {
  PRESET_3_3_X_2_2: {
    id: '3.3x2.2',
    name: '3.3" × 2.2" (User Target)',
    widthInches: 3.3,
    heightInches: 2.2,
    dpi: 300,
    widthPx: 990,  // 3.3 * 300
    heightPx: 660, // 2.2 * 300
    aspectRatio: 3.3 / 2.2 // 1.5
  },
  CR80_STANDARD: {
    id: 'cr80',
    name: 'Standard ID (3.375" × 2.125")',
    widthInches: 3.375,
    heightInches: 2.125,
    dpi: 300,
    widthPx: 1013,
    heightPx: 638,
    aspectRatio: 3.375 / 2.125 // 1.588
  },
  WALLET: {
    id: 'wallet',
    name: 'Wallet Size (3.5" × 2.0")',
    widthInches: 3.5,
    heightInches: 2.0,
    dpi: 300,
    widthPx: 1050,
    heightPx: 600,
    aspectRatio: 3.5 / 2.0 // 1.75
  }
};

/**
 * FAIL-SAFE UNIVERSAL JPEG DOWNLOAD HELPER (Blob URL Powered for Large A4 Sheets)
 */
export function downloadCanvasAsJPEG(canvas, filename = 'ID_Card_3.3x2.2_300DPI.jpg') {
  if (!canvas) return;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(canvas, 0, 0);

  let safeName = filename.trim();
  if (!safeName.toLowerCase().endsWith('.jpg') && !safeName.toLowerCase().endsWith('.jpeg')) {
    safeName += '.jpg';
  }

  try {
    const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.98);
    const link = document.createElement('a');
    link.download = safeName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 1000);
  } catch (err) {
    if (exportCanvas.toBlob) {
      exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = safeName;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 3000);
      }, 'image/jpeg', 0.98);
    }
  }
}

/**
 * 100% RELIABLE 1-CLICK DIRECT PRINT ENGINE (IFRAME POWERED)
 * Prints single-page or 2-page duplex sheets directly with zero margins & high resolution.
 */
export function printDocumentViaIframe({ pageCanvases, title = 'Direct Print A4 ID Cards' }) {
  if (!pageCanvases || pageCanvases.length === 0) return;

  const existingIframe = document.getElementById('direct-print-iframe');
  if (existingIframe && document.body.contains(existingIframe)) {
    document.body.removeChild(existingIframe);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'direct-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();

  const pagesHtml = pageCanvases
    .map((canvas, idx) => {
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      return `<div class="print-page"><img src="${imgData}" alt="Page ${idx + 1}" /></div>`;
    })
    .join('');

  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            width: 100%;
            height: 100%;
          }
          .print-page {
            width: 100vw;
            height: 100vh;
            page-break-after: always;
            page-break-inside: avoid;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 400);
}

/**
 * GENERATE A4 MULTI-COPY SHEET (1 to 8 Copies at 300 DPI)
 * Standard A4: 2480px x 3508px (8.27" x 11.69" @ 300 DPI)
 * Supports:
 * - 'front' (1 to 8 copies of front)
 * - 'back' (1 to 8 copies of back)
 * - 'paired' (front & back pairs, up to 4 pairs = 8 cards)
 */
/**
 * GENERATE A4 MULTI-COPY SHEET (1 to 8 Copies at 300 DPI)
 * Standard A4: 2480px x 3508px (8.27" x 11.69" @ 300 DPI)
 * Provides 100% symmetric margins for perfect front/back duplex registration when printed.
 */
export function generateA4MultiCopyCanvas({
  frontCanvas,
  backCanvas,
  presetInfo = CARD_PRESETS.PRESET_3_3_X_2_2,
  quantity = 8,
  layoutMode = 'front', // 'front' | 'back' | 'paired' | 'combined16'
  showCutLines = true,
  showLabel = true,
  duplexMirror = true // Matches physical back slot to front slot when flipped on long edge
}) {
  const a4Width = 2480;
  const a4Height = 3508;

  const canvas = document.createElement('canvas');
  canvas.width = a4Width;
  canvas.height = a4Height;
  const ctx = canvas.getContext('2d');

  // Pure White Background Sheet
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, a4Width, a4Height);

  // 16-card combined mode: 8 Fronts + 8 Backs on 1 Single A4 Sheet
  if (layoutMode === 'combined16' || layoutMode === 'both16') {
    const cardW16 = 530;
    const cardH16 = 353;
    const gapX16 = 70;
    const gapY16 = 180;
    const marginX16 = Math.round((a4Width - (4 * cardW16 + 3 * gapX16)) / 2);
    const marginY16 = Math.round((a4Height - (4 * cardH16 + 3 * gapY16)) / 2);

    // 8 Fronts (Columns 0 & 1, Rows 0..3)
    for (let i = 0; i < 8; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = marginX16 + col * (cardW16 + gapX16);
      const y = marginY16 + row * (cardH16 + gapY16);

      const srcCanvas = frontCanvas || backCanvas;
      if (srcCanvas) {
        ctx.drawImage(srcCanvas, x, y, cardW16, cardH16);
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x, y, cardW16, cardH16);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Front ${i + 1}`, x + cardW16 / 2, y + cardH16 / 2);
      }

      if (showCutLines) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(x, y, cardW16, cardH16);
        ctx.setLineDash([]);
      }

      if (showLabel) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`FRONT (${i + 1}/8)`, x, y - 6);
      }
    }

    // 8 Backs (Columns 2 & 3, Rows 0..3)
    for (let i = 0; i < 8; i++) {
      const col = 2 + (i % 2);
      const row = Math.floor(i / 2);
      const x = marginX16 + col * (cardW16 + gapX16);
      const y = marginY16 + row * (cardH16 + gapY16);

      const srcCanvas = backCanvas || frontCanvas;
      if (srcCanvas) {
        ctx.drawImage(srcCanvas, x, y, cardW16, cardH16);
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x, y, cardW16, cardH16);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Back ${i + 1}`, x + cardW16 / 2, y + cardH16 / 2);
      }

      if (showCutLines) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(x, y, cardW16, cardH16);
        ctx.setLineDash([]);
      }

      if (showLabel) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`BACK (${i + 1}/8)`, x, y - 6);
      }
    }

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A4 ID Card Sheet • 8 Front & 8 Back Copies (16 Total) @ 300 DPI — Powered by Lunar AI', a4Width / 2, marginY16 / 2);

    return canvas;
  }

  const cardW = presetInfo.widthPx; // 990px
  const cardH = presetInfo.heightPx; // 660px

  // Symmetrically balanced horizontal and vertical spacing
  const gapX = 160;
  const marginX = Math.round((a4Width - (2 * cardW + gapX)) / 2); // 170px (Left == Right)

  const gapY = 140;
  const marginY = Math.round((a4Height - (4 * cardH + 3 * gapY)) / 2); // 224px (Top == Bottom)

  const count = Math.min(8, Math.max(1, quantity));

  for (let i = 0; i < count; i++) {
    let col = i % 2;
    const row = Math.floor(i / 2);

    // If printing Back side with duplex alignment, mirror column (Col 0 <-> Col 1)
    // so Back copy i aligns precisely on the back of Front copy i when flipped horizontally!
    if (layoutMode === 'back' && duplexMirror) {
      col = col === 0 ? 1 : 0;
    }

    const x = marginX + col * (cardW + gapX);
    const y = marginY + row * (cardH + gapY);

    let srcCanvas = null;
    let cardSideText = '';

    if (layoutMode === 'front') {
      srcCanvas = frontCanvas || backCanvas;
      cardSideText = 'FRONT';
    } else if (layoutMode === 'back') {
      srcCanvas = backCanvas || frontCanvas;
      cardSideText = 'BACK';
    } else if (layoutMode === 'paired') {
      if (col === 0) {
        srcCanvas = frontCanvas || backCanvas;
        cardSideText = 'FRONT';
      } else {
        srcCanvas = backCanvas || frontCanvas;
        cardSideText = 'BACK';
      }
    }

    if (srcCanvas) {
      ctx.drawImage(srcCanvas, x, y, cardW, cardH);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x, y, cardW, cardH);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Card Slot ${i + 1}`, x + cardW / 2, y + cardH / 2);
    }

    if (showCutLines) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(x, y, cardW, cardH);
      ctx.setLineDash([]);
    }

    if (showLabel) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${cardSideText} • ${presetInfo.widthInches}" × ${presetInfo.heightInches}" (${i + 1}/${count})`, x, y - 6);
    }
  }

  // Top header text
  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `A4 ID Card Sheet • ${count} Copies • ${presetInfo.widthInches}" × ${presetInfo.heightInches}" (300 DPI Duplex-Aligned)`,
    a4Width / 2,
    marginY / 2
  );

  return canvas;
}

/**
 * HIGH-RELIABILITY AUTOMATIC ID CARD CORNER DETECTION ENGINE
 * Uses dual gradient & background energy scanning to tightly lock onto physical card borders.
 */
export function detectCardCorners(img) {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  if (!origW || !origH) {
    return [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 650 },
      { x: 0, y: 650 }
    ];
  }

  // Work on a fast 320px normalized canvas
  const targetW = 320;
  const scale = targetW / origW;
  const targetH = Math.max(10, Math.floor(origH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;
  const total = targetW * targetH;

  // 1. Grayscale luminance
  const lum = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    lum[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // 2. Sample outer border luminance vs center luminance
  let borderLumSum = 0;
  let borderCount = 0;
  const bSize = 6;
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      if (x < bSize || x >= targetW - bSize || y < bSize || y >= targetH - bSize) {
        borderLumSum += lum[y * targetW + x];
        borderCount++;
      }
    }
  }
  const borderLum = borderCount > 0 ? borderLumSum / borderCount : 128;

  // 3. Dual Method: (A) Difference from background border & (B) Sobel Gradient Energy
  const score = new Float32Array(total);
  let maxScore = 0;

  for (let y = 1; y < targetH - 1; y++) {
    for (let x = 1; x < targetW - 1; x++) {
      const idx = y * targetW + x;
      const gx = lum[idx + 1] - lum[idx - 1];
      const gy = lum[idx + targetW] - lum[idx - targetW];
      const gradMag = Math.hypot(gx, gy);
      const bgDiff = Math.abs(lum[idx] - borderLum);
      
      const combined = gradMag * 0.7 + bgDiff * 0.5;
      score[idx] = combined;
      if (combined > maxScore) maxScore = combined;
    }
  }

  const threshold = Math.max(15, maxScore * 0.25);

  // 4. Multi-ray perimeter scanning (from 4 edges toward center)
  const topHits = [];
  const bottomHits = [];
  const leftHits = [];
  const rightHits = [];

  // Vertical rays
  for (let x = Math.floor(targetW * 0.08); x <= Math.floor(targetW * 0.92); x += 2) {
    // Top -> center
    for (let y = 2; y < Math.floor(targetH * 0.5); y++) {
      if (score[y * targetW + x] > threshold) {
        topHits.push(y);
        break;
      }
    }
    // Bottom -> center
    for (let y = targetH - 3; y > Math.floor(targetH * 0.5); y--) {
      if (score[y * targetW + x] > threshold) {
        bottomHits.push(y);
        break;
      }
    }
  }

  // Horizontal rays
  for (let y = Math.floor(targetH * 0.08); y <= Math.floor(targetH * 0.92); y += 2) {
    // Left -> center
    for (let x = 2; x < Math.floor(targetW * 0.5); x++) {
      if (score[y * targetW + x] > threshold) {
        leftHits.push(x);
        break;
      }
    }
    // Right -> center
    for (let x = targetW - 3; x > Math.floor(targetW * 0.5); x--) {
      if (score[y * targetW + x] > threshold) {
        rightHits.push(x);
        break;
      }
    }
  }

  const getPercentile = (arr, pct, fallback) => {
    if (!arr || arr.length < 3) return fallback;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * pct)));
    return sorted[idx];
  };

  // 20th percentile gives exact clean edge without text noise
  let top = getPercentile(topHits, 0.20, 0);
  let bottom = getPercentile(bottomHits, 0.80, targetH);
  let left = getPercentile(leftHits, 0.20, 0);
  let right = getPercentile(rightHits, 0.80, targetW);

  // If card fills almost the entire image (already cropped / minimal border), snap to 0 or true edge
  if (right - left < targetW * 0.3 || bottom - top < targetH * 0.3) {
    top = 0;
    bottom = targetH;
    left = 0;
    right = targetW;
  }

  return [
    { x: Math.round(left / scale), y: Math.round(top / scale) },
    { x: Math.round(right / scale), y: Math.round(top / scale) },
    { x: Math.round(right / scale), y: Math.round(bottom / scale) },
    { x: Math.round(left / scale), y: Math.round(bottom / scale) }
  ];
}

/**
 * Perform 4-point bilinear perspective transformation to crop & flatten an image quad.
 */
export function warpPerspective(img, corners, targetWidth, targetHeight) {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcWidth;
  srcCanvas.height = srcHeight;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  srcCtx.drawImage(img, 0, 0, srcWidth, srcHeight);
  const srcImgData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
  const srcData = srcImgData.data;

  const dstImgData = ctx.createImageData(targetWidth, targetHeight);
  const dstData = dstImgData.data;

  const [c0, c1, c2, c3] = corners;

  for (let y = 0; y < targetHeight; y++) {
    const v = y / (targetHeight - 1);
    const invV = 1 - v;

    const topX = invV * c0.x + v * c3.x;
    const topY = invV * c0.y + v * c3.y;
    const botX = invV * c1.x + v * c2.x;
    const botY = invV * c1.y + v * c2.y;

    for (let x = 0; x < targetWidth; x++) {
      const u = x / (targetWidth - 1);
      const invU = 1 - u;

      const srcX = invU * topX + u * botX;
      const srcY = invU * topY + u * botY;

      const x0 = Math.floor(srcX);
      const x1 = Math.min(x0 + 1, srcWidth - 1);
      const y0 = Math.floor(srcY);
      const y1 = Math.min(y0 + 1, srcHeight - 1);

      const dx = srcX - x0;
      const dy = srcY - y0;

      const idx00 = (y0 * srcWidth + x0) * 4;
      const idx10 = (y0 * srcWidth + x1) * 4;
      const idx01 = (y1 * srcWidth + x0) * 4;
      const idx11 = (y1 * srcWidth + x1) * 4;

      const dstIdx = (y * targetWidth + x) * 4;

      for (let c = 0; c < 3; c++) {
        const topVal = (1 - dx) * srcData[idx00 + c] + dx * srcData[idx10 + c];
        const botVal = (1 - dx) * srcData[idx01 + c] + dx * srcData[idx11 + c];
        dstData[dstIdx + c] = Math.round((1 - dy) * topVal + dy * botVal);
      }
      dstData[dstIdx + 3] = 255;
    }
  }

  ctx.putImageData(dstImgData, 0, 0);
  return canvas;
}

/**
 * HIGH-DEFINITION DOCUMENT & ID CARD ENHANCER ENGINE (FAST 60FPS OPTIMIZED)
 */
export function applyImageEnhancements(inputCanvas, options = {}) {
  const {
    mode = 'magic-color',
    brightness = 0,
    contrast = 25,
    textDarkening = 40,
    sharpness = 65,
    shadowRemoval = 60,
    saturation = 15,
    invert = false
  } = options;

  const width = inputCanvas.width;
  const height = inputCanvas.height;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(inputCanvas, 0, 0);

  if (mode === 'original') return outputCanvas;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  // 1. High-Pass Unsharp Masking
  const sharpenedData = new Float32Array(totalPixels * 3);
  const sharpWeight = (sharpness / 100) * 1.5;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x);
      const pixelIdx = idx * 4;

      if (sharpness > 0 && y > 0 && y < height - 1 && x > 0 && x < width - 1) {
        for (let c = 0; c < 3; c++) {
          const center = data[pixelIdx + c];
          const blur = (
            data[((y - 1) * width + (x - 1)) * 4 + c] +
            data[((y - 1) * width + x) * 4 + c] * 2 +
            data[((y - 1) * width + (x + 1)) * 4 + c] +
            data[(y * width + (x - 1)) * 4 + c] * 2 +
            center * 4 +
            data[(y * width + (x + 1)) * 4 + c] * 2 +
            data[((y + 1) * width + (x - 1)) * 4 + c] +
            data[((y + 1) * width + x) * 4 + c] * 2 +
            data[((y + 1) * width + (x + 1)) * 4 + c]
          ) / 16.0;

          const edge = center - blur;
          sharpenedData[idx * 3 + c] = Math.min(255, Math.max(0, center + edge * sharpWeight));
        }
      } else {
        sharpenedData[idx * 3] = data[pixelIdx];
        sharpenedData[idx * 3 + 1] = data[pixelIdx + 1];
        sharpenedData[idx * 3 + 2] = data[pixelIdx + 2];
      }
    }
  }

  // 2. Smooth Background Illumination Map
  const bgLum = computeIlluminationMap(data, width, height, Math.max(20, Math.floor(width / 20)));

  // Fast pre-calculated multipliers
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const sWeight = Math.min(1.0, shadowRemoval / 100);
  const darkMultiplier = 1.0 + (textDarkening / 70.0);
  const satScale = 1.0 + (saturation / 100.0);

  for (let i = 0; i < totalPixels; i++) {
    const pIdx = i * 4;
    let r = sharpenedData[i * 3];
    let g = sharpenedData[i * 3 + 1];
    let b = sharpenedData[i * 3 + 2];
    let l = 0.299 * r + 0.587 * g + 0.114 * b;

    const bg = bgLum[i] || 200;

    if (mode === 'magic-color' || mode === 'magic') {
      const illuminationRatio = Math.max(0.25, bg / 245);
      const lightCorrected = Math.min(255, l / ((1 - sWeight) + sWeight * illuminationRatio));
      
      const gain = l > 0 ? lightCorrected / l : 1;
      r = Math.min(255, r * gain);
      g = Math.min(255, g * gain);
      b = Math.min(255, b * gain);

      const currentLum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (currentLum < 200 && textDarkening > 0) {
        const darkCurve = Math.pow(currentLum / 200, darkMultiplier);
        const darkScale = (darkCurve * 200) / Math.max(currentLum, 1);
        r = Math.min(255, Math.max(0, r * darkScale));
        g = Math.min(255, Math.max(0, g * darkScale));
        b = Math.min(255, Math.max(0, b * darkScale));
      } else if (currentLum >= 200 && shadowRemoval > 30) {
        const boost = ((currentLum - 200) / 55) * 15;
        r = Math.min(255, r + boost);
        g = Math.min(255, g + boost);
        b = Math.min(255, b + boost);
      }

      if (saturation !== 0) {
        const avg = (r + g + b) / 3;
        r = Math.min(255, Math.max(0, avg + (r - avg) * satScale));
        g = Math.min(255, Math.max(0, avg + (g - avg) * satScale));
        b = Math.min(255, Math.max(0, avg + (b - avg) * satScale));
      }

      if (contrast !== 0) {
        r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
      }
      if (brightness !== 0) {
        r = Math.min(255, Math.max(0, r + brightness));
        g = Math.min(255, Math.max(0, g + brightness));
        b = Math.min(255, Math.max(0, b + brightness));
      }

    } else if (mode === 'magic-bw' || mode === 'sauvola' || mode === 'bw') {
      const localBg = Math.max(bg, 50);
      let norm = (l / localBg) * 220;
      
      let finalMono;
      if (norm < 165) {
        finalMono = Math.pow(norm / 165, darkMultiplier) * 80;
        finalMono = contrastFactor * (finalMono - 128) + 128;
      } else {
        finalMono = 240 + ((norm - 165) / 90) * 15;
      }

      finalMono = Math.min(255, Math.max(0, finalMono + brightness));
      r = g = b = finalMono;

    } else if (mode === 'grayscale') {
      const illuminationRatio = Math.max(0.3, bg / 240);
      let grayVal = Math.min(255, l / ((1 - sWeight) + sWeight * illuminationRatio));

      if (grayVal < 190 && textDarkening > 0) {
        const darkCurve = Math.pow(grayVal / 190, darkMultiplier);
        grayVal = darkCurve * 190;
      }

      if (contrast !== 0) {
        grayVal = contrastFactor * (grayVal - 128) + 128;
      }
      if (brightness !== 0) {
        grayVal += brightness;
      }

      grayVal = Math.min(255, Math.max(0, grayVal));
      r = g = b = grayVal;

    } else if (mode === 'color') {
      if (bg > 20) {
        const factor = Math.min(255, 230 / bg);
        r = Math.min(255, r * ((1 - sWeight) + sWeight * factor));
        g = Math.min(255, g * ((1 - sWeight) + sWeight * factor));
        b = Math.min(255, b * ((1 - sWeight) + sWeight * factor));
      }

      if (saturation !== 0) {
        const avg = (r + g + b) / 3;
        r = Math.min(255, Math.max(0, avg + (r - avg) * satScale));
        g = Math.min(255, Math.max(0, avg + (g - avg) * satScale));
        b = Math.min(255, Math.max(0, avg + (b - avg) * satScale));
      }

      if (contrast !== 0) {
        r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
      }
      if (brightness !== 0) {
        r = Math.min(255, Math.max(0, r + brightness));
        g = Math.min(255, Math.max(0, g + brightness));
        b = Math.min(255, Math.max(0, b + brightness));
      }
    }

    if (invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[pIdx] = Math.min(255, Math.max(0, Math.round(r)));
    data[pIdx + 1] = Math.min(255, Math.max(0, Math.round(g)));
    data[pIdx + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

export function computeIlluminationMap(data, width, height, blockSize) {
  const totalPixels = width * height;
  const lumMap = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    lumMap[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const gridW = Math.ceil(width / blockSize);
  const gridH = Math.ceil(height / blockSize);
  const grid = new Float32Array(gridW * gridH);

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      let sum = 0;
      let count = 0;
      const startX = gx * blockSize;
      const endX = Math.min(width, (gx + 1) * blockSize);
      const startY = gy * blockSize;
      const endY = Math.min(height, (gy + 1) * blockSize);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          sum += lumMap[y * width + x];
          count++;
        }
      }
      grid[gy * gridW + gx] = count > 0 ? sum / count : 128;
    }
  }

  const bgMap = new Float32Array(totalPixels);
  for (let y = 0; y < height; y++) {
    const gy = y / blockSize;
    const gy0 = Math.floor(gy);
    const gy1 = Math.min(gridH - 1, gy0 + 1);
    const dy = gy - gy0;

    for (let x = 0; x < width; x++) {
      const gx = x / blockSize;
      const gx0 = Math.floor(gx);
      const gx1 = Math.min(gridW - 1, gx0 + 1);
      const dx = gx - gx0;

      const v00 = grid[gy0 * gridW + gx0];
      const v10 = grid[gy0 * gridW + gx1];
      const v01 = grid[gy1 * gridW + gx0];
      const v11 = grid[gy1 * gridW + gx1];

      const top = (1 - dx) * v00 + dx * v10;
      const bot = (1 - dx) * v01 + dx * v11;

      bgMap[y * width + x] = (1 - dy) * top + dy * bot;
    }
  }

  return bgMap;
}

export function getDefaultCorners(width, height) {
  const padX = width * 0.02;
  const padY = height * 0.02;

  return [
    { x: padX, y: padY },
    { x: width - padX, y: padY },
    { x: width - padX, y: height - padY },
    { x: padX, y: height - padY }
  ];
}
