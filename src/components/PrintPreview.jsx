import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, Copy, CheckCircle2, Grid, Scissors, Layers, Eye, Sparkles, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { generateA4MultiCopyCanvas, downloadCanvasAsJPEG } from '../utils/imageProcessing';

export default function PrintPreview({ frontCanvas, backCanvas, presetInfo, onOpenModal }) {
  // Default to 8 Front + 8 Back on single page if both sides exist
  const [layoutMode, setLayoutMode] = useState(
    frontCanvas && backCanvas ? 'combined16' : (frontCanvas ? 'front' : (backCanvas ? 'back' : 'combined16'))
  );
  const [quantity, setQuantity] = useState(8);
  const [showCutLines, setShowCutLines] = useState(true);
  const [showLabel, setShowLabel] = useState(true);
  const [duplexMirror, setDuplexMirror] = useState(true);
  const previewCanvasRef = useRef(null);

  // Instant lightweight live canvas preview rendering (60 FPS, <2ms)
  useEffect(() => {
    if (!previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Preview dimensions (1:1.414 aspect ratio matching A4)
    const prevW = 496;
    const prevH = 702;
    canvas.width = prevW;
    canvas.height = prevH;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, prevW, prevH);

    const scale = prevW / 2480; // Scale factor for preview

    // 16-card combined mode: 8 Fronts + 8 Backs on 1 Single A4 Sheet
    if (layoutMode === 'combined16' || layoutMode === 'both16') {
      const cardW16 = 530 * scale;
      const cardH16 = 353 * scale;
      const gapX16 = 70 * scale;
      const gapY16 = 180 * scale;
      const marginX16 = Math.round((prevW - (4 * cardW16 + 3 * gapX16)) / 2);
      const marginY16 = Math.round((prevH - (4 * cardH16 + 3 * gapY16)) / 2);

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
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(x, y, cardW16, cardH16);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Front ${i + 1}`, x + cardW16 / 2, y + cardH16 / 2);
        }

        if (showCutLines) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(x, y, cardW16, cardH16);
          ctx.setLineDash([]);
        }

        if (showLabel) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`FRONT ${i + 1}`, x, y - 2);
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
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(x, y, cardW16, cardH16);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Back ${i + 1}`, x + cardW16 / 2, y + cardH16 / 2);
        }

        if (showCutLines) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(x, y, cardW16, cardH16);
          ctx.setLineDash([]);
        }

        if (showLabel) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`BACK ${i + 1}`, x, y - 2);
        }
      }

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A4 Sheet • 8 Front & 8 Back Copies (16 Total) @ 300 DPI — Powered by Lunar AI', prevW / 2, marginY16 / 2);
      return;
    }

    // Standard 1 to 8 copies layout
    const cardW = presetInfo.widthPx * scale;
    const cardH = presetInfo.heightPx * scale;
    const gapX = 160 * scale;
    const gapY = 140 * scale;
    const marginX = Math.round((prevW - (2 * cardW + gapX)) / 2);
    const marginY = Math.round((prevH - (4 * cardH + 3 * gapY)) / 2);

    const count = Math.min(8, Math.max(1, quantity));

    for (let i = 0; i < count; i++) {
      let col = i % 2;
      const row = Math.floor(i / 2);

      if (layoutMode === 'back' && duplexMirror) {
        col = col === 0 ? 1 : 0;
      }

      const x = marginX + col * (cardW + gapX);
      const y = marginY + row * (cardH + gapY);

      let srcCanvas = null;
      let label = '';
      if (layoutMode === 'front') {
        srcCanvas = frontCanvas || backCanvas;
        label = 'FRONT';
      } else if (layoutMode === 'back') {
        srcCanvas = backCanvas || frontCanvas;
        label = 'BACK';
      } else if (layoutMode === 'paired') {
        if (col === 0) {
          srcCanvas = frontCanvas || backCanvas;
          label = 'FRONT';
        } else {
          srcCanvas = backCanvas || frontCanvas;
          label = 'BACK';
        }
      }

      if (srcCanvas) {
        ctx.drawImage(srcCanvas, x, y, cardW, cardH);
      } else {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(x, y, cardW, cardH);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Card ${i + 1}`, x + cardW / 2, y + cardH / 2);
      }

      if (showCutLines) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x, y, cardW, cardH);
        ctx.setLineDash([]);
      }

      if (showLabel) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${label} (${i + 1}/${count})`, x, y - 2);
      }
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `A4 ID Card Sheet • ${count} Copies • ${presetInfo.widthInches}" × ${presetInfo.heightInches}" (300 DPI Duplex-Aligned)`,
      prevW / 2,
      marginY / 2
    );
  }, [frontCanvas, backCanvas, presetInfo, quantity, layoutMode, showCutLines, showLabel, duplexMirror]);

  // Export Full 300 DPI A4 Sheet as JPEG
  const handleDownloadA4JPEG = () => {
    const fullCanvas = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity,
      layoutMode,
      showCutLines,
      showLabel,
      duplexMirror
    });

    const modeName = layoutMode === 'combined16' ? '8Front_8Back_16Copies' : layoutMode === 'front' ? 'Front' : layoutMode === 'back' ? 'Back' : 'Paired';
    const filename = `A4_${modeName}_300DPI.jpg`;
    
    downloadCanvasAsJPEG(fullCanvas, filename);

    if (onOpenModal) {
      onOpenModal(fullCanvas, filename);
    }
  };

  // Helper to render standard page cards in PDF
  const renderPdfPage = (pdf, mode, sideCanvas, isBack) => {
    const cardW = presetInfo.widthInches;
    const cardH = presetInfo.heightInches;
    const a4W = 8.27;
    const a4H = 11.69;

    const gapX = 0.533;
    const gapY = 0.467;
    const marginX = (a4W - (2 * cardW + gapX)) / 2;
    const marginY = (a4H - (4 * cardH + 3 * gapY)) / 2;

    const count = Math.min(8, Math.max(1, quantity));

    for (let i = 0; i < count; i++) {
      let col = i % 2;
      const row = Math.floor(i / 2);

      if (isBack && duplexMirror) {
        col = col === 0 ? 1 : 0;
      }

      const x = marginX + col * (cardW + gapX);
      const y = marginY + row * (cardH + gapY);

      let currentCanvas = sideCanvas;
      let label = isBack ? 'BACK' : 'FRONT';

      if (mode === 'paired') {
        if (col === 0) {
          currentCanvas = frontCanvas || backCanvas;
          label = 'FRONT';
        } else {
          currentCanvas = backCanvas || frontCanvas;
          label = 'BACK';
        }
      }

      if (currentCanvas) {
        const imgData = currentCanvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', x, y, cardW, cardH);
      }

      if (showCutLines) {
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineDashPattern([0.06, 0.06], 0);
        pdf.rect(x, y, cardW, cardH);
      }

      if (showLabel) {
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${label} (${i + 1}/${count})`, x, y - 0.04);
      }
    }
  };

  // Export A4 Sheet as 1:1 Scale PDF
  const handleExportA4PDF = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'a4'
    });

    if (layoutMode === 'combined16') {
      const fullCanvas = generateA4MultiCopyCanvas({
        frontCanvas,
        backCanvas,
        presetInfo,
        quantity: 8,
        layoutMode: 'combined16',
        showCutLines,
        showLabel,
        duplexMirror
      });
      const imgData = fullCanvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, 8.27, 11.69);
      pdf.save(`A4_8Front_8Back_16Copies_300DPI.pdf`);
      return;
    }

    const isBack = layoutMode === 'back';
    const activeCanvas = isBack ? (backCanvas || frontCanvas) : (frontCanvas || backCanvas);
    renderPdfPage(pdf, layoutMode, activeCanvas, isBack);

    const modeName = layoutMode === 'front' ? 'Front' : layoutMode === 'back' ? 'Back' : 'Paired';
    pdf.save(`A4_${modeName}_${quantity}_Copies_3.3x2.2_300DPI.pdf`);
  };

  // Export 2-Page Dual Sided Duplex PDF (Page 1 = 8 Fronts, Page 2 = 8 Backs)
  const handleExportDuplex2PagePDF = () => {
    if (!frontCanvas && !backCanvas) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'a4'
    });

    // Page 1: 8 Front copies @ full 3.3" x 2.2"
    renderPdfPage(pdf, 'front', frontCanvas || backCanvas, false);

    // Page 2: 8 Back copies @ full 3.3" x 2.2" (with duplex mirror alignment)
    if (backCanvas || frontCanvas) {
      pdf.addPage('a4', 'portrait');
      renderPdfPage(pdf, 'back', backCanvas || frontCanvas, true);
    }

    pdf.save(`A4_2Page_Duplex_8Front_8Back_300DPI.pdf`);
  };

  // Direct 1-Click Print (Opens browser print dialog with full-bleed A4 layout)
  const handleDirectPrint = (mode = layoutMode) => {
    if (mode === 'duplex2page') {
      // 2-Page Print: Page 1 = 8 Fronts, Page 2 = 8 Backs
      const page1Canvas = generateA4MultiCopyCanvas({
        frontCanvas,
        backCanvas,
        presetInfo,
        quantity: 8,
        layoutMode: 'front',
        showCutLines,
        showLabel,
        duplexMirror: false
      });

      const page2Canvas = generateA4MultiCopyCanvas({
        frontCanvas,
        backCanvas,
        presetInfo,
        quantity: 8,
        layoutMode: 'back',
        showCutLines,
        showLabel,
        duplexMirror: true
      });

      const img1 = page1Canvas.toDataURL('image/jpeg', 0.98);
      const img2 = page2Canvas.toDataURL('image/jpeg', 0.98);

      const printWin = window.open('', '_blank');
      if (!printWin) return;

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Direct Print 8 Front & 8 Back Duplex Sheet</title>
            <style>
              @page { size: A4 portrait; margin: 0; }
              body { margin: 0; padding: 0; background: #fff; }
              .page { width: 100vw; height: 100vh; page-break-after: always; display: flex; justify-content: center; align-items: center; }
              .page:last-child { page-break-after: auto; }
              img { width: 100%; height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <div class="page"><img src="${img1}" /></div>
            <div class="page"><img src="${img2}" /></div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
      return;
    }

    // 1-Page Direct Print (Combined 8 Front + 8 Back or selected single mode)
    const targetMode = mode === 'combined16' ? 'combined16' : layoutMode;
    const fullCanvas = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity,
      layoutMode: targetMode,
      showCutLines,
      showLabel,
      duplexMirror
    });

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const imgData = fullCanvas.toDataURL('image/jpeg', 0.98);
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Direct Print A4 ID Card Sheet</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; background: #fff; display: flex; justify-content: center; align-items: center; }
            img { width: 100vw; height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${imgData}" onload="window.print(); setTimeout(function(){ window.close(); }, 500);" />
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: '8px' }}>
            <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> 100% Symmetrically Aligned Duplex Engine (@ 300 DPI)
          </span>
          <h2 style={{ fontSize: '1.4rem', marginTop: '4px' }}>
            {layoutMode === 'combined16'
              ? '8 Front & 8 Back Copies on 1 Single A4 Sheet'
              : `A4 Paper Layout: ${quantity} ${quantity === 1 ? 'Copy' : 'Copies'} (${presetInfo.widthInches}" × ${presetInfo.heightInches}")`}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
            Direct 1-Click Print & 300 DPI High-Definition Export • Powered by Lunar AI
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-success glow-active"
            onClick={() => handleDirectPrint(layoutMode)}
            style={{ fontSize: '1rem', padding: '12px 22px' }}
          >
            <Printer size={20} /> Direct Print (1-Click)
          </button>
          <button className="btn btn-primary" onClick={handleDownloadA4JPEG}>
            <Download size={18} /> Download A4 JPEG (.jpg)
          </button>
          <button className="btn btn-secondary" onClick={handleExportA4PDF}>
            <FileText size={18} /> Download A4 PDF
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Live A4 Sheet Preview on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '370px 1fr', gap: '24px' }}>
        
        {/* Left Controls Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--accent-secondary)" />
              1. Choose A4 Layout Mode
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              
              {/* Option 1: 8 Front + 8 Back on 1 Single Sheet */}
              <button
                className={`btn ${layoutMode === 'combined16' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLayoutMode('combined16')}
                style={{
                  justifyContent: 'flex-start',
                  padding: '12px 14px',
                  fontWeight: '700',
                  border: layoutMode === 'combined16' ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)'
                }}
              >
                <Sparkles size={18} color={layoutMode === 'combined16' ? '#ffffff' : 'var(--accent-secondary)'} />
                ⭐ 8 Front & 8 Back on 1 Page (16 Copies)
              </button>

              {/* Option 2: 8 Complete Pairs 2-Page Duplex */}
              <button
                className={`btn btn-secondary`}
                onClick={handleExportDuplex2PagePDF}
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                title="Page 1 = 8 Fronts, Page 2 = 8 Backs back-to-back"
              >
                <Printer size={16} color="var(--accent-primary)" />
                📄 2-Page Duplex Batch (8 Front + 8 Back @ 100%)
              </button>

              {/* Option 3: Front Side Only */}
              <button
                className={`btn ${layoutMode === 'front' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLayoutMode('front')}
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              >
                <Grid size={16} /> Front Side Only ({quantity} Copies on A4)
              </button>

              {/* Option 4: Back Side Only */}
              <button
                className={`btn ${layoutMode === 'back' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLayoutMode('back')}
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              >
                <Grid size={16} /> Back Side Only ({quantity} Copies on A4)
              </button>

              {/* Option 5: Paired Columns */}
              <button
                className={`btn ${layoutMode === 'paired' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLayoutMode('paired')}
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              >
                <Copy size={16} /> 4 Front + 4 Back Paired (Side by Side)
              </button>
            </div>

            {/* Direct Print Fast Action Hub */}
            <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} color="var(--accent-secondary)" /> Direct Print Options:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleDirectPrint('combined16')}
                  style={{ fontSize: '0.85rem', padding: '8px 12px', justifyContent: 'center' }}
                >
                  <Printer size={15} /> Direct Print: 8 Front + 8 Back (1 Page)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleDirectPrint('duplex2page')}
                  style={{ fontSize: '0.85rem', padding: '8px 12px', justifyContent: 'center' }}
                >
                  <Printer size={15} /> Direct Print: 2-Page Duplex Full Batch
                </button>
              </div>
            </div>

            {layoutMode !== 'combined16' && (
              <>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Copy size={18} color="var(--accent-primary)" />
                  2. Quantity of Copies (1 to 8):
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      className={`btn ${quantity === num ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setQuantity(num)}
                      style={{
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '1rem',
                        padding: '8px 0',
                        background: quantity === num ? 'var(--accent-primary)' : ''
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Guidelines & Duplex Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.88rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scissors size={15} color="var(--accent-secondary)" /> Show Cutting Dash Guides
                </span>
                <input
                  type="checkbox"
                  checked={showCutLines}
                  onChange={(e) => setShowCutLines(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.88rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={15} color="var(--text-muted)" /> Show Side Labels & Numbers
                </span>
                <input
                  type="checkbox"
                  checked={showLabel}
                  onChange={(e) => setShowLabel(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </label>
            </div>
          </div>

          {/* Quick Single Card Downloads */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Single Card (3.3" × 2.2" @ 300 DPI):</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {frontCanvas && (
                <button
                  className="btn btn-secondary"
                  onClick={() => onOpenModal && onOpenModal(frontCanvas, `ID_Front_${presetInfo.widthPx}x${presetInfo.heightPx}_300DPI`)}
                  style={{ fontSize: '0.8rem', padding: '6px 8px', justifyContent: 'center' }}
                >
                  <Download size={14} /> Front Only (.jpg)
                </button>
              )}
              {backCanvas && (
                <button
                  className="btn btn-secondary"
                  onClick={() => onOpenModal && onOpenModal(backCanvas, `ID_Back_${presetInfo.widthPx}x${presetInfo.heightPx}_300DPI`)}
                  style={{ fontSize: '0.8rem', padding: '6px 8px', justifyContent: 'center' }}
                >
                  <Download size={14} /> Back Only (.jpg)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Live A4 Sheet Preview */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>
              Live A4 Sheet Preview ({layoutMode === 'combined16' ? '8 Front + 8 Back = 16 Copies' : `${quantity} Copies`} @ 300 DPI)
            </h3>
            <span className="badge badge-primary">2480 × 3508 PX (A4)</span>
          </div>

          {/* Realistic A4 Page Frame */}
          <div
            style={{
              background: '#ffffff',
              padding: '10px',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-card)',
              width: '100%',
              maxWidth: '520px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <canvas
              ref={previewCanvasRef}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Bottom Action Row */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', width: '100%', maxWidth: '520px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-success glow-active"
              onClick={() => handleDirectPrint(layoutMode)}
              style={{ flex: '1', minWidth: '160px', justifyContent: 'center' }}
            >
              <Printer size={18} /> Direct Print Now
            </button>
            <button
              className="btn btn-primary"
              onClick={handleDownloadA4JPEG}
              style={{ flex: '1', minWidth: '160px', justifyContent: 'center' }}
            >
              <Download size={18} /> Download A4 JPEG (.jpg)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
