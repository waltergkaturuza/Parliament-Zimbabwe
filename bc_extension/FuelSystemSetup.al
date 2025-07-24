// Business Central Setup Table and Page for Fuel System Integration

// Table: Fuel System Setup
table 50110 "Fuel System Setup"
{
    Caption = 'Fuel System Setup';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Primary Key"; Code[10])
        {
            Caption = 'Primary Key';
            DataClassification = SystemMetadata;
        }

        field(10; "Django Base URL"; Text[250])
        {
            Caption = 'Django Base URL';
            DataClassification = CustomerContent;

            trigger OnValidate()
            begin
                if "Django Base URL" <> '' then begin
                    if not "Django Base URL".EndsWith('/') then
                        "Django Base URL" := "Django Base URL" + '/';
                end;
            end;
        }

        field(11; "Webhook Secret"; Text[100])
        {
            Caption = 'Webhook Secret';
            DataClassification = CustomerContent;
            ExtendedDatatype = Masked;
        }

        field(12; "Integration Enabled"; Boolean)
        {
            Caption = 'Integration Enabled';
            DataClassification = CustomerContent;
        }

        field(20; "Transaction Nos."; Code[20])
        {
            Caption = 'Transaction Nos.';
            DataClassification = CustomerContent;
            TableRelation = "No. Series";
        }

        field(21; "Journal Template"; Code[10])
        {
            Caption = 'Journal Template';
            DataClassification = CustomerContent;
            TableRelation = "Gen. Journal Template";
        }

        field(22; "Journal Batch"; Code[10])
        {
            Caption = 'Journal Batch';
            DataClassification = CustomerContent;
            TableRelation = "Gen. Journal Batch".Name WHERE("Journal Template Name" = FIELD("Journal Template"));
        }

        field(30; "Fuel Expense Account"; Code[20])
        {
            Caption = 'Fuel Expense Account';
            DataClassification = CustomerContent;
            TableRelation = "G/L Account" WHERE("Account Type" = CONST(Posting));
        }

        field(31; "Fuel Payable Account"; Code[20])
        {
            Caption = 'Fuel Payable Account';
            DataClassification = CustomerContent;
            TableRelation = "G/L Account" WHERE("Account Type" = CONST(Posting));
        }

        field(32; "Fuel Rate per Liter"; Decimal)
        {
            Caption = 'Fuel Rate per Liter';
            DataClassification = CustomerContent;
            DecimalPlaces = 2 : 5;
            MinValue = 0;
        }

        field(40; "Last Sync Date"; DateTime)
        {
            Caption = 'Last Sync Date';
            DataClassification = CustomerContent;
            Editable = false;
        }

        field(41; "Sync Status"; Option)
        {
            Caption = 'Sync Status';
            DataClassification = CustomerContent;
            OptionMembers = "Not Synced",Connected,Error;
            OptionCaption = 'Not Synced,Connected,Error';
            Editable = false;
        }
    }

    keys
    {
        key(PK; "Primary Key")
        {
            Clustered = true;
        }
    }

    trigger OnInsert()
    begin
        "Primary Key" := '';
    end;
}

