// Business Central AL Extension for Parliament Fuel System Integration
// This code should be added to your Business Central extension

// Control Add-in for embedding Django app
controladdin "Parliament Fuel System"
{
    RequestedHeight = 700;
    MinimumHeight = 500;
    RequestedWidth = 1200;
    MinimumWidth = 800;
    VerticalStretch = true;
    HorizontalStretch = true;

    Scripts = 'https://fuel.parliament.gov.zw/static/js/bc-integration.js';

    /// <summary>
    /// Fired when the control add-in is ready
    /// </summary>
    event ControlAddInReady();

    /// <summary>
    /// Fired when data changes in the Django app
    /// </summary>
    event DataChanged(data: Text);

    /// <summary>
    /// Fired when a transaction is created in Django
    /// </summary>
    event TransactionCreated(transactionData: Text);

    /// <summary>
    /// Initialize the Django app with BC context
    /// </summary>
    procedure InitializeApp(baseUrl: Text; bcContext: Text);

    /// <summary>
    /// Send data to the Django app
    /// </summary>
    procedure SendData(data: Text);

    /// <summary>
    /// Refresh the Django app data
    /// </summary>
    procedure RefreshData();

    /// <summary>
    /// Set the current user context
    /// </summary>
    procedure SetUserContext(userId: Text; companyId: Text);
}

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
                    // Set the Django app URL
                    BaseUrl := 'https://fuel.parliament.gov.zw/bc/dashboard/';

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
        // Call Django sync API
        SyncUrl := 'https://fuel.parliament.gov.zw/bc/api/sync/';

        HttpRequestMessage.Method := 'POST';
        HttpRequestMessage.SetRequestUri(SyncUrl);
        HttpRequestMessage.Content.WriteFrom('{"sync_type": "full"}');
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
                    // Open the Django app dashboard
                    Hyperlink('https://fuel.parliament.gov.zw/bc/dashboard/');
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
        SyncUrl := 'https://fuel.parliament.gov.zw/bc/webhook/';

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
