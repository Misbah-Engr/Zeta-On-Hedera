import React from 'react';

interface ButtonPrimaryProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({ children, ...props }) => {
  return (
    <button
      data-testid="btn-primary"
      className="w-full md:w-60 bg-accent text-text font-bold py-2 px-4 rounded disabled:bg-warn"
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonPrimary;
