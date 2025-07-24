// Business Central AL Enhancement for PetroTrade Serial Validation
// Add this to existing Coupon table extensions

tableextension 50004 "PetroTrade Coupon Ext" extends "Fuel Coupon"
{
    fields
    {
        field(50020; "Serial Format"; Option)
        {
            Caption = 'Serial Format';
            OptionMembers = Standard,PetroTrade;
            OptionCaption = 'Standard,PetroTrade';
        }
        field(50021; "Serial Prefix"; Code[10])
        {
            Caption = 'Serial Prefix';
            Description = 'Extracted prefix from PetroTrade serial (e.g., PU006H)';
        }
        field(50022; "Serial Number"; Integer)
        {
            Caption = 'Serial Number';
            Description = 'Extracted number from PetroTrade serial (e.g., 355101)';
        }
        field(50023; "Is PetroTrade Valid"; Boolean)
        {
            Caption = 'Is PetroTrade Valid';
            Description = 'Whether the coupon number follows PetroTrade format';
            Editable = false;
        }
    }

    trigger OnBeforeInsert()
    begin
        ValidatePetroTradeSerial();
    end;

    trigger OnBeforeModify()
    begin
        ValidatePetroTradeSerial();
    end;

    local procedure ValidatePetroTradeSerial()
    var
        PetroTradeHelper: Codeunit "PetroTrade Serial Helper";
        SerialInfo: Record "PetroTrade Serial Info" temporary;
    begin
        if "Coupon Number" = '' then
            exit;

        if PetroTradeHelper.ParseSerial("Coupon Number", SerialInfo) then begin
            "Serial Format" := "Serial Format"::PetroTrade;
            "Serial Prefix" := SerialInfo.Prefix;
            "Serial Number" := SerialInfo."Serial Number";
            "Is PetroTrade Valid" := true;
        end else begin
            "Serial Format" := "Serial Format"::Standard;
            "Serial Prefix" := '';
            "Serial Number" := 0;
            "Is PetroTrade Valid" := false;
        end;
    end;
}

// PetroTrade Serial Helper Codeunit
codeunit 50004 "PetroTrade Serial Helper"
{
    procedure ParseSerial(SerialNumber: Code[50]; var SerialInfo: Record "PetroTrade Serial Info" temporary): Boolean
    var
        SerialText: Text;
        Position: Integer;
        NumberPart: Text;
        PrefixPart: Text;
        SerialValue: Integer;
    begin
        Clear(SerialInfo);
        SerialText := UpperCase(SerialNumber);

        // PetroTrade format: [PREFIX][6-DIGIT-NUMBER]
        // Example: PU006H355101
        if StrLen(SerialText) < 7 then
            exit(false);

        // Find where the 6-digit number starts (from the end)
        Position := StrLen(SerialText) - 5; // 6 digits means position is length - 5

        if Position < 2 then // Must have at least 1 character prefix
            exit(false);

        NumberPart := CopyStr(SerialText, Position, 6);
        PrefixPart := CopyStr(SerialText, 1, Position - 1);

        // Validate that number part is exactly 6 digits
        if not Evaluate(SerialValue, NumberPart) then
            exit(false);

        if StrLen(NumberPart) <> 6 then
            exit(false);

        // Validate prefix contains only letters and numbers, ends with letter
        if not IsValidPetroTradePrefix(PrefixPart) then
            exit(false);

        // Success - populate the temporary record
        SerialInfo.Init();
        SerialInfo.Prefix := PrefixPart;
        SerialInfo."Serial Number" := SerialValue;
        SerialInfo."Original Serial" := SerialNumber;
        SerialInfo."Is Valid" := true;
        SerialInfo.Insert();

        exit(true);
    end;

    local procedure IsValidPetroTradePrefix(Prefix: Text): Boolean
    var
        i: Integer;
        CurrentChar: Char;
        HasLetter: Boolean;
        HasDigit: Boolean;
    begin
        if StrLen(Prefix) = 0 then
            exit(false);

        // Check each character
        for i := 1 to StrLen(Prefix) do begin
            CurrentChar := Prefix[i];

            case true of
                (CurrentChar >= 'A') and (CurrentChar <= 'Z'):
                    HasLetter := true;
                (CurrentChar >= '0') and (CurrentChar <= '9'):
                    HasDigit := true;
                else
                    exit(false); // Invalid character
            end;
        end;

        // Must have at least one letter and must end with a letter
        exit(HasLetter and ((Prefix[StrLen(Prefix)] >= 'A') and (Prefix[StrLen(Prefix)] <= 'Z')));
    end;

    procedure GenerateSerialRange(FirstSerial: Code[50]; LastSerial: Code[50]; var SerialList: List of [Code[50]]): Boolean
    var
        FirstInfo, LastInfo : Record "PetroTrade Serial Info" temporary;
        i: Integer;
        CurrentSerial: Code[50];
    begin
        Clear(SerialList);

        if not ParseSerial(FirstSerial, FirstInfo) then
            exit(false);

        if not ParseSerial(LastSerial, LastInfo) then
            exit(false);

        if FirstInfo.Prefix <> LastInfo.Prefix then
            exit(false);

        if FirstInfo."Serial Number" >= LastInfo."Serial Number" then
            exit(false);

        // Generate the range
        for i := FirstInfo."Serial Number" to LastInfo."Serial Number" do begin
            CurrentSerial := FirstInfo.Prefix + Format(i, 0, '<Integer,6><Filler Character,0>');
            SerialList.Add(CurrentSerial);
        end;

        exit(true);
    end;

    procedure ValidateSerialRange(FirstSerial: Code[50]; LastSerial: Code[50]): Text
    var
        FirstInfo, LastInfo : Record "PetroTrade Serial Info" temporary;
    begin
        if not ParseSerial(FirstSerial, FirstInfo) then
            exit('Invalid first serial format');

        if not ParseSerial(LastSerial, LastInfo) then
            exit('Invalid last serial format');

        if FirstInfo.Prefix <> LastInfo.Prefix then
            exit('First and last serials must have the same prefix');

        if FirstInfo."Serial Number" >= LastInfo."Serial Number" then
            exit('Last serial number must be greater than first serial number');

        exit(''); // Empty string means valid
    end;
}

