// Permission Set for Parliament Fuel System
permissionset 50110 "Fuel System"
{
    Access = Public;
    Assignable = true;
    Caption = 'Parliament Fuel System Permissions';

    Permissions =
        // Tables
        tabledata "Fuel System Setup" = RIMD,
        tabledata "Fuel Transaction" = RIMD;
}
}
