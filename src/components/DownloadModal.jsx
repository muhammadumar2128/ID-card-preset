import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, X, CheckCircle2 } from 'lucide-react';

export default function DownloadModal({ isOpen, onClose, canvas, filename = 'ID_Card_3.3x2.2_300DPI' }) {
  const [downloadUrl, setDownloadUrl] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState('');

  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.jpg$/i, '') + '.jpg';

  useEffect(() => {
    if (!isOpen || !canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    // Fast preview
    setPreviewDataUrl(exportCanvas.toDataURL('image/jpeg', 0.88));

    // High quality Blob for reliable file download
    if (exportCanvas.toBlob) {
      exportCanvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);

          // Auto-trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = cleanName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link);
          }, 500);
        },
        'image/jpeg',
        0.98
      );
    }
  }, [isOpen, canvas, cleanName]);

  if (!isOpen || !canvas) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          position: 'relative',
          padding: '20px',
          border: '1px solid rgba(16, 185, 129, 0.5)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', paddingRight: '20px', paddingLeft: '20px' }}>
          <span className="badge badge-success" style={{ marginBottom: '6px' }}>
            <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Download Started • 300 DPI Verified
          </span>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginTop: '2px' }}>
            Your JPEG is Ready
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', wordBreak: 'break-all' }}>
            <code style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{cleanName}</code>
          </p>
        </div>

        {/* JPEG Preview Image - Max Height Constrained so buttons are always visible */}
        <div
          style={{
            background: '#ffffff',
            padding: '6px',
            borderRadius: '8px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            width: '100%',
            maxHeight: '44vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {previewDataUrl && (
            <img
              src={previewDataUrl}
              alt="JPEG Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '42vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '4px',
                display: 'block'
              }}
            />
          )}
        </div>

        {/* Action Buttons - Always visible */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap', marginTop: '4px' }}>
          <a
            href={downloadUrl || previewDataUrl}
            download={cleanName}
            className="btn btn-success glow-active"
            style={{ flex: '1', minWidth: '180px', textDecoration: 'none', textAlign: 'center', justifyContent: 'center', padding: '10px 14px' }}
          >
            <Download size={18} /> Click here to Download (.jpg)
          </a>

          <a
            href={downloadUrl || previewDataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ padding: '10px 14px', textDecoration: 'none' }}
          >
            <ExternalLink size={16} /> Open
          </a>
        </div>
      </div>
    </div>
  );
}
