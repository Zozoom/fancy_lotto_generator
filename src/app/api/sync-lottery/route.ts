import { NextRequest, NextResponse } from "next/server";
import { readGenerations, writeGenerations } from "@/lib/generations";
import { Generation } from "@/types/generation";
import { convertDateToISO } from "@/lib/utils";
import { calculateManipulationScore } from "@/lib/manipulationDetection";
import { logger } from "@/lib/logger";

interface LotteryDraw {
  date: string;
  numbers: number[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get("days") || "7", 10);
  const url = searchParams.get("url") || "https://bet.szerencsejatek.hu/cmsfiles/otos.html";
  
  // Calculate the cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  try {
    
    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      // Add cache control to get fresh data
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Check if the page is blocked/restricted
    if (html.includes("Kedves Látogató") || html.includes("korlátozva van az oldal elérése")) {
      return NextResponse.json(
        { error: "The website is blocking automated requests. Please try accessing the page manually or contact support." },
        { status: 403 }
      );
    }

    let drawDate = "";
    let numbers: number[] = [];

    // Extract draw date (Húzásdátum) - try multiple patterns
    const datePatterns = [
      /Húzásdátum[:\s]*(\d{4}\.\d{2}\.\d{2})/i,
      /Húzásdátum[:\s]*(\d{4}-\d{2}-\d{2})/i,
      /Húzásdátum[:\s]*(\d{4}\/\d{2}\/\d{2})/i,
      /(\d{4}\.\d{2}\.\d{2})/,
      /(\d{4}-\d{2}-\d{2})/,
    ];

    for (const pattern of datePatterns) {
      const match = html.match(pattern);
      if (match) {
        drawDate = match[1];
        break;
      }
    }

    // Extract numbers (Számok) - try multiple patterns
    // Pattern 1: Look for "Számok" followed by numbers
    const szamokPattern = /Számok[:\s]*([\d\s,;]+)/i;
    const szamokMatch = html.match(szamokPattern);
    
    if (szamokMatch) {
      const numbersStr = szamokMatch[1];
      const extracted = numbersStr
        .split(/[\s,;]+/)
        .map(n => parseInt(n.trim()))
        .filter(n => !isNaN(n) && n >= 1 && n <= 99)
        .slice(0, 5);
      
      if (extracted.length === 5) {
        numbers = extracted.sort((a, b) => a - b);
      }
    }

