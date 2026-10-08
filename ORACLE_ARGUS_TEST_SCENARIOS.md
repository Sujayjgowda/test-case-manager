# Oracle Argus Safety - Comprehensive Test Scenarios

This document contains end-to-end test scenarios for Oracle Argus Safety application, covering blinded/unblinded case processing, regulatory reporting, and complete workflows.

---

## Table of Contents

1. [Case Intake & Data Entry](#1-case-intake--data-entry)
2. [Blinded & Unblinded Processing](#2-blinded--unblinded-processing)
3. [Medical Review & Assessment](#3-medical-review--assessment)
4. [Regulatory Reporting](#4-regulatory-reporting)
5. [Signal Detection & Analytics](#5-signal-detection--analytics)
6. [User Administration & Compliance](#6-user-administration--compliance)

---

## 1. Case Intake & Data Entry

### 1.1 Create Spontaneous Adverse Event Case
**Priority:** Critical
**Description:** Verify creation of a new spontaneous AE case with complete patient and event details

**Preconditions:**
- User has Case Processor role
- Argus Safety is accessible

**Expected Outcome:**
- Case is successfully created with unique case ID
- All data is saved correctly

**Test Steps:**
1. Navigate to Case Intake module
2. Click "Create New Case"
3. Select "Spontaneous" as report type
4. Enter patient demographics (age, sex, weight)
5. Enter adverse event information
6. Add suspect product details
7. Save case and verify case ID generation

---

### 1.2 Create Literature Case with Reference
**Priority:** High
**Description:** Verify creation of a literature case with journal reference and author details

**Preconditions:**
- User has Case Processor role
- Literature source is identified

**Expected Outcome:**
- Literature case created with proper reference linking
- PubMed ID validation works correctly

---

### 1.3 Import Case from E2B Gateway
**Priority:** High
**Description:** Verify successful import of ICH E2B R3 case from regulatory gateway

**Preconditions:**
- E2B gateway is configured
- XML message is available

**Expected Outcome:**
- Case is imported with all E2B fields mapped correctly

---

### 1.4 Validate Duplicate Case Detection
**Priority:** Critical
**Description:** Verify system identifies potential duplicate cases during intake

**Preconditions:**
- Similar case already exists in database

**Expected Outcome:**
- System displays potential duplicates with match score
- Reviewer can assess and link or reject as duplicate

---

### 1.5 Enter Product Information with Dosage
**Priority:** High
**Description:** Verify entry of suspect and concomitant products with dosage regimen

**Expected Outcome:**
- Products are coded with WHODrug dictionary
- Dosage regimen is captured correctly with frequency and route

---

### 1.6 Code Adverse Events with MedDRA
**Priority:** Critical
**Description:** Verify coding of verbatim terms to MedDRA LLT, PT, and SOC levels

**Expected Outcome:**
- Verbatims are coded to appropriate MedDRA levels
- Auto-coding suggestions are presented

---

## 2. Blinded & Unblinded Processing

### 2.1 Create Blinded Case for Clinical Trial AE ⭐
**Priority:** Critical
**Description:** Verify creation of blinded case where treatment allocation is hidden

**Preconditions:**
- User has Blinded Case Processor role
- Study is configured for blind maintenance

**Expected Outcome:**
- Case is created with masked treatment information
- Blind is maintained in database

**Detailed Test Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Case Intake and click "Create New Case" | New case form opens |
| 2 | Select study type as "Clinical Trial" and choose blinded study | System recognizes as blinded study |
| 3 | Enter patient demographics (age, sex, weight, country) | Information saves without errors |
| 4 | Enter adverse event verbatim and onset date | AE captured; MedDRA coding appears |
| 5 | Observe Product section treatment allocation field | Treatment shows "BLINDED" or masked |
| 6 | Enter dosage as "As per study protocol" | Dosage field accepts protocol reference |
| 7 | Complete concomitant meds and medical history | All sections save correctly |
| 8 | Save the case | Case saved with unique Argus ID |
| 9 | Verify case in list with "Blinded" indicator | Blind icon/status displays |
| 10 | Log in as Unblinded user and open same case | Full treatment details visible |

---

### 2.2 Process Unblinded Case from Open Label Study ⭐
**Priority:** Critical
**Description:** Verify processing of unblinded case with known treatment allocation

**Expected Outcome:**
- Case displays full treatment information including drug name and dose

**Detailed Test Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open unblinded case from open-label study | Case opens successfully |
| 2 | Navigate to Product Information section | All fields visible |
| 3 | Verify suspect product shows actual drug name | Drug name fully visible (e.g., "Drug X 100mg") |
| 4 | Verify treatment arm/group is displayed | Shows actual arm (Treatment A, Placebo, etc.) |
| 5 | Check case header for blind status | Shows "Unblinded" or no blind indicator |
| 6 | Export/print case | Full treatment details included |

---

### 2.3 Emergency Unblinding Request Workflow ⭐
**Priority:** Critical
**Description:** Verify emergency unblinding process with proper authorization and documentation

**Preconditions:**
- Blinded case exists
- Emergency unblinding request is received

**Expected Outcome:**
- Unblinding is performed with complete audit trail
- Notification sent to stakeholders
- SAE timeline triggered

**Detailed Test Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open blinded case requiring emergency unblinding | Case opens in blinded view |
| 2 | Click "Request Unblinding" button | Unblinding request form opens |
| 3 | Select reason (e.g., "Serious AE requiring treatment knowledge") | Reason captured |
| 4 | Enter requester details (Investigator name, contact) | Requester saved |
| 5 | Obtain authorization (e-signature/approval) | Authorization recorded with timestamp |
| 6 | Confirm unblinding action | Confirmation dialog with warning |
| 7 | Complete unblinding | Treatment visible; blind broken |
| 8 | Verify audit trail entry | Shows who, when, why, authorization |
| 9 | Check SAE reporting timeline triggered | Expedited reporting flagged with due date |
| 10 | Verify notifications sent | Notifications logged; recipients recorded |

---

### 2.4 Unblinding via IVRS/IWRS Integration
**Priority:** High
**Description:** Verify unblinding data receipt from interactive voice/web response system

**Expected Outcome:**
- Treatment allocation received and updated in Argus with timestamp

---

### 2.5 Blind Maintenance During Database Lock
**Priority:** High
**Description:** Verify blind integrity is maintained during clinical database lock

**Expected Outcome:**
- Blind remains intact
- No unauthorized unblinding occurs

---

### 2.6 Compare Blinded vs Unblinded Case Views
**Priority:** High
**Description:** Verify different data visibility between blinded and unblinded user roles

**Expected Outcome:**
- Blinded user sees masked treatment
- Unblinded user sees full details

---

### 2.7 Generate Blinded Safety Report ⭐
**Priority:** Critical
**Description:** Verify generation of safety report with treatment groups masked

**Expected Outcome:**
- Report shows Treatment A/B or placebo without revealing actual allocation

**Detailed Test Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Reports > "Safety Report - Blinded" | Report config screen opens |
| 2 | Select study and date range | Parameters accepted; case count shown |
| 3 | Verify "Blinded" option is selected | Checkbox selected/enforced by role |
| 4 | Select report sections (listings, summary, tabulation) | Sections configured |
| 5 | Click "Generate Report" | Generation begins with progress |
| 6 | Review generated report (PDF/Excel) | Report opens with masking |
| 7 | Verify treatment columns show "Treatment A/B" | No actual drug names appear |
| 8 | Verify case listings maintain blinding | Individual cases masked |
| 9 | Export/print report | No hidden data leakage |
| 10 | Compare with unblinded report | Unblinded shows actual names; blinded does not |

---

### 2.8 Generate Unblinded Safety Report for DMC
**Priority:** Critical
**Description:** Verify generation of unblinded report for Data Monitoring Committee

**Expected Outcome:**
- Report displays actual treatment names and comparative safety data

---

### 2.9 Re-blind Case After Unblinding
**Priority:** Medium
**Description:** Verify ability to re-blind a case when appropriate

**Expected Outcome:**
- Treatment information is masked again
- Audit trail preserves unblinding history

---

## 3. Medical Review & Assessment

### 3.1 Perform Medical Review of AE Case
**Priority:** Critical
**Description:** Verify medical reviewer can evaluate case completeness and accuracy

**Expected Outcome:**
- Medical reviewer can approve, reject, or request additional information

---

### 3.2 Assess Causality for Suspect Product
**Priority:** Critical
**Description:** Verify causality assessment using WHO or company-specific algorithm

**Expected Outcome:**
- Causality assessed (Certain/Probable/Possible/Unlikely)
- Narrative justification provided

---

### 3.3 Determine Seriousness Criteria
**Priority:** Critical
**Description:** Verify assessment of seriousness criteria (death, hospitalization, etc.)

**Expected Outcome:**
- Seriousness criteria correctly captured
- SAE flag is set appropriately

---

### 3.4 Write Medical Narrative for SAE
**Priority:** High
**Description:** Verify creation of comprehensive medical narrative for serious cases

**Expected Outcome:**
- Narrative summarizes case chronologically with medical terminology

---

### 3.5 Assign Expectedness (Labeling)
**Priority:** High
**Description:** Verify determination of expectedness against product labeling/CCDS

**Expected Outcome:**
- Events marked as Expected or Unexpected based on reference safety information

---

### 3.6 Follow-up Request for Additional Information
**Priority:** Medium
**Description:** Verify generation of follow-up request to reporter for missing information

**Expected Outcome:**
- Follow-up letter generated and tracked for response

---

### 3.7 Pregnancy Exposure Assessment
**Priority:** High
**Description:** Verify assessment of pregnancy exposure case with maternal/paternal exposure

**Expected Outcome:**
- Pregnancy details captured including outcome and infant health

---

## 4. Regulatory Reporting

### 4.1 Generate FDA 3517A Form for US Cases
**Priority:** Critical
**Description:** Verify generation of FDA MedWatch 3517A form for domestic reporting

**Expected Outcome:**
- 3517A form populated correctly and ready for submission

---

### 4.2 Submit E2B R3 to FDA FAERS Gateway
**Priority:** Critical
**Description:** Verify electronic submission of ICH E2B R3 message to FDA FAERS

**Expected Outcome:**
- Message transmitted successfully
- ACK received and stored in case

---

### 4.3 Submit to EudraVigilance (EV)
**Priority:** Critical
**Description:** Verify submission of E2B R3 message to EU EudraVigilance database

**Expected Outcome:**
- Message transmitted
- EV report number received and stored

---

### 4.4 Calculate Regulatory Reporting Timelines
**Priority:** Critical
**Description:** Verify automatic calculation of 7-day/15-day reporting deadlines

**Expected Outcome:**
- System calculates due date based on regulation
- Alerts for approaching deadlines

---

### 4.5 Generate CIOMS Form for International Cases
**Priority:** High
**Description:** Verify generation of CIOMS I/II form for non-US/international reporting

**Expected Outcome:**
- CIOMS form populated with all required fields

---

### 4.6 Submit to WHO VigiBase
**Priority:** High
**Description:** Verify submission of case to WHO global safety database

**Expected Outcome:**
- E2B message transmitted
- VigiBase ID received

---

### 4.7 Handle Reporting to Multiple Health Authorities
**Priority:** High
**Description:** Verify simultaneous reporting to FDA, EV, and other authorities

**Expected Outcome:**
- All required submissions generated with region-specific formatting

---

### 4.8 Amend Previously Submitted Report
**Priority:** High
**Description:** Verify submission of follow-up/amendment to regulatory authority

**Expected Outcome:**
- Follow-up submission links to initial report with updated data

---

## 5. Signal Detection & Analytics

### 5.1 Run Disproportionality Analysis
**Priority:** High
**Description:** Verify execution of statistical signal detection (PRR, ROR, EBGM)

**Expected Outcome:**
- Statistical measures calculated
- Potential signals identified above threshold

---

### 5.2 Review and Validate Signal
**Priority:** High
**Description:** Verify signal review workflow with clinical assessment

**Expected Outcome:**
- Signal is validated, prioritized, and recommendation documented

---

### 5.3 Generate Line Listing for Product-AE Combination
**Priority:** Medium
**Description:** Verify extraction of all cases for specific product and event

**Expected Outcome:**
- Line listing includes all relevant fields with proper filtering

---

### 5.4 Create Aggregate Report (PSUR/DSUR)
**Priority:** Critical
**Description:** Verify generation of periodic safety update reports

**Expected Outcome:**
- PSUR/DSUR sections populated with case data, narratives, and exposure

---

### 5.5 Generate PADER Report for FDA
**Priority:** High
**Description:** Verify creation of Periodic Adverse Drug Experience Report

**Expected Outcome:**
- PADER sections include summary tabulations, narratives, and updates

---

### 5.6 Trend Analysis for Adverse Events
**Priority:** Medium
**Description:** Verify visualization of AE trends over time

**Expected Outcome:**
- Charts display AE frequency trends with filtering options

---

## 6. User Administration & Compliance

### 6.1 Create User with Role-Based Access
**Priority:** High
**Description:** Verify creation of user with specific Argus roles and permissions

**Expected Outcome:**
- User created with assigned roles
- Access limited to permitted functions

---

### 6.2 Configure Data Access Permissions by Product
**Priority:** High
**Description:** Verify product-level access restrictions for users

**Expected Outcome:**
- User can only access cases for assigned products

---

### 6.3 View Audit Trail for Case Modifications
**Priority:** Critical
**Description:** Verify complete audit trail of all case changes

**Expected Outcome:**
- Audit trail shows who changed what, when, and reason for change

---

### 6.4 Configure Workflow Status and Transitions
**Priority:** Medium
**Description:** Verify customization of case workflow status and allowed transitions

**Expected Outcome:**
- Custom workflow statuses created with defined transition rules

---

### 6.5 Lock Case to Prevent Modifications
**Priority:** High
**Description:** Verify case locking functionality for approved/submitted cases

**Expected Outcome:**
- Locked case cannot be modified without proper unlock authorization

---

### 6.6 Export Audit Trail for Compliance Inspection
**Priority:** High
**Description:** Verify export of system audit trail for regulatory inspection

**Expected Outcome:**
- Audit trail exported in readable format with all required fields

---

## End-to-End Workflow Scenarios

### E2E-001: Complete Blinded Case Processing Workflow

**Scenario:** Process a blinded clinical trial AE from intake through reporting

**Flow:**
1. Create blinded case (Section 2.1)
2. Enter all case details with masked treatment
3. Code events with MedDRA
4. Perform causality assessment
5. Determine seriousness
6. Generate blinded safety report (Section 2.7)
7. Submit to regulatory authority (if applicable)
8. Maintain blind throughout workflow

---

### E2E-002: Emergency Unblinding to Reporting Workflow

**Scenario:** Handle emergency unblinding and subsequent expedited reporting

**Flow:**
1. Receive blinded SAE case
2. Process emergency unblinding (Section 2.3)
3. Document authorization and audit trail
4. Calculate reporting timelines (Section 4.4)
5. Complete medical assessment (Section 3.2-3.4)
6. Submit to FDA/EV (Section 4.2-4.3)
7. Notify stakeholders

---

### E2E-003: Literature Case to Signal Detection

**Scenario:** Process literature case through signal detection

**Flow:**
1. Create literature case (Section 1.2)
2. Code products and events
3. Medical review and assessment
4. Add to database
5. Include in disproportionality analysis (Section 5.1)
6. Review if signal detected (Section 5.2)

---

## Quick Reference: Blinded vs Unblinded Features

| Feature | Blinded Case | Unblinded Case |
|---------|--------------|----------------|
| Treatment Name | Masked (BLINDED) | Visible |
| Treatment Arm | Masked (A/B/C) | Visible |
| Dosage Details | Protocol reference | Full details |
| Case View | Limited product info | Complete info |
| Reports | Aggregated/masked | Detailed breakdown |
| User Access | Blinded Processor role | Standard/Unblinded role |
| Unblinding Action | Available with auth | N/A |

---

## Regulatory Compliance Notes

- **21 CFR Part 11:** Electronic records and signatures compliance
- **HIPAA:** Patient privacy protection
- **ICH E2B(R3):** Electronic reporting standard
- **GDPR:** EU data protection for EU cases

---

## Test Data Requirements

For comprehensive testing, ensure the following data exists:
- Multiple studies (blinded and open-label)
- Various product types (drug, biologic, device)
- Different case sources (spontaneous, literature, study)
- Mix of serious and non-serious cases
- Cases from multiple regions (US, EU, International)

---

*Document Version: 1.0*
*Last Updated: 2026-04-10*
*Total Scenarios: 43*
*Detailed Test Cases: 4*
