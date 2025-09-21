// src/utils/petrotradeSerials.ts
/**
 * PetroTrade Serial Number Utilities
 * Handles the complex PetroTrade serial format: PU006H1355101
 */

export interface SerialInfo {
  prefix: string;
  seven_digit_serial: number;
  is_valid: boolean;
  formatted: string;
}

export interface BookRange {
  book_number: number;
  first_coupon: string;
  last_coupon: string;
  coupon_count: number;
}

/**
 * Parse a PetroTrade serial number
 */
export const parseSerial = (serial: string): SerialInfo => {
  if (!serial) {
    return {
      prefix: '',
      seven_digit_serial: 0,
      is_valid: false,
      formatted: ''
    };
  }

  // PetroTrade format: PU006H1355101
  // Pattern: [Letters][6-7 digits][Letter][7 digits]
  const match = serial.match(/^([A-Z]+)(\d{6,7})([A-Z])(\d{7})$/);
  
  if (!match) {
    return {
      prefix: '',
      seven_digit_serial: 0,
      is_valid: false,
      formatted: serial
    };
  }

  const [, prefixPart, sixDigit, letterPart, sevenDigit] = match;
  const prefix = `${prefixPart}${sixDigit}${letterPart}`;
  const sevenDigitSerial = parseInt(sevenDigit);

  return {
    prefix,
    seven_digit_serial: sevenDigitSerial,
    is_valid: true,
    formatted: serial.toUpperCase()
  };
};

/**
 * Validate a PetroTrade serial number
 */
export const validateSerial = (serial: string): boolean => {
  const parsed = parseSerial(serial);
  return parsed.is_valid;
};

/**
 * Format a serial number from components
 */
export const formatSerial = (prefix: string, sevenDigitSerial: number): string => {
  return `${prefix}${sevenDigitSerial.toString().padStart(7, '0')}`;
};

/**
 * Increment a serial number by 1
 */
export const incrementSerial = (serial: string): string => {
  const parsed = parseSerial(serial);
  if (!parsed.is_valid) {
    throw new Error(`Invalid serial format: ${serial}`);
  }

  // Handle overflow (9999999 -> next letter)
  let newSevenDigit = parsed.seven_digit_serial + 1;
  let newPrefix = parsed.prefix;

  if (newSevenDigit > 9999999) {
    // Need to increment the letter part
    const prefixMatch = newPrefix.match(/^(.+)([A-Z])$/);
    if (prefixMatch) {
      const [, basePart, letter] = prefixMatch;
      const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
      if (nextLetter <= 'Z') {
        newPrefix = `${basePart}${nextLetter}`;
        newSevenDigit = 1;
      } else {
        throw new Error(`Serial overflow: cannot increment beyond Z`);
      }
    } else {
      throw new Error(`Cannot parse prefix for overflow: ${newPrefix}`);
    }
  }

  return formatSerial(newPrefix, newSevenDigit);
};

/**
 * Generate a range of serial numbers
 */
export const generateRange = (firstSerial: string, lastSerial: string): string[] => {
  const firstParsed = parseSerial(firstSerial);
  const lastParsed = parseSerial(lastSerial);

  if (!firstParsed.is_valid || !lastParsed.is_valid) {
    throw new Error('Invalid serial format in range');
  }

  if (firstParsed.prefix !== lastParsed.prefix) {
    throw new Error('Serial range spans different prefixes');
  }

  if (firstParsed.seven_digit_serial > lastParsed.seven_digit_serial) {
    throw new Error('First serial must be less than or equal to last serial');
  }

  const serials: string[] = [];
  let current = firstParsed.seven_digit_serial;
  
  while (current <= lastParsed.seven_digit_serial) {
    serials.push(formatSerial(firstParsed.prefix, current));
    current++;
  }

  return serials;
};

/**
 * Calculate book ranges from a serial range
 */
export const calculateBookRanges = (
  firstSerial: string,
  lastSerial: string,
  booksPerBatch: number = 10,
  couponsPerBook: number = 100
): BookRange[] => {
  const serials = generateRange(firstSerial, lastSerial);
  const totalCoupons = serials.length;
  
  if (totalCoupons !== booksPerBatch * couponsPerBook) {
    throw new Error(
      `Serial range contains ${totalCoupons} coupons, but expected ${booksPerBatch * couponsPerBook}`
    );
  }

  const books: BookRange[] = [];
  
  for (let bookIndex = 0; bookIndex < booksPerBatch; bookIndex++) {
    const startIndex = bookIndex * couponsPerBook;
    const endIndex = startIndex + couponsPerBook - 1;
    
    if (endIndex >= serials.length) {
      break;
    }

    books.push({
      book_number: bookIndex + 1,
      first_coupon: serials[startIndex],
      last_coupon: serials[endIndex],
      coupon_count: couponsPerBook
    });
  }

  return books;
};

/**
 * Validate continuity between book ranges
 */
export const validateContinuity = (books: BookRange[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (let i = 0; i < books.length - 1; i++) {
    const currentBook = books[i];
    const nextBook = books[i + 1];

    try {
      const expectedNext = incrementSerial(currentBook.last_coupon);
      if (expectedNext !== nextBook.first_coupon) {
        errors.push(
          `Gap between Book ${currentBook.book_number} and ${nextBook.book_number}: ` +
          `expected ${expectedNext}, got ${nextBook.first_coupon}`
        );
      }
    } catch (error) {
      errors.push(`Error checking continuity: ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  parseSerial,
  validateSerial,
  formatSerial,
  incrementSerial,
  generateRange,
  calculateBookRanges,
  validateContinuity
};
