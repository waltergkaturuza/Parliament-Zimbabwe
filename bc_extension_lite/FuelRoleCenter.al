// Role Center for Fuel Management Users
page 50210 "Fuel Manager Role Center"
{
    PageType = RoleCenter;
    Caption = 'Fuel Manager';

    layout
    {
        area(RoleCenter)
        {
            part(TransactionActivities; "Fuel Transaction Activities")
            {
                ApplicationArea = All;
            }
            part(TransactionList; "Fuel Transaction List Lite")
            {
                ApplicationArea = All;
            }
        }
    }

    actions
    {
        area(Creation)
        {
            action(NewTransaction)
            {
                ApplicationArea = All;
                Caption = 'New Fuel Transaction';
                Image = NewDocument;
                RunObject = Page "Fuel Transaction Card Lite";
                RunPageMode = Create;
            }
        }
        area(Processing)
        {
            group(Setup)
            {
                Caption = 'Setup';
                action(FuelRatesSetup)
                {
                    ApplicationArea = All;
                    Caption = 'Fuel Rates Setup';
                    Image = Setup;
                    RunObject = Page "Fuel Rates Setup Page";
                }
            }
            group(Reports)
            {
                Caption = 'Reports & Analysis';
                action(FuelSummaryReport)
                {
                    ApplicationArea = All;
                    Caption = 'Fuel Summary Report';
                    Image = Report;
                    RunObject = Page "Fuel Summary Report";
                }
                action(ShowStatistics)
                {
                    ApplicationArea = All;
                    Caption = 'Show Statistics';
                    Image = Statistics;

                    trigger OnAction()
                    var
                        FuelIntegration: Codeunit "Fuel Integration Lite";
                        StatText: Text;
                    begin
                        StatText := FuelIntegration.GetFuelStatistics();
                        Message(StatText);
                    end;
                }
            }
            group(Integration)
            {
                Caption = 'Integration';
                action(SyncWithDjango)
                {
                    ApplicationArea = All;
                    Caption = 'Sync with Django';
                    Image = Refresh;

                    trigger OnAction()
                    var
                        FuelIntegration: Codeunit "Fuel Integration Lite";
                    begin
                        if FuelIntegration.SyncFuelRatesWithDjango() then
                            Message('Synchronization completed successfully.')
                        else
                            Message('Synchronization failed or is disabled.');
                    end;
                }
            }
        }
    }
}

// Transaction Activities Part for Role Center
page 50211 "Fuel Transaction Activities"
{
    PageType = CardPart;
    SourceTable = "Fuel Transaction Lite";
    Caption = 'Fuel Transaction Activities';

    layout
    {
        area(Content)
        {
            cuegroup(TransactionCues)
            {
                Caption = 'Transactions';

                field(TotalTransactions; TotalTransactions)
                {
                    ApplicationArea = All;
                    Caption = 'Total Transactions';
                    DrillDownPageID = "Fuel Transaction List Lite";
                }

                field(PendingTransactions; PendingTransactions)
                {
                    ApplicationArea = All;
                    Caption = 'Pending Approval';
                    DrillDownPageID = "Fuel Transaction List Lite";

                    trigger OnDrillDown()
                    var
                        FuelTransaction: Record "Fuel Transaction Lite";
                    begin
                        FuelTransaction.SetRange(Status, FuelTransaction.Status::Pending);
                        Page.Run(Page::"Fuel Transaction List Lite", FuelTransaction);
                    end;
                }

                field(ApprovedTransactions; ApprovedTransactions)
                {
                    ApplicationArea = All;
                    Caption = 'Approved';
                    DrillDownPageID = "Fuel Transaction List Lite";

                    trigger OnDrillDown()
                    var
                        FuelTransaction: Record "Fuel Transaction Lite";
                    begin
                        FuelTransaction.SetRange(Status, FuelTransaction.Status::Approved);
                        Page.Run(Page::"Fuel Transaction List Lite", FuelTransaction);
                    end;
                }

                field(RejectedTransactions; RejectedTransactions)
                {
                    ApplicationArea = All;
                    Caption = 'Rejected';
                    DrillDownPageID = "Fuel Transaction List Lite";

                    trigger OnDrillDown()
                    var
                        FuelTransaction: Record "Fuel Transaction Lite";
                    begin
                        FuelTransaction.SetRange(Status, FuelTransaction.Status::Rejected);
                        Page.Run(Page::"Fuel Transaction List Lite", FuelTransaction);
                    end;
                }
            }

            cuegroup(AmountCues)
            {
                Caption = 'Amounts';

                field(TotalFuelLitres; TotalFuelLitres)
                {
                    ApplicationArea = All;
                    Caption = 'Total Fuel (Litres)';
                    DecimalPlaces = 2 : 2;
                }

                field(TotalAmount; TotalAmount)
                {
                    ApplicationArea = All;
                    Caption = 'Total Cost (USD)';
                    DecimalPlaces = 2 : 2;
                }
            }
        }
    }

    var
        TotalTransactions: Integer;
        PendingTransactions: Integer;
        ApprovedTransactions: Integer;
        RejectedTransactions: Integer;
        TotalFuelLitres: Decimal;
        TotalAmount: Decimal;

    trigger OnOpenPage()
    begin
        CalculateCues();
    end;

    trigger OnAfterGetCurrRecord()
    begin
        CalculateCues();
    end;

    local procedure CalculateCues()
    var
        FuelTransaction: Record "Fuel Transaction Lite";
    begin
        // Reset counters
        TotalTransactions := 0;
        PendingTransactions := 0;
        ApprovedTransactions := 0;
        RejectedTransactions := 0;
        TotalFuelLitres := 0;
        TotalAmount := 0;

        // Count all transactions
        TotalTransactions := FuelTransaction.Count;

        // Count by status
        FuelTransaction.SetRange(Status, FuelTransaction.Status::Pending);
        PendingTransactions := FuelTransaction.Count;

        FuelTransaction.SetRange(Status, FuelTransaction.Status::Approved);
        ApprovedTransactions := FuelTransaction.Count;

        FuelTransaction.SetRange(Status, FuelTransaction.Status::Rejected);
        RejectedTransactions := FuelTransaction.Count;

        // Calculate totals for approved transactions only
        FuelTransaction.SetRange(Status, FuelTransaction.Status::Approved);
        if FuelTransaction.FindSet() then begin
            repeat
                TotalFuelLitres += FuelTransaction."Fuel Amount (Litres)";
                TotalAmount += FuelTransaction."Total Amount";
            until FuelTransaction.Next() = 0;
        end;

        // Clear filters
        FuelTransaction.SetRange(Status);
    end;
}
