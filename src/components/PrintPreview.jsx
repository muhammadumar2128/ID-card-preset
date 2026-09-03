import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Printer,
  Copy,
  CheckCircle2,
  Grid,
  Scissors,
  Layers,
  Eye,
  Sparkles,
  FileText,
  Sliders,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Crosshair
} from 'lucide-react';
import jsPDF from 'jspdf';
import { generateA4MultiCopyCanvas, downloadCanvasAsJPEG, printDocumentViaIframe } from '../utils/imageProcessing';

export default function PrintPreview({ frontCanvas, backCanvas, presetInfo, onOpenModal }) {
  // Available preview / layout tabs: 'duplex2page' | 'combined16' | 'front' | 'back'
  const [activeTab, setActiveTab] = useState(
    frontCanvas && backCanvas ? 'duplex2page' : (frontCanvas ? 'front' : (backCanvas ? 'back' : 'duplex2page'))
  );
  const [quantity, setQuantity] = useState(8);
  const [showCutLines, setShowCutLines] = useState(true);
  const [showLabel, setShowLabel] = useState(true);
  const [duplexMirror, setDuplexMirror] = useState(true);

  // For 2-page duplex view: toggle viewing page 1 or page 2
  const [duplexViewPage, setDuplexViewPage] = useState(1); // 1 = Fronts, 2 = Backs

  // Alignment calibration offsets in millimeters (Persisted in localStorage for permanent calibration)
  const [backOffsetY, setBackOffsetY] = useState(() => {
    const saved = localStorage.getItem('idcard_backOffsetY');
    return saved !== null ? Number(saved) : 0;
  });
  const [backOffsetX, setBackOffsetX] = useState(() => {
    const saved = localStorage.getItem('idcard_backOffsetX');
    return saved !== null ? Number(saved) : 0;
  });
  const [frontOffsetY, setFrontOffsetY] = useState(0);
  const [frontOffsetX, setFrontOffsetX] = useState(0);

  // Active side being calibrated in the UI
  const [calibSide, setCalibSide] = useState('back'); // 'back' | 'front'

  // Visual Overlay registration check mode
  const [isOverlayMode, setIsOverlayMode] = useState(false);

  const previewCanvasRef = useRef(null);

  // Persist back side offsets so user's printer alignment is permanently remembered
  useEffect(() => {
    localStorage.setItem('idcard_backOffsetY', String(backOffsetY));
    localStorage.setItem('idcard_backOffsetX', String(backOffsetX));
  }, [backOffsetY, backOffsetX]);

  // Lightweight live canvas preview rendering
  useEffect(() => {
    if (!previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');

    const prevW = 496;
    const prevH = 702;
    canvas.width = prevW;
    canvas.height = prevH;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, prevW, prevH);

    const scale = prevW / 2480;

    // Convert mm to preview px
    const mmToPrevPx = (mm) => ((Number(mm) || 0) / 25.4) * 300 * scale;
    const bOffX = mmToPrevPx(backOffsetX);
    const bOffY = mmToPrevPx(backOffsetY);
    const fOffX = mmToPrevPx(frontOffsetX);
    const fOffY = mmToPrevPx(frontOffsetY);

    // 1-Page 16-Card Combined Mode (8 Front + 8 Back on 1 Single A4 Sheet)
    if (activeTab === 'combined16') {
      const cardW16 = 530 * scale;
      const cardH16 = 353 * scale;
      const gapX16 = 70 * scale;
      const gapY16 = 180 * scale;
      const marginX16 = Math.round((prevW - (4 * cardW16 + 3 * gapX16)) / 2);
      const marginY16 = Math.round((prevH - (4 * cardH16 + 3 * gapY16)) / 2);

      // 8 Fronts (Columns 0 & 1)
      for (let i = 0; i < 8; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = marginX16 + col * (cardW16 + gapX16) + fOffX;
        const y = marginY16 + row * (cardH16 + gapY16) + fOffY;

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

      // 8 Backs (Columns 2 & 3)
      for (let i = 0; i < 8; i++) {
        const col = 2 + (i % 2);
        const row = Math.floor(i / 2);
        const x = marginX16 + col * (cardW16 + gapX16) + bOffX;
        const y = marginY16 + row * (cardH16 + gapY16) + bOffY;

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
      ctx.fillText('A4 Sheet • 8 Front & 8 Back (16 Cards) @ 300 DPI — Powered by Lunar AI', prevW / 2, marginY16 / 2);
      return;
    }

    // Standard 2x4 Layout (For Duplex Page 1, Duplex Page 2, Front Only, or Back Only)
    const cardW = presetInfo.widthPx * scale;
    const cardH = presetInfo.heightPx * scale;
    const gapX = 160 * scale;
    const gapY = 140 * scale;
    const marginX = Math.round((prevW - (2 * cardW + gapX)) / 2);
    const marginY = Math.round((prevH - (4 * cardH + 3 * gapY)) / 2);

    // Overlay Registration Check Mode: Superimposes Front & Back on top of each other!
    if (isOverlayMode && activeTab === 'duplex2page') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, prevW, prevH);

      for (let i = 0; i < 8; i++) {
        const row = Math.floor(i / 2);

        // Front Slot (Column i % 2)
        const frontCol = i % 2;
        const fx = marginX + frontCol * (cardW + gapX) + fOffX;
        const fy = marginY + row * (cardH + gapY) + fOffY;

        // Back Slot (Mirrored Column when duplexMirror is on)
        let backCol = i % 2;
        if (duplexMirror) backCol = backCol === 0 ? 1 : 0;
        const bx = marginX + backCol * (cardW + gapX) + bOffX;
        const by = marginY + row * (cardH + gapY) + bOffY;

        // Draw Front Outline & Ghost
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fillRect(fx, fy, cardW, cardH);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(fx, fy, cardW, cardH);

        // Draw Back Outline & Ghost
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.fillRect(bx, by, cardW, cardH);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(bx, by, cardW, cardH);
        ctx.setLineDash([]);

        // Crosshairs in center
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        // Front Center
        ctx.beginPath();
        ctx.arc(fx + cardW / 2, fy + cardH / 2, 4, 0, Math.PI * 2);
        ctx.stroke();
        // Back Center
        ctx.beginPath();
        ctx.arc(bx + cardW / 2, by + cardH / 2, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Slot ${i + 1}`, fx + cardW / 2, fy + cardH / 2 + 16);
      }

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('— FRONT Side Position', 20, 20);

      ctx.fillStyle = '#10b981';
      ctx.fillText('--- BACK Side Position (Calibrated)', 20, 34);

      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'right';
      const offText = `Back Offset: Y: ${backOffsetY > 0 ? '+' : ''}${backOffsetY}mm, X: ${backOffsetX > 0 ? '+' : ''}${backOffsetX}mm`;
      ctx.fillText(offText, prevW - 20, 20);

      return;
    }

    const isShowingBack = activeTab === 'back' || (activeTab === 'duplex2page' && duplexViewPage === 2);
    const count = activeTab === 'duplex2page' ? 8 : Math.min(8, Math.max(1, quantity));

    for (let i = 0; i < count; i++) {
      let col = i % 2;
      const row = Math.floor(i / 2);

      if (isShowingBack && duplexMirror) {
        col = col === 0 ? 1 : 0;
      }

      const currentOffX = isShowingBack ? bOffX : fOffX;
      const currentOffY = isShowingBack ? bOffY : fOffY;

      const x = marginX + col * (cardW + gapX) + currentOffX;
      const y = marginY + row * (cardH + gapY) + currentOffY;

      let srcCanvas = isShowingBack ? (backCanvas || frontCanvas) : (frontCanvas || backCanvas);
      let label = isShowingBack ? 'BACK' : 'FRONT';

      if (srcCanvas) {
        ctx.drawImage(srcCanvas, x, y, cardW, cardH);
      } else {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(x, y, cardW, cardH);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${label} ${i + 1}`, x + cardW / 2, y + cardH / 2);
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
    const calibText = (backOffsetY !== 0 || backOffsetX !== 0)
      ? ` • Calibration: Y=${backOffsetY > 0 ? '+' : ''}${backOffsetY}mm, X=${backOffsetX > 0 ? '+' : ''}${backOffsetX}mm`
      : '';
    const pageHeaderTitle = activeTab === 'duplex2page'
      ? `A4 Duplex Sheet • Page ${duplexViewPage} of 2 (${duplexViewPage === 1 ? '8 FRONT Copies' : '8 BACK Copies - Mirrored'}) • 300 DPI${calibText}`
      : `A4 Sheet • ${count} Copies (${isShowingBack ? 'BACK' : 'FRONT'}) • ${presetInfo.widthInches}" × ${presetInfo.heightInches}" @ 300 DPI${calibText}`;
    ctx.fillText(pageHeaderTitle, prevW / 2, marginY / 2);

  }, [
    frontCanvas,
    backCanvas,
    presetInfo,
    quantity,
    activeTab,
    duplexViewPage,
    showCutLines,
    showLabel,
    duplexMirror,
    backOffsetY,
    backOffsetX,
    frontOffsetY,
    frontOffsetX,
    isOverlayMode
  ]);

  // 1. Direct Print 2-Page Duplex (Page 1 = 8 Fronts, Page 2 = 8 Backs)
  const handleDirectPrint2SidedDuplex = () => {
    const page1 = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity: 8,
      layoutMode: 'front',
      showCutLines,
      showLabel,
      duplexMirror: false,
      frontOffsetXmm: frontOffsetX,
      frontOffsetYmm: frontOffsetY
    });

    const page2 = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity: 8,
      layoutMode: 'back',
      showCutLines,
      showLabel,
      duplexMirror: true,
      backOffsetXmm: backOffsetX,
      backOffsetYmm: backOffsetY
    });

    printDocumentViaIframe({
      pageCanvases: [page1, page2],
      title: 'Direct Print 8 Front & 8 Back Duplex ID Sheet'
    });
  };

  // 2. Direct Print 1-Page (Current view: 16-card combined or single side)
  const handleDirectPrintCurrent = () => {
    if (activeTab === 'duplex2page') {
      handleDirectPrint2SidedDuplex();
      return;
    }

    const currentCanvas = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity,
      layoutMode: activeTab,
      showCutLines,
      showLabel,
      duplexMirror,
      frontOffsetXmm: frontOffsetX,
      frontOffsetYmm: frontOffsetY,
      backOffsetXmm: backOffsetX,
      backOffsetYmm: backOffsetY
    });

    printDocumentViaIframe({
      pageCanvases: [currentCanvas],
      title: `Direct Print A4 ID Cards (${activeTab})`
    });
  };

  // 3. Download 2-Page Duplex PDF (Page 1 = 8 Fronts, Page 2 = 8 Backs) with exact calibration
  const handleDownload2PageDuplexPDF = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const page1 = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity: 8,
      layoutMode: 'front',
      showCutLines,
      showLabel,
      duplexMirror: false,
      frontOffsetXmm: frontOffsetX,
      frontOffsetYmm: frontOffsetY
    });

    const page2 = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity: 8,
      layoutMode: 'back',
      showCutLines,
      showLabel,
      duplexMirror: true,
      backOffsetXmm: backOffsetX,
      backOffsetYmm: backOffsetY
    });

    const p1Data = page1.toDataURL('image/jpeg', 0.98);
    pdf.addImage(p1Data, 'JPEG', 0, 0, 210, 297);

    pdf.addPage('a4', 'portrait');
    const p2Data = page2.toDataURL('image/jpeg', 0.98);
    pdf.addImage(p2Data, 'JPEG', 0, 0, 210, 297);

    pdf.save('A4_2Page_Duplex_8Front_8Back_300DPI.pdf');
  };

  // 4. Download JPEG for Page 1 (8 Fronts)
  const handleDownloadFrontsJPEG = () => {
    const fullCanvas = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity: 8,
      layoutMode: 'front',
      showCutLines,
      showLabel,
      duplexMirror: false,
      frontOffsetXmm: frontOffsetX,
      frontOffsetYmm: frontOffsetY
    });
    downloadCanvasAsJPEG(fullCanvas, 'A4_Page1_8Fronts_3.3x2.2_300DPI.jpg');
  };

  // 5. Download JPEG for Page 2 (8 Backs)
  const handleDownloadBacksJPEG = () => {
    const fullCanvas = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity: 8,
      layoutMode: 'back',
      showCutLines,
      showLabel,
      duplexMirror: true,
      backOffsetXmm: backOffsetX,
      backOffsetYmm: backOffsetY
    });
    downloadCanvasAsJPEG(fullCanvas, 'A4_Page2_8Backs_3.3x2.2_300DPI.jpg');
  };

  // 6. Download 1-Page Combined 16-card JPEG
  const handleDownloadCombined16JPEG = () => {
    const fullCanvas = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity: 8,
      layoutMode: 'combined16',
      showCutLines,
      showLabel,
      duplexMirror,
      frontOffsetXmm: frontOffsetX,
      frontOffsetYmm: frontOffsetY,
      backOffsetXmm: backOffsetX,
      backOffsetYmm: backOffsetY
    });
    downloadCanvasAsJPEG(fullCanvas, 'A4_1Page_8Front_8Back_16Cards_300DPI.jpg');
  };

  // Helper to adjust offset
  const adjustOffset = (targetSide, axis, delta) => {
    if (targetSide === 'back') {
      if (axis === 'y') {
        setBackOffsetY((prev) => Math.round((prev + delta) * 10) / 10);
      } else {
        setBackOffsetX((prev) => Math.round((prev + delta) * 10) / 10);
      }
    } else {
      if (axis === 'y') {
        setFrontOffsetY((prev) => Math.round((prev + delta) * 10) / 10);
      } else {
        setFrontOffsetX((prev) => Math.round((prev + delta) * 10) / 10);
      }
    }
  };

  const resetOffsets = () => {
    setBackOffsetY(0);
    setBackOffsetX(0);
    setFrontOffsetY(0);
    setFrontOffsetX(0);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner with Direct Print Highlight */}
      <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: '8px' }}>
            <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> 100% Symmetrically Aligned Duplex Engine (@ 300 DPI)
          </span>
          <h2 style={{ fontSize: '1.45rem', marginTop: '4px' }}>
            {activeTab === 'duplex2page'
              ? '2-Page Duplex Print: 8 Front (Page 1) & 8 Back (Page 2)'
              : activeTab === 'combined16'
              ? '1-Page Print: 8 Front & 8 Back (16 Cards on Single A4)'
              : `A4 Single Side: ${quantity} Copies (${presetInfo.widthInches}" × ${presetInfo.heightInches}")`}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Direct Front & Back Printing for B&W / Color Printers • Flip on Long Edge • Powered by Lunar AI
          </p>
        </div>

        {/* Big Direct Print Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-success glow-active"
            onClick={handleDirectPrint2SidedDuplex}
            style={{ fontSize: '1.02rem', padding: '12px 24px', fontWeight: '700' }}
          >
            <Printer size={20} /> 🖨️ Direct Print Front & Back (2-Sided)
          </button>
          <button className="btn btn-primary" onClick={handleDownload2PageDuplexPDF}>
            <FileText size={18} /> Download 2-Page Duplex PDF
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
        
        {/* Left Options Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--accent-secondary)" />
              1. Choose Print Layout Format:
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              
              {/* Layout 1: 2-Page Duplex Batch (RECOMMENDED for 8 Front on front side & 8 Back on back side) */}
              <button
                className={`btn ${activeTab === 'duplex2page' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('duplex2page')}
                style={{
                  justifyContent: 'flex-start',
                  padding: '12px 14px',
                  fontWeight: '700',
                  border: activeTab === 'duplex2page' ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)'
                }}
              >
                <Printer size={18} color={activeTab === 'duplex2page' ? '#ffffff' : 'var(--accent-secondary)'} />
                ⭐ 2-Page Duplex (8 Front Side + 8 Back Side)
              </button>

              {/* Layout 2: 1-Page Combined 16 Cards */}
              <button
                className={`btn ${activeTab === 'combined16' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('combined16')}
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              >
                <Sparkles size={16} /> 1-Page Combined (8 Front + 8 Back = 16 Cards)
              </button>

              {/* Layout 3: 8 Fronts Only */}
              <button
                className={`btn ${activeTab === 'front' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('front')}
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              >
                <Grid size={16} /> Front Side Only ({quantity} Copies on A4)
              </button>

              {/* Layout 4: 8 Backs Only */}
              <button
                className={`btn ${activeTab === 'back' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('back')}
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              >
                <Grid size={16} /> Back Side Only ({quantity} Copies on A4)
              </button>
            </div>

            {/* If 2-Page Duplex tab is active: switch between previewing Page 1 & Page 2 */}
            {activeTab === 'duplex2page' && (
              <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.88rem', marginBottom: '10px', color: 'var(--text-muted)' }}>
                  Preview & Download Individual Duplex Pages:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <button
                    className={`btn ${duplexViewPage === 1 && !isOverlayMode ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setDuplexViewPage(1); setIsOverlayMode(false); }}
                    style={{ fontSize: '0.85rem', padding: '8px 10px', justifyContent: 'center' }}
                  >
                    View Page 1 (Fronts)
                  </button>
                  <button
                    className={`btn ${duplexViewPage === 2 && !isOverlayMode ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setDuplexViewPage(2); setIsOverlayMode(false); }}
                    style={{ fontSize: '0.85rem', padding: '8px 10px', justifyContent: 'center' }}
                  >
                    View Page 2 (Backs)
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleDownloadFrontsJPEG}
                    style={{ fontSize: '0.78rem', padding: '6px 8px', justifyContent: 'center' }}
                  >
                    <Download size={13} /> Page 1 JPEG (.jpg)
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleDownloadBacksJPEG}
                    style={{ fontSize: '0.78rem', padding: '6px 8px', justifyContent: 'center' }}
                  >
                    <Download size={13} /> Page 2 JPEG (.jpg)
                  </button>
                </div>
              </div>
            )}

            {/* DUPLEX ALIGNMENT & NUDGE CALIBRATION PANEL */}
            <div style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'linear-gradient(160deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              marginBottom: '20px'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '1.02rem', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Crosshair size={18} color="#38bdf8" /> 2. Alignment & Nudge Calibration
                </h3>
                <button
                  className="btn btn-secondary"
                  onClick={resetOffsets}
                  title="Reset to 0mm center alignment"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', height: '28px', color: '#cbd5e1', borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  <RotateCcw size={12} style={{ marginRight: '4px' }} /> Reset
                </button>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '14px' }}>
                Compensates for printer feeder drop. If the back side prints lower than the front, shift it <strong style={{ color: '#38bdf8' }}>UP</strong>.
              </p>

              {/* Side Selector Tab (Back Side vs Front Side) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '4px',
                borderRadius: '10px',
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <button
                  onClick={() => setCalibSide('back')}
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 10px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: calibSide === 'back' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                    color: calibSide === 'back' ? '#ffffff' : '#94a3b8',
                    boxShadow: calibSide === 'back' ? '0 2px 10px rgba(2, 132, 199, 0.4)' : 'none'
                  }}
                >
                  🎯 Back Side (Target)
                </button>
                <button
                  onClick={() => setCalibSide('front')}
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 10px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: calibSide === 'front' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                    color: calibSide === 'front' ? '#ffffff' : '#94a3b8',
                    boxShadow: calibSide === 'front' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  Front Side
                </button>
              </div>

              {/* Vertical Shift (Y-Offset) Card */}
              <div style={{
                marginBottom: '16px',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
                    Vertical Shift (Y):
                  </span>
                  
                  {/* Stepper Box */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(15, 23, 42, 0.9)', padding: '2px 4px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                    <button
                      onClick={() => adjustOffset(calibSide, 'y', -1)}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '2px 6px', fontSize: '0.9rem', fontWeight: 'bold' }}
                      title="Step -1mm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      value={calibSide === 'back' ? backOffsetY : frontOffsetY}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (calibSide === 'back') setBackOffsetY(val);
                        else setFrontOffsetY(val);
                      }}
                      style={{
                        width: '54px',
                        padding: '2px 0',
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: '#38bdf8',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => adjustOffset(calibSide, 'y', 1)}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '2px 6px', fontSize: '0.9rem', fontWeight: 'bold' }}
                      title="Step +1mm"
                    >
                      +
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', paddingRight: '4px' }}>mm</span>
                  </div>
                </div>

                {/* 2x2 Nudge Buttons (NO OVERFLOW) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => adjustOffset(calibSide, 'y', -1)}
                    style={{ fontSize: '0.78rem', padding: '7px 8px', justifyContent: 'center', fontWeight: '600' }}
                  >
                    <ArrowUp size={13} color="#38bdf8" /> Nudge Up 1 mm
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => adjustOffset(calibSide, 'y', 1)}
                    style={{ fontSize: '0.78rem', padding: '7px 8px', justifyContent: 'center', fontWeight: '600' }}
                  >
                    <ArrowDown size={13} color="#38bdf8" /> Nudge Down 1 mm
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => adjustOffset(calibSide, 'y', -5)}
                    style={{ fontSize: '0.78rem', padding: '7px 8px', justifyContent: 'center', fontWeight: '600' }}
                  >
                    <ArrowUp size={13} color="#38bdf8" /> Fast Up 5 mm
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => adjustOffset(calibSide, 'y', 5)}
                    style={{ fontSize: '0.78rem', padding: '7px 8px', justifyContent: 'center', fontWeight: '600' }}
                  >
                    <ArrowDown size={13} color="#38bdf8" /> Fast Down 5 mm
                  </button>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="0.5"
                  value={calibSide === 'back' ? backOffsetY : frontOffsetY}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (calibSide === 'back') setBackOffsetY(val);
                    else setFrontOffsetY(val);
                  }}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', fontWeight: '500' }}>
                  <span>▲ -60mm (Up)</span>
                  <span style={{ color: '#e2e8f0', fontWeight: '700' }}>
                    {calibSide === 'back'
                      ? (backOffsetY === 0 ? '0 mm (Center)' : `${backOffsetY > 0 ? '+' : ''}${backOffsetY} mm ${backOffsetY < 0 ? 'UP ⬆️' : 'DOWN ⬇️'}`)
                      : (frontOffsetY === 0 ? '0 mm (Center)' : `${frontOffsetY > 0 ? '+' : ''}${frontOffsetY} mm`)}
                  </span>
                  <span>+60mm (Down) ▼</span>
                </div>
              </div>

              {/* Horizontal Shift (X-Offset) Card */}
              <div style={{
                marginBottom: '16px',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                    Horizontal Shift (X):
                  </span>

                  {/* Stepper Box */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(15, 23, 42, 0.9)', padding: '2px 4px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                    <button
                      onClick={() => adjustOffset(calibSide, 'x', -1)}
                      style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px 6px', fontSize: '0.9rem', fontWeight: 'bold' }}
                      title="Step -1mm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      value={calibSide === 'back' ? backOffsetX : frontOffsetX}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (calibSide === 'back') setBackOffsetX(val);
                        else setFrontOffsetX(val);
                      }}
                      style={{
                        width: '54px',
                        padding: '2px 0',
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: '#10b981',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => adjustOffset(calibSide, 'x', 1)}
                      style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px 6px', fontSize: '0.9rem', fontWeight: 'bold' }}
                      title="Step +1mm"
                    >
                      +
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', paddingRight: '4px' }}>mm</span>
                  </div>
                </div>

                {/* 2x2 Nudge Buttons (NO OVERFLOW) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => adjustOffset(calibSide, 'x', -1)}
                    style={{ fontSize: '0.78rem', padding: '7px 8px', justifyContent: 'center', fontWeight: '600' }}
                  >
                    <ArrowLeft size={13} color="#10b981" /> Left 1 mm
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => adjustOffset(calibSide, 'x', 1)}
                    style={{ fontSize: '0.78rem', padding: '7px 8px', justifyContent: 'center', fontWeight: '600' }}
                  >
                    <ArrowRight size={13} color="#10b981" /> Right 1 mm
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => adjustOffset(calibSide, 'x', -5)}
                    style={{ fontSize: '0.78rem', padding: '7px 8px', justifyContent: 'center', fontWeight: '600' }}
                  >
                    <ArrowLeft size={13} color="#10b981" /> Fast Left 5 mm
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => adjustOffset(calibSide, 'x', 5)}
                    style={{ fontSize: '0.78rem', padding: '7px 8px', justifyContent: 'center', fontWeight: '600' }}
                  >
                    <ArrowRight size={13} color="#10b981" /> Fast Right 5 mm
                  </button>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="0.5"
                  value={calibSide === 'back' ? backOffsetX : frontOffsetX}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (calibSide === 'back') setBackOffsetX(val);
                    else setFrontOffsetX(val);
                  }}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#10b981' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', fontWeight: '500' }}>
                  <span>◀ -60mm (Left)</span>
                  <span style={{ color: '#e2e8f0', fontWeight: '700' }}>
                    {calibSide === 'back'
                      ? (backOffsetX === 0 ? '0 mm (Center)' : `${backOffsetX > 0 ? '+' : ''}${backOffsetX} mm ${backOffsetX < 0 ? 'LEFT ⬅️' : 'RIGHT ➡️'}`)
                      : (frontOffsetX === 0 ? '0 mm (Center)' : `${frontOffsetX > 0 ? '+' : ''}${frontOffsetX} mm`)}
                  </span>
                  <span>+60mm (Right) ▶</span>
                </div>
              </div>

              {/* Quick Preset Buttons (Neatly Arranged) */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                  ⚡ Quick Duplex Presets:
                </span>
                
                {/* Hero 35mm Fix Drop Button */}
                <button
                  className="btn"
                  onClick={() => {
                    if (calibSide === 'back') {
                      setBackOffsetY(-35);
                      setBackOffsetX(0);
                    } else {
                      setFrontOffsetY(-35);
                      setFrontOffsetX(0);
                    }
                  }}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginBottom: '8px',
                    fontSize: '0.82rem',
                    padding: '8px',
                    fontWeight: '700',
                    background: (calibSide === 'back' ? backOffsetY : frontOffsetY) === -35
                      ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                      : 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)'
                  }}
                >
                  ⭐ Shift Back Up 35 mm (Fix HP / Epson Drop)
                </button>

                {/* 3-Column Grid of Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { label: '0 mm (Reset)', y: 0, x: 0 },
                    { label: '▲ Up 30 mm', y: -30, x: 0 },
                    { label: '▲ Up 20 mm', y: -20, x: 0 },
                    { label: '▲ Up 10 mm', y: -10, x: 0 },
                    { label: '▲ Up 2 mm', y: -2, x: 0 },
                    { label: '▼ Down 35 mm', y: 35, x: 0 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      className="btn btn-secondary"
                      onClick={() => {
                        if (calibSide === 'back') {
                          setBackOffsetY(preset.y);
                          setBackOffsetX(preset.x);
                        } else {
                          setFrontOffsetY(preset.y);
                          setFrontOffsetX(preset.x);
                        }
                      }}
                      style={{
                        fontSize: '0.74rem',
                        padding: '6px 4px',
                        justifyContent: 'center',
                        fontWeight: '600',
                        background: ((calibSide === 'back' ? backOffsetY : frontOffsetY) === preset.y && (calibSide === 'back' ? backOffsetX : frontOffsetX) === preset.x)
                          ? 'var(--accent-primary)'
                          : 'rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlay Check Toggle */}
              {activeTab === 'duplex2page' && (
                <button
                  className={`btn ${isOverlayMode ? 'btn-success glow-active' : 'btn-secondary'}`}
                  onClick={() => setIsOverlayMode(!isOverlayMode)}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: '0.84rem',
                    padding: '10px 12px',
                    fontWeight: '700',
                    border: isOverlayMode ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <Eye size={16} style={{ marginRight: '6px' }} />
                  {isOverlayMode ? '✅ Overlay Active (Front Cyan / Back Green)' : '👁️ Superimpose / Overlay Front & Back'}
                </button>
              )}

            </div>

            {/* Direct 1-Click Print Box */}
            <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} color="var(--accent-secondary)" /> Direct Print Shortcuts:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="btn btn-success"
                  onClick={handleDirectPrint2SidedDuplex}
                  style={{ fontSize: '0.85rem', padding: '9px 12px', justifyContent: 'center', fontWeight: '600' }}
                >
                  <Printer size={15} /> 1. Print 2-Page Duplex (8 Front + 8 Back)
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setActiveTab('combined16');
                    setTimeout(handleDirectPrintCurrent, 50);
                  }}
                  style={{ fontSize: '0.85rem', padding: '9px 12px', justifyContent: 'center' }}
                >
                  <Printer size={15} /> 2. Print 1-Page (16 Cards on 1 Sheet)
                </button>
              </div>
            </div>

            {/* Quantity Slider (for single side modes) */}
            {(activeTab === 'front' || activeTab === 'back') && (
              <>
                <h3 style={{ fontSize: '1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Copy size={16} color="var(--accent-primary)" />
                  Copies on Page: {quantity}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      className={`btn ${quantity === num ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setQuantity(num)}
                      style={{
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        padding: '6px 0',
                        background: quantity === num ? 'var(--accent-primary)' : ''
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Guides & Alignments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="#10b981" /> Duplex Flip Alignment (Mirror Columns)
                </span>
                <input
                  type="checkbox"
                  checked={duplexMirror}
                  onChange={(e) => setDuplexMirror(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scissors size={14} color="var(--accent-secondary)" /> Show Cutting Dash Guides
                </span>
                <input
                  type="checkbox"
                  checked={showCutLines}
                  onChange={(e) => setShowCutLines(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={14} color="var(--text-muted)" /> Show Labels & Card Numbers
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
        </div>

        {/* Right Live Sheet Preview */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isOverlayMode
                  ? 'Registration Check: Superimposed Front (Cyan) & Back (Green)'
                  : activeTab === 'duplex2page'
                  ? `Live Preview: Duplex Page ${duplexViewPage} of 2 (${duplexViewPage === 1 ? '8 FRONT Copies' : '8 BACK Copies - Duplex Mirrored'})`
                  : activeTab === 'combined16'
                  ? 'Live Preview: 8 Front + 8 Back on 1 Single A4 Page'
                  : `Live Preview: ${quantity} Copies (${activeTab.toUpperCase()})`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                300 DPI High Resolution Canvas (2480 × 3508 PX)
                {(backOffsetY !== 0 || backOffsetX !== 0) && (
                  <span style={{ color: '#38bdf8', marginLeft: '6px' }}>
                    • Calibration Applied: Y={backOffsetY > 0 ? '+' : ''}{backOffsetY}mm, X={backOffsetX > 0 ? '+' : ''}{backOffsetX}mm
                  </span>
                )}
              </p>
            </div>
            
            {activeTab === 'duplex2page' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn ${duplexViewPage === 1 && !isOverlayMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setDuplexViewPage(1); setIsOverlayMode(false); }}
                  style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                >
                  Page 1 (Fronts)
                </button>
                <button
                  className={`btn ${duplexViewPage === 2 && !isOverlayMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setDuplexViewPage(2); setIsOverlayMode(false); }}
                  style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                >
                  Page 2 (Backs)
                </button>
                <button
                  className={`btn ${isOverlayMode ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setIsOverlayMode(!isOverlayMode)}
                  style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                >
                  <Eye size={13} /> Overlay Check
                </button>
              </div>
            )}
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

          {/* Action Row */}
          <div style={{ marginTop: '18px', display: 'flex', gap: '12px', width: '100%', maxWidth: '520px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-success glow-active"
              onClick={handleDirectPrintCurrent}
              style={{ flex: '1', minWidth: '160px', justifyContent: 'center', fontWeight: '700' }}
            >
              <Printer size={18} /> Direct Print Now
            </button>
            <button
              className="btn btn-primary"
              onClick={activeTab === 'duplex2page' ? handleDownloadFrontsJPEG : (activeTab === 'combined16' ? handleDownloadCombined16JPEG : handleDownloadFrontsJPEG)}
              style={{ flex: '1', minWidth: '160px', justifyContent: 'center' }}
            >
              <Download size={18} /> Direct Download JPEG (.jpg)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
