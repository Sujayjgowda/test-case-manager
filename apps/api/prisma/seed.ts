import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'E-commerce Platform',
      key: 'ECOM',
      description: 'Main e-commerce application with shopping cart and checkout',
      status: 'active',
    },
  });

  console.log(`Created project: ${project.name}`);

  // Create modules
  const authModule = await prisma.module.create({
    data: {
      projectId: project.id,
      name: 'Authentication',
      description: 'User login, registration, and password management',
      orderIndex: 0,
    },
  });

  const cartModule = await prisma.module.create({
    data: {
      projectId: project.id,
      name: 'Shopping Cart',
      description: 'Cart management and item operations',
      orderIndex: 1,
    },
  });

  const checkoutModule = await prisma.module.create({
    data: {
      projectId: project.id,
      name: 'Checkout',
      description: 'Order placement and payment processing',
      orderIndex: 2,
    },
  });

  console.log(`Created modules: ${authModule.name}, ${cartModule.name}, ${checkoutModule.name}`);

  // Create scenarios
  const loginScenario = await prisma.scenario.create({
    data: {
      moduleId: authModule.id,
      title: 'User Login with Valid Credentials',
      description: 'Verify that a user can successfully log in with valid username and password',
      priority: 'high',
      preconditions: 'User account exists and is active',
      expectedOutcome: 'User is successfully logged in and redirected to dashboard',
      status: 'draft',
    },
  });

  const forgotPasswordScenario = await prisma.scenario.create({
    data: {
      moduleId: authModule.id,
      title: 'Password Reset via Email',
      description: 'Verify that a user can request and complete a password reset',
      priority: 'medium',
      preconditions: 'User has a verified email address',
      expectedOutcome: 'Password reset email is sent and user can reset password',
      status: 'draft',
    },
  });

  const addToCartScenario = await prisma.scenario.create({
    data: {
      moduleId: cartModule.id,
      title: 'Add Items to Shopping Cart',
      description: 'Verify that users can add products to their shopping cart',
      priority: 'high',
      preconditions: 'User is logged in, products are available',
      expectedOutcome: 'Items are added to cart with correct quantity and price',
      status: 'draft',
    },
  });

  console.log(
    `Created scenarios: ${loginScenario.title}, ${forgotPasswordScenario.title}, ${addToCartScenario.title}`
  );

  // Create sample test cases
  const loginTestCase = await prisma.testCase.create({
    data: {
      scenarioId: loginScenario.id,
      title: 'Login with valid credentials',
      description: 'Verify successful login with correct username and password',
      priority: 'high',
      status: 'draft',
      preConditions: 'User exists with email test@example.com and password Password123!',
      postConditions: 'User is logged in and on dashboard page',
      aiGenerated: false,
    },
  });

  // Add steps to the test case
  await prisma.testStep.createMany({
    data: [
      {
        testCaseId: loginTestCase.id,
        stepNumber: 1,
        description: 'Navigate to the login page',
        expectedResult: 'Login form is displayed with email and password fields',
      },
      {
        testCaseId: loginTestCase.id,
        stepNumber: 2,
        description: 'Enter valid email address in the email field',
        expectedResult: 'Email is accepted and displayed in the field',
      },
      {
        testCaseId: loginTestCase.id,
        stepNumber: 3,
        description: 'Enter valid password in the password field',
        expectedResult: 'Password is masked and displayed as dots',
      },
      {
        testCaseId: loginTestCase.id,
        stepNumber: 4,
        description: 'Click the "Sign In" button',
        expectedResult: 'User is redirected to the dashboard page',
      },
      {
        testCaseId: loginTestCase.id,
        stepNumber: 5,
        description: 'Verify the welcome message displays user name',
        expectedResult: 'Welcome message shows "Welcome, [User Name]"',
      },
    ],
  });

  console.log(`Created sample test case with steps: ${loginTestCase.title}`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nSummary:');
  console.log(`- 1 Project: ${project.name}`);
  console.log(`- 3 Modules: Authentication, Shopping Cart, Checkout`);
  console.log(`- 3 Scenarios with sample test data`);
  console.log(`- 1 Test Case with 5 steps`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
