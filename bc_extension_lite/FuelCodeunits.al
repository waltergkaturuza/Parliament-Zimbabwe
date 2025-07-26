// Simple Integration Codeunit for Django Communication
codeunit 50201 "Fuel Integration Lite"
{
    trigger OnRun()
    begin
    end;

    procedure SendTransactionToDjango(FuelTransaction: Record "Fuel Transaction Lite"): Boolean
    var
        FuelSetup: Record "Fuel Rates Setup";
        JsonData: Text;
        ResponseText: Text;
    begin
        if not FuelSetup.Get() then
            exit(false);

        if not FuelSetup."Integration Enabled" then
            exit(false);

        if FuelSetup."Django Integration URL" = '' then
            exit(false);

        // Build JSON data
        JsonData := BuildTransactionJson(FuelTransaction);

        // In a full implementation, this would use HTTP requests
        // For now, we'll simulate the integration

        Message('Transaction would be sent to Django:\URL: %1\Data: %2',
                FuelSetup."Django Integration URL", JsonData);

        exit(true);
    end;

    procedure ReceiveTransactionFromDjango(JsonData: Text): Boolean
    var
        FuelTransaction: Record "Fuel Transaction Lite";
    begin
        // Parse incoming JSON and create BC transaction
        // This is a simplified implementation

        FuelTransaction.Init();
        FuelTransaction."Employee Code" := 'EMP001';
        FuelTransaction."Employee Name" := 'Django User';
        FuelTransaction."Transaction Date" := Today;
        FuelTransaction."Fuel Type" := FuelTransaction."Fuel Type"::Petrol;
        FuelTransaction."Fuel Amount (Litres)" := 20;
        FuelTransaction."Rate per Litre" := 1.45;
        FuelTransaction.Status := FuelTransaction.Status::Pending;
        FuelTransaction."Department" := 'Administration';
        FuelTransaction."Purpose" := 'Received from Django system';

        if FuelTransaction.Insert(true) then begin
            Message('Transaction received from Django and created in BC: %1', FuelTransaction."No.");
            exit(true);
        end;

        exit(false);
    end;

    procedure SyncFuelRatesWithDjango(): Boolean
    var
        FuelSetup: Record "Fuel Rates Setup";
    begin
        if not FuelSetup.Get() then
            exit(false);

        if not FuelSetup."Integration Enabled" then
            exit(false);

        // In a full implementation, this would fetch rates from Django API
        // For now, we'll simulate the sync

        Message('Fuel rates would be synchronized with Django at:\%1', FuelSetup."Django Integration URL");

        exit(true);
    end;

    local procedure BuildTransactionJson(FuelTransaction: Record "Fuel Transaction Lite"): Text
    var
        JsonText: Text;
    begin
        // Build a simple JSON representation
        JsonText := '{' +
                   '"transaction_no": "' + FuelTransaction."No." + '",' +
                   '"employee_code": "' + FuelTransaction."Employee Code" + '",' +
                   '"employee_name": "' + FuelTransaction."Employee Name" + '",' +
                   '"transaction_date": "' + Format(FuelTransaction."Transaction Date", 0, 9) + '",' +
                   '"fuel_type": "' + Format(FuelTransaction."Fuel Type") + '",' +
                   '"fuel_amount": ' + Format(FuelTransaction."Fuel Amount (Litres)", 0, 9) + ',' +
                   '"rate_per_litre": ' + Format(FuelTransaction."Rate per Litre", 0, 9) + ',' +
                   '"total_amount": ' + Format(FuelTransaction."Total Amount", 0, 9) + ',' +
                   '"status": "' + Format(FuelTransaction.Status) + '",' +
                   '"department": "' + FuelTransaction."Department" + '",' +
                   '"vehicle_registration": "' + FuelTransaction."Vehicle Registration" + '",' +
                   '"purpose": "' + FuelTransaction."Purpose" + '"' +
                   '}';

        exit(JsonText);
    end;

    procedure GetFuelStatistics(): Text
    var
        FuelTransaction: Record "Fuel Transaction Lite";
        TotalTransactions: Integer;
        TotalLitres: Decimal;
        TotalAmount: Decimal;
        PendingTransactions: Integer;
        ApprovedTransactions: Integer;
        StatText: Text;
    begin
        // Count all transactions
        TotalTransactions := FuelTransaction.Count;

        // Calculate totals for approved transactions
        FuelTransaction.SetRange(Status, FuelTransaction.Status::Approved);
        if FuelTransaction.FindSet() then begin
            repeat
                TotalLitres += FuelTransaction."Fuel Amount (Litres)";
                TotalAmount += FuelTransaction."Total Amount";
            until FuelTransaction.Next() = 0;
        end;
        ApprovedTransactions := FuelTransaction.Count;

        // Count pending transactions
        FuelTransaction.SetRange(Status, FuelTransaction.Status::Pending);
        PendingTransactions := FuelTransaction.Count;

        // Build statistics text
        StatText := 'FUEL SYSTEM STATISTICS\' +
                   '====================\' +
                   'Total Transactions: ' + Format(TotalTransactions) + '\' +
                   'Approved: ' + Format(ApprovedTransactions) + '\' +
                   'Pending: ' + Format(PendingTransactions) + '\' +
                   'Total Fuel Consumed: ' + Format(Round(TotalLitres, 0.01)) + ' litres\' +
                   'Total Cost: $' + Format(Round(TotalAmount, 0.01));

        exit(StatText);
    end;

    procedure ValidateTransaction(var FuelTransaction: Record "Fuel Transaction Lite"): Boolean
    var
        ErrorText: Text;
    begin
        ErrorText := '';

        if FuelTransaction."Employee Code" = '' then
            ErrorText += 'Employee Code is required.\';

        if FuelTransaction."Employee Name" = '' then
            ErrorText += 'Employee Name is required.\';

        if FuelTransaction."Fuel Amount (Litres)" <= 0 then
            ErrorText += 'Fuel Amount must be greater than zero.\';

        if FuelTransaction."Rate per Litre" <= 0 then
            ErrorText += 'Rate per Litre must be greater than zero.\';

        if FuelTransaction."Department" = '' then
            ErrorText += 'Department is required.\';

        if ErrorText <> '' then begin
            Error('Validation failed:\%1', ErrorText);
            exit(false);
        end;

        exit(true);
    end;
}

