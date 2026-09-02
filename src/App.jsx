import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  RotateCw,
  RotateCcw,
  Sparkles,
  Printer,
  CreditCard,
  Layers,
  ArrowRight,
  Info,
  Target,
  Download,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import CornerSelectorCanvas from './components/CornerSelectorCanvas';
import ImageEnhancers from './components/ImageEnhancers';
import PrintPreview from './components/PrintPreview';
import DownloadModal from './components/DownloadModal';
import {
  CARD_PRESETS,
  detectCardCorners,
  warpPerspective,
  applyImageEnhancements,
  downloadCanvasAsJPEG
} from './utils/imageProcessing';

const THEMES = [
  { id: 'indigo', name: 'Indigo Cyan', color: '#6366f1' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'crimson', name: 'Crimson', color: '#f43f5e' },
  { id: 'violet', name: 'Violet', color: '#a855f7' },
  { id: 'amber', name: 'Amber Gold', color: '#f59e0b' },
  { id: 'ocean', name: 'Ocean Blue', color: '#0ea5e9' },
  { id: 'light', name: 'Light Mode', color: '#f8fafc', isLight: true }
];

export default function App() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'indigo';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('app_theme', currentTheme);
  }, [currentTheme]);

  const [selectedPresetKey, setSelectedPresetKey] = useState('PRESET_3_3_X_2_2');
  const activePreset = CARD_PRESETS[selectedPresetKey];

  const [activeSide, setActiveSide] = useState('front');

  // Modal download state
  const [modalConfig, setModalConfig] = useState({ isOpen: false, canvas: null, filename: '' });

  // Default state with High-Definition Magic Color engine
  const defaultOptions = {
    mode: 'magic-color',
    textDarkening: 40,
    sharpness: 65,
    shadowRemoval: 60,
    saturation: 15,
    brightness: 0,
    contrast: 25,
    invert: false
  };

  const [frontImageObj, setFrontImageObj] = useState(null);
  const [frontCorners, setFrontCorners] = useState(null);
  const [frontWarpedCanvas, setFrontWarpedCanvas] = useState(null);
  const [frontEnhancedCanvas, setFrontEnhancedCanvas] = useState(null);
  const [frontOptions, setFrontOptions] = useState({ ...defaultOptions });

  const [backImageObj, setBackImageObj] = useState(null);
  const [backCorners, setBackCorners] = useState(null);
  const [backWarpedCanvas, setBackWarpedCanvas] = useState(null);
  const [backEnhancedCanvas, setBackEnhancedCanvas] = useState(null);
  const [backOptions, setBackOptions] = useState({ ...defaultOptions });

  const frontFileInputRef = useRef(null);
  const backFileInputRef = useRef(null);

  const openDownloadModal = (canvas, filename) => {
    if (!canvas) return;
    setModalConfig({
      isOpen: true,
      canvas,
      filename
    });
  };

  const triggerUpload = (side) => {
    const inputRef = side === 'front' ? frontFileInputRef : backFileInputRef;
    if (inputRef && inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const handleFileUpload = (file, side) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const autoDetectedCorners = detectCardCorners(img);
        if (side === 'front') {
          setFrontImageObj(img);
          setFrontCorners(autoDetectedCorners);
          setActiveSide('front');
        } else {
          setBackImageObj(img);
          setBackCorners(autoDetectedCorners);
          setActiveSide('back');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleReupload = (side) => {
    if (side === 'front') {
      setFrontImageObj(null);
      setFrontCorners(null);
      setFrontWarpedCanvas(null);
      setFrontEnhancedCanvas(null);
    } else {
      setBackImageObj(null);
      setBackCorners(null);
      setBackWarpedCanvas(null);
      setBackEnhancedCanvas(null);
    }
    triggerUpload(side);
  };

  const autoDetectCornersForCurrentSide = () => {
    const img = activeSide === 'front' ? frontImageObj : backImageObj;
    if (!img) return;
    const detected = detectCardCorners(img);
    if (activeSide === 'front') setFrontCorners(detected);
    else setBackCorners(detected);
  };

  useEffect(() => {
    if (frontImageObj && frontCorners) {
      const warped = warpPerspective(
        frontImageObj,
        frontCorners,
        activePreset.widthPx,
        activePreset.heightPx
      );
      setFrontWarpedCanvas(warped);
    }
  }, [frontImageObj, frontCorners, activePreset]);

  useEffect(() => {
    if (backImageObj && backCorners) {
      const warped = warpPerspective(
        backImageObj,
        backCorners,
        activePreset.widthPx,
        activePreset.heightPx
      );
      setBackWarpedCanvas(warped);
    }
  }, [backImageObj, backCorners, activePreset]);

  // Enhancements application
  useEffect(() => {
    if (frontWarpedCanvas) {
      const enhanced = applyImageEnhancements(frontWarpedCanvas, frontOptions);
      setFrontEnhancedCanvas(enhanced);
    }
  }, [frontWarpedCanvas, frontOptions]);

  useEffect(() => {
    if (backWarpedCanvas) {
      const enhanced = applyImageEnhancements(backWarpedCanvas, backOptions);
      setBackEnhancedCanvas(enhanced);
    }
  }, [backWarpedCanvas, backOptions]);

  const rotateCurrentSideImage = (degrees) => {
    const currentImg = activeSide === 'front' ? frontImageObj : backImageObj;
    if (!currentImg) return;

    const c = document.createElement('canvas');
    if (degrees === 90 || degrees === 270) {
      c.width = currentImg.height;
      c.height = currentImg.width;
    } else {
      c.width = currentImg.width;
      c.height = currentImg.height;
    }
    const ctx = c.getContext('2d');
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(currentImg, -currentImg.width / 2, -currentImg.height / 2);

    const rotatedImg = new Image();
    rotatedImg.onload = () => {
      const newCorners = detectCardCorners(rotatedImg);
      if (activeSide === 'front') {
        setFrontImageObj(rotatedImg);
        setFrontCorners(newCorners);
      } else {
        setBackImageObj(rotatedImg);
        setBackCorners(newCorners);
      }
    };
    rotatedImg.src = c.toDataURL();
  };

  const rotateCornerOrientation = (direction = 'clockwise') => {
    const corners = activeSide === 'front' ? frontCorners : backCorners;
    if (!corners || corners.length !== 4) return;

    let rotated;
    if (direction === 'clockwise') {
      rotated = [corners[3], corners[0], corners[1], corners[2]];
    } else {
      rotated = [corners[1], corners[2], corners[3], corners[0]];
    }

    if (activeSide === 'front') setFrontCorners(rotated);
    else setBackCorners(rotated);
  };

  const loadSampleIdCard = (side) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 650;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, 1024, 650);

    ctx.fillStyle = '#111116';
    for (let y = 0; y < 650; y += 20) {
      for (let x = 0; x < 1024; x += 20) {
        if ((x + y) % 40 === 0) {
          ctx.fillRect(x, y, 14, 14);
        }
      }
    }

    const cardX = 70;
    const cardY = 50;
    const cardW = 880;
    const cardH = 550;
    const r = 24;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.lineTo(cardX + cardW - r, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
    ctx.lineTo(cardX + cardW, cardY + cardH - r);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
    ctx.lineTo(cardX + r, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
    ctx.lineTo(cardX, cardY + r);
    ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
    ctx.closePath();

    ctx.fillStyle = '#e8f5e9';
    ctx.fill();
    ctx.strokeStyle = '#a5d6a7';
    ctx.lineWidth = 3;
    ctx.stroke();

    if (side === 'front') {
      ctx.fillStyle = '#1b5e20';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('PAKISTAN National Identity Card', cardX + 160, cardY + 60);

      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(cardX + 40, cardY + 160, 80, 65);

      ctx.fillStyle = '#1a237e';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Name: Ahmad Ali', cardX + 160, cardY + 140);
      ctx.fillText('Father Name: Zahid Hussain', cardX + 160, cardY + 210);
      ctx.fillText('Identity Number: 37406-8501117-7', cardX + 160, cardY + 360);
      ctx.fillText('Date of Birth: 08.01.2004', cardX + 160, cardY + 410);

      ctx.fillStyle = '#90a4ae';
      ctx.fillRect(cardX + cardW - 240, cardY + 120, 200, 260);
    } else {
      ctx.fillStyle = '#1b5e20';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('REGISTRATION & ADDRESS DETAILS', cardX + 40, cardY + 60);

      ctx.fillStyle = '#000000';
      ctx.font = '18px monospace';
      ctx.fillText('PERMANENT ADDRESS: HOUSE 124, SECTOR F-8/3, ISLAMABAD', cardX + 40, cardY + 140);
      ctx.fillText('PRESENT ADDRESS: HOUSE 124, SECTOR F-8/3, ISLAMABAD', cardX + 40, cardY + 200);

      for (let bx = cardX + 40; bx < cardX + cardW - 60; bx += 10) {
        ctx.fillRect(bx, cardY + 340, Math.random() * 6 + 2, 90);
      }
    }

    ctx.restore();

    const img = new Image();
    img.onload = () => {
      const autoCorners = detectCardCorners(img);
      if (side === 'front') {
        setFrontImageObj(img);
        setFrontCorners(autoCorners);
      } else {
        setBackImageObj(img);
        setBackCorners(autoCorners);
      }
    };
    img.src = canvas.toDataURL();
  };

  const currentImageObj = activeSide === 'front' ? frontImageObj : backImageObj;
  const currentCorners = activeSide === 'front' ? frontCorners : backCorners;
  const setCornersHandler = activeSide === 'front' ? setFrontCorners : setBackCorners;
  const currentEnhancedCanvas = activeSide === 'front' ? frontEnhancedCanvas : backEnhancedCanvas;
  const currentOptions = activeSide === 'front' ? frontOptions : backOptions;
  const setOptionsHandler = activeSide === 'front' ? setFrontOptions : setBackOptions;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="glass-panel" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none', padding: '14px 24px' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <CreditCard color="#ffffff" size={24} />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                background: 'linear-gradient(90deg, var(--text-main), var(--accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ID Card Scanner Studio
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '3px' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                  3.3" × 2.2" @ 300 DPI Preset
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: 'var(--bg-secondary)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)'
                }}>
                  <Sparkles size={11} color="var(--accent-secondary)" />
                  Powered by <span style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lunar AI</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Theme Selector + Card Preset */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* Theme Swatches */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-secondary)',
              padding: '6px 10px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <Palette size={16} color="var(--text-muted)" style={{ marginRight: '4px' }} />
              <div style={{ display: 'flex', gap: '5px' }}>
                {THEMES.map((theme) => {
                  const isActive = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setCurrentTheme(theme.id)}
                      title={`${theme.name} Theme`}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: theme.color,
                        border: isActive ? '2px solid #ffffff' : (theme.isLight ? '1px solid #94a3b8' : '1px solid transparent'),
                        boxShadow: isActive ? '0 0 10px var(--accent-primary)' : 'none',
                        cursor: 'pointer',
                        transform: isActive ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: 0
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Preset Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={selectedPresetKey}
                onChange={(e) => setSelectedPresetKey(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                {Object.entries(CARD_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.name} ({preset.widthPx} × {preset.heightPx} px)
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1380px', width: '100%', margin: '24px auto', padding: '0 20px', flex: '1' }}>
        <div className="glass-panel" style={{ padding: '8px', marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeSide === 'front' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSide('front')}
            style={{ flex: '1', minWidth: '180px', justifyContent: 'center' }}
          >
            <CreditCard size={18} />
            1. Front Side {frontImageObj && <CheckCircle size={16} color="#10b981" style={{ marginLeft: '4px' }} />}
          </button>

          <button
            className={`btn ${activeSide === 'back' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSide('back')}
            style={{ flex: '1', minWidth: '180px', justifyContent: 'center' }}
          >
            <Layers size={18} />
            2. Back Side {backImageObj && <CheckCircle size={16} color="#10b981" style={{ marginLeft: '4px' }} />}
          </button>

          <button
            className={`btn ${activeSide === 'export' ? 'btn-success glow-active' : 'btn-secondary'}`}
            onClick={() => setActiveSide('export')}
            style={{ flex: '1', minWidth: '220px', justifyContent: 'center' }}
            disabled={!frontImageObj && !backImageObj}
          >
            <Printer size={18} />
            3. A4 Multi-Copy Sheet (1 to 8 Copies @ 300 DPI)
          </button>
        </div>

        {activeSide === 'export' ? (
          <PrintPreview
            frontCanvas={frontEnhancedCanvas}
            backCanvas={backEnhancedCanvas}
            presetInfo={activePreset}
            onOpenModal={openDownloadModal}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            {!currentImageObj ? (
              <div
                className="glass-panel"
                style={{
                  padding: '60px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  border: '2px dashed var(--accent-primary)',
                  cursor: 'pointer'
                }}
                onClick={() => triggerUpload(activeSide)}
              >
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Upload size={32} color="var(--accent-primary)" />
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
                  Upload Mobile Photo of ID Card ({activeSide.toUpperCase()})
                </h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '480px', fontSize: '0.95rem', marginBottom: '20px' }}>
                  Auto-detects card bounds & sharpens all wording, numbers & digits to razor-sharp bold black on 3.3" × 2.2" @ 300 DPI <strong>JPEG (.jpg)</strong>.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerUpload(activeSide);
                    }}
                  >
                    <ImageIcon size={18} /> Upload Photo from Device
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSampleIdCard(activeSide);
                    }}
                  >
                    <Sparkles size={18} /> Test Smart NIC Sample
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px' }}>
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem' }}>
                        Step 1: ID Card Edge Crop ({activeSide.toUpperCase()})
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Card edges auto-detected. Adjust handles if needed.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" onClick={() => rotateCurrentSideImage(90)} style={{ padding: '6px 12px', fontSize: '0.8rem' }} title="Rotate source photo 90 degrees">
                        <RotateCw size={14} /> Rotate Photo 90°
                      </button>
                      <button className="btn btn-secondary" onClick={() => rotateCornerOrientation('clockwise')} style={{ padding: '6px 12px', fontSize: '0.8rem' }} title="Rotate crop box 90 degrees">
                        <RotateCw size={14} /> Rotate Crop 90°
                      </button>
                      <button className="btn btn-secondary" onClick={autoDetectCornersForCurrentSide} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Target size={14} /> Auto-Trim
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleReupload(activeSide)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <RotateCcw size={14} /> Re-upload
                      </button>
                    </div>
                  </div>

                  <CornerSelectorCanvas
                    imageObj={currentImageObj}
                    corners={currentCorners}
                    onCornersChange={setCornersHandler}
                    targetAspectRatio={activePreset.aspectRatio}
                  />

                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                        Live Scan ({activePreset.widthPx} × {activePreset.heightPx} px @ 300 DPI):
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => rotateCornerOrientation('clockwise')}
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          title="Rotate output card 90 degrees"
                        >
                          <RotateCw size={14} /> Rotate 90°
                        </button>
                        <button
                          className="btn btn-primary glow-active"
                          onClick={() => downloadCanvasAsJPEG(currentEnhancedCanvas, `ID_${activeSide.toUpperCase()}_3.3x2.2_300DPI.jpg`)}
                          style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                        >
                          <Download size={14} /> Download JPEG (.jpg)
                        </button>
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', display: 'flex', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.5)' }}>
                      {currentEnhancedCanvas && (
                        <img
                          src={currentEnhancedCanvas.toDataURL('image/jpeg', 0.95)}
                          alt="Enhanced Output"
                          style={{ maxWidth: '100%', maxHeight: '220px', display: 'block', borderRadius: '4px' }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <ImageEnhancers
                    options={currentOptions}
                    onChange={setOptionsHandler}
                    onReset={() => setOptionsHandler({ ...defaultOptions })}
                  />

                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Info size={16} color="var(--accent-secondary)" />
                      {activeSide === 'front'
                        ? 'Front side ready! Download JPEG or edit Back side.'
                        : 'Both sides ready! Download 300 DPI JPEGs or Print.'}
                    </div>

                    <button
                      className="btn btn-success glow-active"
                      onClick={() => downloadCanvasAsJPEG(currentEnhancedCanvas, `ID_${activeSide.toUpperCase()}_3.3x2.2_300DPI.jpg`)}
                      style={{ width: '100%' }}
                    >
                      <Download size={18} /> Download Single {activeSide.toUpperCase()} JPEG (.jpg)
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => setActiveSide('export')}
                      style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                    >
                      <Printer size={18} /> A4 Multi-Copy & Direct Print (8 Front & 8 Back)
                    </button>

                    {activeSide === 'front' ? (
                      <button
                        className="btn btn-outline"
                        onClick={() => setActiveSide('back')}
                        style={{ width: '100%' }}
                      >
                        {backImageObj ? 'Switch to Back Side' : 'Continue to Back Side'} <ArrowRight size={18} />
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline"
                        onClick={() => setActiveSide('front')}
                        style={{ width: '100%' }}
                      >
                        Switch to Front Side <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          ref={frontFileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0], 'front');
            }
            e.target.value = '';
          }}
        />
        <input
          type="file"
          ref={backFileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0], 'back');
            }
            e.target.value = '';
          }}
        />

        {/* Fail-safe Download Modal Lightbox */}
        <DownloadModal
          isOpen={modalConfig.isOpen}
          canvas={modalConfig.canvas}
          filename={modalConfig.filename}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        />
      </main>

      <footer className="glass-panel" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', padding: '16px 24px', marginTop: '40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>ID Card Scanner & Multi-Copy Preset Studio</span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text-main)' }}>
            <Sparkles size={14} color="var(--accent-secondary)" />
            Powered by <strong style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lunar AI</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
