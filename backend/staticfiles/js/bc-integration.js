/**
 * Business Central Integration JavaScript
 * This file provides the interface between Business Central and the Django application
 */

(function(window) {
    'use strict';

    // BC Integration object
    window.BCIntegration = {
        isReady: false,
        baseUrl: '',
        bcContext: null,
        
        // Initialize the integration
        initialize: function(baseUrl, bcContext) {
            this.baseUrl = baseUrl;
            this.bcContext = JSON.parse(bcContext);
            this.isReady = true;
            
            console.log('BC Integration initialized:', {
                baseUrl: this.baseUrl,
                context: this.bcContext
            });
            
            // Notify BC that we're ready
            this.notifyBC('ControlAddInReady');
        },
        
        // Send data to Django backend
        sendData: function(data) {
            if (!this.isReady) {
                console.error('BC Integration not initialized');
                return;
            }
            
            fetch(this.baseUrl.replace('/bc/dashboard/', '/api/bc/webhook/'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventType: 'data_update',
                    entityData: data,
                    bcContext: this.bcContext
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Data sent to Django:', data);
                this.notifyBC('DataSent', JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error sending data:', error);
                this.notifyBC('Error', error.message);
            });
        },
        
        // Refresh data from Django
        refreshData: function() {
            if (!this.isReady) {
                console.error('BC Integration not initialized');
                return;
            }
            
            fetch(this.baseUrl.replace('/bc/dashboard/', '/api/bc/dashboard-data/'))
            .then(response => response.json())
            .then(data => {
                console.log('Data refreshed from Django:', data);
                this.notifyBC('DataChanged', JSON.stringify(data));
                
                // Update the dashboard if it exists
                if (window.BCDashboard && window.BCDashboard.updateData) {
                    window.BCDashboard.updateData(data);
                }
            })
            .catch(error => {
                console.error('Error refreshing data:', error);
                this.notifyBC('Error', error.message);
            });
        },
        
        // Set user context
        setUserContext: function(userId, companyId) {
            this.bcContext = {
                ...this.bcContext,
                userId: userId,
                companyId: companyId
            };
            
            console.log('User context updated:', this.bcContext);
        },
        
        // Notify Business Central
        notifyBC: function(eventType, data) {
            try {
                // For Control Add-in events
                if (window.parent && window.parent.postMessage) {
                    window.parent.postMessage({
                        type: eventType,
                        data: data || '',
                        source: 'BCIntegration'
                    }, '*');
                }
                
                // For direct BC API calls (if available)
                if (window.Microsoft && window.Microsoft.Dynamics) {
                    console.log('Sending to BC via Microsoft.Dynamics API:', eventType, data);
                }
            } catch (error) {
                console.error('Error notifying BC:', error);
            }
        }
    };
    
    // Auto-refresh data every 30 seconds
    setInterval(function() {
        if (window.BCIntegration.isReady) {
            window.BCIntegration.refreshData();
        }
    }, 30000);
    
    // Listen for messages from Business Central
    window.addEventListener('message', function(event) {
        if (event.data && event.data.source === 'BusinessCentral') {
            console.log('Message from BC:', event.data);
            
            switch (event.data.type) {
                case 'RefreshData':
                    window.BCIntegration.refreshData();
                    break;
                case 'SendData':
                    window.BCIntegration.sendData(event.data.data);
                    break;
                case 'SetUserContext':
                    window.BCIntegration.setUserContext(
                        event.data.userId, 
                        event.data.companyId
                    );
                    break;
            }
        }
    });
    
    console.log('BC Integration script loaded');
    
})(window);
