import React, { useState } from 'react';

interface CopyFieldProps {
  label: string;
  value: string;
}

const CopyField: React.FC<CopyFieldProps> = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div>
      <label className="block text-text-dim text-sm font-bold mb-2">{label}</label>
      <div className="flex items-center">
        <input
          type="text"
          value={value}
          readOnly
          className="bg-panel border border-line rounded-l-lg p-2 w-full font-mono"
        />
        <button
          onClick={handleCopy}
          className="bg-accent text-white font-bold py-2 px-4 rounded-r-lg"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export default CopyField;
