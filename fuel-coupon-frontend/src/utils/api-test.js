// Comprehensive API test script
// Run in browser console on the frontend page

const testAPIs = async () => {
  console.log('🔍 Starting comprehensive API tests...');
  
  // Get base API URL
  const apiBase = '/api/v1'; // Using proxy
  
  // Test 1: Subcenters API
  try {
    console.log('\n📍 Testing Subcenters API...');
    const subcentersResponse = await fetch(`${apiBase}/subcenters/?is_active=true&page_size=1000`);
    const subcentersData = await subcentersResponse.json();
    
    console.log('✅ Subcenters API Response:');
    console.log('- Status:', subcentersResponse.status);
    console.log('- Count:', subcentersData.count);
    console.log('- Results length:', subcentersData.results?.length);
    console.log('- Sample data:', subcentersData.results?.[0]);
    
    if (!subcentersData.results) {
      console.error('❌ Subcenters: Missing results array');
    }
  } catch (error) {
    console.error('❌ Subcenters API failed:', error);
  }
  
  // Test 2: Beneficiaries API
  try {
    console.log('\n👥 Testing Beneficiaries API...');
    const beneficiariesResponse = await fetch(`${apiBase}/beneficiaries/?page=1&page_size=10`);
    const beneficiariesData = await beneficiariesResponse.json();
    
    console.log('✅ Beneficiaries API Response:');
    console.log('- Status:', beneficiariesResponse.status);
    console.log('- Count:', beneficiariesData.count);
    console.log('- Results length:', beneficiariesData.results?.length);
    
    if (beneficiariesData.results?.length > 0) {
      const firstBeneficiary = beneficiariesData.results[0];
      console.log('- First beneficiary:');
      console.log('  - ID:', firstBeneficiary.id);
      console.log('  - Name:', firstBeneficiary.name);
      console.log('  - Has user details:', !!firstBeneficiary.user_details);
      console.log('  - User username:', firstBeneficiary.user_details?.username);
      console.log('  - Category:', firstBeneficiary.category);
      console.log('  - Sub-center:', firstBeneficiary.sub_center);
    }
    
    if (!beneficiariesData.results) {
      console.error('❌ Beneficiaries: Missing results array');
    }
  } catch (error) {
    console.error('❌ Beneficiaries API failed:', error);
  }
  
  // Test 3: Categories API
  try {
    console.log('\n🏷️ Testing Categories API...');
    const categoriesResponse = await fetch(`${apiBase}/public/categories/`);
    const categoriesData = await categoriesResponse.json();
    
    console.log('✅ Categories API Response:');
    console.log('- Status:', categoriesResponse.status);
    console.log('- Count:', categoriesData.length);
    console.log('- Sample:', categoriesData[0]);
  } catch (error) {
    console.error('❌ Categories API failed:', error);
  }
  
  // Test 4: Political Parties API
  try {
    console.log('\n🎯 Testing Political Parties API...');
    const partiesResponse = await fetch(`${apiBase}/public/parties/`);
    const partiesData = await partiesResponse.json();
    
    console.log('✅ Political Parties API Response:');
    console.log('- Status:', partiesResponse.status);
    console.log('- Count:', partiesData.length);
    console.log('- Sample:', partiesData[0]);
  } catch (error) {
    console.error('❌ Political Parties API failed:', error);
  }
  
  console.log('\n🎉 API tests completed!');
};

// Make available globally
window.testAPIs = testAPIs;

// Auto-run if in development
if (window.location.hostname === 'localhost') {
  console.log('🚀 Auto-running API tests in development...');
  testAPIs();
}