"use client"; // This component needs client-side features like `usePathname`

import React from "react";
import { usePathname } from "next/navigation"; // Correct import for Next.js 13+ App Router
import { MARKETING_TEXTS } from "@/utils/constants"; // Import marketing texts

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
        <div className="hidden lg:flex lg:w-1/2 auth-gradient-bg items-center justify-center p-8 text-center"
          style={{
            backgroundImage: `radial-gradient(
          circle at 25% 58%,
          #1cd6b5 26%,
          #2566ed 80%,
          #1e3a8a 1000%
        )`,
          }}
        >
          <div className="space-y-6 box-border px-26">
            <p className="text-xl font-semibold leading-relaxed text-white">
              {quote}
            </p>
            <div className="flex justify-center space-x-1.5 mb-8">
              <div className="w-4.5 h-1.5 bg-white rounded-full mt-0.5"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-0.5"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-0.5"></div>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-medium text-white">{author}</p>
              <p className="text-base opacity-80 text-gray-300">{title}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}