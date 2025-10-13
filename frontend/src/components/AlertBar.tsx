import React from 'react';

type AlertType = 'success' | 'error' | 'info';

interface AlertBarProps {
  type: AlertType;
  message: string;
}

const AlertBar: React.FC<AlertBarProps> = ({ type, message }) => {
  const baseClasses = 'p-4 text-text';
  const typeClasses = {
    success: 'bg-accent-2',
    error: 'bg-error',
    info: 'bg-accent',
  };

  return (
    <div data-testid={`alert-${type}`} className={`${baseClasses} ${typeClasses[type]}`}>
      {message}
    </div>
  );
};

export default AlertBar;
