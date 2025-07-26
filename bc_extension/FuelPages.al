// Fuel Transaction List Page
page 50110 "Fuel Transaction List Lite"
{
    PageType = List;
    ApplicationArea = All;
    UsageCategory = Lists;
    SourceTable = "Fuel Transaction Lite";
    Caption = 'Fuel Transactions';
    CardPageId = 50111;
    Editable = false;

    layout
    {
        area(Content)
        {
            repeater(Transactions)
            {
                field("No."; Rec."No.")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction number';
                }

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

                field("Rate per Litre"; Rec."Rate per Litre")
                {
                    ApplicationArea = All;
                    ToolTip = 'Rate per litre in USD';
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

                field("Department"; Rec."Department")
                {
                    ApplicationArea = All;
                    ToolTip = 'Department';
                }

                field("Vehicle Registration"; Rec."Vehicle Registration")
                {
                    ApplicationArea = All;
                    ToolTip = 'Vehicle registration number';
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(NewTransaction)
            {
                ApplicationArea = All;
                Caption = 'New Transaction';
                Image = New;
                Promoted = true;
                PromotedCategory = New;

                trigger OnAction()
                var
                    FuelTransaction: Record "Fuel Transaction Lite";
                    FuelTransactionCard: Page "Fuel Transaction Card Lite";
                begin
                    FuelTransaction.Init();
                    FuelTransactionCard.SetRecord(FuelTransaction);
                    FuelTransactionCard.Run();
                end;
            }

            action(ApproveTransaction)
            {
                ApplicationArea = All;
                Caption = 'Approve';
                Image = Approve;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                begin
                    if Confirm('Approve this fuel transaction?') then begin
                        Rec.Status := Rec.Status::Approved;
                        Rec.Modify(true);
                        Message('Transaction approved successfully.');
                    end;
                end;
            }

            action(RejectTransaction)
            {
                ApplicationArea = All;
                Caption = 'Reject';
                Image = Reject;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                begin
                    if Confirm('Reject this fuel transaction?') then begin
                        Rec.Status := Rec.Status::Rejected;
                        Rec.Modify(true);
                        Message('Transaction rejected.');
                    end;
                end;
            }

            action(ViewPendingTransactions)
            {
                ApplicationArea = All;
                Caption = 'Pending Transactions';
                Image = Filter;
                Promoted = true;
                PromotedCategory = Category4;

                trigger OnAction()
                begin
                    Rec.SetRange(Status, Rec.Status::Pending);
                    CurrPage.Update(false);
                end;
            }

            action(ViewAllTransactions)
            {
                ApplicationArea = All;
                Caption = 'All Transactions';
                Image = ClearFilter;
                Promoted = true;
                PromotedCategory = Category4;

                trigger OnAction()
                begin
                    Rec.SetRange(Status);
                    CurrPage.Update(false);
                end;
            }

            action(ExportToExcel)
            {
                ApplicationArea = All;
                Caption = 'Export to Excel';
                Image = Export;
                Promoted = true;
                PromotedCategory = Category5;

                trigger OnAction()
                begin
                    ExportTransactionsToExcel();
                end;
            }
        }

        area(Navigation)
        {
            action(FuelRatesSetup)
            {
                ApplicationArea = All;
                Caption = 'Fuel Rates Setup';
                Image = Setup;
                RunObject = Page "Fuel Rates Setup Page";
                Promoted = true;
                PromotedCategory = Category4;
            }
        }
    }

    local procedure ExportTransactionsToExcel()
    var
        FuelTransaction: Record "Fuel Transaction Lite";
        RowNo: Integer;
    begin
        // This is a simplified export - in a real scenario you'd use proper Excel export
        Message('Excel export functionality would be implemented here.\Current filter shows %1 transactions.', Rec.Count);
    end;
}

// Fuel Transaction Card Page
page 50111 "Fuel Transaction Card Lite"
{
    PageType = Card;
    ApplicationArea = All;
    SourceTable = "Fuel Transaction Lite";
    Caption = 'Fuel Transaction';

    layout
    {
        area(Content)
        {
            group(General)
            {
                Caption = 'General Information';

                field("No."; Rec."No.")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction number';
                    Editable = false;
                }

                field("Transaction Date"; Rec."Transaction Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction date';
                }

                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction status';
                }
            }

            group(Employee)
            {
                Caption = 'Employee Information';

                field("Employee Code"; Rec."Employee Code")
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee code';

                    trigger OnValidate()
                    begin
                        UpdateFuelRates();
                    end;
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
            }

            group(FuelDetails)
            {
                Caption = 'Fuel Details';

                field("Fuel Type"; Rec."Fuel Type")
                {
                    ApplicationArea = All;
                    ToolTip = 'Type of fuel';

                    trigger OnValidate()
                    begin
                        UpdateFuelRates();
                    end;
                }

                field("Fuel Amount (Litres)"; Rec."Fuel Amount (Litres)")
                {
                    ApplicationArea = All;
                    ToolTip = 'Amount of fuel in litres';

                    trigger OnValidate()
                    begin
                        Rec.CalculateTotalAmount();
                    end;
                }

                field("Rate per Litre"; Rec."Rate per Litre")
                {
                    ApplicationArea = All;
                    ToolTip = 'Rate per litre in USD';

                    trigger OnValidate()
                    begin
                        Rec.CalculateTotalAmount();
                    end;
                }

                field("Total Amount"; Rec."Total Amount")
                {
                    ApplicationArea = All;
                    ToolTip = 'Total amount in USD';
                    Editable = false;
                }
            }

            group(VehicleDetails)
            {
                Caption = 'Vehicle & Purpose';

                field("Vehicle Registration"; Rec."Vehicle Registration")
                {
                    ApplicationArea = All;
                    ToolTip = 'Vehicle registration number';
                }

                field("Purpose"; Rec."Purpose")
                {
                    ApplicationArea = All;
                    ToolTip = 'Purpose or reason for fuel request';
                    MultiLine = true;
                }
            }

            group(AuditInfo)
            {
                Caption = 'Audit Information';

                field("Created Date"; Rec."Created Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Date and time when transaction was created';
                    Editable = false;
                }

                field("Created By"; Rec."Created By")
                {
                    ApplicationArea = All;
                    ToolTip = 'User who created the transaction';
                    Editable = false;
                }

                field("Approved Date"; Rec."Approved Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Date and time when transaction was approved';
                    Editable = false;
                }

                field("Approved By"; Rec."Approved By")
                {
                    ApplicationArea = All;
                    ToolTip = 'User who approved the transaction';
                    Editable = false;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(Approve)
            {
                ApplicationArea = All;
                Caption = 'Approve';
                Image = Approve;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                begin
                    if Confirm('Approve this fuel transaction?') then begin
                        Rec.Status := Rec.Status::Approved;
                        Rec.Modify(true);
                        Message('Transaction approved successfully.');
                    end;
                end;
            }

            action(Reject)
            {
                ApplicationArea = All;
                Caption = 'Reject';
                Image = Reject;
                Promoted = true;
                PromotedCategory = Process;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                begin
                    if Confirm('Reject this fuel transaction?') then begin
                        Rec.Status := Rec.Status::Rejected;
                        Rec.Modify(true);
                        Message('Transaction rejected.');
                    end;
                end;
            }

            action(PrintTransaction)
            {
                ApplicationArea = All;
                Caption = 'Print';
                Image = Print;
                Promoted = true;
                PromotedCategory = Category4;

                trigger OnAction()
                begin
                    PrintFuelTransaction();
                end;
            }
        }
    }

    local procedure UpdateFuelRates()
    var
        FuelRatesSetup: Record "Fuel Rates Setup";
    begin
        if FuelRatesSetup.Get() then begin
            case Rec."Fuel Type" of
                Rec."Fuel Type"::Petrol:
                    Rec."Rate per Litre" := FuelRatesSetup."Petrol Rate USD";
                Rec."Fuel Type"::Diesel:
                    Rec."Rate per Litre" := FuelRatesSetup."Diesel Rate USD";
            end;
            Rec.CalculateTotalAmount();
        end;
    end;

    local procedure PrintFuelTransaction()
    begin
        Message('Print functionality would generate a fuel voucher/receipt here.');
    end;
}
