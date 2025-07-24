codeunit 50110 "PetroTrade Serial Manager"
{
    Access = Public;

    var
        SerialFormatErr: Label 'Invalid PetroTrade serial format. Expected format: %1', Comment = '%1 = Expected format example';
        InvalidRangeErr: Label 'Invalid serial range. Last serial must be greater than first serial.';
        PrefixMismatchErr: Label 'First and last serials must have the same prefix.';
        BookGeneratedMsg: Label 'Generated %1 books with %2 total coupons from serial range %3 to %4', Comment = '%1 = book count, %2 = coupon count, %3 = first serial, %4 = last serial';

    procedure ValidatePetroTradeSerial(SerialNumber: Text): Boolean
    var
        Regex: DotNet Regex;
        Match: DotNet Match;
        Pattern: Text;
    begin
        // PetroTrade format: prefix + 6 digits (e.g., PU006H355101)
        Pattern := '^([A-Z0-9]+[A-Z])(\d{6})$';

        if SerialNumber = '' then
            exit(false);

        Regex := Regex.Regex(Pattern);
        Match := Regex.Match(SerialNumber);

        exit(Match.Success);
    end;

    procedure ParsePetroTradeSerial(SerialNumber: Text; var Prefix: Text; var Number: Integer): Boolean
    var
        Regex: DotNet Regex;
        Match: DotNet Match;
        Groups: DotNet GroupCollection;
        NumberText: Text;
        Pattern: Text;
    begin
        Pattern := '^([A-Z0-9]+[A-Z])(\d{6})$';

        if SerialNumber = '' then
            exit(false);

        Regex := Regex.Regex(Pattern);
        Match := Regex.Match(SerialNumber);

        if not Match.Success then
            exit(false);

        Groups := Match.Groups;
        Prefix := Groups.Item(1).Value;
        NumberText := Groups.Item(2).Value;

        if not Evaluate(Number, NumberText) then
            exit(false);

        exit(true);
    end;

    procedure ValidateSerialRange(FirstSerial: Text; LastSerial: Text): Boolean
    var
        FirstPrefix: Text;
        LastPrefix: Text;
        FirstNumber: Integer;
        LastNumber: Integer;
    begin
        // Validate both serials
        if not ValidatePetroTradeSerial(FirstSerial) then
            Error(SerialFormatErr, 'PU006H355101');

        if not ValidatePetroTradeSerial(LastSerial) then
            Error(SerialFormatErr, 'PU006H355200');

        // Parse both serials
        if not ParsePetroTradeSerial(FirstSerial, FirstPrefix, FirstNumber) then
            exit(false);

        if not ParsePetroTradeSerial(LastSerial, LastPrefix, LastNumber) then
            exit(false);

        // Check prefix match
        if FirstPrefix <> LastPrefix then
            Error(PrefixMismatchErr);

        // Check range validity
        if LastNumber <= FirstNumber then
            Error(InvalidRangeErr);

        exit(true);
    end;

    procedure GenerateSerialRange(FirstSerial: Text; LastSerial: Text; var SerialList: List of [Text])
    var
        Prefix: Text;
        FirstNumber: Integer;
        LastNumber: Integer;
        CurrentNumber: Integer;
        SerialNumber: Text;
    begin
        // Validate the range first
        ValidateSerialRange(FirstSerial, LastSerial);

        // Parse the first serial
        ParsePetroTradeSerial(FirstSerial, Prefix, FirstNumber);
        ParsePetroTradeSerial(LastSerial, Prefix, LastNumber);

        // Generate all serials in range
        for CurrentNumber := FirstNumber to LastNumber do begin
            SerialNumber := Prefix + PadStr(Format(CurrentNumber), 6, '0');
            SerialList.Add(SerialNumber);
        end;
    end;

    procedure SplitIntoBooks(FirstSerial: Text; LastSerial: Text; CouponsPerBook: Integer; var BookRanges: List of [Text])
    var
        Prefix: Text;
        FirstNumber: Integer;
        LastNumber: Integer;
        CurrentNumber: Integer;
        BookNumber: Integer;
        BookFirstSerial: Text;
        BookLastSerial: Text;
        BookLastNumber: Integer;
        BookInfo: Text;
    begin
        // Validate the range first
        ValidateSerialRange(FirstSerial, LastSerial);

        // Parse serials
        ParsePetroTradeSerial(FirstSerial, Prefix, FirstNumber);
        ParsePetroTradeSerial(LastSerial, Prefix, LastNumber);

        CurrentNumber := FirstNumber;
        BookNumber := 1;

        while CurrentNumber <= LastNumber do begin
            BookFirstSerial := Prefix + PadStr(Format(CurrentNumber), 6, '0');
            BookLastNumber := CurrentNumber + CouponsPerBook - 1;

            // Don't exceed the last serial
            if BookLastNumber > LastNumber then
                BookLastNumber := LastNumber;

            BookLastSerial := Prefix + PadStr(Format(BookLastNumber), 6, '0');

            // Create book info string: "Book 01|PU006H355101|PU006H355200|100"
            BookInfo := StrSubstNo('Book %1|%2|%3|%4',
                PadStr(Format(BookNumber), 2, '0'),
                BookFirstSerial,
                BookLastSerial,
                BookLastNumber - CurrentNumber + 1);

            BookRanges.Add(BookInfo);

            CurrentNumber := BookLastNumber + 1;
            BookNumber += 1;
        end;
    end;

    procedure CreateCouponBookFromSerials(BookCode: Code[20]; FirstSerial: Text; LastSerial: Text; FuelType: Code[10]; Denomination: Decimal)
    var
        CouponBook: Record "Coupon Book";
        SerialList: List of [Text];
        Serial: Text;
        CouponCount: Integer;
    begin
        // Generate all serials in the range
        GenerateSerialRange(FirstSerial, LastSerial, SerialList);
        CouponCount := SerialList.Count;

        // Create the book record
        CouponBook.Init();
        CouponBook."Book Code" := BookCode;
        CouponBook."First Coupon Number" := FirstSerial;
        CouponBook."Last Coupon Number" := LastSerial;
        CouponBook."Fuel Type" := FuelType;
        CouponBook."Denomination (Litres)" := Denomination;
        CouponBook."Total Coupons" := CouponCount;
        CouponBook."Available Coupons" := CouponCount;
        CouponBook."Creation Date" := Today;
        CouponBook."Created By" := UserId;
        CouponBook.Insert(true);

        // Create individual coupon records
        foreach Serial in SerialList do
            CreateCouponRecord(CouponBook."Book Code", Serial, FuelType, Denomination);

        Message(BookGeneratedMsg, 1, CouponCount, FirstSerial, LastSerial);
    end;

    procedure CreateCouponBoxFromSerials(BoxCode: Code[20]; FirstSerial: Text; LastSerial: Text; FuelType: Code[10]; Denomination: Decimal; CouponsPerBook: Integer)
    var
        CouponBox: Record "Coupon Box";
        BookRanges: List of [Text];
        BookInfo: Text;
        BookInfoParts: List of [Text];
        BookCode: Code[20];
        BookFirstSerial: Text;
        BookLastSerial: Text;
        BookNumber: Integer;
        TotalCoupons: Integer;
        TotalBooks: Integer;
        Prefix: Text;
        FirstNumber: Integer;
        LastNumber: Integer;
    begin
        // Parse and validate
        ValidateSerialRange(FirstSerial, LastSerial);
        ParsePetroTradeSerial(FirstSerial, Prefix, FirstNumber);
        ParsePetroTradeSerial(LastSerial, Prefix, LastNumber);

        TotalCoupons := LastNumber - FirstNumber + 1;
        TotalBooks := Round((TotalCoupons / CouponsPerBook) + 0.5, 1, '>'); // Ceiling

        // Create box record
        CouponBox.Init();
        CouponBox."Box Code" := BoxCode;
        CouponBox."First Coupon Number" := FirstSerial;
        CouponBox."Last Coupon Number" := LastSerial;
        CouponBox."Fuel Type" := FuelType;
        CouponBox."Denomination (Litres)" := Denomination;
        CouponBox."Total Coupons" := TotalCoupons;
        CouponBox."Total Books" := TotalBooks;
        CouponBox."Coupons Per Book" := CouponsPerBook;
        CouponBox."Creation Date" := Today;
        CouponBox."Created By" := UserId;
        CouponBox.Insert(true);

        // Split into books and create them
        SplitIntoBooks(FirstSerial, LastSerial, CouponsPerBook, BookRanges);

        BookNumber := 1;
        foreach BookInfo in BookRanges do begin
            BookInfoParts := BookInfo.Split('|');
            if BookInfoParts.Count = 4 then begin
                BookCode := StrSubstNo('%1-%2', BoxCode, PadStr(Format(BookNumber), 2, '0'));
                BookFirstSerial := BookInfoParts.Get(2);
                BookLastSerial := BookInfoParts.Get(3);

                CreateCouponBookFromSerials(BookCode, BookFirstSerial, BookLastSerial, FuelType, Denomination);
                BookNumber += 1;
            end;
        end;

        Message(BookGeneratedMsg, TotalBooks, TotalCoupons, FirstSerial, LastSerial);
    end;

    local procedure CreateCouponRecord(BookCode: Code[20]; CouponNumber: Text; FuelType: Code[10]; Denomination: Decimal)
    var
        Coupon: Record "Fuel Coupon";
    begin
        Coupon.Init();
        Coupon."Coupon Number" := CopyStr(CouponNumber, 1, MaxStrLen(Coupon."Coupon Number"));
        Coupon."Book Code" := BookCode;
        Coupon."Fuel Type" := FuelType;
        Coupon."Denomination (Litres)" := Denomination;
        Coupon.Status := Coupon.Status::Available;
        Coupon."Issue Date" := Today;
        Coupon."Expiry Date" := CalcDate('+1Y', Today); // 1 year validity
        if not Coupon.Insert(true) then
            Coupon.Modify(true);
    end;

    procedure GetTotalCouponsInRange(FirstSerial: Text; LastSerial: Text): Integer
    var
        Prefix: Text;
        FirstNumber: Integer;
        LastNumber: Integer;
    begin
        if not ValidateSerialRange(FirstSerial, LastSerial) then
            exit(0);

        ParsePetroTradeSerial(FirstSerial, Prefix, FirstNumber);
        ParsePetroTradeSerial(LastSerial, Prefix, LastNumber);

        exit(LastNumber - FirstNumber + 1);
    end;

    procedure GetRequiredBooksCount(FirstSerial: Text; LastSerial: Text; CouponsPerBook: Integer): Integer
    var
        TotalCoupons: Integer;
    begin
        TotalCoupons := GetTotalCouponsInRange(FirstSerial, LastSerial);
        if TotalCoupons = 0 then
            exit(0);

        exit(Round((TotalCoupons / CouponsPerBook) + 0.5, 1, '>'));
    end;
}
