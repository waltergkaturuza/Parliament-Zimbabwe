// Installation and Upgrade Codeunit for Parliament Fuel System
codeunit 50111 "Fuel System Install"
{
    Subtype = Install;

    trigger OnInstallAppPerCompany()
    begin
        InitializeSetup();
        CreateDefaultData();
    end;

    local procedure InitializeSetup()
    var
        FuelSetup: Record "Fuel System Setup";
    begin
        if not FuelSetup.Get() then begin
            FuelSetup.Init();
            FuelSetup."Primary Key" := '';
            FuelSetup."Django Base URL" := 'https://parliament-fuel-system.azurewebsites.net/';
            FuelSetup."Integration Enabled" := true;
            FuelSetup."Sync Status" := FuelSetup."Sync Status"::"Not Synced";
            FuelSetup."Fuel Rate per Liter" := 1.50; // Default rate in USD
            FuelSetup.Insert();
        end;
    end;

    local procedure CreateDefaultData()
    var
        NoSeries: Record "No. Series";
        NoSeriesLine: Record "No. Series Line";
    begin
        // Create number series for fuel transactions if it doesn't exist
        if not NoSeries.Get('FUEL-TRANS') then begin
            NoSeries.Init();
            NoSeries.Code := 'FUEL-TRANS';
            NoSeries.Description := 'Fuel Transactions';
            NoSeries."Default Nos." := true;
            NoSeries."Manual Nos." := false;
            NoSeries.Insert();

            // Create number series line
            NoSeriesLine.Init();
            NoSeriesLine."Series Code" := 'FUEL-TRANS';
            NoSeriesLine."Line No." := 10000;
            NoSeriesLine."Starting No." := 'FT000001';
            NoSeriesLine."Ending No." := 'FT999999';
            NoSeriesLine."Increment-by No." := 1;
            NoSeriesLine.Insert();

            // Update setup with number series
            UpdateSetupWithNoSeries();
        end;
    end;

    local procedure UpdateSetupWithNoSeries()
    var
        FuelSetup: Record "Fuel System Setup";
    begin
        if FuelSetup.Get() then begin
            if FuelSetup."Transaction Nos." = '' then begin
                FuelSetup."Transaction Nos." := 'FUEL-TRANS';
                FuelSetup.Modify();
            end;
        end;
    end;
}

// Upgrade Codeunit
codeunit 50112 "Fuel System Upgrade"
{
    Subtype = Upgrade;

    trigger OnUpgradePerCompany()
    begin
        UpgradeToV1_1();
    end;

    local procedure UpgradeToV1_1()
    var
        FuelSetup: Record "Fuel System Setup";
        ModuleInfo: ModuleInfo;
    begin
        // Get current module version
        NavApp.GetCurrentModuleInfo(ModuleInfo);

        // Only run upgrade if upgrading from version 1.0
        if ModuleInfo.AppVersion.Major = 1 then begin
            // Update Django URL to production if still using old URL
            if FuelSetup.Get() then begin
                if FuelSetup."Django Base URL".Contains('azurewebsites.net') then begin
                    FuelSetup."Django Base URL" := 'https://parliament-fuel-system.azurewebsites.net/';
                    FuelSetup.Modify();
                end;
            end;
        end;
    end;
}
