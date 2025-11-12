import { NAV_ITEMS } from "@/utils/data";
import Image from "next/image";
import { FC } from "react";

interface AppHeaderProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  navItems: typeof NAV_ITEMS; // 👈 added this line
}

const AppHeader: FC<AppHeaderProps> = ({ activeTab, setActiveTab, navItems }) => {
  const isActive = activeTab === NAV_ITEMS[0].id;

  return (
    <header className="bg-[#037C01] shadow-xl">
      <div className="mx-auto flex justify-between items-stretch h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div onClick={() => setActiveTab(NAV_ITEMS[1].id)} className="flex items-center space-x-4 cursor-pointer">
          <Image src={'/images/logo.png'} alt="logo" width={100} height={50} />
        </div>

        {/* Navigation Links */}
        <nav className="flex items-stretch space-x-0 pl-[5%]">
          {navItems.filter(item => item.label !== '').map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  h-full px-5 flex items-center text-sm font-semibold transition-all duration-200 relative
                  ${isActive
                    ? 'bg-[#FFFFFF33] text-[#55FF18]'
                    : 'text-green-100 hover:bg-[#FFFFFF33]'
                  }
                  ${isActive
                    ? 'after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[#55FF18] after:rounded-t-sm'
                    : ''
                  }
                `}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <button
          onClick={() => setActiveTab(NAV_ITEMS[0].id)}
          className={`
            h-full px-5 flex items-center text-sm font-semibold transition-all duration-200 relative
            ${isActive ? 'bg-[#FFFFFF33] text-[#55FF18]' : 'text-green-100 hover:bg-[#FFFFFF33]'}
          `}
        >
          <div className="flex items-center space-x-3 text-right text-white px-2">
            <div className="text-sm">
              <div className="font-semibold">Amha Lleus</div>
              <div className="text-xs text-green-200">ID: 077 Obealin</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-700 font-extrabold text-lg shadow-inner border border-white">
              A
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
