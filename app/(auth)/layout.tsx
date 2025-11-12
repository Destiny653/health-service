"use client"; // This component needs client-side features like `usePathname`

import React from "react";
import { usePathname } from "next/navigation"; // Correct import for Next.js 13+ App Router
import { MARKETING_TEXTS } from "@/utils/constants"; // Import marketing texts
import Image from "next/image";

// Function to get the appropriate marketing text based on the current path
const getMarketingText = (pathname: string) => {
  if (pathname.includes("/login")) {
    return MARKETING_TEXTS.login;
  }
  if (pathname.includes("/register/telephone")) {
    return MARKETING_TEXTS.telephone;
  }
  if (pathname.includes("/register/verify-otp")) {
    return MARKETING_TEXTS.verifyOtp;
  }
  if (pathname.includes("/register/verification/business-info")) {
    return MARKETING_TEXTS.businessInfo;
  }
  if (pathname.includes("/register/verification/address-info")) {
    return MARKETING_TEXTS.addressInfo;
  }
  if (pathname.includes("/register/verification/identity-verification")) {
    return MARKETING_TEXTS.identityVerification;
  }
  if (pathname.includes("/register/verification/submission-success")) {
    return MARKETING_TEXTS.submissionSuccess;
  }
  if (pathname.includes("/forgot-password")) {
    return MARKETING_TEXTS.forgotPassword;
  }
  // Default for initial register page and other cases
  return MARKETING_TEXTS.register;
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { quote, author, title } = getMarketingText(pathname);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="flex  overflow-hidden w-[100vw] mx-auto h-[100vh] bg-white">
        {/* Left section for forms */}
        <div className="w-full h-[100vh] lg:w-1/2 flex items-center justify-center p-3 sm:p-4 lg:p-4 overflow-y-auto relative">
          <div className="max-w-lg w-full ">
            {children}
          </div>
        </div>

        {/* Right section for marketing text (hidden on small screens) */}
        <div className="hidden lg:flex lg:w-1/2 auth-gradient-bg items-end justify-center p-0 text-center bg-[#00eeff50]">
          <Image src={'/images/form.png'} alt="form image" height={800} width={800} />
        </div>
      </div>
    </div>
  );
}