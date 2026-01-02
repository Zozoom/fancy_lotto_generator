"use client";

import { useEffect, useState } from "react";

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  packageManager: string;
}

export default function InfoPage() {
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPackageInfo = async () => {
      try {
        const response = await fetch("/api/info");
        if (response.ok) {
          const data = await response.json();
          setPackageInfo(data);
        }
      } catch (error) {
        console.error("Failed to load package info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPackageInfo();
  }, []);

  if (isLoading || !packageInfo) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ml-0 md:ml-64">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ml-0 md:ml-64">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-800 dark:text-slate-100">
              App Information
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Version and technical details
            </p>
          </div>

          {/* App Details Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Application Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Name:</span>
                <span className="text-slate-800 dark:text-slate-100 font-mono">{packageInfo.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Version:</span>
                <span className="text-slate-800 dark:text-slate-100 font-mono bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-green-700 dark:text-green-400 font-semibold">
                  v{packageInfo.version}
                </span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Description:</span>
                <span className="text-slate-800 dark:text-slate-100 text-right max-w-md">{packageInfo.description}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Package Manager:</span>
                <span className="text-slate-800 dark:text-slate-100 font-mono bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full text-blue-700 dark:text-blue-400 font-semibold">
                  {packageInfo.packageManager || "Bun"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Framework:</span>
                <span className="text-slate-800 dark:text-slate-100 font-mono">Next.js {packageInfo.dependencies.next?.replace('^', '')}</span>
              </div>
            </div>
          </div>

          {/* Author & Repository Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Author & Repository
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Author:</span>
                <span className="text-slate-800 dark:text-slate-100 font-mono">Zoltan Zsigmond Kiss</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">GitHub:</span>
                <a
                  href="https://github.com/Zozoom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-mono underline flex items-center gap-2 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  @Zozoom
                </a>
              </div>
            </div>
          </div>

          {/* Tech Stack Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Technology Stack
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Frontend Framework</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">Next.js</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{packageInfo.dependencies.next}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">UI Library</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">React</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{packageInfo.dependencies.react}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Styling</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">Tailwind CSS</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{packageInfo.dependencies.tailwindcss}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Language</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">TypeScript</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{packageInfo.devDependencies.typescript}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Effects</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">Canvas Confetti</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{packageInfo.dependencies["canvas-confetti"]}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Package Manager</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">Bun</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Latest</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

