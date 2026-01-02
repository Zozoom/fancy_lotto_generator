"use client";

import { useState, useEffect, useRef } from "react";
import { Generation } from "@/types/generation";
import { formatDate } from "@/lib/utils";
import { useHistory } from "@/hooks/useHistory";
import ConfirmModal from "@/components/ConfirmModal";

export default function HistoryPage() {
  const { history, isLoading, loadHistory, setHistory } = useHistory();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "deleteSelected" | "deleteAll" | "deleteSingle" | null;
    data?: { count?: number; id?: string };
  }>({
    isOpen: false,
    type: null,
  });
  
  const itemsPerPage = 25;
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = history.slice(startIndex, endIndex);
  
  // Check if all items on current page are selected
  const allSelectedOnPage = paginatedHistory.length > 0 && 
    paginatedHistory.every(gen => selectedIds.has(gen.id));
  
  // Check if some items on current page are selected
  const someSelectedOnPage = paginatedHistory.some(gen => selectedIds.has(gen.id));

  useEffect(() => {
    const newTotalPages = Math.ceil(history.length / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [history.length, currentPage, itemsPerPage]);

  // Set indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelectedOnPage && !allSelectedOnPage;
    }
  }, [someSelectedOnPage, allSelectedOnPage]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (allSelectedOnPage) {
      // Deselect all on current page
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedHistory.forEach(gen => newSet.delete(gen.id));
        return newSet;
      });
    } else {
      // Select all on current page
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        paginatedHistory.forEach(gen => newSet.add(gen.id));
        return newSet;
      });
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    setModalState({
      isOpen: true,
      type: "deleteSelected",
      data: { count },
    });
  };

  const confirmDeleteSelected = async () => {
    if (!modalState.data?.count) return;
    
    setIsDeleting(true);
    setModalState({ isOpen: false, type: null });
    
    try {
      const idsArray = Array.from(selectedIds);
      const response = await fetch(`/api/delete?ids=${idsArray.join(",")}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setSelectedIds(new Set());
        await loadHistory();
        // Reset to page 1 if current page becomes empty
        const newTotalPages = Math.ceil((history.length - modalState.data.count) / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(1);
        }
      } else {
        setModalState({
          isOpen: true,
          type: "deleteSelected",
          data: { count: modalState.data.count },
        });
      }
    } catch (error) {
      console.error("Failed to delete records:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAll = () => {
    if (history.length === 0) return;
    
    setModalState({
      isOpen: true,
      type: "deleteAll",
      data: { count: history.length },
    });
  };

  const confirmDeleteAll = async () => {
    setIsDeleting(true);
    setModalState({ isOpen: false, type: null });
    
    try {
      const response = await fetch("/api/clear", {
        method: "DELETE",
      });
      
      if (response.ok) {
        setSelectedIds(new Set());
        setHistory([]);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Failed to delete all records:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteSingle = (id: string) => {
    setModalState({
      isOpen: true,
      type: "deleteSingle",
      data: { id },
    });
  };

  const confirmDeleteSingle = async () => {
    if (!modalState.data?.id) return;
    
    const id = modalState.data.id;
    setIsDeleting(true);
    setModalState({ isOpen: false, type: null });
    
    try {
      const response = await fetch(`/api/delete?ids=${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        await loadHistory();
        // Reset to page 1 if current page becomes empty
        const newTotalPages = Math.ceil((history.length - 1) / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(1);
        }
      }
    } catch (error) {
      console.error("Failed to delete record:", error);
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 ml-0 md:ml-64">
        <div className="max-w-4xl w-full mx-auto space-y-3 sm:space-y-4 md:space-y-6">
          {/* Header */}
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-slate-800 dark:text-slate-100">
              Generation History
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              View all your previously generated numbers
            </p>
          </div>

          {/* History Content */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border-2 border-slate-300 dark:border-slate-600">
                <svg
                  className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  No history yet
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  Start generating numbers to see them here
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Records</p>
                    <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                      {history.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Showing</p>
                    <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                      {startIndex + 1}-{Math.min(endIndex, history.length)} of {history.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pagination - Top */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                              className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${
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
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Select All Checkbox and Delete Button */}
              {paginatedHistory.length > 0 && (
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-slate-300 dark:border-slate-500">
                  <div className="flex items-center gap-3">
                    <input
                      ref={selectAllCheckboxRef}
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
                    />
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Select All ({selectedIds.size} selected)
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={deleteSelected}
                      disabled={isDeleting || selectedIds.size === 0}
                      className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg font-medium hover:bg-red-600 dark:hover:bg-red-700 transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
                    </button>
                    <button
                      onClick={deleteAll}
                      disabled={isDeleting || history.length === 0}
                      className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-800 transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? "Deleting..." : "Delete All"}
                    </button>
                  </div>
                </div>
              )}

              {/* History List */}
              <div className="space-y-3">
                {paginatedHistory.map((gen) => (
                  <div
                    key={gen.id}
                    className={`bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border ${
                      selectedIds.has(gen.id)
                        ? "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedIds.has(gen.id)}
                        onChange={() => toggleSelect(gen.id)}
                        className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500 focus:ring-2 cursor-pointer flex-shrink-0"
                      />
                      
                      {/* Content */}
                      <div className="flex-1">
                        {gen.predictedNumbers && gen.predictedNumbers.length > 0 && (
                          <div className="mb-3 pb-3 border-b-2 border-slate-300 dark:border-slate-600">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                              Your Selected Numbers:
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {gen.predictedNumbers.map((num, i) => {
                                const isMatch = gen.numbers.includes(num);
                                return (
                                  <span
                                    key={i}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-md border-2 border-dashed border-green-600 dark:border-green-500 ${
                                      isMatch
                                        ? "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white opacity-100"
                                        : "bg-gradient-to-br from-green-500/50 to-emerald-600/50 dark:from-green-600/50 dark:to-emerald-700/50 text-white opacity-50"
                                    }`}
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
                                  className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold ${
                                    isPredicted
                                      ? "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white shadow-md"
                                      : "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white shadow-md"
                                  }`}
                                >
                                  {num}
                                </span>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Manipulation Score Display */}
                            {gen.manipulationScore && (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2 group relative">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Manipulation:
                                  </span>
                                  <div
                                    className={`px-2 py-1 rounded text-xs font-semibold cursor-help ${
                                      gen.manipulationScore.score >= 70
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                        : gen.manipulationScore.score >= 40
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    }`}
                                  >
                                    {gen.manipulationScore.score}%
                                  </div>
                                  {gen.manipulationScore.patterns.length > 0 && (
                                    <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none z-20 transition-opacity duration-200">
                                      <div className="font-semibold mb-2 text-yellow-400">Detected Patterns:</div>
                                      <ul className="list-disc list-inside space-y-1 mb-2">
                                        {gen.manipulationScore.patterns.map((pattern, idx) => (
                                          <li key={idx} className="text-slate-200">{pattern}</li>
                                        ))}
                                      </ul>
                                      <div className="pt-2 border-t border-slate-600 text-slate-300">
                                        <div>Confidence: <span className="font-semibold">{gen.manipulationScore.confidence}%</span></div>
                                        <div className="text-xs mt-1 text-slate-400">
                                          Higher score = more likely manipulated
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(gen.date)}
                            </span>
                            <button
                              onClick={() => deleteSingle(gen.id)}
                              disabled={isDeleting}
                              className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete this record"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination - Bottom */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                              className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${
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
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={
          modalState.type === "deleteAll"
            ? "Delete All Records"
            : modalState.type === "deleteSelected"
            ? "Delete Selected Records"
            : "Delete Record"
        }
        message={
          modalState.type === "deleteAll"
            ? `Are you sure you want to delete ALL ${modalState.data?.count || 0} records? This action cannot be undone.`
            : modalState.type === "deleteSelected"
            ? `Are you sure you want to delete ${modalState.data?.count || 0} record${(modalState.data?.count || 0) !== 1 ? 's' : ''}? This action cannot be undone.`
            : "Are you sure you want to delete this record? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={() => {
          if (modalState.type === "deleteAll") {
            confirmDeleteAll();
          } else if (modalState.type === "deleteSelected") {
            confirmDeleteSelected();
          } else if (modalState.type === "deleteSingle") {
            confirmDeleteSingle();
          }
        }}
        onCancel={() => setModalState({ isOpen: false, type: null })}
      />
    </div>
  );
}

