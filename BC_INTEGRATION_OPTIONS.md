# 🏛️ PARLIAMENT FUEL COUPON SYSTEM
## 🔗 BUSINESS CENTRAL INTEGRATION OPTIONS
### Operating Your Django App Within Business Central

---

## 🎯 **INTEGRATION APPROACHES**

### **Option 1: Business Central Add-in (Recommended)**
**Embed your Django app directly in Business Central pages**

✅ **Advantages:**
- Keep your existing Django application
- Full integration within BC interface
- Users never leave Business Central
- Maintain all current functionality
- No redevelopment needed

```al
// Business Central Add-in Configuration
page 50100 "Fuel Coupon Management"
{
    PageType = Card;
    ApplicationArea = All;
    
    layout
    {
        area(Content)
        {
            usercontrol(FuelSystem; "Fuel Coupon Add-in")
            {
                ApplicationArea = All;
                
                trigger ControlAddInReady()
                begin
                    // Initialize the Django app within BC
                    CurrPage.FuelSystem.InitializeApp('https://fuel.parliament.gov.zw');
                end;
            }
        }
    }
}
```

### **Option 2: Business Central Web Services Integration**
**Deep two-way integration with BC data**

✅ **Features:**
- Real-time data synchronization
- BC workflows trigger Django actions
- Django updates reflected in BC instantly
- Shared user authentication

### **Option 3: Power Platform Integration (Hybrid)**
**Use Power Platform as a bridge**

✅ **Benefits:**
- Power Apps for simple forms
- Power Automate for workflows
- Django for complex logic
- Best of both worlds

---

## 🔧 **IMPLEMENTATION: DJANGO APP IN BUSINESS CENTRAL**

### **Step 1: Create Business Central Add-in**

#### **Control Add-in Definition**
```al
controladdin "Fuel Coupon Add-in"
{
    RequestedHeight = 600;
    MinimumHeight = 400;
    RequestedWidth = 1200;
    MinimumWidth = 800;
    VerticalStretch = true;
    HorizontalStretch = true;
    
    Scripts = 'https://fuel.parliament.gov.zw/static/js/bc-integration.js';
    
    event ControlAddInReady();
    event DataChanged(data: Text);
    
    procedure InitializeApp(url: Text);
    procedure SendData(data: Text);
    procedure RefreshData();
}
```

#### **JavaScript Integration Bridge**
```javascript
// bc-integration.js - Bridge between Django and BC
class BCFuelSystemIntegration {
    constructor() {
        this.bcInterface = null;
        this.djangoApp = null;
    }
    
    initialize(bcControl) {
        this.bcInterface = bcControl;
        this.loadDjangoApp();
        this.setupEventListeners();
    }
    
    loadDjangoApp() {
        // Embed Django app in iframe with BC authentication
        const iframe = document.createElement('iframe');
        iframe.src = 'https://fuel.parliament.gov.zw/bc-embedded/';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Pass BC context to Django
        iframe.onload = () => {
            this.sendBCContext();
        };
        
        document.body.appendChild(iframe);
    }
    
    sendBCContext() {
        const bcContext = {
            userId: this.bcInterface.getCurrentUser(),
            companyId: this.bcInterface.getCurrentCompany(),
            environment: this.bcInterface.getEnvironment()
        };
        
        // Send context to Django app
        this.postMessageToDjango('BC_CONTEXT', bcContext);
    }
    
    postMessageToDjango(type, data) {
        const iframe = document.querySelector('iframe');
        iframe.contentWindow.postMessage({
            type: type,
            data: data,
            source: 'business-central'
        }, 'https://fuel.parliament.gov.zw');
    }
}
```

### **Step 2: Django BC-Embedded Views**

#### **Create BC-Specific Views**
```python
# fuel/views_bc.py - Business Central embedded views
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt
from django.http import JsonResponse
import json

@xframe_options_exempt  # Allow embedding in BC iframe
@csrf_exempt
def bc_embedded_dashboard(request):
    """Main dashboard embedded in Business Central"""
    context = {
        'is_bc_embedded': True,
        'bc_integration': True,
        'hide_navigation': True,  # Hide Django nav when in BC
    }
    return render(request, 'fuel/bc_embedded/dashboard.html', context)

@xframe_options_exempt
@csrf_exempt
def bc_fuel_transactions(request):
    """Fuel transactions view optimized for BC"""
    if request.method == 'POST':
        # Handle BC data updates
        bc_data = json.loads(request.body)
        return handle_bc_transaction_update(bc_data)
    
    transactions = FuelTransaction.objects.filter(
        company_id=request.GET.get('company_id')
    )
    
    context = {
        'transactions': transactions,
        'is_bc_embedded': True,
    }
    return render(request, 'fuel/bc_embedded/transactions.html', context)

def handle_bc_transaction_update(bc_data):
    """Process transaction updates from Business Central"""
    try:
        # Update Django models with BC data
        transaction = FuelTransaction.objects.get(
            id=bc_data['transaction_id']
        )
        transaction.bc_status = bc_data['status']
        transaction.bc_reference = bc_data['reference']
        transaction.save()
        
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
```