// Table: Fuel Transaction
table 50111 "Fuel Transaction"
{
    Caption = 'Fuel Transaction';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Transaction No."; Code[20])
        {
            Caption = 'Transaction No.';
            DataClassification = CustomerContent;
        }

        field(10; "Employee No."; Code[20])
        {
            Caption = 'Employee No.';
            DataClassification = CustomerContent;
            TableRelation = Employee;
        }

        field(11; "Transaction Date"; Date)
        {
            Caption = 'Transaction Date';
            DataClassification = CustomerContent;
        }

        field(12; "Fuel Amount"; Decimal)
        {
            Caption = 'Fuel Amount';
            DataClassification = CustomerContent;
            DecimalPlaces = 2 : 5;
            MinValue = 0;
        }

        field(20; Status; Enum "Fuel Transaction Status")
        {
            Caption = 'Status';
            DataClassification = CustomerContent;
        }

        field(30; "Django Transaction ID"; Text[50])
        {
            Caption = 'Django Transaction ID';
            DataClassification = CustomerContent;
        }

        field(31; "Created From Django"; Boolean)
        {
            Caption = 'Created From Django';
            DataClassification = CustomerContent;
            Editable = false;
        }

        field(40; "Posted"; Boolean)
        {
            Caption = 'Posted';
            DataClassification = CustomerContent;
            Editable = false;
        }

        field(41; "Posted Date"; Date)
        {
            Caption = 'Posted Date';
            DataClassification = CustomerContent;
            Editable = false;
        }
    }

    keys
    {
        key(PK; "Transaction No.")
        {
            Clustered = true;
        }
        key(Django; "Django Transaction ID")
        {
        }
        key(Status; Status)
        {
        }
    }

    trigger OnInsert()
    var
        FuelSetup: Record "Fuel System Setup";
        NoSeriesManagement: Codeunit NoSeriesManagement;
    begin
        if "Transaction No." = '' then begin
            FuelSetup.Get();
            FuelSetup.TestField("Transaction Nos.");
            "Transaction No." := NoSeriesManagement.GetNextNo(FuelSetup."Transaction Nos.", WorkDate(), true);
        end;

        if "Transaction Date" = 0D then
            "Transaction Date" := WorkDate();
    end;
}

// Enum: Fuel Transaction Status
enum 50110 "Fuel Transaction Status"
{
    Extensible = true;

    value(0; Pending)
    {
        Caption = 'Pending';
    }
    value(1; Approved)
    {
        Caption = 'Approved';
    }
    value(2; Rejected)
    {
        Caption = 'Rejected';
    }
}

