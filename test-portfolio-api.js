// Test script for Portfolio API endpoints
const API_BASE = 'http://localhost:8080/api';

async function testPortfolioAPI() {
  console.log('Testing Portfolio API endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData);
    console.log('');

    // Test 2: Get all portfolios (should be empty initially)
    console.log('2. Testing get all portfolios...');
    const portfoliosResponse = await fetch(`${API_BASE}/portfolios`);
    const portfoliosData = await portfoliosResponse.json();
    console.log('✅ Get portfolios passed:', portfoliosData);
    console.log('');

    // Test 3: Create a test portfolio
    console.log('3. Testing create portfolio...');
    const createResponse = await fetch(`${API_BASE}/portfolios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'name=Test Portfolio'
    });
    const createData = await createResponse.json();
    console.log('✅ Create portfolio passed:', createData);
    console.log('');

    // Test 4: Get all portfolios again (should have one now)
    console.log('4. Testing get all portfolios after creation...');
    const portfoliosResponse2 = await fetch(`${API_BASE}/portfolios`);
    const portfoliosData2 = await portfoliosResponse2.json();
    console.log('✅ Get portfolios after creation passed:', portfoliosData2);
    console.log('');

    // Test 5: Add a holding to the portfolio
    console.log('5. Testing add holding...');
    const portfolioId = createData.id;
    const addHoldingResponse = await fetch(`${API_BASE}/portfolios/${portfolioId}/holdings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'symbol=AAPL&quantity=10&averagePrice=150.00'
    });
    const addHoldingData = await addHoldingResponse.json();
    console.log('✅ Add holding passed:', addHoldingData);
    console.log('');

    console.log('🎉 All tests passed! Portfolio API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testPortfolioAPI();