    // Pattern 2: Look for numbers in table cells (td tags)
    if (numbers.length === 0) {
      const tdPattern = /<td[^>]*>(\d{1,2})<\/td>/gi;
      const matches = Array.from(html.matchAll(tdPattern));
      const foundNumbers: number[] = [];
      
      for (const match of matches) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num >= 1 && num <= 99 && !foundNumbers.includes(num)) {
          foundNumbers.push(num);
          if (foundNumbers.length === 5) break;
        }
      }
      
      if (foundNumbers.length === 5) {
        numbers = foundNumbers.sort((a, b) => a - b);
      }
    }

    // Pattern 3: Look for numbers in div/span with class names that might indicate lottery numbers
    if (numbers.length === 0) {
      const classPattern = /<[^>]*class="[^"]*szam[^"]*"[^>]*>(\d{1,2})<\/[^>]*>/gi;
      const matches = Array.from(html.matchAll(classPattern));
      const foundNumbers: number[] = [];
      
      for (const match of matches) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num >= 1 && num <= 99 && !foundNumbers.includes(num)) {
          foundNumbers.push(num);
          if (foundNumbers.length === 5) break;
        }
      }
      
      if (foundNumbers.length === 5) {
        numbers = foundNumbers.sort((a, b) => a - b);
      }
    }

    // Pattern 4: Look for sequences of 5 numbers (1-99) near each other
    if (numbers.length === 0) {
      const sequencePattern = /\b([1-9]|[1-9][0-9])\b[\s,;]+([1-9]|[1-9][0-9])\b[\s,;]+([1-9]|[1-9][0-9])\b[\s,;]+([1-9]|[1-9][0-9])\b[\s,;]+([1-9]|[1-9][0-9])\b/;
      const match = html.match(sequencePattern);
      
      if (match) {
        const extracted = [
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3]),
          parseInt(match[4]),
          parseInt(match[5]),
        ].filter(n => n >= 1 && n <= 99);
        
        if (extracted.length === 5) {
          numbers = extracted.sort((a, b) => a - b);
        }
      }
    }

    // Parse table rows to extract ALL draws from the HTML table
    // The table has structure: Év | Hét | Húzásdátum | ... | Számok
    const tableRowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const tableRows = html.match(tableRowPattern) || [];
    
    logger.info(`[SYNC] Found ${tableRows.length} table rows to parse`);
    logger.info(`[SYNC] Cutoff date: ${cutoffDate.toISOString().split('T')[0]} (${days} days ago)`);
    
    // Extract draws from table rows
    const allDraws: LotteryDraw[] = [];
    
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      
      // Skip header row if it exists
      if (row.includes('<th') || row.includes('Év') || row.includes('Hét') || row.includes('Húzásdátum') || row.includes('Számok')) {
        logger.debug(`[SYNC] Skipping header row ${i}`);
        continue;
      }
      
      // Extract date from row (Húzásdátum column) - format: YYYY.MM.DD
      let rowDate = "";
      for (const pattern of datePatterns) {
        const match = row.match(pattern);
        if (match) {
          rowDate = match[1];
          break;
        }
      }
      
      if (!rowDate) {
        continue; // Skip rows without dates
      }
      
      // Extract numbers from "Számok" column
      // Numbers are space-separated in the last column: "17 28 36 70 82"
      let rowNumbers: number[] = [];
      
      // Pattern 1: Look for 5 space-separated numbers (most common in table)
      const numbersPattern1 = /(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})(?:\s|$|<\/td>|<\/tr>)/;
      const match1 = row.match(numbersPattern1);
      
      if (match1) {
        rowNumbers = [
          parseInt(match1[1]),
          parseInt(match1[2]),
          parseInt(match1[3]),
          parseInt(match1[4]),
          parseInt(match1[5]),
        ].filter(n => !isNaN(n) && n >= 1 && n <= 99);
      }
      
      // Pattern 2: Extract all numbers from table cells and take last 5
      if (rowNumbers.length !== 5) {
        const tdPattern = /<td[^>]*>([^<]+)<\/td>/gi;
        const tdMatches = Array.from(row.matchAll(tdPattern));
        const allNumbers: number[] = [];
        
        // Extract all numbers from all cells
        for (const match of tdMatches) {
          const cellContent = match[1].trim();
          // Try to parse numbers from this cell
          const cellNumbers = cellContent
            .split(/\s+/)
            .map(n => parseInt(n.trim()))
            .filter(n => !isNaN(n) && n >= 1 && n <= 99);
          allNumbers.push(...cellNumbers);
        }
        
        // Take the last 5 unique numbers (assuming they're in the last column)
        const uniqueNumbers = [...new Set(allNumbers)];
        if (uniqueNumbers.length >= 5) {
          rowNumbers = uniqueNumbers.slice(-5).sort((a, b) => a - b);
        }
      }
      
      // Pattern 3: Look for "Számok" text followed by numbers
      if (rowNumbers.length !== 5) {
        const szamokMatch = row.match(/Számok[:\s]*([\d\s]+)/i);
        if (szamokMatch) {
          const numbersStr = szamokMatch[1];
          const extracted = numbersStr
            .trim()
            .split(/\s+/)
            .map(n => parseInt(n.trim()))
            .filter(n => !isNaN(n) && n >= 1 && n <= 99);
          
          if (extracted.length === 5) {
            rowNumbers = extracted.sort((a, b) => a - b);
          }
        }
      }
      
      // If we have both date and 5 numbers, add as a draw
      if (rowDate && rowNumbers.length === 5) {
        try {
          // Convert date from YYYY.MM.DD to Date object
          const [year, month, day] = rowDate.split('.');
          const drawDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          // Only include if within the time range
          if (drawDateObj >= cutoffDate) {
            const exists = allDraws.some(d => d.date === rowDate);
            
            if (!exists) {
              allDraws.push({
                date: rowDate,
                numbers: rowNumbers,
              });
              logger.debug(`[SYNC] Extracted draw ${i}: ${rowDate} - Numbers: ${rowNumbers.join(', ')}`);
            } else {
              logger.debug(`[SYNC] Skipped duplicate date: ${rowDate}`);
            }
          } else {
            logger.debug(`[SYNC] Skipped draw ${i}: ${rowDate} (before cutoff date ${cutoffDate.toISOString().split('T')[0]})`);
          }
        } catch (error) {
          logger.warn(`[SYNC] Error parsing date for row ${i}: ${rowDate} - ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        if (rowDate) {
          logger.debug(`[SYNC] Row ${i} has date ${rowDate} but invalid numbers count: ${rowNumbers.length}`);
        }
      }
    }
    
    // Sort all draws by date (newest first)
    allDraws.sort((a, b) => {
      try {
        const dateA = new Date(a.date.replace(/\./g, '-')).getTime();
        const dateB = new Date(b.date.replace(/\./g, '-')).getTime();
        return dateB - dateA;
      } catch {
        return 0;
      }
    });
    
    logger.info(`[SYNC] Extracted ${allDraws.length} total draws from page (within ${days} days)`);
    
    if (allDraws.length === 0) {
      return NextResponse.json(
        { error: `Could not extract any draws from the page within the selected time range (${days} days). Found ${tableRows.length} table rows but none matched the criteria.` },
        { status: 404 }
      );
    }

    // Save draws to history
    const generations = await readGenerations();
    const initialCount = generations.length;
    let savedCount = 0;
    let skippedCount = 0;

    logger.info(`[SYNC] Starting to save draws. Current history has ${initialCount} records`);

    for (const draw of allDraws) {
      // Only save if we have valid numbers
      if (draw.numbers.length !== 5) {
        logger.warn(`[SYNC] Skipping draw with date ${draw.date} - invalid numbers count`);
        continue;
      }

      // Convert date to ISO format
      const isoDate = convertDateToISO(draw.date);

      // Check if this draw already exists (by date and numbers)
      const exists = generations.some(gen => {
        const genDate = new Date(gen.date).toISOString().split('T')[0];
        const drawDate = new Date(isoDate).toISOString().split('T')[0];
        return genDate === drawDate && 
               JSON.stringify(gen.numbers.sort()) === JSON.stringify(draw.numbers.sort());
      });

      if (!exists) {
        const newGeneration: Generation = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
          numbers: draw.numbers,
          date: isoDate,
          // Explicitly no predictedNumbers for synced data
        };
        
        // Calculate manipulation score based on existing generations + already synced ones
        const manipulationResult = calculateManipulationScore(newGeneration, generations);
        newGeneration.manipulationScore = {
          score: manipulationResult.score,
          confidence: manipulationResult.confidence,
          patterns: manipulationResult.patterns,
        };
        
        generations.unshift(newGeneration);
        savedCount++;
        logger.info(`[SYNC] Saved draw: ${draw.date} - Numbers: ${draw.numbers.join(', ')} - Manipulation Score: ${newGeneration.manipulationScore.score}%`);
      } else {
        skippedCount++;
        logger.debug(`[SYNC] Skipped duplicate: ${draw.date} - Numbers: ${draw.numbers.join(', ')}`);
      }
    }

    // No record limit - save all generations
    await writeGenerations(generations);
    
    const finalCount = generations.length;
    logger.info(`[SYNC] Completed. Saved ${savedCount} new records, skipped ${skippedCount} duplicates. Total records: ${finalCount} (was ${initialCount})`);

    return NextResponse.json({
      success: true,
      draws: allDraws,
      count: allDraws.length,
      saved: savedCount,
      skipped: skippedCount,
      totalRecords: generations.length,
      previousRecords: initialCount,
    });
  } catch (error) {
    logger.error(`[SYNC] Error syncing lottery data: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to sync lottery data",
        details: "The website might be blocking automated requests or the page structure may have changed."
      },
      { status: 500 }
    );
  }
}

