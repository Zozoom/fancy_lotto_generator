"use client";

import { useState, useEffect } from "react";
import { useHistory } from "@/hooks/useHistory";

interface AnalyticsData {
  totalGenerations: number;
  hotNumbers: { number: number; count: number; percentage: number }[];
  coldNumbers: { number: number; count: number; percentage: number }[];
  mostCommonPairs: { pair: string; count: number }[];
  rangeDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  oddEvenDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  sumDistribution: {
    min: number;
    max: number;
    average: number;
    mostCommon: number;
  };
  digitEndingDistribution: {
    ending: number;
    count: number;
    percentage: number;
  }[];
  recentTrends: {
    last10: { number: number; count: number }[];
    last30: { number: number; count: number }[];
  };
  consecutivePatterns: {
    hasConsecutive: number;
    noConsecutive: number;
    percentage: number;
  };
}

export default function AnalyzePage() {
  const { isLoading } = useHistory();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };


  if (isLoadingAnalytics || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ml-0 md:ml-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalGenerations === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ml-0 md:ml-64">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border-2 border-slate-300 dark:border-slate-600 shadow-lg text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-slate-400 dark:text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
              No Data Available
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              There's no history data to analyze yet. Start generating numbers to see detailed analytics and insights.
            </p>
            <a
              href="/play"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Start Playing
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ml-0 md:ml-64">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">
              Number Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Analysis based on {analytics.totalGenerations} generations
            </p>
          </div>

          {/* Hot Numbers */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="text-red-500">🔥</span>
              Hot Numbers (Most Frequent)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
              {analytics.hotNumbers.map((item) => (
                <div
                  key={item.number}
                  className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-lg p-3 text-center shadow-md"
                >
                  <div className="text-2xl font-bold">{item.number}</div>
                  <div className="text-xs mt-1 opacity-90">
                    {item.count}x ({item.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cold Numbers */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="text-blue-500">❄️</span>
              Cold Numbers (Least Frequent)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
              {analytics.coldNumbers.map((item) => (
                <div
                  key={item.number}
                  className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg p-3 text-center shadow-md"
                >
                  <div className="text-2xl font-bold">{item.number}</div>
                  <div className="text-xs mt-1 opacity-90">
                    {item.count}x ({item.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Trends - Last 10 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Recent Trends (Last 10)
              </h2>
              <div className="flex flex-wrap gap-2">
                {analytics.recentTrends.last10.map((item) => (
                  <div
                    key={item.number}
                    className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-semibold shadow-md"
                    title={`Appeared ${item.count} times in last 10 generations`}
                  >
                    {item.number}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Trends - Last 30 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Recent Trends (Last 30)
              </h2>
              <div className="flex flex-wrap gap-2">
                {analytics.recentTrends.last30.map((item) => (
                  <div
                    key={item.number}
                    className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full w-12 h-12 flex items-center justify-center font-semibold shadow-md"
                    title={`Appeared ${item.count} times in last 30 generations`}
                  >
                    {item.number}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Most Common Pairs */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Most Common Pairs
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {analytics.mostCommonPairs.map((item) => (
                <div
                  key={item.pair}
                  className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 text-center"
                >
                  <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {item.pair}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {item.count}x
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Range Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-slate-300 dark:border-slate-600">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Range Distribution
            </h2>
            <div className="space-y-3">
              {analytics.rangeDistribution.map((item) => (
                <div key={item.range}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.range}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sum Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Sum Distribution
              </h3>
              <div className="space-y-1">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Min: <span className="font-semibold">{analytics.sumDistribution.min}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Max: <span className="font-semibold">{analytics.sumDistribution.max}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Avg: <span className="font-semibold">{analytics.sumDistribution.average}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Most Common: <span className="font-semibold">{analytics.sumDistribution.mostCommon}</span>
                </div>
              </div>
            </div>

            {/* Odd/Even Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Odd/Even Distribution
              </h3>
              <div className="space-y-2">
                {analytics.oddEvenDistribution.map((item) => (
                  <div key={item.type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{item.type}</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.type === "Odd"
                            ? "bg-blue-500"
                            : "bg-pink-500"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consecutive Patterns */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Consecutive Patterns
              </h3>
              <div className="space-y-1">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  With Consecutive: <span className="font-semibold">{analytics.consecutivePatterns.hasConsecutive}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Without: <span className="font-semibold">{analytics.consecutivePatterns.noConsecutive}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Percentage: <span className="font-semibold">{analytics.consecutivePatterns.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Digit Ending Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Top Digit Endings
              </h3>
              <div className="flex flex-wrap gap-2">
                {analytics.digitEndingDistribution.slice(0, 5).map((item) => (
                  <div
                    key={item.ending}
                    className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-1 text-xs"
                    title={`${item.count} occurrences (${item.percentage.toFixed(1)}%)`}
                  >
                    ...{item.ending} ({item.percentage.toFixed(1)}%)
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

