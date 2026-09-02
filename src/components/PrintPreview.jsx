import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, Copy, CheckCircle2, Grid, Scissors, Layers, Eye, Sparkles, FileText } from 'lucide-react';
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

  const previewCanvasRef = useRef(null);

  // Lightweight 60 FPS live canvas preview rendering
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

      // 8 Backs (Columns 2 & 3)
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

    const isShowingBack = activeTab === 'back' || (activeTab === 'duplex2page' && duplexViewPage === 2);
    const count = activeTab === 'duplex2page' ? 8 : Math.min(8, Math.max(1, quantity));

    for (let i = 0; i < count; i++) {
      let col = i % 2;
      const row = Math.floor(i / 2);

      if (isShowingBack && duplexMirror) {
        col = col === 0 ? 1 : 0;
      }

      const x = marginX + col * (cardW + gapX);
      const y = marginY + row * (cardH + gapY);

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
    const pageHeaderTitle = activeTab === 'duplex2page'
      ? `A4 Duplex Sheet • Page ${duplexViewPage} of 2 (${duplexViewPage === 1 ? '8 FRONT Copies' : '8 BACK Copies - Mirrored'}) • 300 DPI`
      : `A4 Sheet • ${count} Copies (${isShowingBack ? 'BACK' : 'FRONT'}) • ${presetInfo.widthInches}" × ${presetInfo.heightInches}" @ 300 DPI`;
    ctx.fillText(pageHeaderTitle, prevW / 2, marginY / 2);

  }, [frontCanvas, backCanvas, presetInfo, quantity, activeTab, duplexViewPage, showCutLines, showLabel, duplexMirror]);

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
      duplexMirror: false
    });

    const page2 = generateA4MultiCopyCanvas({
      frontCanvas,
      backCanvas,
      presetInfo,
      quantity: 8,
      layoutMode: 'back',
      showCutLines,
      showLabel,
      duplexMirror: true
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
      duplexMirror
    });

    printDocumentViaIframe({
      pageCanvases: [currentCanvas],
      title: `Direct Print A4 ID Cards (${activeTab})`
    });
  };

  // 3. Download 2-Page Duplex PDF (Page 1 = 8 Fronts, Page 2 = 8 Backs)
  const handleDownload2PageDuplexPDF = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'a4'
    });

    const renderPdfGrid = (sideCanvas, isBack) => {
      const cardW = presetInfo.widthInches;
      const cardH = presetInfo.heightInches;
      const a4W = 8.27;
      const a4H = 11.69;
      const gapX = 0.533;
      const gapY = 0.467;
      const marginX = (a4W - (2 * cardW + gapX)) / 2;
      const marginY = (a4H - (4 * cardH + 3 * gapY)) / 2;

      for (let i = 0; i < 8; i++) {
        let col = i % 2;
        const row = Math.floor(i / 2);
        if (isBack && duplexMirror) col = col === 0 ? 1 : 0;

        const x = marginX + col * (cardW + gapX);
        const y = marginY + row * (cardH + gapY);

        if (sideCanvas) {
          const imgData = sideCanvas.toDataURL('image/jpeg', 0.98);
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
          pdf.text(`${isBack ? 'BACK' : 'FRONT'} (${i + 1}/8)`, x, y - 0.04);
        }
      }
    };

    // Page 1: 8 Fronts
    renderPdfGrid(frontCanvas || backCanvas, false);

    // Page 2: 8 Backs
    pdf.addPage('a4', 'portrait');
    renderPdfGrid(backCanvas || frontCanvas, true);

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
      duplexMirror: false
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
      duplexMirror: true
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
      duplexMirror
    });
    downloadCanvasAsJPEG(fullCanvas, 'A4_1Page_8Front_8Back_16Cards_300DPI.jpg');
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
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        
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
                    className={`btn ${duplexViewPage === 1 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDuplexViewPage(1)}
                    style={{ fontSize: '0.85rem', padding: '8px 10px', justifyContent: 'center' }}
                  >
                    View Page 1 (8 Fronts)
                  </button>
                  <button
                    className={`btn ${duplexViewPage === 2 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDuplexViewPage(2)}
                    style={{ fontSize: '0.85rem', padding: '8px 10px', justifyContent: 'center' }}
                  >
                    View Page 2 (8 Backs)
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
                {activeTab === 'duplex2page'
                  ? `Live Preview: Duplex Page ${duplexViewPage} of 2 (${duplexViewPage === 1 ? '8 FRONT Copies' : '8 BACK Copies - Duplex Mirrored'})`
                  : activeTab === 'combined16'
                  ? 'Live Preview: 8 Front + 8 Back on 1 Single A4 Page'
                  : `Live Preview: ${quantity} Copies (${activeTab.toUpperCase()})`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                300 DPI High Resolution Canvas (2480 × 3508 PX)
              </p>
            </div>
            
            {activeTab === 'duplex2page' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn ${duplexViewPage === 1 ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDuplexViewPage(1)}
                  style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                >
                  Page 1 (Fronts)
                </button>
                <button
                  className={`btn ${duplexViewPage === 2 ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDuplexViewPage(2)}
                  style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                >
                  Page 2 (Backs)
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
