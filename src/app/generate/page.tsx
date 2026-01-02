"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useSound } from "@/contexts/SoundContext";
import { Generation } from "@/types/generation";
import { generateRandomNumbers } from "@/lib/utils";
import { useHistory } from "@/hooks/useHistory";

export default function GeneratePage() {
  const router = useRouter();
  const { playWinSound, playLoseSound } = useSound();
  const { history, loadHistory, saveGeneration } = useHistory();
  const [numbers, setNumbers] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const generateNumbers = useCallback(() => {
    setIsGenerating(true);
    const newNumbers = generateRandomNumbers(5);
    
    setTimeout(() => {
      setNumbers(newNumbers);
      setIsGenerating(false);
      saveGeneration(newNumbers, selectedNumbers);
    }, 500);
  }, [saveGeneration, selectedNumbers]);

  useEffect(() => {
    // Get selected numbers from URL params
    const params = new URLSearchParams(window.location.search);
    const numbersParam = params.get("numbers");
    if (numbersParam) {
      const nums = numbersParam.split(",").map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 99);
      if (nums.length === 5) {
        setSelectedNumbers(nums);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    // Auto-generate when selected numbers are set
    if (selectedNumbers.length === 5 && numbers.length === 0 && !isGenerating) {
      generateNumbers();
    }
  }, [selectedNumbers, numbers.length, isGenerating, generateNumbers]);


  // Trigger confetti and sounds when numbers are generated
  useEffect(() => {
    if (numbers.length > 0 && selectedNumbers.length > 0) {
      const matches = numbers.filter(num => selectedNumbers.includes(num));
      
      const timer = setTimeout(() => {
        if (matches.length >= 1) {
          // Celebrate: Confetti over entire page
          const duration = 3000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

          function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
          }

          // Launch confetti from multiple points across the entire screen
          const positions = [
            { x: 0.1, y: 0.1 },
            { x: 0.3, y: 0.2 },
            { x: 0.5, y: 0.1 },
            { x: 0.7, y: 0.2 },
            { x: 0.9, y: 0.1 },
            { x: 0.2, y: 0.5 },
            { x: 0.5, y: 0.5 },
            { x: 0.8, y: 0.5 },
          ];

          const interval: NodeJS.Timeout = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            // Launch from multiple positions
            positions.forEach(pos => {
              confetti({
                ...defaults,
                particleCount: Math.floor(particleCount / positions.length),
                origin: { x: pos.x, y: pos.y },
                colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5']
              });
            });
          }, 250);

          // Play win sound
          playWinSound();
        } else {
          // Play lose sound for no matches
          playLoseSound();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [numbers, selectedNumbers, playWinSound, playLoseSound]);

  // Calculate statistics
  const calculateStats = () => {
    const predictionsWithResults = history.filter(gen => gen.predictedNumbers && gen.predictedNumbers.length > 0);
    
    if (predictionsWithResults.length === 0) {
      return {
        totalPredictions: 0,
        totalMatches: 0,
        totalMisses: 0,
        averageMatches: 0,
        accuracy: 0,
        perfectMatches: 0,
        zeroMatches: 0
      };
    }

    let totalMatches = 0;
    let perfectMatches = 0;
    let zeroMatches = 0;

    predictionsWithResults.forEach(gen => {
      const matches = gen.predictedNumbers!.filter(num => gen.numbers.includes(num)).length;
      totalMatches += matches;
      if (matches === 5) perfectMatches++;
      if (matches === 0) zeroMatches++;
    });

    const totalPredictions = predictionsWithResults.length;
    const averageMatches = totalMatches / totalPredictions;
    const accuracy = (averageMatches / 5) * 100; // Percentage of numbers matched on average
    const totalMisses = (totalPredictions * 5) - totalMatches;

    return {
      totalPredictions,
      totalMatches,
      totalMisses,
      averageMatches: Number(averageMatches.toFixed(2)),
      accuracy: Number(accuracy.toFixed(2)),
      perfectMatches,
      zeroMatches
    };
  };

  const stats = calculateStats();

  const getNumberColor = (num: number): string => {
    if (selectedNumbers.length === 0) {
      return "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700";
    }
    
    const isMatched = selectedNumbers.includes(num);
    
    if (isMatched) {
      return "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700";
    } else {
      return "bg-gradient-to-br from-red-700 to-red-800 dark:from-red-800 dark:to-red-900";
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ml-0 md:ml-64">
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
          <div className="max-w-2xl w-full mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            {/* Header */}
            <div className="text-center space-y-1 sm:space-y-2">
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                Generated Numbers
              </p>
              <button
                onClick={() => router.push("/play")}
                className="mt-2 sm:mt-3 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full font-semibold text-xs sm:text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                New Play
              </button>
            </div>

            {/* Your Selected Numbers */}
            {selectedNumbers.length > 0 && (
              <div className="space-y-1 sm:space-y-2">
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Your Numbers
                  </p>
                </div>
                <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                  {selectedNumbers.map((num, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-500/50 to-emerald-600/50 dark:from-green-600/50 dark:to-emerald-700/50 text-white flex items-center justify-center text-xs sm:text-sm font-semibold shadow-md border-2 border-dashed border-green-600 dark:border-green-500"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Numbers Display */}
            <div className="space-y-1 sm:space-y-2">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Generated Numbers
                </p>
              </div>
              <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                {numbers.length === 0 && !isGenerating ? (
                  <div className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                    Generating numbers...
                  </div>
                ) : isGenerating ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center"
                    />
                  ))
                ) : (
                  numbers.map((num, i) => (
                    <div
                      key={i}
                      className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full ${getNumberColor(num)} text-white flex items-center justify-center text-base sm:text-lg md:text-xl font-semibold shadow-lg transform transition-all hover:scale-110 animate-fade-in`}
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
                <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-2">
                  <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mr-1"></span>
                  Match{" "}
                  <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-700 mr-1 ml-2 sm:ml-3"></span>
                  Not matched
                </div>
              )}
            </div>

            {/* Prediction Statistics */}
            {stats.totalPredictions > 0 && (
              <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-12 space-y-4">
                <h2 className="text-base sm:text-lg md:text-xl font-light text-slate-700 dark:text-slate-300 text-center">
                  Prediction Statistics
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Total Predictions */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total Predictions</p>
                        <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1">
                          {stats.totalPredictions}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Accuracy */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Accuracy</p>
                        <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1">
                          {stats.accuracy}%
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Total Matches */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total Matches</p>
                        <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">
                          {stats.totalMatches}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Avg: {stats.averageMatches} per prediction
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Total Misses */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total Misses</p>
                        <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
                          {stats.totalMisses}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Perfect Matches */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Perfect Matches</p>
                        <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                          {stats.perfectMatches}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {stats.totalPredictions > 0 ? ((stats.perfectMatches / stats.totalPredictions) * 100).toFixed(1) : 0}% of predictions
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Zero Matches */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Zero Matches</p>
                        <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400 mt-1">
                          {stats.zeroMatches}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {stats.totalPredictions > 0 ? ((stats.zeroMatches / stats.totalPredictions) * 100).toFixed(1) : 0}% of predictions
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

