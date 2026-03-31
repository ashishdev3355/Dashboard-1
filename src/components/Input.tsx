import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ElementType;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}
        <input
          id={inputId}
          className={`premium-input ${Icon ? 'pl-11' : ''} ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
          {...props}
        />
      </div>
      
      {error ? (
        <p className="text-xs font-medium text-red-500 mt-1 ml-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-400 mt-1 ml-1">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
