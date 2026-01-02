"use client";

import Link from "next/link";
import Logo from "./Logo";

interface LandingPageProps {
  onGetStarted?: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-3 sm:p-4 overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl w-full text-center space-y-4 sm:space-y-6 overflow-y-auto">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Main Heading */}
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-slate-800 dark:text-slate-100">
            Generate Your
            <br />
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Lucky Numbers
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
            Create random lottery numbers with AI-powered predictions. 
            Track your history and improve your chances with advanced mathematical analysis.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6 md:mt-8 px-2">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-5 md:p-6 shadow-lg border-2 border-slate-300 dark:border-slate-600">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 sm:mb-2">
              Random Generation
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Generate 5 unique random numbers from 1 to 99 instantly
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-5 md:p-6 shadow-lg border-2 border-slate-300 dark:border-slate-600">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 sm:mb-2">
              AI Predictions
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Advanced algorithms analyze patterns to predict likely numbers
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-5 md:p-6 shadow-lg border-2 border-slate-300 dark:border-slate-600">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 sm:mb-2">
              History Tracking
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Save and review all your generations with timestamps
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-4 sm:mt-6 md:mt-8">
          <Link
            href="/play"
            onClick={onGetStarted}
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full font-semibold text-base sm:text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started
          </Link>
        </div>

        {/* Demo Numbers */}
        <div className="mt-6 sm:mt-8 md:mt-12">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 sm:mb-4">
            Example generated numbers:
          </p>
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
            {[12, 34, 56, 78, 91].map((num, i) => (
              <div
                key={i}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center text-base sm:text-lg md:text-xl font-semibold shadow-lg animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "2s",
                }}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