// Temporary table for serial parsing results
table 50004 "PetroTrade Serial Info"
{
    TableType = Temporary;

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            AutoIncrement = true;
        }
        field(10; "Original Serial"; Code[50])
        {
            Caption = 'Original Serial';
        }
        field(20; "Prefix"; Code[10])
        {
            Caption = 'Prefix';
        }
        field(30; "Serial Number"; Integer)
        {
            Caption = 'Serial Number';
        }
        field(40; "Is Valid"; Boolean)
        {
            Caption = 'Is Valid';
        }
    }

    keys
    {
        key(PK; "Entry No.")
        {
            Clustered = true;
        }
    }
}

// Page for PetroTrade Box Creation
page 50004 "PetroTrade Box Creator"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Tasks;
    Caption = 'PetroTrade Box Creator';

    layout
    {
        area(Content)
        {
            group(SerialRange)
            {
                Caption = 'Serial Range';

                field(FirstSerial; FirstSerialText)
                {
                    ApplicationArea = All;
                    Caption = 'First Coupon Serial';
                    ToolTip = 'Enter the first coupon serial (e.g., PU006H355101)';

                    trigger OnValidate()
                    begin
                        ValidateSerials();
                    end;
                }

                field(LastSerial; LastSerialText)
                {
                    ApplicationArea = All;
                    Caption = 'Last Coupon Serial';
                    ToolTip = 'Enter the last coupon serial (e.g., PU006H355200)';

                    trigger OnValidate()
                    begin
                        ValidateSerials();
                    end;
                }
            }

            group(Configuration)
            {
                Caption = 'Configuration';

                field(FuelType; FuelTypeOption)
                {
                    ApplicationArea = All;
                    Caption = 'Fuel Type';
                }

                field(Denomination; DenominationDecimal)
                {
                    ApplicationArea = All;
                    Caption = 'Litres per Coupon';
                }

                field(CouponsPerBook; CouponsPerBookInt)
                {
                    ApplicationArea = All;
                    Caption = 'Coupons per Book';
                }
            }

            group(Summary)
            {
                Caption = 'Summary';
                Editable = false;

                field(TotalCoupons; TotalCouponsInt)
                {
                    ApplicationArea = All;
                    Caption = 'Total Coupons';
                }

                field(TotalBooks; TotalBooksInt)
                {
                    ApplicationArea = All;
                    Caption = 'Total Books';
                }

                field(TotalLitres; TotalLitresDecimal)
                {
                    ApplicationArea = All;
                    Caption = 'Total Litres';
                }

                field(ValidationStatus; ValidationStatusText)
                {
                    ApplicationArea = All;
                    Caption = 'Validation Status';
                    Style = Favorable;
                    StyleExpr = IsValidRange;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(CreateBox)
            {
                ApplicationArea = All;
                Caption = 'Create Box';
                Image = NewDocument;
                Enabled = IsValidRange;

                trigger OnAction()
                begin
                    CreatePetroTradeBox();
                end;
            }

            action(Preview)
            {
                ApplicationArea = All;
                Caption = 'Preview Books';
                Image = View;
                Enabled = IsValidRange;

                trigger OnAction()
                begin
                    PreviewBookRanges();
                end;
            }
        }
    }

    var
        FirstSerialText: Text[50];
        LastSerialText: Text[50];
        FuelTypeOption: Option Petrol,Diesel;
        DenominationDecimal: Decimal;
        CouponsPerBookInt: Integer;
        TotalCouponsInt: Integer;
        TotalBooksInt: Integer;
        TotalLitresDecimal: Decimal;
        ValidationStatusText: Text[100];
        IsValidRange: Boolean;

    trigger OnOpenPage()
    begin
        // Set defaults
        FirstSerialText := 'PU006H355101';
        LastSerialText := 'PU006H355200';
        FuelTypeOption := FuelTypeOption::Diesel;
        DenominationDecimal := 20;
        CouponsPerBookInt := 100;

        ValidateSerials();
    end;

    local procedure ValidateSerials()
    var
        PetroTradeHelper: Codeunit "PetroTrade Serial Helper";
        ValidationResult: Text;
        FirstInfo, LastInfo : Record "PetroTrade Serial Info" temporary;
    begin
        Clear(TotalCouponsInt);
        Clear(TotalBooksInt);
        Clear(TotalLitresDecimal);
        IsValidRange := false;

        ValidationResult := PetroTradeHelper.ValidateSerialRange(FirstSerialText, LastSerialText);

        if ValidationResult <> '' then begin
            ValidationStatusText := ValidationResult;
            exit;
        end;

        // Get serial info for calculations
        if PetroTradeHelper.ParseSerial(FirstSerialText, FirstInfo) and
           PetroTradeHelper.ParseSerial(LastSerialText, LastInfo) then begin

            TotalCouponsInt := LastInfo."Serial Number" - FirstInfo."Serial Number" + 1;
            TotalBooksInt := Round(TotalCouponsInt / CouponsPerBookInt, 1, '>');
            TotalLitresDecimal := TotalCouponsInt * DenominationDecimal;

            ValidationStatusText := 'Valid PetroTrade serial range';
            IsValidRange := true;
        end;
    end;

    local procedure CreatePetroTradeBox()
    var
        BoxRec: Record "Fuel Box";
        BookRec: Record "Fuel Book";
        PetroTradeHelper: Codeunit "PetroTrade Serial Helper";
        SerialList: List of [Code[50]];
        BoxCode: Code[20];
        BookNo: Integer;
        i: Integer;
        CurrentSerial: Code[50];
        BookFirstSerial, BookLastSerial : Code[50];
    begin
        if not IsValidRange then
            Error('Cannot create box: serial range is not valid');

        // Generate box code
        BoxCode := 'PT' + Format(CurrentDateTime, 0, '<Year4><Month,2><Day,2><Hours24,2><Minutes,2>');

        // Create the box record
        BoxRec.Init();
        BoxRec."Box Code" := BoxCode;
        BoxRec."Fuel Type" := Format(FuelTypeOption);
        BoxRec."First Coupon No." := FirstSerialText;
        BoxRec."Last Coupon No." := LastSerialText;
        BoxRec."Total Books" := TotalBooksInt;
        BoxRec."Total Coupons" := TotalCouponsInt;
        BoxRec."Denomination" := DenominationDecimal;
        BoxRec."Creation Date" := Today;
        BoxRec."Creation Time" := Time;
        BoxRec.Insert(true);

        // Generate serial range
        if not PetroTradeHelper.GenerateSerialRange(FirstSerialText, LastSerialText, SerialList) then
            Error('Failed to generate serial range');

        // Create books
        BookNo := 1;
        i := 1;

        while i <= SerialList.Count do begin
            // Determine book range
            BookFirstSerial := SerialList.Get(i);
            BookLastSerial := SerialList.Get(Minimum(i + CouponsPerBookInt - 1, SerialList.Count));

            // Create book record
            BookRec.Init();
            BookRec."Box Code" := BoxCode;
            BookRec."Book No." := Format(BookNo);
            BookRec."First Coupon No." := BookFirstSerial;
            BookRec."Last Coupon No." := BookLastSerial;
            BookRec."Total Coupons" := Minimum(CouponsPerBookInt, SerialList.Count - i + 1);
            BookRec.Insert(true);

            i := i + CouponsPerBookInt;
            BookNo := BookNo + 1;
        end;

        Message('PetroTrade box %1 created successfully with %2 books', BoxCode, TotalBooksInt);
    end;

    local procedure PreviewBookRanges()
    var
        PetroTradeHelper: Codeunit "PetroTrade Serial Helper";
        SerialList: List of [Code[50]];
        PreviewText: Text;
        BookNo: Integer;
        i: Integer;
        BookFirstSerial, BookLastSerial : Code[50];
    begin
        if not IsValidRange then
            exit;

        if not PetroTradeHelper.GenerateSerialRange(FirstSerialText, LastSerialText, SerialList) then
            exit;

        PreviewText := 'Book Ranges:\n\n';
        BookNo := 1;
        i := 1;

        while i <= SerialList.Count do begin
            BookFirstSerial := SerialList.Get(i);
            BookLastSerial := SerialList.Get(Minimum(i + CouponsPerBookInt - 1, SerialList.Count));

            PreviewText += StrSubstNo('Book %1: %2 - %3 (%4 coupons)\n',
                BookNo, BookFirstSerial, BookLastSerial,
                Minimum(CouponsPerBookInt, SerialList.Count - i + 1));

            i := i + CouponsPerBookInt;
            BookNo := BookNo + 1;
        end;

        Message(PreviewText);
    end;

    local procedure Minimum(Value1: Integer; Value2: Integer): Integer
    begin
        if Value1 < Value2 then
            exit(Value1);
        exit(Value2);
    end;
}
