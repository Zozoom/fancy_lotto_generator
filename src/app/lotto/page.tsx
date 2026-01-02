"use client";

import { useState, useEffect } from "react";
import Logo from "@/components/Logo";
import { formatDate, generateRandomNumbers } from "@/lib/utils";
import { useNumberSelection } from "@/hooks/useNumberSelection";
import { useHistory } from "@/hooks/useHistory";
import { getNumberColor } from "@/lib/numberColors";
import ConfirmModal from "@/components/ConfirmModal";

export default function LottoPage() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const { history, loadHistory, saveGeneration } = useHistory();
  const [isGenerating, setIsGenerating] = useState(false);
  const { selectedNumbers, setSelectedNumbers, toggleNumber, clearSelection: clearNumberSelection } = useNumberSelection(5);
  const [isPredicting, setIsPredicting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showClearModal, setShowClearModal] = useState(false);
  
  const itemsPerPage = 25;
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = history.slice(startIndex, endIndex);

  useEffect(() => {
    // Reset to first page if current page is out of bounds
    const newTotalPages = Math.ceil(history.length / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [history.length, currentPage, itemsPerPage]);

  const generateNumbers = () => {
    // Clear only generated numbers, keep manual inputs
    setNumbers([]);
    
    setIsGenerating(true);
    const newNumbers = generateRandomNumbers(5);
    
    setTimeout(() => {
      setNumbers(newNumbers);
      setIsGenerating(false);
      saveGeneration(newNumbers, selectedNumbers);
    }, 500);
  };

  const autoPredict = async () => {
    setIsPredicting(true);
    try {
      const response = await fetch("/api/predict");
      if (response.ok) {
        const data = await response.json();
        // Set selected numbers to predicted numbers
        setSelectedNumbers(data.numbers);
      }
    } catch (error) {
      console.error("Failed to predict numbers:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  const clearAll = () => {
    setNumbers([]);
    clearNumberSelection();
  };

  const clearDatabase = async () => {
    setShowClearModal(true);
  };

  const confirmClearDatabase = async () => {
    setShowClearModal(false);
    try {
      const response = await fetch("/api/clear", {
        method: "DELETE",
      });
      if (response.ok) {
        loadHistory();
        setNumbers([]);
        clearNumberSelection();
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Failed to clear database:", error);
    }
  };


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ml-0 md:ml-64">
      <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl w-full mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Generate random numbers from 1 to 99
              </p>
            </div>

            {/* Number Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select Your Numbers ({selectedNumbers.length}/5)
                  </p>
                </div>
                <button
                  onClick={autoPredict}
                  disabled={isPredicting || selectedNumbers.length === 5}
                  className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-full text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isPredicting ? "Predicting..." : "Auto Predict"}
                </button>
              </div>
              
              {/* Selected Numbers Display */}
              {selectedNumbers.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap mb-4">
                  {selectedNumbers.map((num) => (
                    <div
                      key={num}
                      className="w-12 h-12 rounded-full bg-indigo-500 dark:bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-md"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              )}

              {/* Number Grid */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-10 gap-2">
                  {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => {
                    const isSelected = selectedNumbers.includes(num);
                    const isDisabled = !isSelected && selectedNumbers.length >= 5;
                    return (
                      <button
                        key={num}
                        onClick={() => toggleNumber(num)}
                        disabled={isDisabled}
                        className={`
                          w-10 h-10 rounded-lg text-sm font-medium transition-all
                          ${
                            isSelected
                              ? "bg-indigo-500 dark:bg-indigo-600 text-white shadow-md scale-110"
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
            </div>

            {/* Generated Numbers Display */}
            <div className="space-y-2">
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Generated Numbers
                </p>
              </div>
              <div className="flex justify-center gap-3 flex-wrap">
                {numbers.length === 0 && !isGenerating ? (
                  <div className="text-slate-400 dark:text-slate-500 text-sm">
                    Click generate to create your numbers
                  </div>
                ) : isGenerating ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center"
                    />
                  ))
                ) : (
                  numbers.map((num, i) => (
                    <div
                      key={i}
                      className={`w-16 h-16 rounded-full ${getNumberColor(num, selectedNumbers)} text-white flex items-center justify-center text-xl font-semibold shadow-lg transform transition-all hover:scale-110 animate-fade-in`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                      }}
                    >
                      {num}
                    </div>
                  ))
                )}
              </div>
              {selectedNumbers.length > 0 && numbers.length > 0 && (
                <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mr-1"></span>
                  Match{" "}
                  <span className="inline-block w-3 h-3 rounded-full bg-red-700 mr-1 ml-3"></span>
                  Not matched
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={generateNumbers}
                disabled={isGenerating}
                className="px-8 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-full font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isGenerating ? "Generating..." : "Generate Numbers"}
              </button>
              {(numbers.length > 0 || selectedNumbers.length > 0) && (
                <button
                  onClick={clearAll}
                  className="px-6 py-3 bg-slate-400 dark:bg-slate-600 text-white rounded-full font-medium hover:bg-slate-500 dark:hover:bg-slate-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Clear
                </button>
              )}
            </div>

            {/* History Section */}
            {history.length > 0 && (
              <div className="mt-12 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-light text-slate-700 dark:text-slate-300">
                    Previous Generations
                  </h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, history.length)} of {history.length}
                  </div>
                </div>
                
                {/* Pagination - Top */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                          );
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && (
                                <span className="text-slate-500 dark:text-slate-400 px-2">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                                  currentPage === page
                                    ? "bg-slate-800 dark:bg-slate-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
                
                {/* Scrollable History Area */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {paginatedHistory.map((gen) => (
                    <div
                      key={gen.id}
                      className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border-2 border-slate-300 dark:border-slate-600"
                    >
                      {gen.predictedNumbers && gen.predictedNumbers.length > 0 && (
                        <div className="mb-3 pb-3 border-b-2 border-slate-300 dark:border-slate-600">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Predicted:
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {gen.predictedNumbers.map((num, i) => {
                              const isMatch = gen.numbers.includes(num);
                              return (
                                <span
                                  key={i}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-gradient-to-br from-green-500/50 to-emerald-600/50 dark:from-green-600/50 dark:to-emerald-700/50 text-white shadow-md border-2 border-dashed border-green-600 dark:border-green-500"
                                >
                                  {num}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {gen.numbers.map((num, i) => {
                            const isPredicted = gen.predictedNumbers?.includes(num);
                            return (
                              <span
                                key={i}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isPredicted
                                    ? "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white shadow-md"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {num}
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(gen.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Clear Database Modal */}
        <ConfirmModal
          isOpen={showClearModal}
          title="Clear All History"
          message={`Are you sure you want to clear all ${history.length} records? This action cannot be undone.`}
          confirmText="Clear All"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmClearDatabase}
          onCancel={() => setShowClearModal(false)}
        />
    </div>
  );
}