// Installation Codeunit for initial setup
codeunit 50202 "Fuel System Install Lite"
{
    Subtype = Install;

    trigger OnInstallAppPerCompany()
    begin
        InitializeFuelRatesSetup();
        CreateSampleData();
    end;

    local procedure InitializeFuelRatesSetup()
    var
        FuelSetup: Record "Fuel Rates Setup";
    begin
        if not FuelSetup.Get() then begin
            FuelSetup.Init();
            FuelSetup."Primary Key" := '';
            FuelSetup."Petrol Rate USD" := 1.45;
            FuelSetup."Diesel Rate USD" := 1.40;
            FuelSetup."Django Integration URL" := 'https://parliament-fuel-system.azurewebsites.net/';
            FuelSetup."Integration Enabled" := false;
            FuelSetup.Insert();
        end;
    end;

    local procedure CreateSampleData()
    var
        FuelTransaction: Record "Fuel Transaction Lite";
    begin
        // Create a sample transaction for testing
        if FuelTransaction.IsEmpty then begin
            FuelTransaction.Init();
            FuelTransaction."Employee Code" := 'SAMPLE001';
            FuelTransaction."Employee Name" := 'Sample Employee';
            FuelTransaction."Transaction Date" := Today;
            FuelTransaction."Fuel Type" := FuelTransaction."Fuel Type"::Petrol;
            FuelTransaction."Fuel Amount (Litres)" := 25;
            FuelTransaction."Rate per Litre" := 1.45;
            FuelTransaction.Status := FuelTransaction.Status::Pending;
            FuelTransaction."Department" := 'IT Department';
            FuelTransaction."Vehicle Registration" := 'AAA-123Z';
            FuelTransaction."Purpose" := 'Sample transaction for testing the fuel management system';
            FuelTransaction.Insert(true);
        end;
    end;
}
