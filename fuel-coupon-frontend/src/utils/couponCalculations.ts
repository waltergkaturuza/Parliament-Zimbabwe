// src/utils/couponCalculations.ts
// Shared utilities for coupon number calculations used by both Box Reception and Box Verification

export interface CouponRange {
  firstCouponId: string;
  lastCouponId: string;
  totalCoupons: number;
}

export interface BookInfo {
  bookId: string;
  firstCouponId: string;
  lastCouponId: string;
  numberOfCoupons: number;
}

/**
 * Calculate last coupon ID from first coupon ID and total coupons
 * Based on: lastNumber = firstNumber + totalCoupons - 1
 */
export const calculateLastCouponId = (firstCouponId: string, totalCoupons: number): string => {
  // Extract the numeric part from the coupon ID (e.g., PU00GH355101 -> 355101)
  const match = firstCouponId.match(/([A-Z]+)(\d+)$/);
  if (!match) return firstCouponId;

  const prefix = match[1];
  const firstNumber = parseInt(match[2]);
  const lastNumber = firstNumber + totalCoupons - 1;
  
  // Maintain the same number of digits as the original
  const numberLength = match[2].length;
  const lastCouponId = `${prefix}${lastNumber.toString().padStart(numberLength, '0')}`;
  
  return lastCouponId;
};

/**
 * Calculate coupon range for a given fuel type and amount
 */
export const calculateCouponRange = (fuelType: string, couponAmount: number, totalCoupons: number): CouponRange => {
  // Use the Parliament coupon numbering format
  let lastCouponNumber = 355100; // Starting from the range shown in examples
  
  // Generate coupon prefix based on fuel type and amount
  const prefix = fuelType === 'PETROL' 
    ? (couponAmount === 5 ? 'PU05GH' : couponAmount === 20 ? 'PU20GH' : 'PU50GH')
    : (couponAmount === 5 ? 'DU05GH' : couponAmount === 20 ? 'DU20GH' : 'DU50GH');
  
  const firstNumber = lastCouponNumber + 1;
  const lastNumber = firstNumber + totalCoupons - 1;
  
  const firstCouponId = `${prefix}${firstNumber.toString().padStart(6, '0')}`;
  const lastCouponId = `${prefix}${lastNumber.toString().padStart(6, '0')}`;
  
  return {
    firstCouponId,
    lastCouponId,
    totalCoupons
  };
};

/**
 * Generate books with coupon ranges based on different modes
 */