#### **BC-Optimized Templates**
```html
<!-- fuel/templates/fuel/bc_embedded/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Parliament Fuel System</title>
    <style>
        /* BC-optimized styling */
        body { 
            margin: 0; 
            padding: 10px; 
            font-family: 'Segoe UI', sans-serif;
            background: #f8f9fa;
        }
        .bc-container { 
            max-width: 100%; 
            height: calc(100vh - 20px);
        }
        .bc-header {
            background: #0078d4;
            color: white;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="bc-container">
        <div class="bc-header">
            <h3>🏛️ Parliament Fuel Coupon System</h3>
        </div>
        
        <!-- Quick Actions for BC Users -->
        <div class="quick-actions">
            <button onclick="createTransaction()">New Fuel Transaction</button>
            <button onclick="viewReports()">View Reports</button>
            <button onclick="syncWithBC()">Sync with BC</button>
        </div>
        
        <!-- Dashboard Content -->
        <div id="dashboard-content">
            {% include 'fuel/components/dashboard_stats.html' %}
            {% include 'fuel/components/recent_transactions.html' %}
        </div>
    </div>
    
    <script>
        // BC Integration JavaScript
        function createTransaction() {
            // Open transaction form optimized for BC
            window.parent.postMessage({
                type: 'OPEN_TRANSACTION_FORM',
                source: 'django-app'
            }, '*');
        }
        
        function syncWithBC() {
            fetch('/api/bc/sync/', {method: 'POST'})
                .then(response => response.json())
                .then(data => {
                    window.parent.postMessage({
                        type: 'SYNC_COMPLETE',
                        data: data
                    }, '*');
                });
        }
        
        // Listen for BC messages
        window.addEventListener('message', function(event) {
            if (event.data.source === 'business-central') {
                handleBCMessage(event.data);
            }
        });
        
        function handleBCMessage(message) {
            switch(message.type) {
                case 'BC_CONTEXT':
                    // Set BC user context in Django
                    setBCContext(message.data);
                    break;
                case 'REFRESH_DATA':
                    // Refresh Django data
                    location.reload();
                    break;
            }
        }
    </script>
</body>
</html>
```

### **Step 3: Business Central Page Integration**

#### **Create BC Pages for Fuel System**
```al
// Business Central pages for fuel system
page 50101 "Fuel Transactions"
{
    PageType = List;
    ApplicationArea = All;
    SourceTable = "Fuel Transaction";
    CardPageId = "Fuel Transaction Card";
    
    layout
    {
        area(Content)
        {
            repeater(Transactions)
            {
                field("Transaction No."; "Transaction No.")
                {
                    ApplicationArea = All;
                }
                field("Employee No."; "Employee No.")
                {
                    ApplicationArea = All;
                }
                field("Fuel Amount"; "Fuel Amount")
                {
                    ApplicationArea = All;
                }
                field("Transaction Date"; "Transaction Date")
                {
                    ApplicationArea = All;
                }
                field(Status; Status)
                {
                    ApplicationArea = All;
                }
            }
        }
        area(FactBoxes)
        {
            part(FuelSystemFactBox; "Fuel System Embedded")
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
                    // Open Django app in BC
                    OpenFuelSystemApp();
                end;
            }
        }
    }
}

page 50102 "Fuel System Embedded"
{
    PageType = CardPart;
    
    layout
    {
        area(Content)
        {
            usercontrol(DjangoApp; "Fuel Coupon Add-in")
            {
                ApplicationArea = All;
                
                trigger ControlAddInReady()
                begin
                    CurrPage.DjangoApp.InitializeApp('https://fuel.parliament.gov.zw/bc-embedded/');
                end;
            }
        }
    }
}
```

---

## 🔄 **REAL-TIME SYNCHRONIZATION**

