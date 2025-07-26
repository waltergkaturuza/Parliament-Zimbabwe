// Parliament Fuel System Integration - No Symbol Dependencies
codeunit 50110 "Fuel System Integration"
{
    trigger OnRun()
    begin
        Message('Parliament Fuel System Integration is running.');
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
        Headers: HttpHeaders;
        RequestHeaders: HttpHeaders;
    begin
        // Get setup
        if not FuelSetup.Get() then
            Error('Fuel System Setup not found.');

        if not FuelSetup."Integration Enabled" then
            exit(false);

        FuelSetup.TestField("Django Base URL");

        // Build request
        WebhookUrl := FuelSetup."Django Base URL" + 'api/bc/webhook/';
        RequestBody := BuildTransactionJson(FuelTransaction);

        // Send request
        HttpRequestMessage.Method := 'POST';
        HttpRequestMessage.SetRequestUri(WebhookUrl);
        HttpRequestMessage.Content.WriteFrom(RequestBody);
        HttpRequestMessage.Content.GetHeaders(Headers);
        Headers.Clear();
        Headers.Add('Content-Type', 'application/json');

        if FuelSetup."Webhook Secret" <> '' then begin
            HttpRequestMessage.GetHeaders(RequestHeaders);
            RequestHeaders.Add('X-Webhook-Secret', FuelSetup."Webhook Secret");
        end;

        if HttpClient.Send(HttpRequestMessage, HttpResponseMessage) then begin
            HttpResponseMessage.Content.ReadAs(ResponseText);

            if HttpResponseMessage.HttpStatusCode = 200 then begin
                ProcessDjangoResponse(ResponseText, FuelTransaction);
                exit(true);
            end else begin
                Message('Django sync failed with status: %1', HttpResponseMessage.HttpStatusCode);
                exit(false);
            end;
        end else begin
            Message('Failed to connect to Django application');
            exit(false);
        end;
    end;

    procedure ProcessDjangoWebhook(WebhookData: Text): Boolean
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        EventType: Text;
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
                Message('Unknown webhook event: %1', EventType);
        end;

        exit(true);
    end;

    procedure TestConnection(): Boolean
    var
        FuelSetup: Record "Fuel System Setup";
        HttpClient: HttpClient;
        HttpRequestMessage: HttpRequestMessage;
        HttpResponseMessage: HttpResponseMessage;
        TestUrl: Text;
    begin
        if not FuelSetup.Get() then
            exit(false);

        TestUrl := FuelSetup."Django Base URL" + 'api/bc/health/';
        HttpRequestMessage.Method := 'GET';
        HttpRequestMessage.SetRequestUri(TestUrl);

        if HttpClient.Send(HttpRequestMessage, HttpResponseMessage) then
            exit(HttpResponseMessage.HttpStatusCode = 200)
        else
            exit(false);
    end;

    local procedure BuildTransactionJson(FuelTransaction: Record "Fuel Transaction"): Text
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
                    Message('Transaction %1 approved via Django', TransactionNo);
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
                    Message('Transaction %1 rejected via Django', TransactionNo);
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
                    Message('Fuel rate updated to %1', NewRate);
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

        Message('Sync request processed');
    end;

    procedure GetDashboardData(): Text
    var
        FuelTransaction: Record "Fuel Transaction";
        JsonObject: JsonObject;
        JsonArray: JsonArray;
        TransactionObject: JsonObject;
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
                Clear(TransactionObject);
                TransactionObject.Add('transaction_no', FuelTransaction."Transaction No.");
                TransactionObject.Add('employee_no', FuelTransaction."Employee No.");
                TransactionObject.Add('transaction_date', Format(FuelTransaction."Transaction Date", 0, 9));
                TransactionObject.Add('fuel_amount', FuelTransaction."Fuel Amount");
                TransactionObject.Add('status', Format(FuelTransaction.Status));
                TransactionObject.Add('posted', FuelTransaction.Posted);

                JsonArray.Add(TransactionObject);
            until (FuelTransaction.Next() = 0) or (JsonArray.Count >= 50);
        end;

        JsonObject.Add('recent_transactions', JsonArray);
        JsonObject.WriteTo(ResultText);

        exit(ResultText);
    end;
}
