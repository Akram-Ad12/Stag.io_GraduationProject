import { useEffect } from 'react';

export default function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.classList.add('modal-open');
    
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={wide ? { maxWidth: 1200, width: '95vw' } : {}}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={wide ? { padding: 48 } : {}}>
          {children}
        </div>
      </div>
    </div>
  );
}
