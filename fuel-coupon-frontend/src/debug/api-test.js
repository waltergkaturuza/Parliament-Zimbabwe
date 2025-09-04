// Debug script to test beneficiary API data structure
import apiClient from '../api/index.js';

const testBeneficiaryAPI = async () => {
  try {
    console.log('Testing beneficiary API...');
    
    // Test with different page sizes
    const response1 = await apiClient.get('/beneficiaries/?page_size=10');
    console.log('First 10 beneficiaries response structure:', {
      total: response1.data.count,
      results: response1.data.results?.length,
      firstBeneficiary: response1.data.results?.[0]
    });
    
    // Test larger fetch
    const response2 = await apiClient.get('/beneficiaries/?page_size=1000');
    console.log('Large beneficiaries fetch:', {
      total: response2.data.count,
      results: response2.data.results?.length,
      sampleNames: response2.data.results?.slice(0, 5).map(b => ({
        id: b.id,
        name: b.name,
        first_name: b.first_name,
        last_name: b.last_name,
        constituency: b.constituency,
        category: b.category
      }))
    });
    
    // Check for constituency vs beneficiary name confusion
    const suspiciousNames = response2.data.results?.filter(b => {
      const name = b.name || '';
      // Check if the name looks like a constituency (contains certain keywords)
      const constituencyKeywords = ['WEST', 'EAST', 'NORTH', 'SOUTH', 'CENTRAL', 'RURAL', 'URBAN', 'DISTRICT'];
      return constituencyKeywords.some(keyword => name.toUpperCase().includes(keyword));
    });
    
    console.log('Potentially problematic names (constituency-like):', suspiciousNames?.slice(0, 10));
    
  } catch (error) {
    console.error('API test failed:', error);
  }
};

// Auto-run when imported
testBeneficiaryAPI();

export default testBeneficiaryAPI;
