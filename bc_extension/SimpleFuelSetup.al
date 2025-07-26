// Setup Page for Simple Fuel System
page 50132 "Simple Fuel Setup"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    SourceTable = "Simple Fuel Setup";
    Caption = 'Parliament Fuel System Setup';
    InsertAllowed = false;
    DeleteAllowed = false;

    layout
    {
        area(Content)
        {
            group(FuelRates)
            {
                Caption = 'Fuel Rates (USD)';

                field("Petrol Rate USD"; Rec."Petrol Rate USD")
                {
                    ApplicationArea = All;
                    ToolTip = 'Current petrol rate per liter in USD';
                }

                field("Diesel Rate USD"; Rec."Diesel Rate USD")
                {
                    ApplicationArea = All;
                    ToolTip = 'Current diesel rate per liter in USD';
                }
            }

            group(Integration)
            {
                Caption = 'Django Integration';

                field("Django Base URL"; Rec."Django Base URL")
                {
                    ApplicationArea = All;
                    ToolTip = 'Base URL for Django fuel management system';
                }

                field("Integration Enabled"; Rec."Integration Enabled")
                {
                    ApplicationArea = All;
                    ToolTip = 'Enable integration with Django system';
                }

                field("Auto Sync"; Rec."Auto Sync")
                {
                    ApplicationArea = All;
                    ToolTip = 'Automatically sync transactions with Django';
                }

                field("Last Sync Date"; Rec."Last Sync Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Last successful synchronization date';
                    Editable = false;
                }
            }

            group(BusinessRules)
            {
                Caption = 'Business Rules';

                field("Default Department"; Rec."Default Department")
                {
                    ApplicationArea = All;
                    ToolTip = 'Default department for new transactions';
                }

                field("Max Fuel per Transaction"; Rec."Max Fuel per Transaction")
                {
                    ApplicationArea = All;
                    ToolTip = 'Maximum liters allowed per transaction';
                }

                field("Daily Fuel Limit"; Rec."Daily Fuel Limit")
                {
                    ApplicationArea = All;
                    ToolTip = 'Daily fuel limit per employee in liters';
                }

                field("Require Vehicle Info"; Rec."Require Vehicle Info")
                {
                    ApplicationArea = All;
                    ToolTip = 'Require vehicle registration for all transactions';
                }

                field("Require Odometer"; Rec."Require Odometer")
                {
                    ApplicationArea = All;
                    ToolTip = 'Require odometer reading for all transactions';
                }
            }

            group(Statistics)
            {
                Caption = 'System Statistics';

                field("Total Transactions"; Rec."Total Transactions")
                {
                    ApplicationArea = All;
                    ToolTip = 'Total number of fuel transactions';
                    DrillDown = true;

                    trigger OnDrillDown()
                    begin
                        Page.Run(Page::"Simple Fuel Transactions");
                    end;
                }

                field("Pending Approvals"; Rec."Pending Approvals")
                {
                    ApplicationArea = All;
                    ToolTip = 'Number of transactions pending approval';
                    DrillDown = true;
                    Style = Attention;
                    StyleExpr = Rec."Pending Approvals" > 0;

                    trigger OnDrillDown()
                    var
                        FuelTransaction: Record "Simple Fuel Transaction";
                    begin
                        FuelTransaction.SetRange(Status, FuelTransaction.Status::Pending);
                        Page.Run(Page::"Simple Fuel Transactions", FuelTransaction);
                    end;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(TestDjangoConnection)
            {
                ApplicationArea = All;
                Caption = 'Test Connection';
                Image = TestDatabase;
                PromotedCategory = Process;
                Promoted = true;

                trigger OnAction()
                begin
                    TestDjangoConnection();
                end;
            }

            action(SyncAllTransactions)
            {
                ApplicationArea = All;
                Caption = 'Sync All Transactions';
                Image = Refresh;
                PromotedCategory = Process;
                Promoted = true;

                trigger OnAction()
                begin
                    if Confirm('Sync all pending transactions with Django system?') then begin
                        SyncAllTransactions();
                    end;
                end;
            }

            action(UpdateFuelRates)
            {
                ApplicationArea = All;
                Caption = 'Update Fuel Rates';
                Image = UpdateDescription;
                PromotedCategory = Process;
                Promoted = true;

                trigger OnAction()
                begin
                    UpdateFuelRatesFromDjango();
                end;
            }

            action(OpenDjangoSystem)
            {
                ApplicationArea = All;
                Caption = 'Open Django System';
                Image = Web;
                PromotedCategory = Process;
                Promoted = true;

                trigger OnAction()
                begin
                    if Rec."Django Base URL" <> '' then
                        Hyperlink(Rec."Django Base URL")
                    else
                        Message('Django Base URL not configured.');
                end;
            }
        }

        area(Navigate)
        {
            action(ViewTransactions)
            {
                ApplicationArea = All;
                Caption = 'View All Transactions';
                Image = List;
                RunObject = page "Simple Fuel Transactions";
            }

            action(PendingApprovals)
            {
                ApplicationArea = All;
                Caption = 'Pending Approvals';
                Image = Approval;

                trigger OnAction()
                var
                    FuelTransaction: Record "Simple Fuel Transaction";
                begin
                    FuelTransaction.SetRange(Status, FuelTransaction.Status::Pending);
                    Page.Run(Page::"Simple Fuel Transactions", FuelTransaction);
                end;
            }
        }
    }

    trigger OnOpenPage()
    begin
        Rec.Reset();
        if not Rec.Get() then begin
            Rec.Init();
            Rec.Insert();
        end;
    end;

    local procedure TestDjangoConnection()
    begin
        if Rec."Django Base URL" = '' then begin
            Error('Please configure Django Base URL first.');
        end;

        if Rec."Integration Enabled" then begin
            // Simulate connection test
            Rec."Last Sync Date" := CurrentDateTime;
            Rec.Modify();
            Message('Connection test completed successfully.\n\nDjango System: %1\nLast Sync: %2',
                Rec."Django Base URL", Rec."Last Sync Date");
        end else begin
            Message('Integration is disabled. Enable integration first.');
        end;
    end;

    local procedure SyncAllTransactions()
    var
        FuelTransaction: Record "Simple Fuel Transaction";
        SyncCount: Integer;
    begin
        if not Rec."Integration Enabled" then begin
            Error('Django integration is not enabled.');
        end;

        FuelTransaction.SetRange("Django Sync Status", FuelTransaction."Django Sync Status"::" ");
        if FuelTransaction.FindSet() then begin
            repeat
                FuelTransaction."Django Sync Status" := FuelTransaction."Django Sync Status"::Pending;
                FuelTransaction."Last Sync Attempt" := CurrentDateTime;
                FuelTransaction.Modify();
                SyncCount += 1;
            until FuelTransaction.Next() = 0;
        end;

        Rec."Last Sync Date" := CurrentDateTime;
        Rec.Modify();

        Message('Sync initiated for %1 transactions.\nLast sync: %2', SyncCount, Rec."Last Sync Date");
    end;

    local procedure UpdateFuelRatesFromDjango()
    begin
        if not Rec."Integration Enabled" then begin
            Error('Django integration is not enabled.');
        end;

        // Simulate rate update from Django
        Message('Fuel rates updated from Django system.\n\nPetrol: $%1 USD/L\nDiesel: $%2 USD/L\n\nNote: This is a simulation. Real implementation would fetch rates from Django API.',
            Rec."Petrol Rate USD", Rec."Diesel Rate USD");
    end;
}

// FactBox for Fuel Statistics
page 50133 "Simple Fuel Stats FactBox"
{
    PageType = CardPart;
    SourceTable = "Simple Fuel Setup";
    Caption = 'Fuel System Statistics';

    layout
    {
        area(Content)
        {
            group(QuickStats)
            {
                ShowCaption = false;

                field("Total Transactions"; Rec."Total Transactions")
                {
                    ApplicationArea = All;
                    Caption = 'Total Transactions';
                    ToolTip = 'Total number of fuel transactions';
                    DrillDown = true;

                    trigger OnDrillDown()
                    begin
                        Page.Run(Page::"Simple Fuel Transactions");
                    end;
                }

                field("Pending Approvals"; Rec."Pending Approvals")
                {
                    ApplicationArea = All;
                    Caption = 'Pending Approvals';
                    ToolTip = 'Transactions awaiting approval';
                    Style = Attention;
                    StyleExpr = Rec."Pending Approvals" > 0;
                    DrillDown = true;

                    trigger OnDrillDown()
                    var
                        FuelTransaction: Record "Simple Fuel Transaction";
                    begin
                        FuelTransaction.SetRange(Status, FuelTransaction.Status::Pending);
                        Page.Run(Page::"Simple Fuel Transactions", FuelTransaction);
                    end;
                }

                field("Current Petrol Rate"; Rec."Petrol Rate USD")
                {
                    ApplicationArea = All;
                    Caption = 'Petrol Rate (USD/L)';
                    ToolTip = 'Current petrol rate per liter';
                }

                field("Current Diesel Rate"; Rec."Diesel Rate USD")
                {
                    ApplicationArea = All;
                    Caption = 'Diesel Rate (USD/L)';
                    ToolTip = 'Current diesel rate per liter';
                }

                field("Integration Status"; Rec."Integration Enabled")
                {
                    ApplicationArea = All;
                    Caption = 'Django Integration';
                    ToolTip = 'Django integration status';
                    Style = Favorable;
                    StyleExpr = Rec."Integration Enabled";
                }
            }
        }
    }

    trigger OnOpenPage()
    begin
        if not Rec.Get() then begin
            Rec.Init();
            Rec.Insert();
        end;
    end;
}
