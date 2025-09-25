const API_BASE = 'http://localhost:3000/api';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message?: string;
}

interface TestData {
  userId?: number;
  frameworkId?: number;
  entryId?: number;
  ideaId?: number;
  goalId?: number;
  actionId?: number;
  beliefId?: number;
}

const results: TestResult[] = [];
const testData: TestData = {};

function logTest(test: string, success: boolean, message?: string) {
  results.push({
    test,
    status: success ? 'PASS' : 'FAIL',
    message
  });
  console.log(`${success ? '✅' : '❌'} ${test}${message ? `: ${message}` : ''}`);
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order to respect foreign key constraints
    if (testData.beliefId) {
      await fetch(`${API_BASE}/beliefs/${testData.beliefId}`, { method: 'DELETE' });
    }
    if (testData.actionId) {
      await fetch(`${API_BASE}/actions/${testData.actionId}`, { method: 'DELETE' });
    }
    if (testData.goalId) {
      await fetch(`${API_BASE}/goals/${testData.goalId}`, { method: 'DELETE' });
    }
    if (testData.ideaId) {
      await fetch(`${API_BASE}/ideas/${testData.ideaId}`, { method: 'DELETE' });
    }
    if (testData.entryId) {
      await fetch(`${API_BASE}/journal/${testData.entryId}`, { method: 'DELETE' });
    }
    if (testData.frameworkId) {
      await fetch(`${API_BASE}/frameworks/${testData.frameworkId}`, { method: 'DELETE' });
    }
    if (testData.userId) {
      await fetch(`${API_BASE}/users/${testData.userId}`, { method: 'DELETE' });
    }
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log(`⚠️ Cleanup failed: ${error}`);
  }
}

