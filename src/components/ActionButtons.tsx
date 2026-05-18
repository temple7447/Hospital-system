import React from 'react';
import { cn } from '@/utils/cn';
import { Eye, Pencil, Trash2, Download, MoreVertical } from 'lucide-react';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showDownload?: boolean;
  className?: string;
  compact?: boolean;
}

export function ActionButtons({
  onView,
  onEdit,
  onDelete,
  onDownload,
  showView = true,
  showEdit = true,
  showDelete = true,
  showDownload = false,
  className,
  compact = false
}: ActionButtonsProps) {
  const buttonClass = compact 
    ? "p-1.5" 
    : "p-2";
  
  const iconClass = compact 
    ? "w-3.5 h-3.5" 
    : "w-4 h-4";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showView && onView && (
        <button
          onClick={onView}
          className={cn(
            buttonClass,
            "hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all text-slate-400 hover:text-blue-600",
            !compact && "shadow-sm"
          )}
          title="View"
        >
          <Eye className={iconClass} />
        </button>
      )}
      
      {showDownload && onDownload && (
        <button
          onClick={onDownload}
          className={cn(
            buttonClass,
            "hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all text-slate-400 hover:text-blue-600",
            !compact && "shadow-sm"
          )}
          title="Download"
        >
          <Download className={iconClass} />
        </button>
      )}
      
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className={cn(
            buttonClass,
            "hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-slate-600",
            !compact && "shadow-sm"
          )}
          title="Edit"
        >
          <Pencil className={iconClass} />
        </button>
      )}
      
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className={cn(
            buttonClass,
            "hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all text-slate-400 hover:text-red-600",
            !compact && "shadow-sm"
          )}
          title="Delete"
        >
          <Trash2 className={iconClass} />
        </button>
      )}
    </div>
  );
}

export default ActionButtons;