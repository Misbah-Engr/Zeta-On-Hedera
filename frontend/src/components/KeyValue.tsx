import React from 'react';

interface KeyValueProps {
  label: string;
  value: React.ReactNode;
  isMono?: boolean;
}

const KeyValue: React.FC<KeyValueProps> = ({ label, value, isMono = false }) => {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-text-dim">{label}</span>
      <span className={`text-text ${isMono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
};

export default KeyValue;