async function testAPI() {
  console.log('🚀 Testing Qualia AI Journal API\n');

  // First, test if the server is reachable
  try {
    console.log('🔍 Checking if server is running...');
    const healthCheck = await fetch(`${API_BASE}/docs`);
    console.log(`Server status: ${healthCheck.status}`);
  } catch (error) {
    console.log(`❌ Server not reachable: ${(error as Error).message}`);
    console.log('💡 Make sure to run: npm run dev');
    return;
  }

  try {
    // Test 1: Create a user
    const userResponse = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test4@example.com',
        password: "secret1"
      })
    });
    
    const user = await userResponse.json() as { id: number };
    testData.userId = user.id;
    logTest('Create User', userResponse.ok, `Created user ${user.id}`);

    // Test 2: Get users
    const usersResponse = await fetch(`${API_BASE}/users`);
    const users = await usersResponse.json() as Array<{ id: number }>;
    logTest('Get Users', usersResponse.ok && users.length > 0, `Found ${users.length} users`);

    // Test 3: Create a framework
    const frameworkResponse = await fetch(`${API_BASE}/frameworks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testData.userId,
        name: 'Test Framework',
        description: 'A test framework for API testing',
        concepts: ['Testing', 'API', 'Validation'],
        is_system: false
      })
    });
    
    const framework = await frameworkResponse.json() as { id: number };
    testData.frameworkId = framework.id;
    logTest('Create Framework', frameworkResponse.ok, `Created framework ${framework.id}`);

    // Test 4: Get frameworks
    const frameworksResponse = await fetch(`${API_BASE}/frameworks?user_id=${testData.userId}`);
    const frameworks = await frameworksResponse.json() as Array<{ id: number }>;
    logTest('Get Frameworks', frameworksResponse.ok && frameworks.length > 0, `Found ${frameworks.length} frameworks`);

    // Test 5: Create framework steps
    const step1Response = await fetch(`${API_BASE}/frameworks/${testData.frameworkId}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step_order: 1,
        title: 'Step 1: Prepare',
        description: 'Prepare for testing'
      })
    });
    logTest('Create Framework Step', step1Response.ok);

    // Test 6: Get framework with steps
    const frameworkWithStepsResponse = await fetch(`${API_BASE}/frameworks/${testData.frameworkId}`);
    const frameworkWithSteps = await frameworkWithStepsResponse.json() as { steps: Array<{ id: number }> };
    logTest('Get Framework with Steps', frameworkWithStepsResponse.ok && frameworkWithSteps.steps.length > 0);

    // Test 7: Create journal entry
    const journalResponse = await fetch(`${API_BASE}/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testData.userId,
        framework_id: testData.frameworkId,
        title: 'Test Journal Entry',
        content: 'This is a test journal entry to validate the API.'
      })
    });
    
    const journalEntry = await journalResponse.json() as { id: number };
    testData.entryId = journalEntry.id;
    logTest('Create Journal Entry', journalResponse.ok, `Created entry ${journalEntry.id}`);

    // Test 8: Get journal entries
    const journalEntriesResponse = await fetch(`${API_BASE}/journal?user_id=${testData.userId}`);
    const journalEntries = await journalEntriesResponse.json() as Array<{ id: number }>;
    logTest('Get Journal Entries', journalEntriesResponse.ok && journalEntries.length > 0);

    // Test 9: Create idea
    const ideaResponse = await fetch(`${API_BASE}/journal/${testData.entryId}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        framework_id: testData.frameworkId,
        content: 'This is a test idea generated from the journal entry.',
        text_selection: 'test journal entry'
      })
    });
    
    const idea = await ideaResponse.json() as { id: number };
    testData.ideaId = idea.id;
    logTest('Create Idea', ideaResponse.ok, `Created idea ${idea.id}`);

    // Test 10: Get journal entry with ideas
    const entryWithIdeasResponse = await fetch(`${API_BASE}/journal/${testData.entryId}`);
    const entryWithIdeas = await entryWithIdeasResponse.json() as { ideas: Array<{ id: number }> };
    logTest('Get Entry with Ideas', entryWithIdeasResponse.ok && entryWithIdeas.ideas.length > 0);

    // Test 11: Create goal
    const goalResponse = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testData.userId,
        title: 'Test Goal',
        description: 'A test goal for API validation',
        status: 'planned',
        target_date: '2025-12-31'
      })
    });
    
    const goal = await goalResponse.json() as { id: number };
    testData.goalId = goal.id;
    logTest('Create Goal', goalResponse.ok, `Created goal ${goal.id}`);

    // Test 12: Create action
    const actionResponse = await fetch(`${API_BASE}/goals/${testData.goalId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Complete API testing',
        completed: false,
        due_date: '2025-10-01'
      })
    });
    
    const action = await actionResponse.json() as { id: number };
    testData.actionId = action.id;
    logTest('Create Action', actionResponse.ok, `Created action ${action.id}`);

    // Test 13: Get goal with actions
    const goalWithActionsResponse = await fetch(`${API_BASE}/goals/${testData.goalId}`);
    const goalWithActions = await goalWithActionsResponse.json() as { actions: Array<{ id: number }> };
    logTest('Get Goal with Actions', goalWithActionsResponse.ok && goalWithActions.actions.length > 0);

    // Test 14: Create belief
    const beliefResponse = await fetch(`${API_BASE}/beliefs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testData.userId,
        belief: 'API testing is essential for reliable software',
        confidence_level: 95,
        evidence: 'Years of experience with software development'
      })
    });
    
    const belief = await beliefResponse.json() as { id: number };
    testData.beliefId = belief.id;
    logTest('Create Belief', beliefResponse.ok, `Created belief ${belief.id}`);

    // Test 15: Get beliefs
    const beliefsResponse = await fetch(`${API_BASE}/beliefs?user_id=${testData.userId}`);
    const beliefs = await beliefsResponse.json() as Array<{ id: number }>;
    logTest('Get Beliefs', beliefsResponse.ok && beliefs.length > 0);

    // Test 16: Test Swagger docs
    const docsResponse = await fetch(`${API_BASE}/docs`);
    const docs = await docsResponse.json() as { openapi?: string };
    logTest('Get API Documentation', docsResponse.ok && !!docs.openapi);

  } catch (error) {
    logTest('API Test Suite', false, `Error: ${(error as Error).message}`);
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Phase 1 API is complete and working.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
  }

  // Always cleanup regardless of test results
  await cleanup();
}

// Run the tests
testAPI().catch(console.error);
