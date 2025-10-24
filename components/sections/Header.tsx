
// --- MOCK CONTENT COMPONENTS ---
// These components represent the large divs that switch out when the nav is clicked.

import { NAV_ITEMS } from "@/utils/data";
import { FC } from "react";


// --- NAVIGATION CONFIGURATION ---

interface AppHeaderProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

// --- REUSABLE HEADER COMPONENT ---

const AppHeader: FC<AppHeaderProps> = ({ activeTab, setActiveTab }) => {
    //   const [activeTab, setActiveTab] = useState('data_entries'); // 'Data Entries' is highlighted in the screenshot
    
  return (
    <header className="bg-green-700 shadow-xl">
      <div className=" mx-auto flex justify-between items-stretch h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Logo Section */}
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-700 font-extrabold text-sm">
            L
          </div>
          <span className="text-2xl font-bold text-white">Logo</span>
        </div>

        {/* Navigation Links (Middle) */}
        <nav className="flex items-stretch space-x-0">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  h-full px-5 flex items-center text-sm font-semibold transition-all duration-200 relative
                  ${isActive
                    ? 'bg-green-800 text-green-500' // Darker green for active tab background
                    : 'text-green-100 hover:bg-green-600' // Lighter green for hover/inactive text
                  }
                  ${isActive ? 'after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-green-500 after:rounded-t-sm' : ''}
                `}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="flex items-center space-x-3 text-right text-white">
          <div className="text-sm">
            <div className="font-semibold">Amha Lleus</div>
            <div className="text-xs text-green-200">ID: 077 Obealin</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-700 font-extrabold text-lg shadow-inner border border-white">
            A
          </div>
        </div>

      </div>
    </header>
  );
};

export default AppHeader
