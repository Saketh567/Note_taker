import { useState, useCallback } from 'react';
import { AIStatus } from '../services/llm';

interface AIStatusBarProps {
  status: AIStatus;
  onCheck: () => void;
}

export function AIStatusBar({ status, onCheck }: AIStatusBarProps) {
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = useCallback(() => {
    if (status === 'offline') {
      onCheck();
    }
  }, [status, onCheck]);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          dotColor: 'bg-green-500',
          text: 'AI Ready',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          showSpinner: false,
        };
      case 'checking':
        return {
          dotColor: 'bg-blue-500',
          text: 'Checking...',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          showSpinner: true,
        };
      case 'offline':
        return {
          dotColor: 'bg-gray-400',
          text: 'AI Offline',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          showSpinner: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      {/* Demo mode notice */}
      <span className="text-[10px] text-gray-400 hidden sm:inline">
        Demo: 20 req/min
      </span>
      
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={status === 'checking'}
        className={`
          flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium
          border ${config.borderColor} ${config.bgColor} ${config.textColor}
          transition-all duration-150
          ${status === 'offline' ? 'cursor-pointer hover:bg-gray-200' : 'cursor-default'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={
          status === 'offline'
            ? 'Click to retry connection'
            : status === 'connected'
            ? 'Kimi Cloud API connected'
            : 'Checking connection...'
        }
      >
        {config.showSpinner ? (
          <div className="w-2 h-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
        )}
        <span>{config.text}</span>
        {status === 'offline' && isHovering && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 ml-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
