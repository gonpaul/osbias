export async function seed(knex) {
  // Clear existing data
  await knex("similar_frameworks").del();
  await knex("framework_steps").del();
  await knex("frameworks").del();

  // Insert system frameworks with concepts
  const frameworks = [
    {
      user_id: null,
      name: "First Principles Decomposition",
      description: "A step-by-step process for applying first principles thinking to complex problems",
      concepts: JSON.stringify(["First Principles", "MECE"]),
      is_system: true
    },
    {
      user_id: null,
      name: "OODA Loop Process",
      description: "The complete OODA loop implementation for decision-making in dynamic environments",
      concepts: JSON.stringify(["OODA Loop", "Second-Order Thinking"]),
      is_system: true
    },
    {
      user_id: null,
      name: "Inversion Analysis",
      description: "Systematic approach to using inversion for better decision-making",
      concepts: JSON.stringify(["Inversion"]),
      is_system: true
    },
    {
      user_id: null,
      name: "MECE Analysis",
      description: "Ensuring complete and non-overlapping analysis of any problem",
      concepts: JSON.stringify(["MECE"]),
      is_system: true
    }
  ];

  const insertedFrameworks = await knex("frameworks")
    .insert(frameworks)
    .returning("id");

  const [fpFrameworkId, oodaFrameworkId, inversionFrameworkId, meceFrameworkId] =
    insertedFrameworks.map(row => row.id);

  // Insert framework steps
  const frameworkSteps = [
    // First Principles Decomposition
    {
      framework_id: fpFrameworkId,
      step_order: 1,
      title: "Identify the problem",
      description: "Clearly define what you're trying to solve or understand"
    },
    {
      framework_id: fpFrameworkId,
      step_order: 2,
      title: "List current assumptions",
      description: "Write down all assumptions you have about the problem"
    },
    {
      framework_id: fpFrameworkId,
      step_order: 3,
      title: "Break down to fundamentals",
      description: "Identify the basic facts that cannot be broken down further"
    },
    {
      framework_id: fpFrameworkId,
      step_order: 4,
      title: "Build up from basics",
      description: "Construct new solutions from the fundamental truths"
    },
    // OODA Loop Process
    {
      framework_id: oodaFrameworkId,
      step_order: 1,
      title: "Observe",
      description: "Gather information about the current situation and environment"
    },
    {
      framework_id: oodaFrameworkId,
      step_order: 2,
      title: "Orient",
      description: "Analyze and synthesize the information to understand the situation"
    },
    {
      framework_id: oodaFrameworkId,
      step_order: 3,
      title: "Decide",
      description: "Choose the best course of action based on your orientation"
    },
    {
      framework_id: oodaFrameworkId,
      step_order: 4,
      title: "Act",
      description: "Execute the decision and observe the results"
    },
    // Inversion Analysis
    {
      framework_id: inversionFrameworkId,
      step_order: 1,
      title: "Define success",
      description: "Clearly articulate what success looks like"
    },
    {
      framework_id: inversionFrameworkId,
      step_order: 2,
      title: "Identify failure modes",
      description: "List all the ways this could go wrong"
    },
    {
      framework_id: inversionFrameworkId,
      step_order: 3,
      title: "Prevent failures",
      description: "Develop strategies to avoid the identified failure modes"
    },
    // MECE Analysis
    {
      framework_id: meceFrameworkId,
      step_order: 1,
      title: "Define the scope",
      description: "Clearly define what you're analyzing"
    },
    {
      framework_id: meceFrameworkId,
      step_order: 2,
      title: "Create mutually exclusive categories",
      description: "Break down the scope into non-overlapping parts"
    },
    {
      framework_id: meceFrameworkId,
      step_order: 3,
      title: "Ensure collectively exhaustive coverage",
      description: "Verify that all parts together cover the entire scope"
    }
  ];

  await knex("framework_steps").insert(frameworkSteps);

  // Add some similar frameworks
  const similarFrameworks = [
    {
      framework_id_a: fpFrameworkId,
      framework_id_b: inversionFrameworkId,
      similarity_note: "Both are fundamental thinking approaches that help break down complex problems"
    },
    {
      framework_id_a: fpFrameworkId,
      framework_id_b: meceFrameworkId,
      similarity_note: "Both help break down complex problems into manageable parts"
    }
  ];

  await knex("similar_frameworks").insert(similarFrameworks);
}
