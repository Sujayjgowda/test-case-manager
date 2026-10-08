import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Oracle Argus Safety Test Data...');

  // Create Oracle Argus Safety Project
  const argusProject = await prisma.project.create({
    data: {
      name: 'Oracle Argus Safety',
      key: 'ARGUS',
      description: 'Pharmacovigilance safety database for adverse event reporting',
      status: 'active',
    },
  });

  console.log(`Created project: ${argusProject.name}`);

  // Create Modules for Argus Safety
  const modules = await Promise.all([
    prisma.module.create({
      data: {
        projectId: argusProject.id,
        name: 'Case Intake & Data Entry',
        description: 'Spontaneous reports, literature cases, study cases intake',
        orderIndex: 0,
      },
    }),
    prisma.module.create({
      data: {
        projectId: argusProject.id,
        name: 'Blinded & Unblinded Processing',
        description: 'Blind maintenance, unblinding workflows, treatment exposure',
        orderIndex: 1,
      },
    }),
    prisma.module.create({
      data: {
        projectId: argusProject.id,
        name: 'Medical Review & Assessment',
        description: 'Medical evaluation, causality, seriousness assessment',
        orderIndex: 2,
      },
    }),
    prisma.module.create({
      data: {
        projectId: argusProject.id,
        name: 'Regulatory Reporting',
        description: 'FDA FAERS, EudraVigilance, WHO VigiBase submissions',
        orderIndex: 3,
      },
    }),
    prisma.module.create({
      data: {
        projectId: argusProject.id,
        name: 'Signal Detection & Analytics',
        description: 'Signal management, trend analysis, aggregate reporting',
        orderIndex: 4,
      },
    }),
    prisma.module.create({
      data: {
        projectId: argusProject.id,
        name: 'User Administration',
        description: 'User roles, permissions, audit trails, compliance',
        orderIndex: 5,
      },
    }),
  ]);

  console.log(`Created ${modules.length} modules`);

  // Create Scenarios for each module
  const scenarios = [];

  // Module 1: Case Intake & Data Entry Scenarios
  scenarios.push(
    await prisma.scenario.create({
      data: {
        moduleId: modules[0].id,
        title: 'Create Spontaneous Adverse Event Case',
        description: 'Verify creation of a new spontaneous AE case with complete patient and event details',
        priority: 'critical',
        preconditions: 'User has Case Processor role; Argus Safety is accessible',
        expectedOutcome: 'Case is successfully created with unique case ID and all data is saved correctly',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[0].id,
        title: 'Create Literature Case with Reference',
        description: 'Verify creation of a literature case with journal reference and author details',
        priority: 'high',
        preconditions: 'User has Case Processor role; Literature source is identified',
        expectedOutcome: 'Literature case created with proper reference linking and PubMed ID validation',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[0].id,
        title: 'Import Case from E2B Gateway',
        description: 'Verify successful import of ICH E2B R3 case from regulatory gateway',
        priority: 'high',
        preconditions: 'E2B gateway is configured; XML message is available',
        expectedOutcome: 'Case is imported with all E2B fields mapped correctly',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[0].id,
        title: 'Validate Duplicate Case Detection',
        description: 'Verify system identifies potential duplicate cases during intake',
        priority: 'critical',
        preconditions: 'Similar case already exists in database',
        expectedOutcome: 'System displays potential duplicates with match score for reviewer assessment',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[0].id,
        title: 'Enter Product Information with Dosage',
        description: 'Verify entry of suspect and concomitant products with dosage regimen',
        priority: 'high',
        preconditions: 'Case is created; Product dictionary is loaded',
        expectedOutcome: 'Products are coded with WHODrug and dosage is captured correctly',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[0].id,
        title: 'Code Adverse Events with MedDRA',
        description: 'Verify coding of verbatim terms to MedDRA LLT, PT, and SOC levels',
        priority: 'critical',
        preconditions: 'Case has adverse event terms entered; MedDRA dictionary is loaded',
        expectedOutcome: 'Verbatims are coded to appropriate MedDRA levels with auto-coding suggestions',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[0].id,
        title: 'Enter Medical History and Risk Factors',
        description: 'Verify capture of patient medical history and relevant risk factors',
        priority: 'medium',
        preconditions: 'Case is in data entry mode',
        expectedOutcome: 'Medical history is recorded with onset dates and relationship to AE',
        status: 'draft',
      },
    }),
  );

  // Module 2: Blinded & Unblinded Processing Scenarios
  scenarios.push(
    await prisma.scenario.create({
      data: {
        moduleId: modules[1].id,
        title: 'Create Blinded Case for Clinical Trial AE',
        description: 'Verify creation of blinded case where treatment allocation is hidden',
        priority: 'critical',
        preconditions: 'User has Blinded Case Processor role; Study is configured for blind maintenance',
        expectedOutcome: 'Case is created with masked treatment information; blind is maintained in database',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[1].id,
        title: 'Process Unblinded Case from Open Label Study',
        description: 'Verify processing of unblinded case with known treatment allocation',
        priority: 'critical',
        preconditions: 'User has appropriate role; Study is open label or unblinded',
        expectedOutcome: 'Case displays full treatment information including drug name and dose',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[1].id,
        title: 'Emergency Unblinding Request Workflow',
        description: 'Verify emergency unblinding process with proper authorization and documentation',
        priority: 'critical',
        preconditions: 'Blinded case exists; Emergency unblinding request is received',
        expectedOutcome: 'Unblinding is performed with audit trail; notification sent to stakeholders; SAE timeline triggered',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[1].id,
        title: 'Unblinding via IVRS/IWRS Integration',
        description: 'Verify unblinding data receipt from interactive voice/web response system',
        priority: 'high',
        preconditions: 'IVRS/IWRS integration is configured; Blinded case exists',
        expectedOutcome: 'Treatment allocation is received and updated in Argus with timestamp',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[1].id,
        title: 'Blind Maintenance During Database Lock',
        description: 'Verify blind integrity is maintained during clinical database lock',
        priority: 'high',
        preconditions: 'Blinded cases exist; Database lock is initiated',
        expectedOutcome: 'Blind remains intact; no unauthorized unblinding occurs',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[1].id,
        title: 'Compare Blinded vs Unblinded Case Views',
        description: 'Verify different data visibility between blinded and unblinded user roles',
        priority: 'high',
        preconditions: 'Same case accessible to both blinded and unblinded users',
        expectedOutcome: 'Blinded user sees masked treatment; unblinded user sees full details',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[1].id,
        title: 'Generate Blinded Safety Report',
        description: 'Verify generation of safety report with treatment groups masked',
        priority: 'critical',
        preconditions: 'Blinded cases exist; Report template is configured for blinded output',
        expectedOutcome: 'Report shows Treatment A/B or placebo without revealing actual allocation',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[1].id,
        title: 'Generate Unblinded Safety Report for DMC',
        description: 'Verify generation of unblinded report for Data Monitoring Committee',
        priority: 'critical',
        preconditions: 'User has DMC unblinded role; Unblinded cases or unblinded data available',
        expectedOutcome: 'Report displays actual treatment names and comparative safety data',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[1].id,
        title: 'Re-blind Case After Unblinding',
        description: 'Verify ability to re-blind a case when appropriate (system reset)',
        priority: 'medium',
        preconditions: 'Case was previously unblinded; Re-blinding is authorized',
        expectedOutcome: 'Treatment information is masked again; audit trail preserves unblinding history',
        status: 'draft',
      },
    }),
  );

  // Module 3: Medical Review & Assessment Scenarios
  scenarios.push(
    await prisma.scenario.create({
      data: {
        moduleId: modules[2].id,
        title: 'Perform Medical Review of AE Case',
        description: 'Verify medical reviewer can evaluate case completeness and accuracy',
        priority: 'critical',
        preconditions: 'Case is in Medical Review status; User has Medical Reviewer role',
        expectedOutcome: 'Medical reviewer can approve, reject, or request additional information',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[2].id,
        title: 'Assess Causality for Suspect Product',
        description: 'Verify causality assessment using WHO or company-specific algorithm',
        priority: 'critical',
        preconditions: 'Case has suspect product; User has causality assessment rights',
        expectedOutcome: 'Causality is assessed (Certain/Probable/Possible/Unlikely) with narrative justification',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[2].id,
        title: 'Determine Seriousness Criteria',
        description: 'Verify assessment of seriousness criteria (death, hospitalization, etc.)',
        priority: 'critical',
        preconditions: 'Case has adverse events; User has assessment rights',
        expectedOutcome: 'Seriousness criteria are correctly captured and SAE flag is set',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[2].id,
        title: 'Write Medical Narrative for SAE',
        description: 'Verify creation of comprehensive medical narrative for serious cases',
        priority: 'high',
        preconditions: 'Case is serious; All case details are entered',
        expectedOutcome: 'Narrative summarizes case chronologically with medical terminology',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[2].id,
        title: 'Assign Expectedness (Labeling)',
        description: 'Verify determination of expectedness against product labeling/CCDS',
        priority: 'high',
        preconditions: 'Case has suspect product; CCDS is maintained in system',
        expectedOutcome: 'Events are marked as Expected or Unexpected based on reference safety information',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[2].id,
        title: 'Follow-up Request for Additional Information',
        description: 'Verify generation of follow-up request to reporter for missing information',
        priority: 'medium',
        preconditions: 'Case has missing critical information',
        expectedOutcome: 'Follow-up letter is generated and tracked for response',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[2].id,
        title: 'Pregnancy Exposure Assessment',
        description: 'Verify assessment of pregnancy exposure case with maternal/paternal exposure',
        priority: 'high',
        preconditions: 'Case involves pregnancy exposure during treatment',
        expectedOutcome: 'Pregnancy details captured including outcome and infant health',
        status: 'draft',
      },
    }),
  );

  // Module 4: Regulatory Reporting Scenarios
  scenarios.push(
    await prisma.scenario.create({
      data: {
        moduleId: modules[3].id,
        title: 'Generate FDA 3517A Form for US Cases',
        description: 'Verify generation of FDA MedWatch 3517A form for domestic reporting',
        priority: 'critical',
        preconditions: 'Case is US origin and meets FDA reporting criteria',
        expectedOutcome: '3517A form is populated correctly and ready for submission',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[3].id,
        title: 'Submit E2B R3 to FDA FAERS Gateway',
        description: 'Verify electronic submission of ICH E2B R3 message to FDA FAERS',
        priority: 'critical',
        preconditions: 'Case is ready for FDA submission; Gateway credentials configured',
        expectedOutcome: 'Message transmitted successfully; ACK received and stored in case',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[3].id,
        title: 'Submit to EudraVigilance (EV)',
        description: 'Verify submission of E2B R3 message to EU EudraVigilance database',
        priority: 'critical',
        preconditions: 'Case is reportable to EU; EV gateway is configured',
        expectedOutcome: 'Message transmitted; EV report number received and stored',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[3].id,
        title: 'Calculate Regulatory Reporting Timelines',
        description: 'Verify automatic calculation of 7-day/15-day reporting deadlines',
        priority: 'critical',
        preconditions: 'Case has receipt date and seriousness criteria',
        expectedOutcome: 'System calculates due date based on regulation; alerts for approaching deadlines',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[3].id,
        title: 'Generate CIOMS Form for International Cases',
        description: 'Verify generation of CIOMS I/II form for non-US/international reporting',
        priority: 'high',
        preconditions: 'Case is from outside US; CIOMS reporting applies',
        expectedOutcome: 'CIOMS form is populated with all required fields',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[3].id,
        title: 'Submit to WHO VigiBase',
        description: 'Verify submission of case to WHO global safety database',
        priority: 'high',
        preconditions: 'Country requires VigiBase reporting; Gateway configured',
        expectedOutcome: 'E2B message transmitted; VigiBase ID received',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[3].id,
        title: 'Handle Reporting to Multiple Health Authorities',
        description: 'Verify simultaneous reporting to FDA, EV, and other authorities',
        priority: 'high',
        preconditions: 'Case is reportable to multiple regions',
        expectedOutcome: 'All required submissions are generated with region-specific formatting',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[3].id,
        title: 'Amend Previously Submitted Report',
        description: 'Verify submission of follow-up/amendment to regulatory authority',
        priority: 'high',
        preconditions: 'Initial report was submitted; New information received',
        expectedOutcome: 'Follow-up submission links to initial report with updated data',
        status: 'draft',
      },
    }),
  );

  // Module 5: Signal Detection & Analytics Scenarios
  scenarios.push(
    await prisma.scenario.create({
      data: {
        moduleId: modules[4].id,
        title: 'Run Disproportionality Analysis',
        description: 'Verify execution of statistical signal detection (PRR, ROR, EBGM)',
        priority: 'high',
        preconditions: 'Sufficient case volume exists; Signal detection module is licensed',
        expectedOutcome: 'Statistical measures calculated; potential signals identified above threshold',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[4].id,
        title: 'Review and Validate Signal',
        description: 'Verify signal review workflow with clinical assessment',
        priority: 'high',
        preconditions: 'Signal was detected; Signal Review Team assigned',
        expectedOutcome: 'Signal is validated, prioritized, and recommendation documented',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[4].id,
        title: 'Generate Line Listing for Product-AE Combination',
        description: 'Verify extraction of all cases for specific product and event',
        priority: 'medium',
        preconditions: 'Cases exist for the product-AE combination',
        expectedOutcome: 'Line listing includes all relevant fields with proper filtering',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[4].id,
        title: 'Create Aggregate Report (PSUR/DSUR)',
        description: 'Verify generation of periodic safety update reports',
        priority: 'critical',
        preconditions: 'Reporting period is defined; Data cutoff applied',
        expectedOutcome: 'PSUR/DSUR sections populated with case data, narratives, and exposure',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[4].id,
        title: 'Generate PADER Report for FDA',
        description: 'Verify creation of Periodic Adverse Drug Experience Report',
        priority: 'high',
        preconditions: 'NDA/BLA product with FDA reporting requirement',
        expectedOutcome: 'PADER sections include summary tabulations, narratives, and updates',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[4].id,
        title: 'Trend Analysis for Adverse Events',
        description: 'Verify visualization of AE trends over time',
        priority: 'medium',
        preconditions: 'Historical case data exists',
        expectedOutcome: 'Charts display AE frequency trends with filtering options',
        status: 'draft',
      },
    }),
  );

  // Module 6: User Administration Scenarios
  scenarios.push(
    await prisma.scenario.create({
      data: {
        moduleId: modules[5].id,
        title: 'Create User with Role-Based Access',
        description: 'Verify creation of user with specific Argus roles and permissions',
        priority: 'high',
        preconditions: 'User has Administrator role',
        expectedOutcome: 'User created with assigned roles; access limited to permitted functions',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[5].id,
        title: 'Configure Data Access Permissions by Product',
        description: 'Verify product-level access restrictions for users',
        priority: 'high',
        preconditions: 'Multiple products exist; User roles configured',
        expectedOutcome: 'User can only access cases for assigned products',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[5].id,
        title: 'View Audit Trail for Case Modifications',
        description: 'Verify complete audit trail of all case changes',
        priority: 'critical',
        preconditions: 'Case has been modified multiple times',
        expectedOutcome: 'Audit trail shows who changed what, when, and reason for change',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[5].id,
        title: 'Configure Workflow Status and Transitions',
        description: 'Verify customization of case workflow status and allowed transitions',
        priority: 'medium',
        preconditions: 'Administrator access; Workflow configuration enabled',
        expectedOutcome: 'Custom workflow statuses created with defined transition rules',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[5].id,
        title: 'Lock Case to Prevent Modifications',
        description: 'Verify case locking functionality for approved/submitted cases',
        priority: 'high',
        preconditions: 'Case is in locked status or ready for lock',
        expectedOutcome: 'Locked case cannot be modified without proper unlock authorization',
        status: 'draft',
      },
    }),
    await prisma.scenario.create({
      data: {
        moduleId: modules[5].id,
        title: 'Export Audit Trail for Compliance Inspection',
        description: 'Verify export of system audit trail for regulatory inspection',
        priority: 'high',
        preconditions: 'Audit trail data exists; User has export permissions',
        expectedOutcome: 'Audit trail exported in readable format with all required fields',
        status: 'draft',
      },
    }),
  );

  console.log(`Created ${scenarios.length} scenarios`);

  // Create sample test cases for the most critical scenario (Blinded Case Creation)
  const blindedScenario = scenarios.find(s => s.title === 'Create Blinded Case for Clinical Trial AE');

  if (blindedScenario) {
    const blindedTestCase = await prisma.testCase.create({
      data: {
        scenarioId: blindedScenario.id,
        title: 'TC-001: Create new blinded case with masked treatment allocation',
        description: 'Verify that a user with Blinded Case Processor role can create a case where treatment information is hidden',
        priority: 'critical',
        status: 'draft',
        preConditions: '1. User is logged in with Blinded Case Processor role\n2. Study is configured for blind maintenance in Argus\n3. Patient meets eligibility for AE reporting',
        postConditions: 'Case is saved with blinded status; Treatment field shows "BLINDED" or similar mask',
        aiGenerated: false,
      },
    });

    await prisma.testStep.createMany({
      data: [
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 1,
          description: 'Navigate to Case Intake module and click "Create New Case"',
          expectedResult: 'New case form opens with all required fields displayed',
        },
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 2,
          description: 'Select study type as "Clinical Trial" and choose the blinded study from dropdown',
          expectedResult: 'Study is selected; system recognizes it as blinded study',
        },
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 3,
          description: 'Enter patient demographics (age, sex, weight, country)',
          expectedResult: 'Patient information is saved; no validation errors',
        },
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 4,
          description: 'Enter adverse event verbatim term and onset date',
          expectedResult: 'AE term is captured; MedDRA coding suggestion appears',
        },
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 5,
          description: 'In Product section, observe the treatment allocation field',
          expectedResult: 'Treatment shows as "BLINDED" or "MASKED"; actual drug name is hidden',
        },
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 6,
          description: 'Enter dosage regimen and indication (if known without unblinding)',
          expectedResult: 'Dosage can be entered as "As per study protocol" or similar',
        },
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 7,
          description: 'Complete remaining case sections (concomitant meds, medical history)',
          expectedResult: 'All sections are accessible and save correctly',
        },
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 8,
          description: 'Save the case and note the case ID',
          expectedResult: 'Case is saved successfully with unique Argus case ID',
        },
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 9,
          description: 'Verify case appears in case list with "Blinded" indicator',
          expectedResult: 'Case displays with blind icon or status indicator',
        },
        {
          testCaseId: blindedTestCase.id,
          stepNumber: 10,
          description: 'Log in as Unblinded user and open the same case',
          expectedResult: 'Unblinded user sees actual treatment name and full allocation details',
        },
      ],
    });

    console.log('Created sample test case with 10 steps for Blinded Case scenario');
  }

  // Create sample test case for Unblinded scenario
  const unblindedScenario = scenarios.find(s => s.title === 'Process Unblinded Case from Open Label Study');

  if (unblindedScenario) {
    const unblindedTestCase = await prisma.testCase.create({
      data: {
        scenarioId: unblindedScenario.id,
        title: 'TC-002: Process unblinded case with full treatment visibility',
        description: 'Verify that unblinded cases display complete treatment information',
        priority: 'critical',
        status: 'draft',
        preConditions: '1. User has Unblinded Processor or Standard role\n2. Study is open-label or post-unblinding\n3. Treatment allocation is known',
        postConditions: 'Case displays full treatment details including drug name, dose, and frequency',
        aiGenerated: false,
      },
    });

    await prisma.testStep.createMany({
      data: [
        {
          testCaseId: unblindedTestCase.id,
          stepNumber: 1,
          description: 'Navigate to existing unblinded case or create new case from open-label study',
          expectedResult: 'Case opens successfully',
        },
        {
          testCaseId: unblindedTestCase.id,
          stepNumber: 2,
          description: 'Navigate to Product Information section',
          expectedResult: 'Product section displays with all fields visible',
        },
        {
          testCaseId: unblindedTestCase.id,
          stepNumber: 3,
          description: 'Verify suspect product shows actual drug name (not masked)',
          expectedResult: 'Drug name is fully visible (e.g., "Drug X 100mg")',
        },
        {
          testCaseId: unblindedTestCase.id,
          stepNumber: 4,
          description: 'Verify treatment arm/group is displayed if applicable',
          expectedResult: 'Treatment arm shows (e.g., "Treatment A", "Placebo", or actual name)',
        },
        {
          testCaseId: unblindedTestCase.id,
          stepNumber: 5,
          description: 'Check case header or summary for blind status indicator',
          expectedResult: 'Case shows "Unblinded" status or no blind indicator',
        },
        {
          testCaseId: unblindedTestCase.id,
          stepNumber: 6,
          description: 'Verify ability to print/export case with full treatment details',
          expectedResult: 'Exported case includes all treatment information',
        },
      ],
    });

    console.log('Created sample test case with 6 steps for Unblinded Case scenario');
  }

  // Create sample test case for Emergency Unblinding
  const emergencyUnblindScenario = scenarios.find(s => s.title === 'Emergency Unblinding Request Workflow');

  if (emergencyUnblindScenario) {
    const emergencyTestCase = await prisma.testCase.create({
      data: {
        scenarioId: emergencyUnblindScenario.id,
        title: 'TC-003: Emergency unblinding with proper authorization workflow',
        description: 'Verify emergency unblinding process maintains compliance and audit trail',
        priority: 'critical',
        status: 'draft',
        preConditions: '1. Blinded SAE case exists\n2. Investigator requests emergency unblinding\n3. User has unblinding authorization',
        postConditions: 'Case is unblinded with complete audit trail; SAE reporting timeline initiated',
        aiGenerated: false,
      },
    });

    await prisma.testStep.createMany({
      data: [
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 1,
          description: 'Open blinded case requiring emergency unblinding',
          expectedResult: 'Case opens in blinded view',
        },
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 2,
          description: 'Click "Request Unblinding" or similar action button',
          expectedResult: 'Unblinding request form opens',
        },
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 3,
          description: 'Select reason for unblinding (e.g., "Serious AE requiring treatment knowledge")',
          expectedResult: 'Reason is captured in unblinding request',
        },
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 4,
          description: 'Enter requester details (Investigator name, contact information)',
          expectedResult: 'Requester information is saved',
        },
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 5,
          description: 'Obtain required authorization (electronic signature or approval workflow)',
          expectedResult: 'Authorization is recorded with timestamp and approver ID',
        },
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 6,
          description: 'Confirm unblinding action',
          expectedResult: 'System displays confirmation dialog with warning about blind break',
        },
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 7,
          description: 'Complete unblinding; observe treatment allocation is now visible',
          expectedResult: 'Treatment name and details are displayed; blind is broken',
        },
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 8,
          description: 'Verify audit trail entry for unblinding event',
          expectedResult: 'Audit trail shows who, when, why, and authorization for unblinding',
        },
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 9,
          description: 'Check if SAE reporting timeline is triggered (if applicable)',
          expectedResult: 'System flags case for expedited reporting with due date calculated',
        },
        {
          testCaseId: emergencyTestCase.id,
          stepNumber: 10,
          description: 'Verify notification is sent to relevant parties (Sponsor, Monitor, PV)',
          expectedResult: 'Notifications logged in system; recipients recorded',
        },
      ],
    });

    console.log('Created sample test case with 10 steps for Emergency Unblinding scenario');
  }

  // Create sample test case for Blinded Safety Report
  const blindedReportScenario = scenarios.find(s => s.title === 'Generate Blinded Safety Report');

  if (blindedReportScenario) {
    const reportTestCase = await prisma.testCase.create({
      data: {
        scenarioId: blindedReportScenario.id,
        title: 'TC-004: Generate blinded safety report with masked treatment groups',
        description: 'Verify that safety reports for blinded studies mask treatment allocation',
        priority: 'critical',
        status: 'draft',
        preConditions: '1. Multiple blinded cases exist in study\n2. User has Blinded Reporter role\n3. Report template is configured for blinded output',
        postConditions: 'Report is generated with Treatment A/B or similar masking; no actual drug names revealed',
        aiGenerated: false,
      },
    });

    await prisma.testStep.createMany({
      data: [
        {
          testCaseId: reportTestCase.id,
          stepNumber: 1,
          description: 'Navigate to Reports module and select "Safety Report - Blinded"',
          expectedResult: 'Report configuration screen opens',
        },
        {
          testCaseId: reportTestCase.id,
          stepNumber: 2,
          description: 'Select study and date range for report',
          expectedResult: 'Parameters are accepted; case count is displayed',
        },
        {
          testCaseId: reportTestCase.id,
          stepNumber: 3,
          description: 'Verify "Blinded" option is selected (treatment masking)',
          expectedResult: 'Blinded checkbox is selected or enforced by user role',
        },
        {
          testCaseId: reportTestCase.id,
          stepNumber: 4,
          description: 'Select report sections (Case listings, AE summary, SAE tabulation)',
          expectedResult: 'Selected sections are configured',
        },
        {
          testCaseId: reportTestCase.id,
          stepNumber: 5,
          description: 'Click "Generate Report" or "Preview"',
          expectedResult: 'Report generation begins; progress indicator shows',
        },
        {
          testCaseId: reportTestCase.id,
          stepNumber: 6,
          description: 'Review generated report (PDF or Excel)',
          expectedResult: 'Report opens with all treatment groups masked',
        },
        {
          testCaseId: reportTestCase.id,
          stepNumber: 7,
          description: 'Verify treatment columns show "Treatment A", "Treatment B", "Placebo" etc.',
          expectedResult: 'No actual drug names appear in any section of the report',
        },
        {
          testCaseId: reportTestCase.id,
          stepNumber: 8,
          description: 'Verify case listings do not reveal treatment allocation',
          expectedResult: 'Individual cases show masked treatment in listings',
        },
        {
          testCaseId: reportTestCase.id,
          stepNumber: 9,
          description: 'Attempt to export or print the report',
          expectedResult: 'Exported file maintains blinding; no hidden data leakage',
        },
        {
          testCaseId: reportTestCase.id,
          stepNumber: 10,
          description: 'Compare with unblinded report (if user has both roles)',
          expectedResult: 'Unblinded report shows actual treatment names; blinded does not',
        },
      ],
    });

    console.log('Created sample test case with 10 steps for Blinded Safety Report scenario');
  }

  console.log('\n✅ Oracle Argus Safety test data seeded successfully!');
  console.log('\nSummary:');
  console.log(`- Project: ${argusProject.name}`);
  console.log(`- Modules: ${modules.length}`);
  console.log(`- Scenarios: ${scenarios.length}`);
  console.log(`- Sample Test Cases: 4 (with detailed steps)`);
  console.log('\nTo view: Navigate to /scenarios in the application');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
