// Simplified Parliament Fuel System Extension - No External Dependencies
// This extension works without downloading external symbols

// Simple Fuel Transaction Table
table 50130 "Simple Fuel Transaction"
{
    Caption = 'Parliament Fuel Transaction';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            AutoIncrement = true;
            DataClassification = SystemMetadata;
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

        field(15; "Department"; Text[50])
        {
            Caption = 'Department';
            DataClassification = CustomerContent;
        }

        field(20; "Transaction Date"; Date)
        {
            Caption = 'Transaction Date';
            DataClassification = CustomerContent;
        }

        field(21; "Transaction Time"; Time)
        {
            Caption = 'Transaction Time';
            DataClassification = CustomerContent;
        }

        field(30; "Fuel Type"; Option)
        {
            Caption = 'Fuel Type';
            OptionMembers = Petrol,Diesel;
            OptionCaption = 'Petrol,Diesel';
            DataClassification = CustomerContent;
        }

        field(31; "Fuel Amount Liters"; Decimal)
        {
            Caption = 'Fuel Amount (Liters)';
            DecimalPlaces = 2 : 2;
            MinValue = 0;
            DataClassification = CustomerContent;
        }

        field(32; "Rate per Liter USD"; Decimal)
        {
            Caption = 'Rate per Liter (USD)';
            DecimalPlaces = 4 : 4;
            MinValue = 0;
            DataClassification = CustomerContent;
        }

        field(33; "Total Amount USD"; Decimal)
        {
            Caption = 'Total Amount (USD)';
            DecimalPlaces = 2 : 2;
            Editable = false;
            DataClassification = CustomerContent;
        }

        field(40; "Status"; Option)
        {
            Caption = 'Status';
            OptionMembers = Pending,Approved,Rejected,Posted;
            OptionCaption = 'Pending,Approved,Rejected,Posted';
            DataClassification = CustomerContent;
        }

        field(50; "Request Reference"; Code[30])
        {
            Caption = 'Request Reference';
            DataClassification = CustomerContent;
        }

        field(51; "Approval Reference"; Code[30])
        {
            Caption = 'Approval Reference';
            DataClassification = CustomerContent;
        }

        field(60; "Vehicle Registration"; Code[20])
        {
            Caption = 'Vehicle Registration';
            DataClassification = CustomerContent;
        }

        field(61; "Odometer Reading"; Integer)
        {
            Caption = 'Odometer Reading (km)';
            MinValue = 0;
            DataClassification = CustomerContent;
        }

        field(70; "Created Date"; DateTime)
        {
            Caption = 'Created Date';
            Editable = false;
            DataClassification = CustomerContent;
        }

        field(71; "Created By"; Code[50])
        {
            Caption = 'Created By';
            Editable = false;
            DataClassification = CustomerContent;
        }

        field(80; "Posted Date"; Date)
        {
            Caption = 'Posted Date';
            Editable = false;
            DataClassification = CustomerContent;
        }

        field(81; "Posted By"; Code[50])
        {
            Caption = 'Posted By';
            Editable = false;
            DataClassification = CustomerContent;
        }

        field(90; "Django Sync Status"; Option)
        {
            Caption = 'Django Sync Status';
            OptionMembers = " ",Pending,Synced,Error;
            OptionCaption = ' ,Pending,Synced,Error';
            DataClassification = CustomerContent;
        }

        field(91; "Django Transaction ID"; Text[50])
        {
            Caption = 'Django Transaction ID';
            DataClassification = CustomerContent;
        }

        field(92; "Last Sync Attempt"; DateTime)
        {
            Caption = 'Last Sync Attempt';
            Editable = false;
            DataClassification = CustomerContent;
        }

        field(100; "Notes"; Text[250])
        {
            Caption = 'Notes';
            DataClassification = CustomerContent;
        }
    }

    keys
    {
        key(PK; "Entry No.")
        {
            Clustered = true;
        }
        key(Employee; "Employee Code", "Transaction Date")
        {
        }
        key(Status; Status, "Transaction Date")
        {
        }
        key(Django; "Django Transaction ID")
        {
        }
    }

    trigger OnInsert()
    begin
        if "Transaction Date" = 0D then
            "Transaction Date" := Today;

        if "Transaction Time" = 0T then
            "Transaction Time" := Time;

        "Created Date" := CurrentDateTime;
        "Created By" := UserId;

        // Auto-calculate total amount
        CalculateTotalAmount();
    end;

    trigger OnModify()
    begin
        CalculateTotalAmount();
    end;

    local procedure CalculateTotalAmount()
    begin
        "Total Amount USD" := "Fuel Amount Liters" * "Rate per Liter USD";
    end;

    procedure ApproveFuelTransaction()
    begin
        TestField(Status, Status::Pending);
        Status := Status::Approved;
        "Approval Reference" := 'APP-' + Format("Entry No.");
        Modify();
    end;

    procedure RejectFuelTransaction()
    begin
        TestField(Status, Status::Pending);
        Status := Status::Rejected;
        Modify();
    end;

    procedure PostFuelTransaction()
    begin
        TestField(Status, Status::Approved);
        Status := Status::Posted;
        "Posted Date" := Today;
        "Posted By" := UserId;
        Modify();
    end;
}
