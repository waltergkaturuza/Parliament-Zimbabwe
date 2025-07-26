// Card Page for Individual Fuel Transaction
page 50131 "Simple Fuel Transaction"
{
    PageType = Card;
    ApplicationArea = All;
    SourceTable = "Simple Fuel Transaction";
    Caption = 'Parliament Fuel Transaction';

    layout
    {
        area(Content)
        {
            group(General)
            {
                Caption = 'General Information';

                field("Entry No."; Rec."Entry No.")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction entry number';
                    Editable = false;
                }

                field("Employee Code"; Rec."Employee Code")
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee code requesting fuel';
                }

                field("Employee Name"; Rec."Employee Name")
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee name';
                }

                field(Department; Rec.Department)
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee department';
                }

                field("Transaction Date"; Rec."Transaction Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Date of fuel transaction';
                }

                field("Transaction Time"; Rec."Transaction Time")
                {
                    ApplicationArea = All;
                    ToolTip = 'Time of fuel transaction';
                }

                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction status';
                    Editable = false;
                }
            }

            group(FuelDetails)
            {
                Caption = 'Fuel Details';

                field("Fuel Type"; Rec."Fuel Type")
                {
                    ApplicationArea = All;
                    ToolTip = 'Type of fuel (Petrol/Diesel)';

                    trigger OnValidate()
                    begin
                        UpdateFuelRate();
                    end;
                }

                field("Fuel Amount Liters"; Rec."Fuel Amount Liters")
                {
                    ApplicationArea = All;
                    ToolTip = 'Amount of fuel in liters';

                    trigger OnValidate()
                    begin
                        ValidateFuelAmount();
                    end;
                }

                field("Rate per Liter USD"; Rec."Rate per Liter USD")
                {
                    ApplicationArea = All;
                    ToolTip = 'Rate per liter in USD';
                }

                field("Total Amount USD"; Rec."Total Amount USD")
                {
                    ApplicationArea = All;
                    ToolTip = 'Total cost in USD';
                    Editable = false;
                    Style = Strong;
                    StyleExpr = true;
                }
            }

            group(VehicleInfo)
            {
                Caption = 'Vehicle Information';

                field("Vehicle Registration"; Rec."Vehicle Registration")
                {
                    ApplicationArea = All;
                    ToolTip = 'Vehicle registration number';
                }

                field("Odometer Reading"; Rec."Odometer Reading")
                {
                    ApplicationArea = All;
                    ToolTip = 'Current odometer reading in kilometers';
                }
            }

            group(References)
            {
                Caption = 'References';

                field("Request Reference"; Rec."Request Reference")
                {
                    ApplicationArea = All;
                    ToolTip = 'Internal request reference';
                }

                field("Approval Reference"; Rec."Approval Reference")
                {
                    ApplicationArea = All;
                    ToolTip = 'Approval reference';
                    Editable = false;
                }

                field(Notes; Rec.Notes)
                {
                    ApplicationArea = All;
                    ToolTip = 'Additional notes';
                    MultiLine = true;
                }
            }

            group(SystemInfo)
            {
                Caption = 'System Information';

                field("Created Date"; Rec."Created Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Date and time transaction was created';
                    Editable = false;
                }

                field("Created By"; Rec."Created By")
                {
                    ApplicationArea = All;
                    ToolTip = 'User who created the transaction';
                    Editable = false;
                }

                field("Django Sync Status"; Rec."Django Sync Status")
                {
                    ApplicationArea = All;
                    ToolTip = 'Synchronization status with Django system';
                    Editable = false;
                }

                field("Django Transaction ID"; Rec."Django Transaction ID")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction ID in Django system';
                    Editable = false;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(ApproveFuel)
            {
                ApplicationArea = All;
                Caption = 'Approve';
                Image = Approve;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                begin
                    if Confirm('Approve this fuel transaction?') then begin
                        Rec.ApproveFuelTransaction();
                        Message('Transaction approved successfully.');
                        CurrPage.Update();
                    end;
                end;
            }

            action(RejectFuel)
            {
                ApplicationArea = All;
                Caption = 'Reject';
                Image = Reject;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                begin
                    if Confirm('Reject this fuel transaction?') then begin
                        Rec.RejectFuelTransaction();
                        Message('Transaction rejected.');
                        CurrPage.Update();
                    end;
                end;
            }

            action(PostFuel)
            {
                ApplicationArea = All;
                Caption = 'Post to Accounts';
                Image = Post;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Approved;

                trigger OnAction()
                begin
                    if Confirm('Post this transaction to accounts?') then begin
                        Rec.PostFuelTransaction();
                        Message('Transaction posted successfully.');
                        CurrPage.Update();
                    end;
                end;
            }

            action(SyncDjango)
            {
                ApplicationArea = All;
                Caption = 'Sync with Django';
                Image = Refresh;
                PromotedCategory = Process;
                Promoted = true;

                trigger OnAction()
                begin
                    SyncWithDjango();
                end;
            }
        }

        area(Navigate)
        {
            action(AllTransactions)
            {
                ApplicationArea = All;
                Caption = 'All Transactions';
                Image = List;
                RunObject = page "Simple Fuel Transactions";
            }

            action(Setup)
            {
                ApplicationArea = All;
                Caption = 'Setup';
                Image = Setup;
                RunObject = page "Simple Fuel Setup";
            }
        }
    }

    trigger OnNewRecord(BelowxRec: Boolean)
    begin
        // Set defaults for new records
        Rec."Transaction Date" := Today;
        Rec."Transaction Time" := Time;
        Rec.Status := Rec.Status::Pending;

        // Set default fuel rate
        UpdateFuelRate();

        // Set default employee info if setup exists
        SetDefaultEmployeeInfo();
    end;

    local procedure UpdateFuelRate()
    var
        FuelSetup: Record "Simple Fuel Setup";
    begin
        if FuelSetup.Get() then begin
            case Rec."Fuel Type" of
                Rec."Fuel Type"::Petrol:
                    Rec."Rate per Liter USD" := FuelSetup."Petrol Rate USD";
                Rec."Fuel Type"::Diesel:
                    Rec."Rate per Liter USD" := FuelSetup."Diesel Rate USD";
            end;
        end;
    end;

    local procedure ValidateFuelAmount()
    var
        FuelSetup: Record "Simple Fuel Setup";
    begin
        if FuelSetup.Get() then begin
            if (FuelSetup."Max Fuel per Transaction" > 0) and
               (Rec."Fuel Amount Liters" > FuelSetup."Max Fuel per Transaction") then
                Error('Fuel amount cannot exceed %1 liters per transaction.', FuelSetup."Max Fuel per Transaction");
        end;
    end;

    local procedure SetDefaultEmployeeInfo()
    var
        FuelSetup: Record "Simple Fuel Setup";
    begin
        if FuelSetup.Get() then begin
            if Rec.Department = '' then
                Rec.Department := FuelSetup."Default Department";
        end;
    end;

    local procedure SyncWithDjango()
    var
        FuelSetup: Record "Simple Fuel Setup";
    begin
        if FuelSetup.Get() and FuelSetup."Integration Enabled" then begin
            Rec."Django Sync Status" := Rec."Django Sync Status"::Pending;
            Rec."Last Sync Attempt" := CurrentDateTime;
            Rec.Modify();

            // Simulate sync (in real implementation, this would call Django API)
            Message('Sync with Django initiated. Transaction will be synchronized with the fuel management system.');
        end else begin
            Message('Django integration is not enabled in setup.');
        end;
    end;
}
