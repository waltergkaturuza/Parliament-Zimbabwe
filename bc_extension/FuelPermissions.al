// Permission Set for Fuel Management
permissionset 50110 "Fuel Manager Objects"
{
    Access = Public;
    Assignable = true;
    Caption = 'Fuel Manager';

    Permissions =
        tabledata "Fuel Transaction Lite" = RIMD,
        tabledata "Fuel Rates Setup" = RIMD,
        table "Fuel Transaction Lite" = X,
        table "Fuel Rates Setup" = X,
        page "Fuel Transaction List Lite" = X,
        page "Fuel Transaction Card Lite" = X,
        page "Fuel Rates Setup Page" = X,
        page "Fuel Summary Report" = X,
        page "Fuel Manager Role Center" = X,
        page "Fuel Transaction Activities" = X,
        codeunit "Fuel Integration Lite" = X,
        codeunit "Fuel System Install Lite" = X;
}

// Profile for Fuel Manager Role Center
profile "FUEL MANAGER"
{
    Description = 'Fuel Management System User';
    RoleCenter = "Fuel Manager Role Center";
    Caption = 'Fuel Manager';
}
