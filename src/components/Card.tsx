import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  icon?: React.ElementType;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  headerAction,
  footer,
  noPadding = false,
  icon: Icon,
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-premium border border-slate-100 overflow-hidden ${className}`}>
      {(title || subtitle || headerAction || Icon) && (
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                <Icon size={20} />
              </div>
            )}
            <div>
              {title && <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>}
              {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      
      <div className={`${noPadding ? '' : 'p-6'}`}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
