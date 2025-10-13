import React, { useEffect } from 'react';
import ButtonPrimary from './ButtonPrimary';

interface ModalConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ModalConfirm: React.FC<ModalConfirmProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-panel p-6 rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div>{children}</div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="mr-2 px-4 py-2 rounded text-text-dim"
          >
            Cancel
          </button>
          <ButtonPrimary onClick={onConfirm}>Confirm</ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;
