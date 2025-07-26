// Fuel Rates Setup Page
page 50203 "Fuel Rates Setup"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    SourceTable = "Fuel Rates Setup";
    Caption = 'Fuel Rates Setup';
    InsertAllowed = false;
    DeleteAllowed = false;

    layout
    {
        area(Content)
        {
            group(FuelRates)
            {
                Caption = 'Current Fuel Rates (USD)';

                field("Petrol Rate USD"; Rec."Petrol Rate USD")
                {
                    ApplicationArea = All;
                    ToolTip = 'Current petrol rate in USD per litre';
                }

                field("Diesel Rate USD"; Rec."Diesel Rate USD")
                {
                    ApplicationArea = All;
                    ToolTip = 'Current diesel rate in USD per litre';
                }
            }

            group(Integration)
            {
                Caption = 'Django Integration';

                field("Integration Enabled"; Rec."Integration Enabled")
                {
                    ApplicationArea = All;
                    ToolTip = 'Enable integration with Django fuel system';
                }

                field("Django Integration URL"; Rec."Django Integration URL")
                {
                    ApplicationArea = All;
                    ToolTip = 'URL for Django system integration';
                }
            }

            group(AuditInfo)
            {
                Caption = 'Last Update Information';

                field("Last Updated"; Rec."Last Updated")
                {
                    ApplicationArea = All;
                    ToolTip = 'Date and time of last update';
                    Editable = false;
                }

                field("Updated By"; Rec."Updated By")
                {
                    ApplicationArea = All;
                    ToolTip = 'User who last updated the rates';
                    Editable = false;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(UpdateRatesFromDjango)
            {
                ApplicationArea = All;
                Caption = 'Update from Django';
                Image = Refresh;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = Rec."Integration Enabled" and (Rec."Django Integration URL" <> '');

                trigger OnAction()
                begin
                    UpdateRatesFromDjangoAPI();
                end;
            }

            action(TestConnection)
            {
                ApplicationArea = All;
                Caption = 'Test Django Connection';
                Image = TestDatabase;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = Rec."Django Integration URL" <> '';

                trigger OnAction()
                begin
                    TestDjangoConnection();
                end;
            }

            action(ViewTransactions)
            {
                ApplicationArea = All;
                Caption = 'View Fuel Transactions';
                Image = List;
                RunObject = page 50201;
                Promoted = true;
                PromotedCategory = Category4;
            }
        }
    }

    trigger OnOpenPage()
    begin
        Rec.Reset();
        if not Rec.Get() then begin
            Rec.Init();
            Rec."Primary Key" := '';
            Rec."Petrol Rate USD" := 1.45;
            Rec."Diesel Rate USD" := 1.40;
            Rec."Django Integration URL" := 'https://parliament-fuel-system.azurewebsites.net/';
            Rec."Integration Enabled" := false;
            Rec.Insert();
        end;
    end;

    local procedure UpdateRatesFromDjangoAPI()
    begin
        // Simplified implementation - would use HTTP requests in full version
        Message('Django integration would update fuel rates here.\Current rates:\Petrol: $%1\Diesel: $%2',
                Rec."Petrol Rate USD", Rec."Diesel Rate USD");
    end;

    local procedure TestDjangoConnection()
    begin
        // Simplified implementation - would test actual HTTP connection
        Message('Django connection test would verify connectivity to:\%1', Rec."Django Integration URL");
    end;
}

// Fuel Summary Report Page
page 50204 "Fuel Usage Summary"
{
    PageType = List;
    ApplicationArea = All;
    UsageCategory = ReportsAndAnalysis;
    SourceTable = "Fuel Transaction Lite";
    Caption = 'Fuel Usage Summary';
    Editable = false;

    layout
    {
        area(Content)
        {
            repeater(Summary)
            {
                field("Employee Code"; Rec."Employee Code")
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee code';
                }

                field("Employee Name"; Rec."Employee Name")
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee name';
                }

                field("Department"; Rec."Department")
                {
                    ApplicationArea = All;
                    ToolTip = 'Department';
                }

                field("Transaction Date"; Rec."Transaction Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction date';
                }

                field("Fuel Type"; Rec."Fuel Type")
                {
                    ApplicationArea = All;
                    ToolTip = 'Type of fuel';
                }

                field("Fuel Amount (Litres)"; Rec."Fuel Amount (Litres)")
                {
                    ApplicationArea = All;
                    ToolTip = 'Amount of fuel in litres';
                }

                field("Total Amount"; Rec."Total Amount")
                {
                    ApplicationArea = All;
                    ToolTip = 'Total amount in USD';
                }

                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction status';
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(FilterByEmployee)
            {
                ApplicationArea = All;
                Caption = 'Filter by Employee';
                Image = Filter;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                var
                    EmployeeCode: Code[20];
                begin
                    EmployeeCode := '';
                    if Page.RunModal(0, EmployeeCode) = Action::OK then begin
                        Rec.SetRange("Employee Code", EmployeeCode);
                        CurrPage.Update(false);
                    end;
                end;
            }

            action(FilterByDepartment)
            {
                ApplicationArea = All;
                Caption = 'Filter by Department';
                Image = Filter;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                var
                    Department: Text[50];
                begin
                    Department := '';
                    if Page.RunModal(0, Department) = Action::OK then begin
                        Rec.SetRange("Department", Department);
                        CurrPage.Update(false);
                    end;
                end;
            }

            action(FilterByDateRange)
            {
                ApplicationArea = All;
                Caption = 'Filter by Date Range';
                Image = DateRange;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                var
                    FromDate: Date;
                    ToDate: Date;
                begin
                    FromDate := CalcDate('-1M', Today);
                    ToDate := Today;

                    if Page.RunModal(0, FromDate) = Action::OK then begin
                        if Page.RunModal(0, ToDate) = Action::OK then begin
                            Rec.SetRange("Transaction Date", FromDate, ToDate);
                            CurrPage.Update(false);
                        end;
                    end;
                end;
            }

            action(ClearFilters)
            {
                ApplicationArea = All;
                Caption = 'Clear All Filters';
                Image = ClearFilter;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                begin
                    Rec.SetRange("Employee Code");
                    Rec.SetRange("Department");
                    Rec.SetRange("Transaction Date");
                    Rec.SetRange(Status);
                    CurrPage.Update(false);
                end;
            }

            action(ShowStatistics)
            {
                ApplicationArea = All;
                Caption = 'Show Statistics';
                Image = Statistics;
                Promoted = true;
                PromotedCategory = Category4;

                trigger OnAction()
                begin
                    ShowFuelStatistics();
                end;
            }
        }
    }

    trigger OnOpenPage()
    begin
        // Show only approved transactions by default
        Rec.SetRange(Status, Rec.Status::Approved);
    end;

    local procedure ShowFuelStatistics()
    var
        FuelTransaction: Record "Fuel Transaction Lite";
        TotalLitres: Decimal;
        TotalAmount: Decimal;
        PetrolLitres: Decimal;
        DieselLitres: Decimal;
        TransactionCount: Integer;
        StatisticsText: Text;
    begin
        FuelTransaction.CopyFilters(Rec);

        if FuelTransaction.FindSet() then begin
            repeat
                TotalLitres += FuelTransaction."Fuel Amount (Litres)";
                TotalAmount += FuelTransaction."Total Amount";
                TransactionCount += 1;

                case FuelTransaction."Fuel Type" of
                    FuelTransaction."Fuel Type"::Petrol:
                        PetrolLitres += FuelTransaction."Fuel Amount (Litres)";
                    FuelTransaction."Fuel Type"::Diesel:
                        DieselLitres += FuelTransaction."Fuel Amount (Litres)";
                end;
            until FuelTransaction.Next() = 0;
        end;

        StatisticsText := StrSubstNo('FUEL USAGE STATISTICS\' +
                                   '===================\' +
                                   'Total Transactions: %1\' +
                                   'Total Fuel: %2 litres\' +
                                   'Total Cost: $%3\' +
                                   'Petrol: %4 litres\' +
                                   'Diesel: %5 litres\' +
                                   'Average per Transaction: %6 litres',
                                   TransactionCount,
                                   Round(TotalLitres, 0.01),
                                   Round(TotalAmount, 0.01),
                                   Round(PetrolLitres, 0.01),
                                   Round(DieselLitres, 0.01),
                                   Round(TotalLitres / TransactionCount, 0.01));

        Message(StatisticsText);
    end;
}
