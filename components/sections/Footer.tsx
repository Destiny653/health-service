'use client';

import React from 'react';
import Link from 'next/link';
import { Copyright, Github, Twitter, Mail } from 'lucide-react';

export default function Footer({ company = 'INSTANVI SARL', github = '#', twitter = '#', mail = 'mailto:hello@example.com' }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* left: copyright */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Copyright className="w-4 h-4" aria-hidden />
            <span>
              {year} {company}. All rights reserved.
            </span>
          </div>

          {/* right: small social / contact icons */}
          <div className="flex items-center gap-3">
            <Link href={github} aria-label="GitHub" className="group p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <Github className="w-5 h-5 text-gray-600 group-hover:text-black dark:text-gray-300" />
            </Link>

            <Link href={twitter} aria-label="Twitter" className="group p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <Twitter className="w-5 h-5 text-gray-600 group-hover:text-black dark:text-gray-300" />
            </Link>

            <Link href={mail} aria-label="Email" className="group p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <Mail className="w-5 h-5 text-gray-600 group-hover:text-black dark:text-gray-300" />
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
