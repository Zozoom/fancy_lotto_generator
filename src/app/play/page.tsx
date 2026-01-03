"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNumberSelection } from "@/hooks/useNumberSelection";

export default function PlayPage() {
  const { selectedNumbers, setSelectedNumbers, toggleNumber, clearSelection } = useNumberSelection(5);
  const [isPredictingHistory, setIsPredictingHistory] = useState(false);
  const [isPredictingAnalytics, setIsPredictingAnalytics] = useState(false);
  const router = useRouter();

  const predictFromHistory = async () => {
    setIsPredictingHistory(true);
    try {
      // Add timestamp to cache-bust and ensure fresh prediction
      const response = await fetch(`/api/predict?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedNumbers(data.numbers);
      }
    } catch (error) {
      console.error("Failed to predict numbers:", error);
    } finally {
      setIsPredictingHistory(false);
    }
  };

  const predictFromAnalytics = async () => {
    setIsPredictingAnalytics(true);
    try {
      const response = await fetch(`/api/predict-analytics?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedNumbers(data.numbers);
      }
    } catch (error) {
      console.error("Failed to predict from analytics:", error);
    } finally {
      setIsPredictingAnalytics(false);
    }
  };

  const handleGenerate = () => {
    if (selectedNumbers.length === 5) {
      // Pass selected numbers as URL params
      const params = new URLSearchParams();
      params.set("numbers", selectedNumbers.join(","));
      router.push(`/generate?${params.toString()}`);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ml-0 md:ml-64">
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
        <div className="max-w-4xl w-full mx-auto space-y-3 sm:space-y-4 md:space-y-6">
          {/* Header */}
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-slate-800 dark:text-slate-100">
              Select Your Numbers
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              Choose 5 numbers from 1 to 90
            </p>
          </div>

          {/* Number Selection Section */}
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3 md:mb-4">
              <div className="text-center sm:text-left flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Selected Numbers ({selectedNumbers.length}/5)
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {selectedNumbers.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-400 dark:bg-slate-600 text-white rounded-full text-xs sm:text-sm font-medium hover:bg-slate-500 dark:hover:bg-slate-500 transition-all shadow-md hover:shadow-lg"
                  >
                    Clear
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={predictFromHistory}
                    disabled={isPredictingHistory || isPredictingAnalytics}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-full text-xs sm:text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-1.5"
                    title="Predict based on historical patterns and behavioral analysis"
                  >
                    {isPredictingHistory ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Predicting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Predict (History)</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={predictFromAnalytics}
                    disabled={isPredictingHistory || isPredictingAnalytics}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-full text-xs sm:text-sm font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-1.5"
                    title="Predict based on analytics (hot numbers, trends, patterns)"
                  >
                    {isPredictingAnalytics ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Predicting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Predict (Analytics)</span>
                      </>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={selectedNumbers.length !== 5}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full text-xs sm:text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Play
                </button>
              </div>
            </div>
            
            {/* Number Selection Box */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 sm:p-3 border-2 border-slate-300 dark:border-slate-600 shadow-lg">
              {/* Number Grid */}
              <div className="p-1 sm:p-2 md:p-3">
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-0.5 sm:gap-1 md:gap-1.5">
                {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
                  const isSelected = selectedNumbers.includes(num);
                  const isDisabled = !isSelected && selectedNumbers.length >= 5;
                  return (
                    <button
                      key={num}
                      onClick={() => toggleNumber(num)}
                      disabled={isDisabled}
                      className={`
                        w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full text-xs sm:text-sm md:text-base font-medium transition-all flex items-center justify-center
                        ${
                          isSelected
                            ? "bg-green-500 dark:bg-green-600 text-white shadow-md scale-110"
                            : isDisabled
                            ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105"
                        }
                      `}
                    >
                      {num}
                    </button>
                  );
                })}
                </div>
              </div>

              {/* Selected Numbers Display */}
              {selectedNumbers.length > 0 && (
                <div className="flex justify-center gap-2 sm:gap-3 flex-wrap mt-2 sm:mt-2 md:mt-3 pt-2 sm:pt-2 md:pt-3 border-t-2 border-slate-300 dark:border-slate-600">
                  {selectedNumbers.map((num) => (
                    <div
                      key={num}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-500/50 to-emerald-600/50 dark:from-green-600/50 dark:to-emerald-700/50 text-white flex items-center justify-center text-base sm:text-lg md:text-xl font-semibold shadow-lg border-2 border-dashed border-green-600 dark:border-green-500"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

