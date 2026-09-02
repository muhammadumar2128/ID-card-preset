import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Sun, Contrast, ShieldAlert, Sparkles, RefreshCw, Moon, Zap, Type, Eye, Palette } from 'lucide-react';

export default function ImageEnhancers({ options, onChange, onReset }) {
  const [localOptions, setLocalOptions] = useState(options);
  const rafRef = useRef(null);

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const updateOption = (key, value) => {
    const updated = { ...localOptions, [key]: value };
    setLocalOptions(updated);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      onChange(updated);
    });
  };

  const handleModeChange = (mode) => {
    const updated = { ...localOptions, mode };
    setLocalOptions(updated);
    onChange(updated);
  };

  const isMagicOrColor = localOptions.mode === 'magic-color' || localOptions.mode === 'magic' || localOptions.mode === 'color';

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--text-main)' }}>
          <Sparkles size={18} color="var(--accent-secondary)" />
          Document Enhancements
        </h3>
        <button className="btn btn-secondary" onClick={onReset} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Preset Filter Modes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`btn ${localOptions.mode === 'magic-color' || localOptions.mode === 'magic' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleModeChange('magic-color')}
          style={{
            justifyContent: 'flex-start',
            fontSize: '0.85rem',
            gridColumn: 'span 2',
            background: (localOptions.mode === 'magic-color' || localOptions.mode === 'magic')
              ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
              : ''
          }}
        >
          <Zap size={16} color="#ffffff" /> Magic Color HD (Vivid & Clear Text)
        </button>
        <button
          className={`btn ${localOptions.mode === 'magic-bw' || localOptions.mode === 'sauvola' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleModeChange('magic-bw')}
          style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }}
        >
          <Sparkles size={16} /> Super Clear B&W
        </button>
        <button
          className={`btn ${localOptions.mode === 'grayscale' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleModeChange('grayscale')}
          style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }}
        >
          <Sliders size={16} /> Grayscale HD
        </button>
        <button
          className={`btn ${localOptions.mode === 'color' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleModeChange('color')}
          style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }}
        >
          <Sun size={16} /> Vibrant Color
        </button>
        <button
          className={`btn ${localOptions.mode === 'original' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleModeChange('original')}
          style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }}
        >
          Raw Cropped
        </button>
      </div>

      {/* Sharpness & Clarity Control */}
      <div className="slider-group">
        <div className="slider-header">
          <span>
            <Eye size={14} style={{ verticalAlign: 'middle', marginRight: '4px', color: '#10b981' }} />
            Text Sharpness & Edge Clarity
          </span>
          <span className="slider-value" style={{ color: '#10b981' }}>{localOptions.sharpness ?? 65}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={localOptions.sharpness ?? 65}
          onChange={(e) => updateOption('sharpness', parseInt(e.target.value))}
        />
      </div>

      {/* Text Darkening / Ink Depth */}
      <div className="slider-group">
        <div className="slider-header">
          <span>
            <Type size={14} style={{ verticalAlign: 'middle', marginRight: '4px', color: '#38bdf8' }} />
            Text & Numbers Ink Depth (Darken)
          </span>
          <span className="slider-value" style={{ color: '#38bdf8' }}>{localOptions.textDarkening ?? 40}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={localOptions.textDarkening ?? 40}
          onChange={(e) => updateOption('textDarkening', parseInt(e.target.value))}
        />
      </div>

      {/* Background White Normalization */}
      <div className="slider-group">
        <div className="slider-header">
          <span>
            <ShieldAlert size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Background Clean (Paper White)
          </span>
          <span className="slider-value">{localOptions.shadowRemoval ?? 60}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={localOptions.shadowRemoval ?? 60}
          onChange={(e) => updateOption('shadowRemoval', parseInt(e.target.value))}
        />
      </div>

      {/* Color Saturation (when in color mode) */}
      {isMagicOrColor && (
        <div className="slider-group">
          <div className="slider-header">
            <span>
              <Palette size={14} style={{ verticalAlign: 'middle', marginRight: '4px', color: '#ec4899' }} />
              Color Richness / Saturation
            </span>
            <span className="slider-value" style={{ color: '#ec4899' }}>{localOptions.saturation ?? 15}%</span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            value={localOptions.saturation ?? 15}
            onChange={(e) => updateOption('saturation', parseInt(e.target.value))}
          />
        </div>
      )}

      {/* Brightness Offset */}
      <div className="slider-group">
        <div className="slider-header">
          <span>
            <Sun size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Brightness Offset
          </span>
          <span className="slider-value">{(localOptions.brightness || 0) > 0 ? `+${localOptions.brightness}` : localOptions.brightness || 0}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          value={localOptions.brightness || 0}
          onChange={(e) => updateOption('brightness', parseInt(e.target.value))}
        />
      </div>

      {/* Contrast Multiplier */}
      <div className="slider-group">
        <div className="slider-header">
          <span>
            <Contrast size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Contrast Multiplier
          </span>
          <span className="slider-value">{(localOptions.contrast || 0) > 0 ? `+${localOptions.contrast}` : localOptions.contrast || 0}</span>
        </div>
        <input
          type="range"
          min="-50"
          max="100"
          value={localOptions.contrast || 0}
          onChange={(e) => updateOption('contrast', parseInt(e.target.value))}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Invert Colors</span>
        <button
          className={`btn ${localOptions.invert ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => updateOption('invert', !localOptions.invert)}
          style={{ padding: '4px 12px', fontSize: '0.8rem' }}
        >
          <Moon size={14} /> {localOptions.invert ? 'Inverted ON' : 'Off'}
        </button>
      </div>
    </div>
  );
}
