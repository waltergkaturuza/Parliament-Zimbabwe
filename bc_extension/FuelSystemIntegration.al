// Codeunit for handling Business Central and Django integration
codeunit 50110 "Fuel System Integration"
{
    trigger OnRun()
    begin
    end;
    
    procedure SendTransactionToDjango(FuelTransaction: Record "Fuel Transaction"): Boolean
    var
        FuelSetup: Record "Fuel System Setup";
        HttpClient: HttpClient;
        HttpRequestMessage: HttpRequestMessage;
        HttpResponseMessage: HttpResponseMessage;
        ResponseText: Text;
        RequestBody: Text;
        WebhookUrl: Text;
        Employee: Record Employee;
    begin
        // Get setup
        if not FuelSetup.Get() then
            Error('Fuel System Setup not found.');
            
        if not FuelSetup."Integration Enabled" then
            exit(false);
            
        FuelSetup.TestField("Django Base URL");
        
        // Get employee data
        if Employee.Get(FuelTransaction."Employee No.") then;
        
        // Build request
        WebhookUrl := FuelSetup."Django Base URL" + 'api/bc/webhook/';
        RequestBody := BuildTransactionJson(FuelTransaction, Employee);
        
        // Send request
        HttpRequestMessage.Method := 'POST';
        HttpRequestMessage.SetRequestUri(WebhookUrl);
        HttpRequestMessage.Content.WriteFrom(RequestBody);
        HttpRequestMessage.Content.GetHeaders.Clear();
        HttpRequestMessage.Content.GetHeaders.Add('Content-Type', 'application/json');
        
        if FuelSetup."Webhook Secret" <> '' then
            HttpRequestMessage.GetHeaders.Add('X-Webhook-Secret', FuelSetup."Webhook Secret");
        
        if HttpClient.Send(HttpRequestMessage, HttpResponseMessage) then begin
            HttpResponseMessage.Content.ReadAs(ResponseText);
            
            if HttpResponseMessage.HttpStatusCode = 200 then begin
                ProcessDjangoResponse(ResponseText, FuelTransaction);
                exit(true);
            end else begin
                LogError('Django sync failed', StrSubstNo('Status: %1, Response: %2', 
                    HttpResponseMessage.HttpStatusCode, ResponseText));
                exit(false);
            end;
        end else begin
            LogError('Django connection failed', 'Unable to connect to Django application');
            exit(false);
        end;
    end;
    
    procedure ProcessDjangoWebhook(WebhookData: Text): Boolean
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        EventType: Text;
        EntityData: Text;
    begin
        if not JsonObject.ReadFrom(WebhookData) then
            exit(false);
        
        // Get event type
        if JsonObject.Get('eventType', JsonToken) then
            EventType := JsonToken.AsValue().AsText();
        
        // Process based on event type
        case EventType of
            'transaction_approved':
                ProcessTransactionApproval(WebhookData);
            'transaction_rejected':
                ProcessTransactionRejection(WebhookData);
            'fuel_data_updated':
                ProcessFuelDataUpdate(WebhookData);
            'sync_request':
                ProcessSyncRequest(WebhookData);
            else
                LogError('Unknown webhook event', StrSubstNo('Event Type: %1', EventType));
        end;
        
        exit(true);
    end;
    
    local procedure BuildTransactionJson(FuelTransaction: Record "Fuel Transaction"; Employee: Record Employee): Text
    var
        JsonObject: JsonObject;
        EntityDataObject: JsonObject;
        ResultText: Text;
    begin
        // Main object
        JsonObject.Add('eventType', 'transaction_created');
        JsonObject.Add('timestamp', Format(CurrentDateTime, 0, 9));
        
        // Entity data
        EntityDataObject.Add('transaction_no', FuelTransaction."Transaction No.");
        EntityDataObject.Add('employee_no', FuelTransaction."Employee No.");
        EntityDataObject.Add('employee_name', Employee."First Name" + ' ' + Employee."Last Name");
        EntityDataObject.Add('transaction_date', Format(FuelTransaction."Transaction Date", 0, 9));
        EntityDataObject.Add('fuel_amount', FuelTransaction."Fuel Amount");
        EntityDataObject.Add('status', Format(FuelTransaction.Status));
        EntityDataObject.Add('bc_transaction_id', FuelTransaction."Transaction No.");
        
        JsonObject.Add('entityData', EntityDataObject);
        JsonObject.WriteTo(ResultText);
        
        exit(ResultText);
    end;
    
    local procedure ProcessDjangoResponse(ResponseText: Text; var FuelTransaction: Record "Fuel Transaction")
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        DjangoId: Text;
    begin
        if not JsonObject.ReadFrom(ResponseText) then
            exit;
        
        // Get Django transaction ID
        if JsonObject.Get('transaction_id', JsonToken) then begin
            DjangoId := JsonToken.AsValue().AsText();
            FuelTransaction."Django Transaction ID" := DjangoId;
            FuelTransaction."Created From Django" := false;
            FuelTransaction.Modify();
        end;
    end;
    
    local procedure ProcessTransactionApproval(WebhookData: Text)
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        EntityDataObject: JsonObject;
        TransactionNo: Code[20];
        FuelTransaction: Record "Fuel Transaction";
    begin
        if not JsonObject.ReadFrom(WebhookData) then
            exit;
        
        if JsonObject.Get('entityData', JsonToken) then begin
            EntityDataObject := JsonToken.AsObject();
            
            if EntityDataObject.Get('bc_transaction_id', JsonToken) then begin
                TransactionNo := JsonToken.AsValue().AsCode();
                
                if FuelTransaction.Get(TransactionNo) then begin
                    FuelTransaction.Status := FuelTransaction.Status::Approved;
                    FuelTransaction.Modify();
                    
                    // Post the transaction
                    PostFuelTransactionFromWebhook(FuelTransaction);
                end;
            end;
        end;
    end;
    
    local procedure ProcessTransactionRejection(WebhookData: Text)
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        EntityDataObject: JsonObject;
        TransactionNo: Code[20];
        FuelTransaction: Record "Fuel Transaction";
    begin
        if not JsonObject.ReadFrom(WebhookData) then
            exit;
        
        if JsonObject.Get('entityData', JsonToken) then begin
            EntityDataObject := JsonToken.AsObject();
            
            if EntityDataObject.Get('bc_transaction_id', JsonToken) then begin
                TransactionNo := JsonToken.AsValue().AsCode();
                
                if FuelTransaction.Get(TransactionNo) then begin
                    FuelTransaction.Status := FuelTransaction.Status::Rejected;
                    FuelTransaction.Modify();
                end;
            end;
        end;
    end;
    
    local procedure ProcessFuelDataUpdate(WebhookData: Text)
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        EntityDataObject: JsonObject;
        FuelSetup: Record "Fuel System Setup";
        NewRate: Decimal;
    begin
        if not JsonObject.ReadFrom(WebhookData) then
            exit;
        
        if JsonObject.Get('entityData', JsonToken) then begin
            EntityDataObject := JsonToken.AsObject();
            
            if EntityDataObject.Get('fuel_rate', JsonToken) then begin
                NewRate := JsonToken.AsValue().AsDecimal();
                
                if FuelSetup.Get() then begin
                    FuelSetup."Fuel Rate per Liter" := NewRate;
                    FuelSetup.Modify();
                end;
            end;
        end;
    end;
    
    local procedure ProcessSyncRequest(WebhookData: Text)
    var
        FuelTransaction: Record "Fuel Transaction";
    begin
        // Send all pending transactions to Django
        FuelTransaction.SetRange(Status, FuelTransaction.Status::Pending);
        FuelTransaction.SetRange("Created From Django", false);
        
        if FuelTransaction.FindSet() then
            repeat
                SendTransactionToDjango(FuelTransaction);
            until FuelTransaction.Next() = 0;
    end;
    
    local procedure PostFuelTransactionFromWebhook(FuelTransaction: Record "Fuel Transaction")
    var
        FuelSetup: Record "Fuel System Setup";
        GenJournalLine: Record "Gen. Journal Line";
        LineNo: Integer;
        Employee: Record Employee;
        TotalAmount: Decimal;
    begin
        if FuelTransaction.Posted then
            exit;
        
        FuelSetup.Get();
        FuelSetup.TestField("Journal Template");
        FuelSetup.TestField("Journal Batch");
        FuelSetup.TestField("Fuel Expense Account");
        FuelSetup.TestField("Fuel Payable Account");
        
        // Get last line number
        GenJournalLine.SetRange("Journal Template Name", FuelSetup."Journal Template");
        GenJournalLine.SetRange("Journal Batch Name", FuelSetup."Journal Batch");
        if GenJournalLine.FindLast() then
            LineNo := GenJournalLine."Line No." + 10000
        else
            LineNo := 10000;
        
        // Calculate total amount
        TotalAmount := FuelTransaction."Fuel Amount" * FuelSetup."Fuel Rate per Liter";
        
        // Get employee
        Employee.Get(FuelTransaction."Employee No.");
        
        // Create expense entry
        GenJournalLine.Init();
        GenJournalLine."Journal Template Name" := FuelSetup."Journal Template";
        GenJournalLine."Journal Batch Name" := FuelSetup."Journal Batch";
        GenJournalLine."Line No." := LineNo;
        GenJournalLine."Posting Date" := FuelTransaction."Transaction Date";
        GenJournalLine."Document No." := FuelTransaction."Transaction No.";
        GenJournalLine."Account Type" := GenJournalLine."Account Type"::"G/L Account";
        GenJournalLine."Account No." := FuelSetup."Fuel Expense Account";
        GenJournalLine.Description := StrSubstNo('Fuel expense for %1 - %2L', 
            Employee."First Name" + ' ' + Employee."Last Name", FuelTransaction."Fuel Amount");
        GenJournalLine.Amount := TotalAmount;
        GenJournalLine.Insert();
        
        // Create payable entry
        LineNo += 10000;
        GenJournalLine.Init();
        GenJournalLine."Journal Template Name" := FuelSetup."Journal Template";
        GenJournalLine."Journal Batch Name" := FuelSetup."Journal Batch";
        GenJournalLine."Line No." := LineNo;
        GenJournalLine."Posting Date" := FuelTransaction."Transaction Date";
        GenJournalLine."Document No." := FuelTransaction."Transaction No.";
        GenJournalLine."Account Type" := GenJournalLine."Account Type"::"G/L Account";
        GenJournalLine."Account No." := FuelSetup."Fuel Payable Account";
        GenJournalLine.Description := StrSubstNo('Fuel payable for %1 - %2L', 
            Employee."First Name" + ' ' + Employee."Last Name", FuelTransaction."Fuel Amount");
        GenJournalLine.Amount := -TotalAmount;
        GenJournalLine.Insert();
        
        // Post the journal
        CODEUNIT.Run(CODEUNIT::"Gen. Jnl.-Post Batch", GenJournalLine);
        
        // Update transaction
        FuelTransaction.Posted := true;
        FuelTransaction."Posted Date" := Today;
        FuelTransaction.Modify();
    end;
    
    local procedure LogError(ErrorTitle: Text; ErrorMessage: Text)
    var
        ErrorLog: Record "Error Message";
    begin
        // Log error for review
        Error('%1: %2', ErrorTitle, ErrorMessage);
    end;
    
    procedure GetDashboardData(): Text
    var
        FuelTransaction: Record "Fuel Transaction";
        JsonObject: JsonObject;
        JsonArray: JsonArray;
        TransactionObject: JsonObject;
        Employee: Record Employee;
        ResultText: Text;
        TotalPending: Integer;
        TotalApproved: Integer;
        TotalRejected: Integer;
    begin
        // Count transactions by status
        FuelTransaction.SetRange(Status, FuelTransaction.Status::Pending);
        TotalPending := FuelTransaction.Count;
        
        FuelTransaction.SetRange(Status, FuelTransaction.Status::Approved);
        TotalApproved := FuelTransaction.Count;
        
        FuelTransaction.SetRange(Status, FuelTransaction.Status::Rejected);
        TotalRejected := FuelTransaction.Count;
        
        // Build summary object
        JsonObject.Add('total_pending', TotalPending);
        JsonObject.Add('total_approved', TotalApproved);
        JsonObject.Add('total_rejected', TotalRejected);
        JsonObject.Add('last_updated', Format(CurrentDateTime, 0, 9));
        
        // Get recent transactions
        FuelTransaction.Reset();
        FuelTransaction.SetCurrentKey("Transaction Date");
        FuelTransaction.SetAscending("Transaction Date", false);
        if FuelTransaction.FindSet() then begin
            repeat
                TransactionObject.Clear();
                TransactionObject.Add('transaction_no', FuelTransaction."Transaction No.");
                TransactionObject.Add('employee_no', FuelTransaction."Employee No.");
                
                if Employee.Get(FuelTransaction."Employee No.") then
                    TransactionObject.Add('employee_name', Employee."First Name" + ' ' + Employee."Last Name")
                else
                    TransactionObject.Add('employee_name', '');
                
                TransactionObject.Add('transaction_date', Format(FuelTransaction."Transaction Date", 0, 9));
                TransactionObject.Add('fuel_amount', FuelTransaction."Fuel Amount");
                TransactionObject.Add('status', Format(FuelTransaction.Status));
                TransactionObject.Add('posted', FuelTransaction.Posted);
                
                JsonArray.Add(TransactionObject);
            until (FuelTransaction.Next() = 0) or (JsonArray.Count >= 50); // Limit to 50 records
        end;
        
        JsonObject.Add('recent_transactions', JsonArray);
        JsonObject.WriteTo(ResultText);
        
        exit(ResultText);
    end;

// Page for Fuel System Dashboard
page 50100 "Fuel System Dashboard"
{
    PageType = Card;
    ApplicationArea = All;
    Caption = 'Parliament Fuel Coupon System';

    layout
    {
        area(Content)
        {
            usercontrol(FuelSystemControl; "Parliament Fuel System")
            {
                ApplicationArea = All;

                trigger ControlAddInReady()
                var
                    BCContext: Text;
                    BaseUrl: Text;
                begin
                    // Set the Django app URL - Production Azure
                    BaseUrl := 'https://parliament-fuel-system.azurewebsites.net/bc/dashboard/';

                    // Build BC context
                    BCContext := BuildBCContext();

                    // Initialize the Django app
                    CurrPage.FuelSystemControl.InitializeApp(BaseUrl, BCContext);
                end;

                trigger DataChanged(data: Text)
                begin
                    // Handle data changes from Django app
                    ProcessDjangoDataChange(data);
                end;

                trigger TransactionCreated(transactionData: Text)
                begin
                    // Handle new transaction from Django
                    ProcessNewTransaction(transactionData);
                end;
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(RefreshData)
            {
                ApplicationArea = All;
                Caption = 'Refresh';
                Image = Refresh;

                trigger OnAction()
                begin
                    CurrPage.FuelSystemControl.RefreshData();
                end;
            }

            action(SyncWithDjango)
            {
                ApplicationArea = All;
                Caption = 'Sync with Fuel System';
                Image = Sync;

                trigger OnAction()
                begin
                    SyncAllData();
                end;
            }
        }
    }

    local procedure BuildBCContext(): Text
    var
        JsonObject: JsonObject;
        JsonText: Text;
        CompanyInfo: Record "Company Information";
        UserSetup: Record "User Setup";
    begin
        // Get company information
        CompanyInfo.Get();

        // Build JSON context
        JsonObject.Add('user_id', UserId);
        JsonObject.Add('company_id', CompanyName);
        JsonObject.Add('environment', 'Production'); // or get from setup
        JsonObject.Add('company_name', CompanyInfo.Name);

        // Get user setup if exists
        if UserSetup.Get(UserId) then begin
            JsonObject.Add('user_name', UserSetup."User ID");
            JsonObject.Add('department', UserSetup."Salespers./Purch. Code");
        end;

        JsonObject.WriteTo(JsonText);
        exit(JsonText);
    end;

    local procedure ProcessDjangoDataChange(data: Text)
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        EventType: Text;
    begin
        // Parse the JSON data
        if JsonObject.ReadFrom(data) then begin
            if JsonObject.Get('event_type', JsonToken) then begin
                EventType := JsonToken.AsValue().AsText();

                case EventType of
                    'transaction_updated':
                        HandleTransactionUpdate(JsonObject);
                    'user_updated':
                        HandleUserUpdate(JsonObject);
                    'sync_request':
                        SyncAllData();
                end;
            end;
        end;
    end;

    local procedure ProcessNewTransaction(transactionData: Text)
    var
        FuelTransaction: Record "Fuel Transaction";
        JsonObject: JsonObject;
        JsonToken: JsonToken;
    begin
        // Parse transaction data and create BC record
        if JsonObject.ReadFrom(transactionData) then begin
            FuelTransaction.Init();

            if JsonObject.Get('transaction_id', JsonToken) then
                FuelTransaction."Django Transaction ID" := JsonToken.AsValue().AsText();

            if JsonObject.Get('employee_no', JsonToken) then
                FuelTransaction."Employee No." := JsonToken.AsValue().AsText();

            if JsonObject.Get('amount', JsonToken) then
                FuelTransaction."Fuel Amount" := JsonToken.AsValue().AsDecimal();

            if JsonObject.Get('date', JsonToken) then
                Evaluate(FuelTransaction."Transaction Date", JsonToken.AsValue().AsText());

            FuelTransaction."Transaction No." := GetNextTransactionNo();
            FuelTransaction.Insert(true);

            // Post to G/L if needed
            PostFuelTransaction(FuelTransaction);
        end;
    end;

    local procedure HandleTransactionUpdate(JsonObject: JsonObject)
    var
        FuelTransaction: Record "Fuel Transaction";
        JsonToken: JsonToken;
        DjangoTransactionId: Text;
    begin
        if JsonObject.Get('transaction_id', JsonToken) then begin
            DjangoTransactionId := JsonToken.AsValue().AsText();

            // Find the BC transaction
            FuelTransaction.SetRange("Django Transaction ID", DjangoTransactionId);
            if FuelTransaction.FindFirst() then begin
                // Update status or other fields
                if JsonObject.Get('status', JsonToken) then
                    FuelTransaction.Status := GetStatusEnum(JsonToken.AsValue().AsText());

                FuelTransaction.Modify(true);
            end;
        end;
    end;

    local procedure SyncAllData()
    var
        HttpClient: HttpClient;
        HttpRequestMessage: HttpRequestMessage;
        HttpResponseMessage: HttpResponseMessage;
        ResponseText: Text;
        SyncUrl: Text;
    begin
        // Call Django sync API - Production Azure
        SyncUrl := 'https://parliament-fuel-system.azurewebsites.net/api/bc/webhook/';

        HttpRequestMessage.Method := 'POST';
        HttpRequestMessage.SetRequestUri(SyncUrl);
        HttpRequestMessage.Content.WriteFrom('{"eventType": "sync_request", "entityData": {"sync_type": "full"}}');
        HttpRequestMessage.Content.GetHeaders.Clear();
        HttpRequestMessage.Content.GetHeaders.Add('Content-Type', 'application/json');

        if HttpClient.Send(HttpRequestMessage, HttpResponseMessage) then begin
            HttpResponseMessage.Content.ReadAs(ResponseText);
            Message('Sync completed: ' + ResponseText);
        end else begin
            Message('Sync failed');
        end;
    end;

    local procedure GetNextTransactionNo(): Code[20]
    var
        NoSeriesManagement: Codeunit NoSeriesManagement;
        FuelSetup: Record "Fuel System Setup";
    begin
        FuelSetup.Get();
        exit(NoSeriesManagement.GetNextNo(FuelSetup."Transaction Nos.", WorkDate(), true));
    end;

    local procedure PostFuelTransaction(var FuelTransaction: Record "Fuel Transaction")
    var
        GenJournalLine: Record "Gen. Journal Line";
        GenJournalBatch: Record "Gen. Journal Batch";
        FuelSetup: Record "Fuel System Setup";
    begin
        FuelSetup.Get();

        // Create G/L entries for fuel transaction
        GenJournalBatch.Get(FuelSetup."Journal Template", FuelSetup."Journal Batch");

        GenJournalLine.Init();
        GenJournalLine."Journal Template Name" := FuelSetup."Journal Template";
        GenJournalLine."Journal Batch Name" := FuelSetup."Journal Batch";
        GenJournalLine."Line No." := GetNextLineNo(GenJournalLine);
        GenJournalLine."Posting Date" := FuelTransaction."Transaction Date";
        GenJournalLine."Document No." := FuelTransaction."Transaction No.";
        GenJournalLine."Account Type" := GenJournalLine."Account Type"::"G/L Account";
        GenJournalLine."Account No." := FuelSetup."Fuel Expense Account";
        GenJournalLine.Description := 'Fuel Transaction - ' + FuelTransaction."Employee No.";
        GenJournalLine.Amount := FuelTransaction."Fuel Amount" * FuelSetup."Fuel Rate per Liter";
        GenJournalLine."Bal. Account Type" := GenJournalLine."Bal. Account Type"::"G/L Account";
        GenJournalLine."Bal. Account No." := FuelSetup."Fuel Payable Account";
        GenJournalLine.Insert();

        // Post the journal
        Codeunit.Run(Codeunit::"Gen. Jnl.-Post Line", GenJournalLine);
    end;

    local procedure GetNextLineNo(var GenJournalLine: Record "Gen. Journal Line"): Integer
    begin
        GenJournalLine.SetRange("Journal Template Name", GenJournalLine."Journal Template Name");
        GenJournalLine.SetRange("Journal Batch Name", GenJournalLine."Journal Batch Name");
        if GenJournalLine.FindLast() then
            exit(GenJournalLine."Line No." + 10000)
        else
            exit(10000);
    end;

    local procedure GetStatusEnum(StatusText: Text): Enum "Fuel Transaction Status"
    begin
        case StatusText of
            'APPROVED':
                exit("Fuel Transaction Status"::Approved);
            'PENDING':
                exit("Fuel Transaction Status"::Pending);
            'REJECTED':
                exit("Fuel Transaction Status"::Rejected);
            else
                exit("Fuel Transaction Status"::Pending);
        end;
    end;
}

// List page for Fuel Transactions
page 50101 "Fuel Transactions"
{
    PageType = List;
    ApplicationArea = All;
    SourceTable = "Fuel Transaction";
    CardPageId = "Fuel Transaction Card";
    Caption = 'Fuel Transactions';

    layout
    {
        area(Content)
        {
            repeater(Transactions)
            {
                field("Transaction No."; Rec."Transaction No.")
                {
                    ApplicationArea = All;
                }
                field("Employee No."; Rec."Employee No.")
                {
                    ApplicationArea = All;
                }
                field("Transaction Date"; Rec."Transaction Date")
                {
                    ApplicationArea = All;
                }
                field("Fuel Amount"; Rec."Fuel Amount")
                {
                    ApplicationArea = All;
                }
                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                }
                field("Django Transaction ID"; Rec."Django Transaction ID")
                {
                    ApplicationArea = All;
                    Visible = false;
                }
            }
        }
        area(FactBoxes)
        {
            part(FuelSystemFactBox; "Fuel System FactBox")
            {
                ApplicationArea = All;
                SubPageLink = "Transaction No." = FIELD("Transaction No.");
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(OpenDjangoApp)
            {
                ApplicationArea = All;
                Caption = 'Open Fuel System';
                Image = Web;

                trigger OnAction()
                begin
                    // Open the Django app dashboard - Production Azure
                    Hyperlink('https://parliament-fuel-system.azurewebsites.net/bc/dashboard/');
                end;
            }

            action(SyncTransaction)
            {
                ApplicationArea = All;
                Caption = 'Sync with Django';
                Image = Sync;

                trigger OnAction()
                begin
                    SyncTransactionWithDjango(Rec);
                end;
            }
        }
    }

    local procedure SyncTransactionWithDjango(var FuelTransaction: Record "Fuel Transaction")
    var
        HttpClient: HttpClient;
        HttpRequestMessage: HttpRequestMessage;
        HttpResponseMessage: HttpResponseMessage;
        RequestBody: Text;
        ResponseText: Text;
        SyncUrl: Text;
    begin
        // Build sync request
        RequestBody := BuildTransactionJson(FuelTransaction);
        SyncUrl := 'https://parliament-fuel-system.azurewebsites.net/api/bc/webhook/';

        HttpRequestMessage.Method := 'POST';
        HttpRequestMessage.SetRequestUri(SyncUrl);
        HttpRequestMessage.Content.WriteFrom(RequestBody);
        HttpRequestMessage.Content.GetHeaders.Clear();
        HttpRequestMessage.Content.GetHeaders.Add('Content-Type', 'application/json');

        if HttpClient.Send(HttpRequestMessage, HttpResponseMessage) then begin
            HttpResponseMessage.Content.ReadAs(ResponseText);
            Message('Transaction synced successfully');
        end else begin
            Message('Sync failed');
        end;
    end;

    local procedure BuildTransactionJson(var FuelTransaction: Record "Fuel Transaction"): Text
    var
        JsonObject: JsonObject;
        JsonText: Text;
    begin
        JsonObject.Add('eventType', 'transaction_updated');
        JsonObject.Add('entityData', BuildTransactionEntityData(FuelTransaction));
        JsonObject.WriteTo(JsonText);
        exit(JsonText);
    end;

    local procedure BuildTransactionEntityData(var FuelTransaction: Record "Fuel Transaction"): JsonObject
    var
        EntityData: JsonObject;
    begin
        EntityData.Add('transaction_id', FuelTransaction."Django Transaction ID");
        EntityData.Add('bc_transaction_no', FuelTransaction."Transaction No.");
        EntityData.Add('employee_no', FuelTransaction."Employee No.");
        EntityData.Add('amount', FuelTransaction."Fuel Amount");
        EntityData.Add('date', Format(FuelTransaction."Transaction Date"));
        EntityData.Add('status', Format(FuelTransaction.Status));

        exit(EntityData);
    end;
}

// FactBox for Fuel System integration
page 50102 "Fuel System FactBox"
{
    PageType = CardPart;
    SourceTable = "Fuel Transaction";

    layout
    {
        area(Content)
        {
            field("Django Status"; 'Connected')
            {
                ApplicationArea = All;
                Caption = 'Django Status';
                Style = Favorable;
                StyleExpr = true;
            }
            field("Last Sync"; Today)
            {
                ApplicationArea = All;
                Caption = 'Last Sync';
            }
        }
    }
}
