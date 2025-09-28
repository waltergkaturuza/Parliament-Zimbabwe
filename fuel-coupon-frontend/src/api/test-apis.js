// Simple test for beneficiaries API
import apiClient from './index.js';

const testBeneficiaries = async () => {
  try {
    console.log('Testing beneficiaries API...');
    const response = await apiClient.get('/beneficiaries/', { params: { page_size: 10 } });
    console.log('SUCCESS - Response status:', response.status);
    console.log('Response data count:', response.data?.count);
    console.log('Results length:', response.data?.results?.length);
    
    if (response.data?.results?.length > 0) {
      const first = response.data.results[0];
      console.log('First beneficiary:', {
        id: first.id,
        name: first.name,
        category: first.category,
        user_details: first.user_details
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('FAILED - Error testing beneficiaries API:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

// Also test subcenters
const testSubcenters = async () => {
  try {
    console.log('Testing subcenters API...');
    const response = await apiClient.get('/subcenters/', { params: { is_active: true, page_size: 1000 } });
    console.log('SUCCESS - Subcenters response status:', response.status);
    console.log('Response data count:', response.data?.count);
    console.log('Results length:', response.data?.results?.length);
    return response.data;
  } catch (error) {
    console.error('FAILED - Error testing subcenters API:', error);
    throw error;
  }
};

// Run tests
export { testBeneficiaries, testSubcenters };

// If running directly
if (typeof window !== 'undefined') {
  window.testBeneficiariesAPI = testBeneficiaries;
  window.testSubcentersAPI = testSubcenters;
}