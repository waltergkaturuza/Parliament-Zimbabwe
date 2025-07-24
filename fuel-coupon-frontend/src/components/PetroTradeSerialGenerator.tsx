import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">Book {book.book_number.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="font-mono text-sm">
                      {book.first_serial} - {book.last_serial}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {book.coupon_count} coupons
                    </div>
                  </div>
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Calculator, BookOpen, Fuel, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import petrotradeApi, { PetroTradeBoxRequest } from '@/api/petrotrade';

interface SerialInfo {
  prefix: string;
  number: number;
  isValid: boolean;
  formatted: string;
}

interface BookRange {
  bookNumber: number;
  firstSerial: string;
  lastSerial: string;
  couponCount: number;
}

export default function PetroTradeSerialGenerator() {
  const [firstSerial, setFirstSerial] = useState('PU006H355101');
  const [lastSerial, setLastSerial] = useState('PU006H355200');
  const [fuelType, setFuelType] = useState('DIESEL');
  const [denomination, setDenomination] = useState(20);
  const [couponsPerBook, setCouponsPerBook] = useState(100);
  
  const [firstSerialInfo, setFirstSerialInfo] = useState<SerialInfo | null>(null);
  const [lastSerialInfo, setLastSerialInfo] = useState<SerialInfo | null>(null);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalLitres, setTotalLitres] = useState(0);
  const [bookRanges, setBookRanges] = useState<BookRange[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // PetroTrade serial format validation using API utility
  const parseSerial = (serial: string): SerialInfo | null => {
    const validation = petrotradeApi.validateSerial(serial);
    return {
      prefix: validation.prefix,
      number: validation.number,
      isValid: validation.is_valid,
      formatted: validation.formatted
    };
  };

  const formatSerial = (prefix: string, number: number): string => {
    return `${prefix}${number.toString().padStart(6, '0')}`;
  };

  const generateBookRanges = (firstInfo: SerialInfo, lastInfo: SerialInfo): BookRange[] => {
    if (!firstInfo.isValid || !lastInfo.isValid) return [];
    
    try {
      return petrotradeApi.splitIntoBooks(
        firstInfo.formatted,
        lastInfo.formatted,
        couponsPerBook
      );
    } catch (error) {
      console.error('Error generating book ranges:', error);
      return [];
    }
  };

  useEffect(() => {
    const firstInfo = parseSerial(firstSerial);
    const lastInfo = parseSerial(lastSerial);
    
    setFirstSerialInfo(firstInfo);
    setLastSerialInfo(lastInfo);
    
    if (firstInfo?.isValid && lastInfo?.isValid && 
        firstInfo.prefix === lastInfo.prefix && 
        firstInfo.number <= lastInfo.number) {
      
      const total = lastInfo.number - firstInfo.number + 1;
      const books = Math.ceil(total / couponsPerBook);
      const litres = total * denomination;
      const ranges = generateBookRanges(firstInfo, lastInfo);
      
      setTotalCoupons(total);
      setTotalBooks(books);
      setTotalLitres(litres);
      setBookRanges(ranges);
      setIsValid(true);
    } else {
      setTotalCoupons(0);
      setTotalBooks(0);
      setTotalLitres(0);
      setBookRanges([]);
      setIsValid(false);
    }
  }, [firstSerial, lastSerial, denomination, couponsPerBook]);

  const handleCreateBox = async () => {
    if (!isValid || isCreating) return;
    
    setIsCreating(true);
    
    const payload: PetroTradeBoxRequest = {
      first_coupon: firstSerial,
      last_coupon: lastSerial,
      fuel_type: fuelType as 'PETROL' | 'DIESEL',
      denomination: denomination,
      coupons_per_book: couponsPerBook,
      create_coupons: true
    };
    
    try {
      const response = await petrotradeApi.createBox(payload);
      
      toast({
        title: "Success!",
        description: `PetroTrade box created with ${response.box.total_books} books and ${response.box.coupons_created} coupons.`,
      });
      
      // Reset form or redirect
      console.log('PetroTrade box created:', response);
      
    } catch (error: any) {
      console.error('Error creating box:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Failed to create PetroTrade box. Please try again.';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const SerialValidationBadge = ({ info }: { info: SerialInfo | null }) => {
    if (!info) return null;
    
    return info.isValid ? (
      <Badge variant="default" className="ml-2">
        <CheckCircle className="w-3 h-3 mr-1" />
        Valid
      </Badge>
    ) : (
      <Badge variant="destructive" className="ml-2">
        <AlertCircle className="w-3 h-3 mr-1" />
        Invalid Format
      </Badge>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            PetroTrade Coupon Box Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Serial Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstSerial">First Coupon Serial</Label>
              <div className="flex items-center">
                <Input
                  id="firstSerial"
                  value={firstSerial}
                  onChange={(e) => setFirstSerial(e.target.value)}
                  placeholder="PU006H355101"
                  className="font-mono"
                />
                <SerialValidationBadge info={firstSerialInfo} />
              </div>
              {firstSerialInfo && (
                <p className="text-sm text-muted-foreground">
                  Prefix: <code>{firstSerialInfo.prefix}</code> | 
                  Number: <code>{firstSerialInfo.number.toLocaleString()}</code>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastSerial">Last Coupon Serial</Label>
              <div className="flex items-center">
                <Input
                  id="lastSerial"
                  value={lastSerial}
                  onChange={(e) => setLastSerial(e.target.value)}
                  placeholder="PU006H355200"
                  className="font-mono"
                />
                <SerialValidationBadge info={lastSerialInfo} />
              </div>
              {lastSerialInfo && (
                <p className="text-sm text-muted-foreground">
                  Prefix: <code>{lastSerialInfo.prefix}</code> | 
                  Number: <code>{lastSerialInfo.number.toLocaleString()}</code>
                </p>
              )}
            </div>
          </div>

          {/* Configuration Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PETROL">Petrol</SelectItem>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="denomination">Litres per Coupon</Label>
              <Select value={denomination.toString()} onValueChange={(value) => setDenomination(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Litres</SelectItem>
                  <SelectItem value="20">20 Litres</SelectItem>
                  <SelectItem value="50">50 Litres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="couponsPerBook">Coupons per Book</Label>
              <Input
                id="couponsPerBook"
                type="number"
                value={couponsPerBook}
                onChange={(e) => setCouponsPerBook(parseInt(e.target.value) || 100)}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <Separator />

          {/* Summary Section */}
          {isValid && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{totalCoupons.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Coupons</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{totalBooks}</p>
                      <p className="text-xs text-muted-foreground">Books</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{totalLitres.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Litres</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{denomination}L</p>
                      <p className="text-xs text-muted-foreground">Per Coupon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Book Breakdown */}
          {isValid && bookRanges.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Book Breakdown</h3>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {bookRanges.map((book) => (
                  <div key={book.bookNumber} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">Book {book.bookNumber.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="font-mono text-sm">
                      {book.firstSerial} - {book.lastSerial}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {book.couponCount} coupons
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleCreateBox}
              disabled={!isValid || isCreating}
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Box...
                </>
              ) : (
                'Create PetroTrade Box'
              )}
            </Button>
          </div>

          {/* Validation Errors */}
          {!isValid && (firstSerial || lastSerial) && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="font-medium text-destructive mb-2">Validation Errors:</h4>
              <ul className="text-sm text-destructive space-y-1">
                {firstSerialInfo && !firstSerialInfo.isValid && (
                  <li>• First serial format is invalid (expected: PU006H355101)</li>
                )}
                {lastSerialInfo && !lastSerialInfo.isValid && (
                  <li>• Last serial format is invalid (expected: PU006H355200)</li>
                )}
                {firstSerialInfo?.isValid && lastSerialInfo?.isValid && 
                 firstSerialInfo.prefix !== lastSerialInfo.prefix && (
                  <li>• First and last serials must have the same prefix</li>
                )}
                {firstSerialInfo?.isValid && lastSerialInfo?.isValid && 
                 firstSerialInfo.number >= lastSerialInfo.number && (
                  <li>• Last serial number must be greater than first serial number</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