### **Django to BC Webhook**
```python
# fuel/services/bc_webhook.py
import requests
from django.conf import settings

class BCWebhookService:
    def __init__(self):
        self.bc_webhook_url = settings.BUSINESS_CENTRAL_CONFIG['webhook_url']
        
    def notify_bc_transaction_created(self, transaction):
        """Notify BC when Django creates a transaction"""
        payload = {
            'event': 'transaction_created',
            'transaction_id': transaction.id,
            'employee_no': transaction.user.employee_id,
            'amount': float(transaction.amount),
            'date': transaction.created_at.isoformat(),
            'status': transaction.status
        }
        
        try:
            response = requests.post(
                self.bc_webhook_url,
                json=payload,
                headers={'Authorization': f'Bearer {self.get_bc_token()}'}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"BC webhook failed: {e}")
            return False
    
    def sync_transaction_status(self, transaction_id, bc_status):
        """Sync status from BC back to Django"""
        try:
            transaction = FuelTransaction.objects.get(id=transaction_id)
            transaction.bc_status = bc_status
            transaction.save()
            return True
        except FuelTransaction.DoesNotExist:
            return False
```

### **BC to Django Integration**
```al
// Business Central codeunit for Django integration
codeunit 50100 "Django Integration"
{
    procedure SendTransactionToDjango(TransactionRec: Record "Fuel Transaction")
    var
        HttpClient: HttpClient;
        HttpRequestMessage: HttpRequestMessage;
        HttpResponseMessage: HttpResponseMessage;
        RequestBody: Text;
        ResponseText: Text;
    begin
        // Prepare request body
        RequestBody := BuildTransactionJson(TransactionRec);
        
        // Send to Django
        HttpRequestMessage.Method := 'POST';
        HttpRequestMessage.SetRequestUri('https://fuel.parliament.gov.zw/api/bc/transactions/');
        HttpRequestMessage.Content.WriteFrom(RequestBody);
        HttpRequestMessage.Content.GetHeaders.Clear();
        HttpRequestMessage.Content.GetHeaders.Add('Content-Type', 'application/json');
        
        if HttpClient.Send(HttpRequestMessage, HttpResponseMessage) then begin
            HttpResponseMessage.Content.ReadAs(ResponseText);
            ProcessDjangoResponse(ResponseText);
        end;
    end;
    
    local procedure BuildTransactionJson(TransactionRec: Record "Fuel Transaction"): Text
    var
        JsonObject: JsonObject;
        JsonText: Text;
    begin
        JsonObject.Add('transaction_no', TransactionRec."Transaction No.");
        JsonObject.Add('employee_no', TransactionRec."Employee No.");
        JsonObject.Add('amount', TransactionRec."Fuel Amount");
        JsonObject.Add('date', Format(TransactionRec."Transaction Date"));
        JsonObject.Add('status', Format(TransactionRec.Status));
        
        JsonObject.WriteTo(JsonText);
        exit(JsonText);
    end;
}
```

---

## 🎯 **COMPARISON: DJANGO vs POWER APPS**

### **Keep Django + BC Integration (Recommended)**
✅ **Advantages:**
- **No redevelopment** - Use existing code
- **Full functionality** - Keep all features
- **Better performance** - Optimized Django backend
- **More flexibility** - Custom logic and workflows
- **Cost effective** - No Power Apps licensing costs
- **Easier maintenance** - Single codebase

❌ **Considerations:**
- Requires BC add-in development (1-2 weeks)
- Need iframe/embedding setup

### **Rebuild with Power Apps**
✅ **Advantages:**
- **Native BC integration** - Built for Microsoft ecosystem
- **Drag-and-drop** interface building
- **Automatic mobile** optimization

❌ **Disadvantages:**
- **Complete redevelopment** (2-3 months)
- **Limited customization** compared to Django
- **Additional licensing costs** (~$20/user/month)
- **Performance limitations** for complex operations
- **Lose existing integrations**

---

## 🚀 **RECOMMENDED IMPLEMENTATION PLAN**

### **Phase 1: Basic BC Integration (Week 1-2)**
1. Create BC Add-in control
2. Develop embedded Django views
3. Set up iframe integration
4. Test basic functionality

### **Phase 2: Deep Integration (Week 3-4)**
1. Real-time synchronization
2. BC webhook implementation
3. Shared authentication
4. Data consistency checks

### **Phase 3: Enhanced Features (Week 5-6)**
1. BC workflow integration
2. Advanced reporting in BC
3. Mobile optimization
4. User training

---

## 💡 **IMMEDIATE NEXT STEPS**

**Would you like me to:**

1. **🔧 Create the BC Add-in code** for embedding Django app
2. **🔗 Set up the Django BC-embedded views** 
3. **📊 Design the BC pages** for fuel management
4. **🔄 Implement real-time synchronization**

**This approach gives you the best of both worlds** - keep your powerful Django application AND have it fully integrated within Business Central! 

**Which integration level would you prefer to start with?** 🎯
