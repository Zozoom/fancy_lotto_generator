"use client";

import { useState, useEffect } from "react";
import { Generation } from "@/types/generation";
import { getCurrentISODate } from "@/lib/utils";
import { useHistory } from "@/hooks/useHistory";

interface LotteryDraw {
  date: string;
  numbers: number[];
}

type TimeRange = {
  value: number; // in days
  label: string;
};

const timeRangeOptions: TimeRange[] = [
  { value: 7, label: "1 Week" },
  { value: 14, label: "2 Weeks" },
  { value: 30, label: "1 Month" },
  { value: 60, label: "2 Months" },
  { value: 90, label: "3 Months" },
  { value: 180, label: "6 Months" },
  { value: 365, label: "1 Year" },
  { value: 730, label: "2 Years" },
  { value: 1095, label: "3 Years" },
  { value: 1825, label: "5 Years" },
  { value: 3650, label: "10 Years" },
  { value: 5475, label: "15 Years" },
  { value: 7300, label: "20 Years" },
  { value: 9125, label: "25 Years" },
  { value: 10950, label: "30 Years" },
  { value: 12775, label: "35 Years" },
  { value: 14600, label: "40 Years" },
  { value: 16425, label: "45 Years" },
  { value: 18250, label: "50 Years" },
  { value: 18615, label: "51 Years" },
];

export default function SettingsPage() {
  const { history, loadHistory } = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [lotteryDraws, setLotteryDraws] = useState<LotteryDraw[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<number>(180); // Default to 6 months
  const [syncUrl, setSyncUrl] = useState<string>("https://bet.szerencsejatek.hu/cmsfiles/otos.html");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const exportHistory = () => {
    try {
      const dataStr = JSON.stringify(history, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lottery-history-${getCurrentISODate().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setImportStatus({ type: "success", message: "History exported successfully!" });
      setTimeout(() => setImportStatus({ type: null, message: "" }), 3000);
    } catch (error) {
      console.error("Failed to export history:", error);
      setImportStatus({ type: "error", message: "Failed to export history" });
      setTimeout(() => setImportStatus({ type: null, message: "" }), 3000);
    }
  };

  const syncLottery = async () => {
    setIsSyncing(true);
    setImportStatus({ type: null, message: "" });

    try {
      const response = await fetch(`/api/sync-lottery?days=${selectedTimeRange}&url=${encodeURIComponent(syncUrl)}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setLotteryDraws(data.draws || []);
        const count = data.draws?.length || 0;
        const saved = data.saved || 0;
        const skipped = data.skipped || 0;
        const totalRecords = data.totalRecords || 0;
        const previousRecords = data.previousRecords || 0;
        
        let message = `Synced ${count} lottery draw${count !== 1 ? 's' : ''}`;
        if (saved > 0) {
          message += ` - ${saved} new record${saved !== 1 ? 's' : ''} saved`;
        }
        if (skipped > 0) {
          message += `, ${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped`;
        }
        message += `. Total records: ${totalRecords} (was ${previousRecords})`;
        
        console.log(`[SYNC] ${message}`);
        
        setImportStatus({ 
          type: "success", 
          message: message
        });
        
        // Reload history to show new records
        await loadHistory();
        
        setTimeout(() => setImportStatus({ type: null, message: "" }), 5000);
      } else {
        throw new Error(data.error || "Failed to sync lottery data");
      }
    } catch (error) {
      console.error("Failed to sync lottery:", error);
      setImportStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to sync lottery data. The website might be blocking requests.",
      });
      setTimeout(() => setImportStatus({ type: null, message: "" }), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setImportStatus({ type: null, message: "" });

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validate the imported data
      if (!Array.isArray(importedData)) {
        throw new Error("Invalid format: Expected an array");
      }

      // Validate each generation object
      for (const gen of importedData) {
        if (!gen.id || !gen.numbers || !gen.date) {
          throw new Error("Invalid format: Missing required fields");
        }
        if (!Array.isArray(gen.numbers) || gen.numbers.length !== 5) {
          throw new Error("Invalid format: Numbers must be an array of 5 numbers");
        }
      }

      // Import the data
      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importedData),
      });

      if (response.ok) {
        setImportStatus({ type: "success", message: `Successfully imported ${importedData.length} records!` });
        await loadHistory();
        setTimeout(() => setImportStatus({ type: null, message: "" }), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import history");
      }
    } catch (error) {
      console.error("Failed to import history:", error);
      setImportStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to import history",
      });
      setTimeout(() => setImportStatus({ type: null, message: "" }), 5000);
    } finally {
      setIsLoading(false);
      // Reset the file input
      event.target.value = "";
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 ml-0 md:ml-64">
        <div className="max-w-2xl w-full mx-auto space-y-4 sm:space-y-6 md:space-y-8">
          {/* Header */}
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-slate-800 dark:text-slate-100">
              Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              Manage your lottery history data
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 border-2 border-slate-300 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Records</p>
                <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1">
                  {history.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Lottery Sync Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 border-2 border-slate-300 dark:border-slate-600">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Sync Lottery Results
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Sync draw dates and winning numbers from a lottery website.
                </p>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Lottery URL
                </label>
                <input
                  type="url"
                  value={syncUrl}
                  onChange={(e) => setSyncUrl(e.target.value)}
                  disabled={isSyncing}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  placeholder="https://bet.szerencsejatek.hu/cmsfiles/otos.html"
                />
              </div>

              {/* Time Range Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sync Period
                </label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isSyncing}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                >
                  <span>{timeRangeOptions.find(opt => opt.value === selectedTimeRange)?.label || "Select period"}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    ></div>
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 rounded-lg shadow-lg max-h-[288px] overflow-y-auto" style={{ maxHeight: 'calc(2.5rem * 8)' }}>
                      {timeRangeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedTimeRange(option.value);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${
                            selectedTimeRange === option.value
                              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={syncLottery}
                disabled={isSyncing}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Sync Lottery Data</span>
                  </>
                )}
              </button>

              {/* Display Synced Data */}
              {lotteryDraws.length > 0 && (
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                  {lotteryDraws.map((draw, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-slate-300 dark:border-slate-500"
                    >
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Húzásdátum (Draw Date)</p>
                          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                            {draw.date}
                          </p>
                        </div>
                        {draw.numbers.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Számok (Numbers)</p>
                            <div className="flex gap-2 flex-wrap">
                              {draw.numbers.map((num, i) => (
                                <div
                                  key={i}
                                  className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white flex items-center justify-center text-base font-semibold shadow-md"
                                >
                                  {num}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export & Import Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 border-2 border-slate-300 dark:border-slate-600">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Export & Import History
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Export your lottery history as a JSON file or import history from a previously exported file.
                </p>
              </div>

              {/* Export Button */}
              <button
                onClick={exportHistory}
                disabled={history.length === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export History ({history.length} records)
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-slate-400 dark:border-slate-500"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">Or</span>
                </div>
              </div>

              {/* Import Section */}
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  ⚠️ Warning: Importing will replace all existing history. Make sure to export your current data first if you want to keep it.
                </p>
                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={isLoading}
                    className="hidden"
                    id="import-file"
                  />
                  <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-dashed border-slate-400 dark:border-slate-500">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600 dark:border-slate-300"></div>
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Choose JSON File to Import</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {importStatus.type && (
            <div
              className={`p-4 rounded-lg border ${
                importStatus.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {importStatus.type === "success" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <p className="text-sm font-medium">{importStatus.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