export const generateBooksFromMode = (
  mode: string,
  options: {
    numberOfBooks: number;
    couponsPerBook: number;
    firstCouponId?: string;
    lastCouponId?: string;
  }
): BookInfo[] => {
  const { numberOfBooks, couponsPerBook, firstCouponId, lastCouponId } = options;
  const books: BookInfo[] = [];
  
  switch (mode) {
    case 'books-and-coupons':
      if (!firstCouponId) return books;
      
      // Extract prefix and number from first coupon ID
      const match = firstCouponId.match(/^(.+?)(\d+)$/);
      if (!match) return books;
      
      const prefix = match[1];
      const startNumber = parseInt(match[2]);
      const numberLength = match[2].length;
      
      // Generate books
      for (let i = 0; i < numberOfBooks; i++) {
        const bookFirstNumber = startNumber + (i * couponsPerBook);
        const bookLastNumber = bookFirstNumber + couponsPerBook - 1;
        
        books.push({
          bookId: `Book-${i + 1}`,
          firstCouponId: `${prefix}${bookFirstNumber.toString().padStart(numberLength, '0')}`,
          lastCouponId: `${prefix}${bookLastNumber.toString().padStart(numberLength, '0')}`,
          numberOfCoupons: couponsPerBook
        });
      }
      break;
      
    case 'first-and-last':
      if (!firstCouponId || !lastCouponId) return books;
      
      // Extract numbers from both IDs
      const firstBoxMatch = firstCouponId.match(/^(.+?)(\d+)$/);
      const lastBoxMatch = lastCouponId.match(/^(.+?)(\d+)$/);
      
      if (!firstBoxMatch || !lastBoxMatch || firstBoxMatch[1] !== lastBoxMatch[1]) {
        return books;
      }
      
      const boxPrefix = firstBoxMatch[1];
      const firstBoxNumber = parseInt(firstBoxMatch[2]);
      const lastBoxNumber = parseInt(lastBoxMatch[2]);
      const boxNumberLength = Math.max(firstBoxMatch[2].length, lastBoxMatch[2].length);
      
      const totalBoxCoupons = lastBoxNumber - firstBoxNumber + 1;
      const actualBooksNeeded = Math.ceil(totalBoxCoupons / couponsPerBook);
      
      for (let i = 0; i < actualBooksNeeded; i++) {
        const bookFirstNumber = firstBoxNumber + (i * couponsPerBook);
        const bookLastNumber = Math.min(bookFirstNumber + couponsPerBook - 1, lastBoxNumber);
        
        books.push({
          bookId: `Book-${i + 1}`,
          firstCouponId: `${boxPrefix}${bookFirstNumber.toString().padStart(boxNumberLength, '0')}`,
          lastCouponId: `${boxPrefix}${bookLastNumber.toString().padStart(boxNumberLength, '0')}`,
          numberOfCoupons: bookLastNumber - bookFirstNumber + 1
        });
      }
      break;
      
    case 'full-range':
      // Auto-calculate optimal distribution
      if (!firstCouponId || !lastCouponId) return books;
      
      const fullFirstMatch = firstCouponId.match(/^(.+?)(\d+)$/);
      const fullLastMatch = lastCouponId.match(/^(.+?)(\d+)$/);
      
      if (!fullFirstMatch || !fullLastMatch || fullFirstMatch[1] !== fullLastMatch[1]) {
        return books;
      }
      
      const fullPrefix = fullFirstMatch[1];
      const fullFirstNumber = parseInt(fullFirstMatch[2]);
      const fullLastNumber = parseInt(fullLastMatch[2]);
      const fullNumberLength = Math.max(fullFirstMatch[2].length, fullLastMatch[2].length);
      
      const totalFullCoupons = fullLastNumber - fullFirstNumber + 1;
      const optimalCouponsPerBook = Math.ceil(totalFullCoupons / numberOfBooks);
      
      for (let i = 0; i < numberOfBooks; i++) {
        const bookFirstNumber = fullFirstNumber + (i * optimalCouponsPerBook);
        const bookLastNumber = Math.min(bookFirstNumber + optimalCouponsPerBook - 1, fullLastNumber);
        
        books.push({
          bookId: `Book-${i + 1}`,
          firstCouponId: `${fullPrefix}${bookFirstNumber.toString().padStart(fullNumberLength, '0')}`,
          lastCouponId: `${fullPrefix}${bookLastNumber.toString().padStart(fullNumberLength, '0')}`,
          numberOfCoupons: bookLastNumber - bookFirstNumber + 1
        });
        
        // Stop if we've reached the last coupon
        if (bookLastNumber >= fullLastNumber) break;
      }
      break;
  }
  
  return books;
};

/**
 * Calculate monetary values based on fuel type, amount, and coupons
 */
export const calculateMonetaryValues = (
  fuelType: string,
  couponAmount: number,
  totalCoupons: number,
  pricePerLitre: number
): {
  totalLitres: number;
  monetaryValueUSD: number;
  monetaryValueZWG: number;
} => {
  const totalLitres = totalCoupons * couponAmount;
  const monetaryValueUSD = totalLitres * pricePerLitre;
  const monetaryValueZWG = monetaryValueUSD * 25000; // Example exchange rate
  
  return {
    totalLitres,
    monetaryValueUSD,
    monetaryValueZWG
  };
};

/**
 * Validate coupon ID format
 */
export const validateCouponId = (couponId: string): boolean => {
  // Check if coupon ID matches expected format (e.g., PU05GH355101)
  const pattern = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{6}$/;
  return pattern.test(couponId);
};

/**
 * Extract coupon number from coupon ID
 */
export const extractCouponNumber = (couponId: string): number | null => {
  const match = couponId.match(/([A-Z]+)(\d+)$/);
  return match ? parseInt(match[2]) : null;
};