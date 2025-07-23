// Business Central Control Add-in for Parliament Fuel System Integration
// This file defines the Control Add-in interface for embedding the Django app

controladdin "Parliament Fuel System"
{
    RequestedHeight = 700;
    MinimumHeight = 500;
    RequestedWidth = 1200;
    MinimumWidth = 800;
    VerticalStretch = true;
    HorizontalStretch = true;

    // Reference to the BC integration JavaScript file
    Scripts = 'https://parliament-fuel-system.azurewebsites.net/static/js/bc-integration.js';

    /// <summary>
    /// Fired when the control add-in is ready and initialized
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
    /// Fired when a transaction status is updated in Django
    /// </summary>
    event TransactionUpdated(transactionData: Text);

    /// <summary>
    /// Fired when an error occurs in the Django app
    /// </summary>
    event ErrorOccurred(errorMessage: Text);

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

    /// <summary>
    /// Navigate to a specific page in the Django app
    /// </summary>
    procedure NavigateToPage(pageName: Text);

    /// <summary>
    /// Send transaction approval to Django
    /// </summary>
    procedure ApproveTransaction(transactionId: Text);

    /// <summary>
    /// Send transaction rejection to Django
    /// </summary>
    procedure RejectTransaction(transactionId: Text; reason: Text);
}