// Setup Page
page 50103 "Fuel System Setup"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    SourceTable = "Fuel System Setup";
    Caption = 'Parliament Fuel System Setup';
    InsertAllowed = false;
    DeleteAllowed = false;

    layout
    {
        area(Content)
        {
            group(General)
            {
                Caption = 'General';

                field("Integration Enabled"; Rec."Integration Enabled")
                {
                    ApplicationArea = All;
                    ToolTip = 'Enable integration with Parliament Fuel System';
                }

                field("Django Base URL"; Rec."Django Base URL")
                {
                    ApplicationArea = All;
                    ToolTip = 'Base URL for the Django application (e.g., https://parliament-fuel-system.azurewebsites.net/)';
                }

                field("Webhook Secret"; Rec."Webhook Secret")
                {
                    ApplicationArea = All;
                    ToolTip = 'Secret key for webhook authentication';
                }
            }

            group(Numbering)
            {
                Caption = 'Numbering';

                field("Transaction Nos."; Rec."Transaction Nos.")
                {
                    ApplicationArea = All;
                    ToolTip = 'Number series for fuel transactions';
                }
            }

            group(Posting)
            {
                Caption = 'Posting Setup';

                field("Journal Template"; Rec."Journal Template")
                {
                    ApplicationArea = All;
                    ToolTip = 'General journal template for posting fuel transactions';
                }

                field("Journal Batch"; Rec."Journal Batch")
                {
                    ApplicationArea = All;
                    ToolTip = 'General journal batch for posting fuel transactions';
                }

                field("Fuel Expense Account"; Rec."Fuel Expense Account")
                {
                    ApplicationArea = All;
                    ToolTip = 'G/L account for fuel expenses';
                }

                field("Fuel Payable Account"; Rec."Fuel Payable Account")
                {
                    ApplicationArea = All;
                    ToolTip = 'G/L account for fuel payables';
                }

                field("Fuel Rate per Liter"; Rec."Fuel Rate per Liter")
                {
                    ApplicationArea = All;
                    ToolTip = 'Standard rate per liter for fuel calculations';
                }
            }

            group(Status)
            {
                Caption = 'Sync Status';

                field("Last Sync Date"; Rec."Last Sync Date")
                {
                    ApplicationArea = All;
                    ToolTip = 'Last successful synchronization with Django';
                }

                field("Sync Status"; Rec."Sync Status")
                {
                    ApplicationArea = All;
                    ToolTip = 'Current synchronization status';
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(TestConnection)
            {
                ApplicationArea = All;
                Caption = 'Test Connection';
                Image = TestDatabase;
                PromotedCategory = Process;
                Promoted = true;

                trigger OnAction()
                begin
                    TestDjangoConnection();
                end;
            }

            action(SyncNow)
            {
                ApplicationArea = All;
                Caption = 'Sync Now';
                Image = Refresh;
                PromotedCategory = Process;
                Promoted = true;

                trigger OnAction()
                begin
                    SyncWithDjango();
                end;
            }

            action(OpenDashboard)
            {
                ApplicationArea = All;
                Caption = 'Open Dashboard';
                Image = Web;
                PromotedCategory = Navigation;
                Promoted = true;

                trigger OnAction()
                begin
                    if Rec."Django Base URL" <> '' then
                        Hyperlink(Rec."Django Base URL" + 'bc/dashboard/')
                    else
                        Message('Please configure Django Base URL first.');
                end;
            }
        }
    }

    trigger OnOpenPage()
    begin
        Rec.Reset();
        if not Rec.Get() then begin
            Rec.Init();
            Rec."Primary Key" := '';
            Rec."Django Base URL" := 'https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/';
            Rec."Integration Enabled" := true;
            Rec.Insert();
        end;
    end;

    local procedure TestDjangoConnection()
    var
        HttpClient: HttpClient;
        HttpRequestMessage: HttpRequestMessage;
        HttpResponseMessage: HttpResponseMessage;
        ResponseText: Text;
        TestUrl: Text;
    begin
        Rec.TestField("Django Base URL");

        TestUrl := Rec."Django Base URL" + 'api/bc/health/';

        HttpRequestMessage.Method := 'GET';
        HttpRequestMessage.SetRequestUri(TestUrl);

        if HttpClient.Send(HttpRequestMessage, HttpResponseMessage) then begin
            HttpResponseMessage.Content.ReadAs(ResponseText);

            if HttpResponseMessage.HttpStatusCode = 200 then begin
                Rec."Sync Status" := Rec."Sync Status"::Connected;
                Rec."Last Sync Date" := CurrentDateTime;
                Rec.Modify();
                Message('Connection successful!\Response: %1', ResponseText);
            end else begin
                Rec."Sync Status" := Rec."Sync Status"::Error;
                Rec.Modify();
                Error('Connection failed. Status: %1\Response: %2', HttpResponseMessage.HttpStatusCode, ResponseText);
            end;
        end else begin
            Rec."Sync Status" := Rec."Sync Status"::Error;
            Rec.Modify();
            Error('Failed to connect to Django application.');
        end;
    end;

    local procedure SyncWithDjango()
    var
        HttpClient: HttpClient;
        HttpRequestMessage: HttpRequestMessage;
        HttpResponseMessage: HttpResponseMessage;
        ResponseText: Text;
        SyncUrl: Text;
        RequestBody: Text;
        Headers: HttpHeaders;
    begin
        Rec.TestField("Django Base URL");

        SyncUrl := Rec."Django Base URL" + 'api/bc/webhook/';
        RequestBody := '{"eventType": "sync_request", "entityData": {"sync_type": "full"}}';

        HttpRequestMessage.Method := 'POST';
        HttpRequestMessage.SetRequestUri(SyncUrl);
        HttpRequestMessage.Content.WriteFrom(RequestBody);
        HttpRequestMessage.Content.GetHeaders(Headers);
        Headers.Clear();
        Headers.Add('Content-Type', 'application/json');

        if HttpClient.Send(HttpRequestMessage, HttpResponseMessage) then begin
            HttpResponseMessage.Content.ReadAs(ResponseText);

            if HttpResponseMessage.HttpStatusCode = 200 then begin
                Rec."Sync Status" := Rec."Sync Status"::Connected;
                Rec."Last Sync Date" := CurrentDateTime;
                Rec.Modify();
                Message('Sync completed successfully!\Response: %1', ResponseText);
            end else begin
                Rec."Sync Status" := Rec."Sync Status"::Error;
                Rec.Modify();
                Error('Sync failed. Status: %1\Response: %2', HttpResponseMessage.HttpStatusCode, ResponseText);
            end;
        end else begin
            Rec."Sync Status" := Rec."Sync Status"::Error;
            Rec.Modify();
            Error('Failed to sync with Django application.');
        end;
    end;
}
