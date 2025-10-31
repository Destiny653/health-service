import localFont from "next/font/local";

export const myFont = localFont({
  src: [
    {
      path: "../public/fonts/Stolzl-Light.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Stolzl-Bold.woff2",
      weight: "700",
      style: "bold",
    },
  ],
  variable: "--font-myfont",
});
