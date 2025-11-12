"use client";

import { NAV_ITEMS } from "@/utils/data";
import Image from "next/image";
import { FC, useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface AppHeaderProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  navItems: typeof NAV_ITEMS;
  userName?: string;
  email?: string;
  role?: string;
}

const AppHeader: FC<AppHeaderProps> = ({ activeTab, setActiveTab, navItems, userName, email, role }) => {
  const router = useRouter();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  const handleSignOut = () => {
    // Clear localStorage / cookies
    localStorage.removeItem("userInfo");
    localStorage.removeItem("app:activeTab");
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    toast.success("Signed out successfully!");
    router.push("/sign-in");
  };

  const isActiveProfile = activeTab === navItems[0].id;

  return (
    <header className="bg-[#037C01] shadow-xl">
      <div className="mx-auto flex justify-between items-stretch h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div onClick={() => setActiveTab(navItems[1].id)} className="flex items-center  space-x-4 cursor-pointer">
          <Image src="/images/logo.png" alt="logo" width={120} height={500} />
        </div>

        {/* Navigation Links */}
        <nav className="flex items-stretch space-x-0 pl-[5%]">
          {navItems.filter(item => item.label !== "").map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  h-full px-5 flex items-center text-[17px] font-semibold transition-all duration-200 relative
                  ${isActive ? "bg-[#FFFFFF33] text-[#55FF18]" : "text-green-100 hover:bg-[#FFFFFF33]"}
                  ${isActive ? "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[#55FF18] after:rounded-t-sm" : ""}
                `}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Sign Out */}
        <div className="flex items-center space-x-0">
          {/* Profile Info */}
          <button
            onClick={() => setActiveTab(navItems[0].id)}
            className={`
              h-full px-5 flex items-center text-sm font-semibold transition-all duration-200 relative
              ${isActiveProfile ? "bg-[#FFFFFF33] text-[#55FF18]" : "text-green-100 hover:bg-[#FFFFFF33]"}
            `}
          >
            <div className="flex items-center space-x-3 text-left text-white px-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-700 font-extrabold text-lg shadow-inner border border-white">
                {userName ? userName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="text-sm">
                <div className="font-semibold">{userName || "User"}</div>
                <div className="font-[400]">{email}</div>
                {/* <div className="text-xs text-green-200">{role ? role.toUpperCase() : "..."}</div> */}
              </div>
            </div>
          </button>

          {/* Sign Out Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  // variant="ghost"
                  className="rounded-full p-3 shadow-none hover:bg-[#cacaca86] bg-inherit"
                  onClick={() => setIsSignOutOpen(true)}
                >
                  <LogOut size={20} className="text-white hover:text-black" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className=" text-white rounded-md px-3 py-1 text-sm">
                Sign Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Sign Out Confirmation Modal */}
        <Dialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirm Sign Out</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center text-sm text-gray-700">
              Are you sure you want to sign out?
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsSignOutOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleSignOut}>
                Sign Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
};

export default AppHeader;
