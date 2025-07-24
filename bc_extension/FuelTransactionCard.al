// Card page for individual Fuel Transaction
page 50104 "Fuel Transaction Card"
{
    PageType = Card;
    ApplicationArea = All;
    SourceTable = "Fuel Transaction";
    Caption = 'Fuel Transaction Card';

    layout
    {
        area(Content)
        {
            group(General)
            {
                Caption = 'General';

                field("Transaction No."; Rec."Transaction No.")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction number from Business Central';
                    Editable = false;
                }

                field("Employee No."; Rec."Employee No.")
                {
                    ApplicationArea = All;
                    ToolTip = 'Employee number who requested fuel';

                    trigger OnValidate()
                    var
                        Employee: Record Employee;
                    begin
                        if Employee.Get(Rec."Employee No.") then
                            EmployeeName := Employee."First Name" + ' ' + Employee."Last Name"
                        else
                            EmployeeName := '';
                    end;
                }

                field(EmployeeName; EmployeeName)
                {
                    ApplicationArea = All;
                    Caption = 'Employee Name';
                    ToolTip = 'Name of the employee';
                    Editable = false;
                }

                field("Transaction Date"; Rec."Transaction Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Date of the fuel transaction';
                }

                field("Fuel Amount"; Rec."Fuel Amount")
                {
                    ApplicationArea = All;
                    ToolTip = 'Amount of fuel in liters';
                }

                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    ToolTip = 'Current status of the transaction';

                    trigger OnValidate()
                    begin
                        if Rec.Status = Rec.Status::Approved then
                            ProcessApproval()
                        else if Rec.Status = Rec.Status::Rejected then
                            ProcessRejection();
                    end;
                }
            }

            group(Integration)
            {
                Caption = 'Django Integration';

                field("Django Transaction ID"; Rec."Django Transaction ID")
                {
                    ApplicationArea = All;
                    ToolTip = 'Transaction ID from Django system';
                    Editable = false;
                }

                field("Created From Django"; Rec."Created From Django")
                {
                    ApplicationArea = All;
                    ToolTip = 'Indicates if this transaction was created from Django';
                    Editable = false;
                }
            }

            group(Posting)
            {
                Caption = 'Posting Information';

                field("Posted"; Rec."Posted")
                {
                    ApplicationArea = All;
                    ToolTip = 'Indicates if the transaction has been posted to G/L';
                    Editable = false;
                }

                field("Posted Date"; Rec."Posted Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Date when the transaction was posted';
                    Editable = false;
                }

                field(CalculatedAmount; CalculatedAmount)
                {
                    ApplicationArea = All;
                    Caption = 'Calculated Amount';
                    ToolTip = 'Calculated monetary amount based on fuel rate';
                    Editable = false;
                    DecimalPlaces = 2 : 2;
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
                Caption = 'Approve Transaction';
                Image = Approve;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                begin
                    if Confirm('Do you want to approve this fuel transaction?') then begin
                        Rec.Status := Rec.Status::Approved;
                        Rec.Modify(true);
                        ProcessApproval();
                        Message('Transaction approved successfully.');
                    end;
                end;
            }

            action(Reject)
            {
                ApplicationArea = All;
                Caption = 'Reject Transaction';
                Image = Reject;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = Rec.Status = Rec.Status::Pending;

                trigger OnAction()
                var
                    RejectionReason: Text;
                begin
                    RejectionReason := '';
                    if Dialog.Confirm('Do you want to reject this fuel transaction?') then begin
                        if Dialog.Input(RejectionReason, 'Enter rejection reason:') then begin
                            Rec.Status := Rec.Status::Rejected;
                            Rec.Modify(true);
                            ProcessRejection();
                            Message('Transaction rejected successfully.');
                        end;
                    end;
                end;
            }

            action(PostTransaction)
            {
                ApplicationArea = All;
                Caption = 'Post to G/L';
                Image = Post;
                PromotedCategory = Process;
                Promoted = true;
                Enabled = (Rec.Status = Rec.Status::Approved) and (not Rec.Posted);

                trigger OnAction()
                begin
                    if Confirm('Do you want to post this transaction to General Ledger?') then begin
                        PostFuelTransaction();
                        Message('Transaction posted successfully.');
                    end;
                end;
            }

            action(SyncWithDjango)
            {
                ApplicationArea = All;
                Caption = 'Sync with Django';
                Image = Sync;
                PromotedCategory = Navigate;
                Promoted = true;

                trigger OnAction()
                begin
                    SyncTransactionWithDjango();
                end;
            }

            action(OpenInDjango)
            {
                ApplicationArea = All;
                Caption = 'Open in Fuel System';
                Image = Web;
                PromotedCategory = Navigate;
                Promoted = true;

                trigger OnAction()
                var
                    DjangoUrl: Text;
                begin
                    if Rec."Django Transaction ID" <> '' then begin
                        DjangoUrl := 'https://parliament-fuel-system.azurewebsites.net/transactions/' + Rec."Django Transaction ID" + '/';
                        Hyperlink(DjangoUrl);
                    end else begin
                        Hyperlink('https://parliament-fuel-system.azurewebsites.net/bc/dashboard/');
                    end;
                end;
            }
        }
    }

    var
        EmployeeName: Text[100];
        CalculatedAmount: Decimal;

    trigger OnAfterGetRecord()
    var
        Employee: Record Employee;
        FuelSetup: Record "Fuel System Setup";
    begin
        // Update employee name
        if Employee.Get(Rec."Employee No.") then
            EmployeeName := Employee."First Name" + ' ' + Employee."Last Name"
        else
            EmployeeName := '';

        // Calculate amount
        if FuelSetup.Get() then
            CalculatedAmount := Rec."Fuel Amount" * FuelSetup."Fuel Rate per Liter"
        else
            CalculatedAmount := 0;
    end;

    local procedure ProcessApproval()
    var
        FuelIntegration: Codeunit "Fuel System Integration";
    begin
        // Send approval to Django
        SendStatusUpdateToDjango('approved');

        // Post to G/L if auto-posting is enabled
        if ShouldAutoPost() then
            PostFuelTransaction();
    end;

    local procedure ProcessRejection()
    begin
        // Send rejection to Django
        SendStatusUpdateToDjango('rejected');
    end;

    local procedure SendStatusUpdateToDjango(NewStatus: Text)
    var
        HttpClient: HttpClient;
        HttpRequestMessage: HttpRequestMessage;
        HttpResponseMessage: HttpResponseMessage;
        RequestBody: Text;
        ResponseText: Text;
        WebhookUrl: Text;
        JsonObject: JsonObject;
        EntityData: JsonObject;
    begin
        // Build request body
        EntityData.Add('bc_transaction_id', Rec."Transaction No.");
        EntityData.Add('django_transaction_id', Rec."Django Transaction ID");
        EntityData.Add('status', NewStatus);
        EntityData.Add('updated_by', UserId);
        EntityData.Add('updated_date', Format(CurrentDateTime, 0, 9));

        JsonObject.Add('eventType', 'transaction_status_updated');
        JsonObject.Add('entityData', EntityData);
        JsonObject.WriteTo(RequestBody);

        // Send to Django
        WebhookUrl := 'https://parliament-fuel-system.azurewebsites.net/api/bc/webhook/';

        HttpRequestMessage.Method := 'POST';
        HttpRequestMessage.SetRequestUri(WebhookUrl);
        HttpRequestMessage.Content.WriteFrom(RequestBody);
        HttpRequestMessage.Content.GetHeaders.Clear();
        HttpRequestMessage.Content.GetHeaders.Add('Content-Type', 'application/json');

        if HttpClient.Send(HttpRequestMessage, HttpResponseMessage) then begin
            HttpResponseMessage.Content.ReadAs(ResponseText);
            // Log success
        end else begin
            Message('Failed to sync status with Django system');
        end;
    end;

    local procedure PostFuelTransaction()
    var
        FuelSetup: Record "Fuel System Setup";
        GenJournalLine: Record "Gen. Journal Line";
        GenJournalBatch: Record "Gen. Journal Batch";
        LineNo: Integer;
        TotalAmount: Decimal;
        Employee: Record Employee;
    begin
        if Rec.Posted then
            exit;

        // Get setup
        FuelSetup.Get();
        FuelSetup.TestField("Journal Template");
        FuelSetup.TestField("Journal Batch");
        FuelSetup.TestField("Fuel Expense Account");
        FuelSetup.TestField("Fuel Payable Account");
        FuelSetup.TestField("Fuel Rate per Liter");

        // Calculate total amount
        TotalAmount := Rec."Fuel Amount" * FuelSetup."Fuel Rate per Liter";

        // Get employee info
        Employee.Get(Rec."Employee No.");

        // Get next line number
        GenJournalLine.SetRange("Journal Template Name", FuelSetup."Journal Template");
        GenJournalLine.SetRange("Journal Batch Name", FuelSetup."Journal Batch");
        if GenJournalLine.FindLast() then
            LineNo := GenJournalLine."Line No." + 10000
        else
            LineNo := 10000;

        // Create expense entry
        GenJournalLine.Init();
        GenJournalLine."Journal Template Name" := FuelSetup."Journal Template";
        GenJournalLine."Journal Batch Name" := FuelSetup."Journal Batch";
        GenJournalLine."Line No." := LineNo;
        GenJournalLine."Posting Date" := Rec."Transaction Date";
        GenJournalLine."Document No." := Rec."Transaction No.";
        GenJournalLine."Account Type" := GenJournalLine."Account Type"::"G/L Account";
        GenJournalLine."Account No." := FuelSetup."Fuel Expense Account";
        GenJournalLine.Description := StrSubstNo('Fuel: %1 (%2L)',
            Employee."First Name" + ' ' + Employee."Last Name", Rec."Fuel Amount");
        GenJournalLine.Amount := TotalAmount;
        GenJournalLine."Bal. Account Type" := GenJournalLine."Bal. Account Type"::"G/L Account";
        GenJournalLine."Bal. Account No." := FuelSetup."Fuel Payable Account";
        GenJournalLine.Insert();

        // Post the journal line
        CODEUNIT.Run(CODEUNIT::"Gen. Jnl.-Post Line", GenJournalLine);

        // Update transaction
        Rec.Posted := true;
        Rec."Posted Date" := Today;
        Rec.Modify();

        // Update calculated amount
        CalculatedAmount := TotalAmount;
    end;

    local procedure SyncTransactionWithDjango()
    var
        FuelIntegration: Codeunit "Fuel System Integration";
    begin
        if FuelIntegration.SendTransactionToDjango(Rec) then
            Message('Transaction synced successfully with Django')
        else
            Message('Failed to sync transaction with Django');
    end;

    local procedure ShouldAutoPost(): Boolean
    var
        FuelSetup: Record "Fuel System Setup";
    begin
        // Add auto-posting logic based on setup
        exit(false); // For now, manual posting only
    end;
}
