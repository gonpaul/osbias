// scripts/test-relationships.ts
import db from "../src/lib/db";
import { NewUser, NewUserWithPassword } from "../src/models/user";
import { NewFramework, NewFrameworkStep } from "../src/models/knowledge";
import { NewJournalEntry, NewIdea } from "../src/models/journal";
import { NewBelief, NewGoal, NewAction } from "../src/models/life";

async function testRelationships() {
  console.log("🧪 Testing database relationships...\n");

  let testData: {
    userId: number | null;
    frameworkId: number | null;
    entryId: number | null;
    goalId: number | null;
  } = {
    userId: null,
    frameworkId: null,
    entryId: null,
    goalId: null
  };

  try {
    // Test 1: Create a user
    console.log("1. Creating test user...");
    const testUser: NewUserWithPassword = {
      name: "Test User",
      email: "test1@example.com",
      password: "hashed_password_123"
    };
    const [userId] = await db("users").insert(testUser);
    testData.userId = userId;
    console.log(`✅ User created with ID: ${userId}`);

    // Test 2: Create a framework with concepts
    console.log("\n2. Creating framework...");
    const testFramework: NewFramework = {
      user_id: null,
      name: "Test First Principles Framework",
      description: "A test framework for first principles thinking",
      concepts: JSON.stringify(["First Principles", "Problem Solving"]),
      is_system: true
    };
    const [frameworkId] = await db("frameworks").insert(testFramework);
    testData.frameworkId = frameworkId;
    console.log(`✅ Framework created with ID: ${frameworkId}`);

    // Test 3: Create framework steps
    console.log("\n3. Creating framework steps...");
    const steps: NewFrameworkStep[] = [
      {
        framework_id: frameworkId,
        step_order: 1,
        title: "Identify the problem",
        description: "Clearly define what you're trying to solve"
      },
      {
        framework_id: frameworkId,
        step_order: 2,
        title: "Break down assumptions",
        description: "List all assumptions about the problem"
      },
      {
        framework_id: frameworkId,
        step_order: 3,
        title: "Find fundamental truths",
        description: "Identify the basic facts that cannot be broken down further"
      }
    ];
    
    for (const step of steps) {
      await db("framework_steps").insert(step);
    }
    console.log(`✅ Created ${steps.length} framework steps`);

    // Test 4: Create journal entry
    console.log("\n4. Creating journal entry...");
    const journalEntry: NewJournalEntry = {
      user_id: userId,
      framework_id: frameworkId,
      title: "Testing First Principles",
      content: "This is a test entry using the First Principles framework."
    };
    const [entryId] = await db("journal_entries").insert(journalEntry);
    testData.entryId = entryId;
    console.log(`✅ Journal entry created with ID: ${entryId}`);

    // Test 5: Create ideas linked to entry and framework
    console.log("\n5. Creating ideas...");
    const ideas: NewIdea[] = [
      {
        entry_id: entryId,
        framework_id: frameworkId,
        content: "The core assumption here is that we need to solve this problem",
        text_selection: "This is a test entry",
        file_path: null
      },
      {
        entry_id: entryId,
        framework_id: null,
        content: "This is a general idea not linked to any framework",
        text_selection: null,
        file_path: null
      }
    ];
    
    for (const idea of ideas) {
      await db("ideas").insert(idea);
    }
    console.log(`✅ Created ${ideas.length} ideas`);

    // Test 6: Create belief
    console.log("\n6. Creating belief...");
    const belief: NewBelief = {
      user_id: userId,
      belief: "First principles thinking is the most effective problem-solving approach",
      confidence_level: 85,
      evidence: "Successfully used it in multiple complex projects"
    };
    const [beliefId] = await db("beliefs").insert(belief);
    console.log(`✅ Belief created with ID: ${beliefId}`);

    // Test 7: Create goal and action
    console.log("\n7. Creating goal and action...");
    const goal: NewGoal = {
      user_id: userId,
      title: "Master First Principles Thinking",
      description: "Become proficient in applying first principles to complex problems",
      status: "active",
      target_date: "2024-12-31"
    };
    const [goalId] = await db("goals").insert(goal);
    testData.goalId = goalId;
    console.log(`✅ Goal created with ID: ${goalId}`);

    const action: NewAction = {
      goal_id: goalId,
      description: "Practice first principles thinking on 5 different problems this week",
      completed: false,
      due_date: "2024-01-15"
    };
    const [actionId] = await db("actions").insert(action);
    console.log(`✅ Action created with ID: ${actionId}`);

    // Test 8: Verify relationships with queries
    console.log("\n8. Verifying relationships...");
    
    // Check user has journal entries
    const userEntries = await db("journal_entries").where("user_id", userId);
    console.log(`✅ User has ${userEntries.length} journal entries`);

    // Check framework has steps
    const frameworkSteps = await db("framework_steps").where("framework_id", frameworkId);
    console.log(`✅ Framework has ${frameworkSteps.length} steps`);

    // Check framework has concepts
    const framework = await db("frameworks").where("id", frameworkId).first();
    const concepts = JSON.parse(framework.concepts || "[]");
    console.log(`✅ Framework has concepts: ${concepts.join(", ")}`);

    // Check entry has ideas
    const entryIdeas = await db("ideas").where("entry_id", entryId);
    console.log(`✅ Journal entry has ${entryIdeas.length} ideas`);

    // Check goal has actions
    const goalActions = await db("actions").where("goal_id", goalId);
    console.log(`✅ Goal has ${goalActions.length} actions`);

    console.log("\n🎉 All relationship tests passed!");

  } catch (error) {
    console.error("❌ Relationship test failed:", error);
    throw error;
  } finally {
    // Cleanup: Remove all test data
    console.log("\n🧹 Cleaning up test data...");
    try {
      if (testData.goalId) {
        await db("actions").where("goal_id", testData.goalId).del();
        await db("goals").where("id", testData.goalId).del();
        console.log("✅ Cleaned up goals and actions");
      }
      
      if (testData.entryId) {
        await db("ideas").where("entry_id", testData.entryId).del();
        await db("journal_entries").where("id", testData.entryId).del();
        console.log("✅ Cleaned up journal entries and ideas");
      }
      
      if (testData.frameworkId) {
        await db("framework_steps").where("framework_id", testData.frameworkId).del();
        await db("frameworks").where("id", testData.frameworkId).del();
        console.log("✅ Cleaned up frameworks and steps");
      }
      
      if (testData.userId) {
        await db("beliefs").where("user_id", testData.userId).del();
        await db("users").where("id", testData.userId).del();
        console.log("✅ Cleaned up user and beliefs");
      }
      
      console.log("✅ All test data cleaned up successfully");
    } catch (cleanupError) {
      console.error("⚠️ Cleanup failed:", cleanupError);
    }
    
    await db.destroy();
  }
}

// Run the test
testRelationships().catch(console.error);
