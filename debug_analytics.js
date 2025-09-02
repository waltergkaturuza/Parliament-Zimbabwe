// Debug script to test analytics API directly
const API_BASE_URL = 'https://parliament-zimbabwe.onrender.com';

// Get token from localStorage (you'll need to replace this with actual token)
const token = 'your_actual_token_here';

async function testAnalyticsAPI() {
    try {
        console.log('Testing analytics API...');
        
        const response = await fetch(`${API_BASE_URL}/api/v1/analytics/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            console.error('API Response not OK:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('Analytics API Response:', JSON.stringify(data, null, 2));
        
        // Check if data is minimal
        console.log('\n--- Data Analysis ---');
        console.log('Total revenue:', data.financial_summary?.total_revenue_usd || 0);
        console.log('Total boxes:', data.operational_summary?.total_boxes_processed || 0);
        console.log('Daily data entries:', data.daily_data?.length || 0);
        console.log('Fuel dispensed:', data.fuel_summary?.total_fuel_dispensed || 0);
        
    } catch (error) {
        console.error('Error testing analytics API:', error);
    }
}

testAnalyticsAPI();
