/**
 * TicketNo Generator
 * Format: WAC-YYYY-NNNNNN
 * Requirements: 2.2
 */

/**
 * Formats a ticket number from year and sequence
 * 
 * @param year - The year (4 digits)
 * @param sequence - The sequence number
 * @returns string - The formatted ticket number
 */
export function formatTicketNo(year: number, sequence: number): string {
  const paddedSeq = sequence.toString().padStart(6, '0');
  return `WAC-${year}-${paddedSeq}`;
}

/**
 * Validates that a ticket number matches the expected format
 * Format: WAC-YYYY-NNNNNN
 * 
 * @param ticketNo - The ticket number to validate
 * @returns boolean - true if valid format
 */
export function isValidTicketNoFormat(ticketNo: string): boolean {
  if (!ticketNo || typeof ticketNo !== 'string') {
    return false;
  }
  
  const pattern = /^WAC-\d{4}-\d{6}$/;
  return pattern.test(ticketNo);
}

/**
 * Extracts the year from a ticket number
 * 
 * @param ticketNo - The ticket number
 * @returns number | null - The year or null if invalid format
 */
export function extractYearFromTicketNo(ticketNo: string): number | null {
  if (!isValidTicketNoFormat(ticketNo)) {
    return null;
  }
  
  const yearStr = ticketNo.substring(4, 8);
  return parseInt(yearStr, 10);
}

/**
 * Extracts the sequence number from a ticket number
 * 
 * @param ticketNo - The ticket number
 * @returns number | null - The sequence number or null if invalid format
 */
export function extractSequenceFromTicketNo(ticketNo: string): number | null {
  if (!isValidTicketNoFormat(ticketNo)) {
    return null;
  }
  
  const seqStr = ticketNo.substring(9);
  return parseInt(seqStr, 10);
}
