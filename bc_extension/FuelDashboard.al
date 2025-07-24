// Parliament Fuel System Dashboard Page
page 50106 "Parliament Fuel Dashboard"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'Parliament Fuel System Dashboard';

    layout
    {
        area(Content)
        {
            group(DashboardContainer)
            {
                Caption = 'Dashboard';
                ShowCaption = false;

                usercontrol(DjangoApp; "Parliament Fuel System")
                {
                    ApplicationArea = All;

                    trigger ControlAddInReady()
                    var
                        FuelSetup: Record "Fuel System Setup";
                        BCContext: Text;
                        CompanyInfo: Record "Company Information";
                        UserInfo: Record User;
                    begin
                        // Get setup
                        if not FuelSetup.Get() then begin
                            Message('Fuel System Setup not configured. Please configure setup first.');
                            exit;
                        end;

                        // Get current user info
                        UserInfo.SetRange("User Name", UserId);
                        if UserInfo.FindFirst() then;

                        // Get company info
                        if CompanyInfo.Get() then;

                        // Build BC context
                        BCContext := BuildBCContext(UserInfo, CompanyInfo);

                        // Initialize the Django app
                        CurrPage.DjangoApp.InitializeApp(FuelSetup."Django Base URL", BCContext);
                        CurrPage.DjangoApp.SetUserContext(UserId, CompanyName);
                    end;

                    trigger DataChanged(data: Text)
                    begin
                        // Handle data changes from Django
                        ProcessDjangoDataChange(data);
                    end;

                    trigger TransactionCreated(transactionData: Text)
                    begin
                        // Process new transaction from Django
                        CreateTransactionFromDjango(transactionData);
                        Message('New transaction created from Django system.');
                    end;

                    trigger TransactionUpdated(transactionData: Text)
                    begin
                        // Handle transaction updates from Django
                        UpdateTransactionFromDjango(transactionData);
                    end;

                    trigger ErrorOccurred(errorMessage: Text)
                    begin
                        Error('Django App Error: %1', errorMessage);
                    end;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(RefreshDashboard)
            {
                ApplicationArea = All;
                Caption = 'Refresh Dashboard';
                Image = Refresh;
                PromotedCategory = Process;
                Promoted = true;

                trigger OnAction()
                begin
                    CurrPage.DjangoApp.RefreshData();
                end;
            }

            action(ViewTransactions)
            {
                ApplicationArea = All;
                Caption = 'View Transactions';
                Image = List;
                RunObject = page 50105;
                PromotedCategory = Navigate;
                Promoted = true;
            }

            action(Setup)
            {
                ApplicationArea = All;
                Caption = 'Setup';
                Image = Setup;
                RunObject = page 50103;
                PromotedCategory = Process;
                Promoted = true;
            }

            action(NavigateToTransactions)
            {
                ApplicationArea = All;
                Caption = 'Transaction Management';
                Image = Navigate;
                PromotedCategory = Navigate;
                Promoted = true;

                trigger OnAction()
                begin
                    CurrPage.DjangoApp.NavigateToPage('transactions');
                end;
            }

            action(NavigateToReports)
            {
                ApplicationArea = All;
                Caption = 'Reports';
                Image = Report;
                PromotedCategory = Navigate;
                Promoted = true;

                trigger OnAction()
                begin
                    CurrPage.DjangoApp.NavigateToPage('reports');
                end;
            }

            action(NavigateToSettings)
            {
                ApplicationArea = All;
                Caption = 'Django Settings';
                Image = Setup;
                PromotedCategory = Navigate;
                Promoted = true;

                trigger OnAction()
                begin
                    CurrPage.DjangoApp.NavigateToPage('settings');
                end;
            }
        }
    }

    local procedure BuildBCContext(UserInfo: Record User; CompanyInfo: Record "Company Information"): Text
    var
        JsonObject: JsonObject;
        ResultText: Text;
    begin
        JsonObject.Add('userId', UserId);
        JsonObject.Add('companyName', CompanyName);
        JsonObject.Add('userFullName', UserInfo."Full Name");
        JsonObject.Add('companyDisplayName', CompanyInfo.Name);
        JsonObject.Add('bcVersion', 'Business Central Online');
        JsonObject.Add('integrationVersion', '1.0.0');
        JsonObject.Add('timestamp', Format(CurrentDateTime, 0, 9));

        JsonObject.WriteTo(ResultText);
        exit(ResultText);
    end;

    local procedure ProcessDjangoDataChange(data: Text)
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        DataType: Text;
    begin
        if not JsonObject.ReadFrom(data) then
            exit;

        if JsonObject.Get('dataType', JsonToken) then
            DataType := JsonToken.AsValue().AsText();

        case DataType of
            'transaction':
                RefreshTransactionData();
            'fuel_data':
                RefreshFuelData();
            'employee':
                RefreshEmployeeData();
        end;
    end;

    local procedure CreateTransactionFromDjango(transactionData: Text)
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        FuelTransaction: Record "Fuel Transaction";
        EmployeeNo: Code[20];
        FuelAmount: Decimal;
        TransactionDate: Date;
        DjangoId: Text;
    begin
        if not JsonObject.ReadFrom(transactionData) then
            exit;

        // Parse transaction data
        if JsonObject.Get('employee_no', JsonToken) then
            EmployeeNo := JsonToken.AsValue().AsCode();

        if JsonObject.Get('fuel_amount', JsonToken) then
            FuelAmount := JsonToken.AsValue().AsDecimal();

        if JsonObject.Get('transaction_date', JsonToken) then
            Evaluate(TransactionDate, JsonToken.AsValue().AsText());

        if JsonObject.Get('django_id', JsonToken) then
            DjangoId := JsonToken.AsValue().AsText();

        // Create new transaction
        FuelTransaction.Init();
        FuelTransaction."Employee No." := EmployeeNo;
        FuelTransaction."Fuel Amount" := FuelAmount;
        FuelTransaction."Transaction Date" := TransactionDate;
        FuelTransaction."Django Transaction ID" := DjangoId;
        FuelTransaction."Created From Django" := true;
        FuelTransaction.Status := FuelTransaction.Status::Pending;
        FuelTransaction.Insert(true);
    end;

    local procedure UpdateTransactionFromDjango(transactionData: Text)
    var
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        FuelTransaction: Record "Fuel Transaction";
        TransactionNo: Code[20];
        StatusText: Text;
        NewStatus: Enum "Fuel Transaction Status";
    begin
        if not JsonObject.ReadFrom(transactionData) then
            exit;

        // Get transaction reference
        if JsonObject.Get('bc_transaction_no', JsonToken) then
            TransactionNo := JsonToken.AsValue().AsCode()
        else if JsonObject.Get('django_id', JsonToken) then begin
            // Find by Django ID
            FuelTransaction.SetRange("Django Transaction ID", JsonToken.AsValue().AsText());
            if FuelTransaction.FindFirst() then
                TransactionNo := FuelTransaction."Transaction No.";
        end;

        if TransactionNo = '' then
            exit;

        // Get the transaction
        if not FuelTransaction.Get(TransactionNo) then
            exit;

        // Update status
        if JsonObject.Get('status', JsonToken) then begin
            StatusText := JsonToken.AsValue().AsText();
            case StatusText of
                'approved':
                    NewStatus := FuelTransaction.Status::Approved;
                'rejected':
                    NewStatus := FuelTransaction.Status::Rejected;
                'pending':
                    NewStatus := FuelTransaction.Status::Pending;
            end;

            FuelTransaction.Status := NewStatus;
            FuelTransaction.Modify();
        end;
    end;

    local procedure RefreshTransactionData()
    begin
        // Trigger refresh of transaction list if needed
        Message('Transaction data updated from Django.');
    end;

    local procedure RefreshFuelData()
    var
        FuelSetup: Record "Fuel System Setup";
    begin
        // Update fuel rate from Django if needed
        if FuelSetup.Get() then begin
            FuelSetup."Last Sync Date" := CurrentDateTime;
            FuelSetup.Modify();
        end;
    end;

    local procedure RefreshEmployeeData()
    begin
        // Handle employee data updates if needed
        Message('Employee data updated from Django.');
    end;
}
