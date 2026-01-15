/**
 * Format a grade for display.
 * Handles various input formats:
 * - "3" -> "3rd Grade"
 * - "3rd Grade" -> "3rd Grade"
 * - "K" -> "Kindergarten"
 * - "Kindergarten" -> "Kindergarten"
 */
export function formatGrade(grade: string): string {
  if (!grade) return '';

  // Already contains "Grade" - return as is
  if (grade.toLowerCase().includes('grade')) {
    return grade;
  }

  // Handle kindergarten
  if (grade.toLowerCase() === 'k' || grade.toLowerCase() === 'kindergarten') {
    return 'Kindergarten';
  }

  // Handle numeric grades
  const num = parseInt(grade, 10);
  if (!isNaN(num)) {
    const suffix = getOrdinalSuffix(num);
    return `${num}${suffix} Grade`;
  }

  // Return as-is if we can't parse it
  return grade;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
