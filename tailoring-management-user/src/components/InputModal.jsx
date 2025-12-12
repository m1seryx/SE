import React, { useState, useEffect } from 'react';
import './AlertModal.css';

const InputModal = ({ isOpen, title, message, placeholder = '', onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', defaultValue = '' }) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  // Handle body overflow and input value when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        // Restore original overflow or default to 'auto'
        document.body.style.overflow = originalOverflow || 'auto';
      };
    } else {
      // Ensure overflow is restored when modal closes
      document.body.style.overflow = 'auto';
    }
  }, [isOpen, defaultValue]);

  // Handle keyboard events - MUST be called before early return to follow Rules of Hooks
  useEffect(() => {
    if (!isOpen) {
      return; // Early return inside effect is fine, but effect must always be called
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && inputValue.trim()) {
        onConfirm(inputValue);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, inputValue, onConfirm, onCancel]);

  // Early return AFTER all hooks
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    // Call onConfirm with the input value (even if empty) - the caller will validate
    onConfirm(inputValue);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="alert-modal-overlay active" onClick={handleOverlayClick}>
      <div className="alert-modal input-modal">
        <div className="alert-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3498DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <h3>{title || 'Input Required'}</h3>
        <p>{message}</p>
        <div className="input-field">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="modal-input"
          />
        </div>
        <div className="alert-buttons">
          <button className="alert-btn cancel" onClick={handleCancel}>
            {cancelText}
          </button>
          <button className="alert-btn confirm" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;

