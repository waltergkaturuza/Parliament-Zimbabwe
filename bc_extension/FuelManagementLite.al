// Lightweight Fuel Management System for Parliament
// This extension works without external symbol dependencies

// Simple Fuel Transaction Table
table 50110 "Fuel Transaction Lite"
{
    Caption = 'Fuel Transaction';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "No."; Code[20])
        {
            Caption = 'Transaction No.';
            DataClassification = CustomerContent;

            trigger OnValidate()
            begin
                if "No." = '' then begin
                    "No." := GetNextTransactionNo();
                end;
            end;
        }

        field(10; "Employee Code"; Code[20])
        {
            Caption = 'Employee Code';
            DataClassification = CustomerContent;
        }

        field(11; "Employee Name"; Text[100])
        {
            Caption = 'Employee Name';
            DataClassification = CustomerContent;
        }

        field(20; "Transaction Date"; Date)
        {
            Caption = 'Transaction Date';
            DataClassification = CustomerContent;
        }

        field(30; "Fuel Type"; Option)
        {
            Caption = 'Fuel Type';
            DataClassification = CustomerContent;
            OptionMembers = Petrol,Diesel;
            OptionCaption = 'Petrol,Diesel';
        }

        field(31; "Fuel Amount (Litres)"; Decimal)
        {
            Caption = 'Fuel Amount (Litres)';
            DataClassification = CustomerContent;
            DecimalPlaces = 2 : 2;
            MinValue = 0;
        }

        field(40; "Rate per Litre"; Decimal)
        {
            Caption = 'Rate per Litre (USD)';
            DataClassification = CustomerContent;
            DecimalPlaces = 2 : 4;
            MinValue = 0;
        }

        field(41; "Total Amount"; Decimal)
        {
            Caption = 'Total Amount (USD)';
            DataClassification = CustomerContent;
            DecimalPlaces = 2 : 2;
            Editable = false;
        }

        field(50; Status; Option)
        {
            Caption = 'Status';
            DataClassification = CustomerContent;
            OptionMembers = Pending,Approved,Rejected,Posted;
            OptionCaption = 'Pending,Approved,Rejected,Posted';
        }

        field(60; "Department"; Text[50])
        {
            Caption = 'Department';
            DataClassification = CustomerContent;
        }

        field(70; "Vehicle Registration"; Text[20])
        {
            Caption = 'Vehicle Registration';
            DataClassification = CustomerContent;
        }

        field(80; "Purpose"; Text[250])
        {
            Caption = 'Purpose/Reason';
            DataClassification = CustomerContent;
        }

        field(90; "Created Date"; DateTime)
        {
            Caption = 'Created Date';
            DataClassification = CustomerContent;
            Editable = false;
        }

        field(91; "Created By"; Code[50])
        {
            Caption = 'Created By';
            DataClassification = CustomerContent;
            Editable = false;
        }

        field(100; "Approved Date"; DateTime)
        {
            Caption = 'Approved Date';
            DataClassification = CustomerContent;
            Editable = false;
        }

        field(101; "Approved By"; Code[50])
        {
            Caption = 'Approved By';
            DataClassification = CustomerContent;
            Editable = false;
        }
    }

    keys
    {
        key(PK; "No.")
        {
            Clustered = true;
        }
        key(Employee; "Employee Code")
        {
        }
        key(Date; "Transaction Date")
        {
        }
        key(Status; Status)
        {
        }
    }

    trigger OnInsert()
    begin
        if "No." = '' then
            "No." := GetNextTransactionNo();

        if "Transaction Date" = 0D then
            "Transaction Date" := Today;

        "Created Date" := CurrentDateTime;
        "Created By" := UserId;
    end;

    trigger OnModify()
    begin
        CalculateTotalAmount();

        if (xRec.Status <> Status) and (Status = Status::Approved) then begin
            "Approved Date" := CurrentDateTime;
            "Approved By" := UserId;
        end;
    end;

    local procedure GetNextTransactionNo(): Code[20]
    var
        FuelTransaction: Record "Fuel Transaction Lite";
        LastNo: Integer;
        NewNo: Code[20];
    begin
        FuelTransaction.SetCurrentKey("No.");
        if FuelTransaction.FindLast() then begin
            if Evaluate(LastNo, CopyStr(FuelTransaction."No.", 3)) then
                LastNo := LastNo + 1
            else
                LastNo := 1;
        end else
            LastNo := 1;

        NewNo := 'FT' + Format(LastNo, 6, '<Integer,6><Filler Character,0>');
        exit(NewNo);
    end;

    procedure CalculateTotalAmount()
    begin
        "Total Amount" := "Fuel Amount (Litres)" * "Rate per Litre";
    end;
}

// Simple Fuel Rates Setup Table
table 50111 "Fuel Rates Setup"
{
    Caption = 'Fuel Rates Setup';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Primary Key"; Code[10])
        {
            Caption = 'Primary Key';
            DataClassification = SystemMetadata;
        }

        field(10; "Petrol Rate USD"; Decimal)
        {
            Caption = 'Petrol Rate (USD per Litre)';
            DataClassification = CustomerContent;
            DecimalPlaces = 2 : 4;
            MinValue = 0;
        }

        field(11; "Diesel Rate USD"; Decimal)
        {
            Caption = 'Diesel Rate (USD per Litre)';
            DataClassification = CustomerContent;
            DecimalPlaces = 2 : 4;
            MinValue = 0;
        }

        field(20; "Last Updated"; DateTime)
        {
            Caption = 'Last Updated';
            DataClassification = CustomerContent;
            Editable = false;
        }

        field(21; "Updated By"; Code[50])
        {
            Caption = 'Updated By';
            DataClassification = CustomerContent;
            Editable = false;
        }

        field(30; "Django Integration URL"; Text[250])
        {
            Caption = 'Django Integration URL';
            DataClassification = CustomerContent;
        }

        field(31; "Integration Enabled"; Boolean)
        {
            Caption = 'Integration Enabled';
            DataClassification = CustomerContent;
        }
    }

    keys
    {
        key(PK; "Primary Key")
        {
            Clustered = true;
        }
    }

    trigger OnInsert()
    begin
        "Primary Key" := '';
    end;

    trigger OnModify()
    begin
        "Last Updated" := CurrentDateTime;
        "Updated By" := UserId;
    end;
}
