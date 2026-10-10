import { prisma } from '../index.js';
import { NotFoundError } from '../middleware/error-handler.js';
import ExcelJS from 'exceljs';
import { marked } from 'marked';
import pdfkit from 'pdfkit';

export async function exportToJson(testCaseId: number) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
      scenario: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
    },
  });

  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  const json = JSON.stringify(
    {
      id: testCase.id,
      title: testCase.title,
      description: testCase.description,
      status: testCase.status,
      priority: testCase.priority,
      preConditions: testCase.preConditions,
      postConditions: testCase.postConditions,
      estimatedTime: testCase.estimatedTime,
      scenario: testCase.scenario,
      steps: testCase.steps.map((s) => ({
        stepNumber: s.stepNumber,
        description: s.description,
        expectedResult: s.expectedResult,
      })),
    },
    null,
    2
  );

  return Buffer.from(json);
}

export async function exportToMarkdown(testCaseId: number) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
      scenario: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  let md = `# ${testCase.title}\n\n`;
  md += `**Scenario:** ${testCase.scenario.title}\n`;
  md += `**Status:** ${testCase.status}\n`;
  md += `**Priority:** ${testCase.priority}\n`;
  if (testCase.estimatedTime) {
    md += `**Estimated Time:** ${testCase.estimatedTime} minutes\n`;
  }
  md += '\n';

  if (testCase.preConditions) {
    md += `## Pre-Conditions\n\n${testCase.preConditions}\n\n`;
  }

  if (testCase.description) {
    md += `## Description\n\n${testCase.description}\n\n`;
  }

  md += `## Test Steps\n\n`;
  md += `| Step | Description | Expected Result |\n`;
  md += `|------|-------------|----------------|\n`;

  for (const step of testCase.steps) {
    md += `| ${step.stepNumber} | ${step.description} | ${step.expectedResult} |\n`;
  }

  md += '\n';

  if (testCase.postConditions) {
    md += `## Post-Conditions\n\n${testCase.postConditions}\n`;
  }

  return Buffer.from(md);
}

export async function exportToExcel(testCaseId: number) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
      scenario: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Test Case');

  // Add headers
  worksheet.columns = [
    { header: 'Test Case', key: 'testCase', width: 30 },
    { header: 'Scenario', key: 'scenario', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Step', key: 'step', width: 8 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Expected Result', key: 'expectedResult', width: 50 },
  ];

  // Add rows for each step
  testCase.steps.forEach((step) => {
    worksheet.addRow({
      testCase: testCase.title,
      scenario: testCase.scenario.title,
      status: testCase.status,
      priority: testCase.priority,
      step: step.stepNumber,
      description: step.description,
      expectedResult: step.expectedResult,
    });
  });

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function exportToPdf(testCaseId: number) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
      scenario: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new pdfkit({ margin: 40 });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text(testCase.title, { align: 'center' });
    doc.moveDown();

    // Meta info
    doc.fontSize(12).font('Helvetica');
    doc.text(`Scenario: ${testCase.scenario.title}`);
    doc.text(`Status: ${testCase.status}`);
    doc.text(`Priority: ${testCase.priority}`);
    if (testCase.estimatedTime) {
      doc.text(`Estimated Time: ${testCase.estimatedTime} minutes`);
    }
    doc.moveDown();

    // Pre-conditions
    if (testCase.preConditions) {
      doc.font('Helvetica-Bold').text('Pre-Conditions:');
      doc.font('Helvetica').text(testCase.preConditions);
      doc.moveDown();
    }

    // Description
    if (testCase.description) {
      doc.font('Helvetica-Bold').text('Description:');
      doc.font('Helvetica').text(testCase.description);
      doc.moveDown();
    }

    // Test Steps
    doc.font('Helvetica-Bold').text('Test Steps:');
    doc.moveDown(0.5);

    testCase.steps.forEach((step) => {
      doc.font('Helvetica-Bold').text(`Step ${step.stepNumber}:`);
      doc.font('Helvetica').text(step.description);
      doc.font('Helvetica-Bold').text('Expected Result:');
      doc.font('Helvetica').text(step.expectedResult);
      doc.moveDown();
    });

    // Post-conditions
    if (testCase.postConditions) {
      doc.font('Helvetica-Bold').text('Post-Conditions:');
      doc.font('Helvetica').text(testCase.postConditions);
    }

    doc.end();
  });
}

export async function bulkExport(testCaseIds: number[], format: string) {
  const testCases = await prisma.testCase.findMany({
    where: { id: { in: testCaseIds } },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
      scenario: {
        select: { title: true },
      },
    },
  });

  let buffer: Buffer;
  let contentType: string;

  switch (format) {
    case 'json':
      buffer = Buffer.from(JSON.stringify(testCases, null, 2));
      contentType = 'application/json';
      break;
    case 'markdown':
      const md = testCases
        .map((tc) => `# ${tc.title}\n\n${tc.steps.map((s) => `${s.stepNumber}. ${s.description}`).join('\n')}`)
        .join('\n\n---\n\n');
      buffer = Buffer.from(md);
      contentType = 'text/markdown';
      break;
    case 'excel':
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Test Cases');
      worksheet.columns = [
        { header: 'Test Case', key: 'title', width: 30 },
        { header: 'Scenario', key: 'scenario', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Step', key: 'step', width: 8 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Expected Result', key: 'expectedResult', width: 50 },
      ];
      testCases.forEach((tc) => {
        tc.steps.forEach((step) => {
          worksheet.addRow({
            title: tc.title,
            scenario: tc.scenario.title,
            status: tc.status,
            step: step.stepNumber,
            description: step.description,
            expectedResult: step.expectedResult,
          });
        });
      });
      buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  return { buffer, contentType };
}

export async function exportScenario(scenarioId: number, format: string) {
  const testCases = await prisma.testCase.findMany({
    where: { scenarioId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  });

  const testCaseIds = testCases.map((tc) => tc.id);
  return bulkExport(testCaseIds, format);
}
