

export type MobileTab = 'editor' | 'insights';

interface BottomTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  isKeyboardVisible?: boolean;
}

/**
 * Fixed bottom tab bar for mobile navigation
 * Hides when keyboard is visible (prevents covering text input)
 */
export function BottomTabBar({ 
  activeTab, 
  onTabChange,
  isKeyboardVisible = false 
}: BottomTabBarProps) {
  // Hide when keyboard is visible
  if (isKeyboardVisible) {
    return null;
  }

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40
      bg-white border-t border-gray-200
      safe-area-pb
      flex items-center justify-around
      h-[56px] min-h-[56px]
    ">
      <TabButton
        isActive={activeTab === 'editor'}
        onClick={() => onTabChange('editor')}
        icon={<EditIcon />}
        label="Notes"
      />
      <TabButton
        isActive={activeTab === 'insights'}
        onClick={() => onTabChange('insights')}
        icon={<InsightsIcon />}
        label="Insights"
      />
    </nav>
  );
}

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ isActive, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        flex-1 h-full min-w-[44px]
        transition-colors duration-150
        ${isActive 
          ? 'text-blue-600' 
          : 'text-gray-500 hover:text-gray-700'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className={`${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className="text-[10px] mt-0.5 font-medium">{label}</span>
    </button>
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
