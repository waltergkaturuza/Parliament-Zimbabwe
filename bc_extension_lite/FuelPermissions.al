// Entitlement for Fuel Manager Role
entitlement "Fuel Manager"
{
    Type = ConcurrentUserServicePlan;
    Id = '00000000-0000-0000-0000-000000000001';
    ObjectEntitlements = "Fuel Manager Objects";
}

// Permission Set for Fuel Management
permissionset 50200 "Fuel Manager Objects"
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

// User Group for easy assignment
usergroup "Fuel Managers"
{
    Name = 'Fuel Managers';
    DefaultProfileID = 'FUEL MANAGER';
    
    Permissions = "Fuel Manager Objects";
}

// Profile for Fuel Manager Role Center
profile "FUEL MANAGER"
{
    Description = 'Fuel Management System User';
    RoleCenter = "Fuel Manager Role Center";
    Caption = 'Fuel Manager';
}
