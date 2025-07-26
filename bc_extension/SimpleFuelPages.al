// Simple Fuel System Setup Table - No Dependencies
table 50131 "Simple Fuel Setup"
{
    Caption = 'Parliament Fuel System Setup';
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
            Caption = 'Petrol Rate per Liter (USD)';
            DecimalPlaces = 4 : 4;
            MinValue = 0;
            DataClassification = CustomerContent;
        }

        field(11; "Diesel Rate USD"; Decimal)
        {
            Caption = 'Diesel Rate per Liter (USD)';
            DecimalPlaces = 4 : 4;
            MinValue = 0;
            DataClassification = CustomerContent;
        }

        field(20; "Django Base URL"; Text[250])
        {
            Caption = 'Django Application URL';
            DataClassification = CustomerContent;
        }

        field(21; "Integration Enabled"; Boolean)
        {
            Caption = 'Django Integration Enabled';
            DataClassification = CustomerContent;
        }

        field(22; "Auto Sync"; Boolean)
        {
            Caption = 'Auto Sync with Django';
            DataClassification = CustomerContent;
        }

        field(30; "Default Department"; Text[50])
        {
            Caption = 'Default Department';
            DataClassification = CustomerContent;
        }

        field(31; "Require Vehicle Info"; Boolean)
        {
            Caption = 'Require Vehicle Information';
            DataClassification = CustomerContent;
        }

        field(32; "Require Odometer"; Boolean)
        {
            Caption = 'Require Odometer Reading';
            DataClassification = CustomerContent;
        }

        field(40; "Max Fuel per Transaction"; Decimal)
        {
            Caption = 'Maximum Fuel per Transaction (Liters)';
            DecimalPlaces = 2 : 2;
            MinValue = 0;
            DataClassification = CustomerContent;
        }

        field(41; "Daily Fuel Limit"; Decimal)
        {
            Caption = 'Daily Fuel Limit per Employee (Liters)';
            DecimalPlaces = 2 : 2;
            MinValue = 0;
            DataClassification = CustomerContent;
        }

        field(50; "Last Sync Date"; DateTime)
        {
            Caption = 'Last Django Sync';
            Editable = false;
            DataClassification = CustomerContent;
        }

        field(51; "Total Transactions"; Integer)
        {
            Caption = 'Total Transactions';
            Editable = false;
            FieldClass = FlowField;
            CalcFormula = count("Simple Fuel Transaction");
        }

        field(52; "Pending Approvals"; Integer)
        {
            Caption = 'Pending Approvals';
            Editable = false;
            FieldClass = FlowField;
            CalcFormula = count("Simple Fuel Transaction" where(Status = const(Pending)));
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
        "Petrol Rate USD" := 1.45;  // Default rate
        "Diesel Rate USD" := 1.38;  // Default rate
        "Django Base URL" := 'https://parliament-fuel-system.azurewebsites.net/';
        "Integration Enabled" := true;
        "Default Department" := 'Parliament';
        "Max Fuel per Transaction" := 50.00;
        "Daily Fuel Limit" := 100.00;
    end;
}

// Simple Pages for the Fuel System

// List Page for Fuel Transactions
page 50130 "Simple Fuel Transactions"
{
    PageType = List;
    ApplicationArea = All;
    UsageCategory = Lists;
    SourceTable = "Simple Fuel Transaction";
    Caption = 'Parliament Fuel Transactions';
    CardPageId = "Simple Fuel Transaction";
    
    layout
    {
        area(Content)
        {
            repeater(Transactions)
            {
                field("Entry No."; Rec."Entry No.")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction entry number';
                }

                field("Employee Code"; Rec."Employee Code")
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee code who requested fuel';
                }

                field("Employee Name"; Rec."Employee Name")
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee name';
                }

                field("Transaction Date"; Rec."Transaction Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Date of fuel transaction';
                }

                field("Fuel Type"; Rec."Fuel Type")
                {
                    ApplicationArea = All;
                    ToolTip = 'Type of fuel (Petrol/Diesel)';
                }

                field("Fuel Amount Liters"; Rec."Fuel Amount Liters")
                {
                    ApplicationArea = All;
                    ToolTip = 'Amount of fuel in liters';
                }

                field("Total Amount USD"; Rec."Total Amount USD")
                {
                    ApplicationArea = All;
                    ToolTip = 'Total cost in USD';
                }

                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction status';
                }

                field("Vehicle Registration"; Rec."Vehicle Registration")
                {
                    ApplicationArea = All;
                    ToolTip = 'Vehicle registration number';
                }
            }
        }

        area(FactBoxes)
        {
            part(FuelStats; "Simple Fuel Stats FactBox")
            {
                ApplicationArea = All;
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(ApproveSelected)
            {
                ApplicationArea = All;
                Caption = 'Approve Transaction';
                Image = Approve;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                begin
                    if Confirm('Approve this fuel transaction?') then begin
                        Rec.ApproveFuelTransaction();
                        Message('Transaction approved successfully.');
                    end;
                end;
            }

            action(RejectSelected)
            {
                ApplicationArea = All;
                Caption = 'Reject Transaction';
                Image = Reject;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                begin
                    if Confirm('Reject this fuel transaction?') then begin
                        Rec.RejectFuelTransaction();
                        Message('Transaction rejected.');
                    end;
                end;
            }

            action(PostTransaction)
            {
                ApplicationArea = All;
                Caption = 'Post Transaction';
                Image = Post;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Approved;

                trigger OnAction()
                begin
                    if Confirm('Post this fuel transaction to accounts?') then begin
                        Rec.PostFuelTransaction();
                        Message('Transaction posted successfully.');
                    end;
                end;
            }

            action(NewFuelRequest)
            {
                ApplicationArea = All;
                Caption = 'New Fuel Request';
                Image = New;
                PromotedCategory = New;
                Promoted = true;
                RunObject = page "Simple Fuel Transaction";
                RunPageMode = Create;
            }

            action(OpenDjangoApp)
            {
                ApplicationArea = All;
                Caption = 'Open Fuel System';
                Image = Web;
                PromotedCategory = Navigation;
                Promoted = true;

                trigger OnAction()
                var
                    FuelSetup: Record "Simple Fuel Setup";
                begin
                    if FuelSetup.Get() then begin
                        if FuelSetup."Django Base URL" <> '' then
                            Hyperlink(FuelSetup."Django Base URL")
                        else
                            Message('Django URL not configured in setup.');
                    end;
                end;
            }
        }

        area(Navigation)
        {
            action(Setup)
            {
                ApplicationArea = All;
                Caption = 'Fuel System Setup';
                Image = Setup;
                RunObject = page "Simple Fuel Setup";
                PromotedCategory = Process;
                Promoted = true;
            }

            action(Reports)
            {
                ApplicationArea = All;
                Caption = 'Fuel Reports';
                Image = Report;
                PromotedCategory = Reports;
                Promoted = true;

                trigger OnAction()
                begin
                    Message('Fuel reports feature - to be implemented based on requirements.');
                end;
            }
        }
    }

    trigger OnOpenPage()
    begin
        // Set default filter to show recent transactions
        Rec.SetCurrentKey("Transaction Date");
        Rec.SetAscending("Transaction Date", false);
    end;
}
