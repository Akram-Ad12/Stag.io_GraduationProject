import { useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(-1)} 
      className="back-btn"
      aria-label="Go back"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      
      <style>{`
        .back-btn {
          position: fixed;
          top: 80px;
          left: 20px;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #fff;
          border: 1.5px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 100;
          box-shadow: var(--shadow-sm);
          color: var(--text-dark);
        }
        .back-btn:hover {
          transform: translateX(-4px);
          border-color: var(--primary);
          color: var(--primary);
          box-shadow: var(--shadow);
        }
        @media (max-width: 768px) {
          .back-btn {
            top: auto;
            bottom: 20px;
            left: 20px;
          }
        }
      `}</style>
    </button>
  );
}
