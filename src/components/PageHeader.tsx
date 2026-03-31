import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  action,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        )}
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-slate-500 mt-1 text-sm font-medium">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};

export default PageHeader;
