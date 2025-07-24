// List Page for Fuel Transactions
page 50105 "Fuel Transaction List"
{
    PageType = List;
    ApplicationArea = All;
    UsageCategory = Lists;
    SourceTable = "Fuel Transaction";
    Caption = 'Fuel Transactions';
    CardPageId = "Fuel Transaction Card";
    Editable = false;

    layout
    {
        area(Content)
        {
            repeater(Transactions)
            {
                field("Transaction No."; Rec."Transaction No.")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction number';
                }

                field("Employee No."; Rec."Employee No.")
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee number';
                }

                field("Transaction Date"; Rec."Transaction Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction date';
                }

                field("Fuel Amount"; Rec."Fuel Amount")
                {
                    ApplicationArea = All;
                    ToolTip = 'Fuel amount in liters';
                }

                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction status';
                }

                field("Posted"; Rec."Posted")
                {
                    ApplicationArea = All;
                    ToolTip = 'Posted to general ledger';
                }

                field("Django Transaction ID"; Rec."Django Transaction ID")
                {
                    ApplicationArea = All;
                    ToolTip = 'Django system ID';
                    Visible = false;
                }
            }
        }

        area(FactBoxes)
        {
            part(EmployeeFactBox; "Employee Picture")
            {
                ApplicationArea = All;
                SubPageLink = "No." = field("Employee No.");
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
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                var
                    FuelIntegration: Codeunit "Fuel System Integration";
                begin
                    if Confirm('Approve selected transaction?') then begin
                        Rec.Status := Rec.Status::Approved;
                        Rec.Modify();

                        // Send to Django
                        FuelIntegration.SendTransactionToDjango(Rec);

                        Message('Transaction approved successfully.');
                    end;
                end;
            }

            action(Reject)
            {
                ApplicationArea = All;
                Caption = 'Reject';
                Image = Reject;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                var
                    FuelIntegration: Codeunit "Fuel System Integration";
                begin
                    if Confirm('Reject selected transaction?') then begin
                        Rec.Status := Rec.Status::Rejected;
                        Rec.Modify();

                        // Send to Django
                        FuelIntegration.SendTransactionToDjango(Rec);

                        Message('Transaction rejected successfully.');
                    end;
                end;
            }

            action(SyncWithDjango)
            {
                ApplicationArea = All;
                Caption = 'Sync with Django';
                Image = Sync;
                PromotedCategory = Process;
                Promoted = true;

                trigger OnAction()
                var
                    FuelIntegration: Codeunit "Fuel System Integration";
                begin
                    if FuelIntegration.SendTransactionToDjango(Rec) then
                        Message('Sync completed successfully.')
                    else
                        Error('Sync failed. Check setup and try again.');
                end;
            }

            action(OpenDjangoApp)
            {
                ApplicationArea = All;
                Caption = 'Open Django App';
                Image = Web;
                PromotedCategory = Navigate;
                Promoted = true;

                trigger OnAction()
                var
                    FuelSetup: Record "Fuel System Setup";
                begin
                    if FuelSetup.Get() then begin
                        if FuelSetup."Django Base URL" <> '' then
                            Hyperlink(FuelSetup."Django Base URL" + 'fuel/transactions/')
                        else
                            Message('Django Base URL not configured in setup.');
                    end else
                        Message('Fuel System Setup not found.');
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
                RunObject = page "Fuel System Setup";
                PromotedCategory = Process;
                Promoted = true;
            }
        }
    }

    trigger OnOpenPage()
    begin
        // Set filters for relevant transactions
        Rec.SetCurrentKey(Status);
    end;
}
