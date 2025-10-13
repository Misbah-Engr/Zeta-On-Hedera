import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

const Panel: React.FC<PanelProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-panel border border-line rounded-lg p-4 ${className}`}
    >
      {children}
    </div>
  );
};

export default Panel;
