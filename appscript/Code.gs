/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         Dollar.v2 — Google Apps Script Backend               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * FIRST-TIME SETUP (do this once):
 * ─────────────────────────────────
 * 1. Open your Google Sheet
 * 2. Extensions → Apps Script → paste this entire file into Code.gs
 * 3. Click the ▶ Run button and choose: runSetup()
 *    → This creates Users, Targets, SalesDetails tabs + maps SalesDone columns
 * 4. Then run: addFirstAdmin("your@email.com", "Your Name")
 *    → Creates your Admin account (you'll set password via the invite link)
 * 5. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the web app URL → add to Vercel as APPS_SCRIPT_URL
 * 7. Run: testDeployment() to verify everything is wired up correctly
 *
 * ─────────────────────────────────────────────────────────────────
 * YOUR SalesDone COLUMN MAPPING
 * (actual column headers from your sheet → what the app calls them)
 * ─────────────────────────────────────────────────────────────────
 */
const SALES_COL = {
  agentEmail:     'Agent Email address',   // used to link deal to user
  revenue:        'Paid - Actual',         // amount used for commission calc
  totalSaleValue: 'Total sale Value',      // original sale value (informational)
  dealDate:       'Timestamp',             // when the deal was logged
  paymentDate:    'Payment date',          // actual payment date
  clientName:     'Lead Name',             // customer/lead name
  customerEmail:  'Customer E-mail id',
  phone:          'Phone number',
  course:         'Course',
  rating:         'Rating',
  paymentType:    'Payment Type',
  profession:     'Profession',
  leadSource:     'Lead source',
  status:         'Status',
  month:          'Month',                 // used for period filtering (YYYY-MM or "March 2026")
  team:           'Team',
  vertical:       'VERTICAL',
  techStack:      'Tech Stack',
  paidOld:        'Paid Old',
  paid:           'Paid',
  paidDiff:       'Paid Diff',
  paidActual:     'Paid - Actual',
  amountCleared:  'Amount cleared',
  loanDocs:       'Loan Documents Collected',
  emiTenure:      'EMI Tenure',
  location:       'Location',
};

// ─── Entry Points ────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, payload } = body;

    const handlers = {
      // Users
      getUser:         () => getUser(payload.email),
      getUsers:        () => getUsers(payload),
      getUserByToken:  () => getUserByToken(payload.token),
      createUser:      () => createUser(payload),
      updateUser:      () => updateUser(payload),
      // Targets
      getTargets:      () => getTargets(payload),
      createTarget:    () => createTarget(payload),
      updateTarget:    () => updateTarget(payload),
      // Sales
      getSales:        () => getSales(payload),
      getAllSales:      () => getAllSales(),
      // Email
      sendInviteEmail: () => sendInviteEmail(payload),
    };

    if (!handlers[action]) return respond({ error: 'Unknown action: ' + action });
    return respond(handlers[action]());

  } catch (err) {
    return respond({ error: err.message, stack: err.stack });
  }
}

function doGet() {
  return respond({ status: 'ok', version: '2.0', timestamp: new Date().toISOString() });
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── SETUP ───────────────────────────────────────────────────────────────────
// Run this ONCE after pasting the script. It creates missing tabs and headers.

function runSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = [];

  // Tab definitions: [tabName, [headers...]]
  // Only 2 tabs are created — SalesDone already exists with your raw data
  const tabs = [
    ['Users', [
      'Email', 'Name', 'Role', 'ManagerEmail',
      'PasswordHash', 'InviteToken', 'InviteExpiry', 'Status', 'CreatedAt'
    ]],
    ['Targets', [
      'TargetID', 'AssignedTo', 'AssignedBy', 'Period',
      'RevenueTarget', 'IncentiveStructure', 'Notes', 'CreatedAt', 'UpdatedAt'
    ]],
  ];

  tabs.forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      // Style the header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1E3A5F');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
      results.push('✅ Created tab: ' + name);
    } else {
      results.push('⏭️  Tab already exists (skipped): ' + name);
    }
  });

  // Check SalesDone exists
  const salesSheet = ss.getSheetByName('SalesDone');
  if (salesSheet) {
    const firstRow = salesSheet.getRange(1, 1, 1, salesSheet.getLastColumn()).getValues()[0];
    results.push('✅ SalesDone tab found with ' + salesSheet.getLastRow() + ' rows');
    results.push('   Headers: ' + firstRow.filter(h => h !== '').join(' | '));

    // Check that the key columns we need actually exist
    const required = [SALES_COL.agentEmail, SALES_COL.revenue, SALES_COL.month];
    const missing = required.filter(col => !firstRow.includes(col));
    if (missing.length > 0) {
      results.push('⚠️  WARNING: These expected columns were not found in SalesDone:');
      missing.forEach(m => results.push('     → "' + m + '"'));
      results.push('   Check SALES_COL mapping at the top of this script.');
    } else {
      results.push('✅ All required SalesDone columns found');
    }
  } else {
    // Create SalesDone with standard headers as a starting point
    const sheet = ss.insertSheet('SalesDone');
    const headers = Object.values(SALES_COL);
    // Use actual column names from SALES_COL as headers
    const salesHeaders = [
      'Timestamp', 'Agent Email address', 'Lead Name', 'Customer E-mail id',
      'Phone number', 'Course', 'Rating', 'Total sale Value', 'Payment Type',
      'Profession', 'Lead source', 'Payment date', 'Paid for Orientation ?',
      'Tech Stack', 'Aur Kuch  ?', 'Location', 'EMI Tenure', 'Paid Old',
      'Paid', 'Paid Diff', 'Payment comment', 'Paid - Actual',
      'Loan Documents Collected', 'Payment comment', 'Status', 'Month',
      'Amount cleared', 'Team', 'Slack Access', 'Eligible for Slack Access',
      'VERTICAL',
    ];
    sheet.getRange(1, 1, 1, salesHeaders.length).setValues([salesHeaders]);
    const headerRange = sheet.getRange(1, 1, 1, salesHeaders.length);
    headerRange.setBackground('#1E3A5F');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
    results.push('✅ Created SalesDone tab with your column headers');
  }

  Logger.log('\n' + results.join('\n'));
  SpreadsheetApp.getUi().alert('Setup Complete!\n\n' + results.join('\n') + '\n\nNext: run addFirstAdmin() to create your Admin user.');
}

// ─── ADD FIRST ADMIN ─────────────────────────────────────────────────────────
// Run this after setup to create the first Admin user.
// They'll receive an invite email to set their password.
// Usage: addFirstAdmin("admin@yourdomain.com", "Admin Name")

function addFirstAdmin(email, name) {
  // Default values — change before running
  email = email || 'mahesh.reddy@airtribe.live';
  name  = name  || 'Admin';

  const existing = getUser(email);
  if (existing) {
    SpreadsheetApp.getUi().alert('User already exists: ' + email);
    return;
  }

  const token = Utilities.getUuid();
  const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const sheet = getSheet('Users');
  sheet.appendRow([email, name, 'Admin', '', '', token, expiry, 'invited', new Date().toISOString()]);

  // Send invite email
  const inviteUrl = 'https://your-app.vercel.app/invite?token=' + token;
  MailApp.sendEmail({
    to: email,
    subject: 'Dollar.v2 — Set your Admin password',
    htmlBody: buildInviteEmail(name, inviteUrl),
  });

  Logger.log('✅ Admin user created and invite sent to: ' + email);
  Logger.log('   Invite URL (also in email): ' + inviteUrl);
  SpreadsheetApp.getUi().alert('✅ Admin invite sent to ' + email + '\n\nInvite URL (backup):\n' + inviteUrl);
}

// ─── TEST DEPLOYMENT ─────────────────────────────────────────────────────────
// Run this after deploying as a web app to verify everything works.

function testDeployment() {
  const results = [];

  try {
    // 1. Test Users sheet
    const usersSheet = getSheet('Users');
    results.push(usersSheet ? '✅ Users tab: OK (' + (usersSheet.getLastRow() - 1) + ' users)' : '❌ Users tab: MISSING');

    // 2. Test Targets sheet
    const targetsSheet = getSheet('Targets');
    results.push(targetsSheet ? '✅ Targets tab: OK (' + (targetsSheet.getLastRow() - 1) + ' targets)' : '❌ Targets tab: MISSING');

    // 3. Test SalesDone sheet + column mapping
    const salesSheet = getSheet('SalesDone');
    if (salesSheet) {
      const headers = salesSheet.getRange(1, 1, 1, salesSheet.getLastColumn()).getValues()[0];
      const agentCol = headers.indexOf(SALES_COL.agentEmail);
      const revenueCol = headers.indexOf(SALES_COL.revenue);
      const monthCol = headers.indexOf(SALES_COL.month);

      results.push('✅ SalesDone tab: OK (' + (salesSheet.getLastRow() - 1) + ' rows)');
      results.push(agentCol > -1 ? '✅ Agent column found at col ' + (agentCol + 1) : '❌ Agent column "' + SALES_COL.agentEmail + '" NOT FOUND');
      results.push(revenueCol > -1 ? '✅ Revenue column (Paid - Actual) found at col ' + (revenueCol + 1) : '❌ Revenue column "' + SALES_COL.revenue + '" NOT FOUND');
      results.push(monthCol > -1 ? '✅ Month column found at col ' + (monthCol + 1) : '❌ Month column "' + SALES_COL.month + '" NOT FOUND');
    } else {
      results.push('❌ SalesDone tab: MISSING — run runSetup() first');
    }

    // 4. Test reading a sample deal
    const sampleDeals = getSales({});
    results.push('✅ getSales(): returned ' + sampleDeals.length + ' deals');

    // 5. Test reading users
    const users = getUsers({});
    results.push('✅ getUsers(): returned ' + users.length + ' users');

  } catch (err) {
    results.push('❌ ERROR: ' + err.message);
  }

  const report = results.join('\n');
  Logger.log(report);
  SpreadsheetApp.getUi().alert('Deployment Test Results:\n\n' + report);
}

// ─── Sheet Helpers ────────────────────────────────────────────────────────────

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1)
    .filter(r => r[0] !== '' && r[0] !== null)
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i]; });
      return obj;
    });
}

// Parse "Month" column value into YYYY-MM string
// Handles: "2026-03", "March 2026", "Mar-26", "03/2026", Date objects
function parsePeriod(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM');
  }
  const s = String(val).trim();
  // Already YYYY-MM
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  // "March 2026" or "Mar 2026"
  const monthNames = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                       jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
  const wordMatch = s.match(/^([a-zA-Z]{3,9})[\s-](\d{4})$/);
  if (wordMatch) {
    const m = monthNames[wordMatch[1].toLowerCase().slice(0,3)];
    if (m) return wordMatch[2] + '-' + m;
  }
  // "03/2026" or "3/2026"
  const slashMatch = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return slashMatch[2] + '-' + String(slashMatch[1]).padStart(2, '0');
  // "Mar-26" (short year)
  const shortMatch = s.match(/^([a-zA-Z]{3})-(\d{2})$/);
  if (shortMatch) {
    const m = monthNames[shortMatch[1].toLowerCase()];
    if (m) return '20' + shortMatch[2] + '-' + m;
  }
  return s;
}

// ─── Users ────────────────────────────────────────────────────────────────────

function getUser(email) {
  const sheet = getSheet('Users');
  const users = sheetToObjects(sheet);
  return users.find(u => u.Email && String(u.Email).toLowerCase() === String(email).toLowerCase()) || null;
}

function getUsers(payload) {
  const sheet = getSheet('Users');
  let users = sheetToObjects(sheet);

  if (payload && payload.managerEmail) {
    users = users.filter(u => String(u.ManagerEmail).toLowerCase() === String(payload.managerEmail).toLowerCase());
  }
  if (payload && payload.role) {
    users = users.filter(u => u.Role === payload.role);
  }
  // Never expose password hashes to the frontend
  return users.map(u => ({ ...u, PasswordHash: '' }));
}

function getUserByToken(token) {
  const users = sheetToObjects(getSheet('Users'));
  const user = users.find(u => u.InviteToken === token);
  if (!user) return null;
  return { ...user, PasswordHash: '' };
}

function createUser(payload) {
  const sheet = getSheet('Users');
  sheet.appendRow([
    payload.email || '',
    payload.name || '',
    payload.role || 'Associate',
    payload.managerEmail || '',
    payload.passwordHash || '',
    payload.inviteToken || '',
    payload.inviteExpiry || '',
    payload.status || 'invited',
    new Date().toISOString(),
  ]);
  return { success: true };
}

function updateUser(payload) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIdx = headers.indexOf('Email');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][emailIdx]).toLowerCase() === String(payload.email).toLowerCase()) {
      const colMap = {};
      headers.forEach((h, idx) => { colMap[h.toLowerCase()] = idx; });

      const updates = {
        name:          payload.name,
        role:          payload.role,
        manageremail:  payload.managerEmail,
        passwordhash:  payload.passwordHash,
        invitetoken:   payload.inviteToken,
        inviteexpiry:  payload.inviteExpiry,
        status:        payload.status,
      };

      Object.entries(updates).forEach(([key, val]) => {
        if (val !== undefined && val !== null && colMap[key] !== undefined) {
          sheet.getRange(i + 1, colMap[key] + 1).setValue(val);
        }
      });
      return { success: true };
    }
  }
  return { error: 'User not found' };
}

// ─── Targets ─────────────────────────────────────────────────────────────────

function getTargets(payload) {
  const sheet = getSheet('Targets');
  let targets = sheetToObjects(sheet);

  if (payload && payload.assignedTo) {
    targets = targets.filter(t =>
      String(t.AssignedTo).toLowerCase() === String(payload.assignedTo).toLowerCase()
    );
  }
  if (payload && payload.assignedBy) {
    targets = targets.filter(t =>
      String(t.AssignedBy).toLowerCase() === String(payload.assignedBy).toLowerCase()
    );
  }
  if (payload && payload.period) {
    targets = targets.filter(t => t.Period === payload.period);
  }

  return targets.map(t => ({
    ...t,
    RevenueTarget: Number(t.RevenueTarget) || 0,
    IncentiveStructure: Number(t.IncentiveStructure) || 1,
  }));
}

function createTarget(payload) {
  const sheet = getSheet('Targets');
  const now = new Date().toISOString();
  sheet.appendRow([
    payload.targetId,
    payload.assignedTo,
    payload.assignedBy,
    payload.period,
    payload.revenueTarget,
    payload.incentiveStructure || 1,
    payload.notes || '',
    now,
    now,
  ]);
  return { success: true };
}

function updateTarget(payload) {
  const sheet = getSheet('Targets');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('TargetID');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === payload.targetId) {
      const colMap = {};
      headers.forEach((h, idx) => { colMap[h.toLowerCase()] = idx; });

      const updates = {
        revenuetarget:       payload.revenueTarget,
        incentivestructure:  payload.incentiveStructure,
        notes:               payload.notes,
        period:              payload.period,
        updatedat:           new Date().toISOString(),
      };

      Object.entries(updates).forEach(([key, val]) => {
        if (val !== undefined && val !== null && colMap[key] !== undefined) {
          sheet.getRange(i + 1, colMap[key] + 1).setValue(val);
        }
      });
      return { success: true };
    }
  }
  return { error: 'Target not found' };
}

// ─── Sales ────────────────────────────────────────────────────────────────────

function getSales(payload) {
  const sheet = getSheet('SalesDone');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];

  // Column index lookup (case-sensitive match against SALES_COL values)
  function col(name) { return headers.indexOf(name); }

  const agentIdx   = col(SALES_COL.agentEmail);
  const revenueIdx = col(SALES_COL.revenue);      // Paid - Actual
  const dateIdx    = col(SALES_COL.dealDate);      // Timestamp
  const monthIdx   = col(SALES_COL.month);         // Month
  const clientIdx  = col(SALES_COL.clientName);    // Lead Name
  const saleValIdx = col(SALES_COL.totalSaleValue);// Total sale Value
  const statusIdx  = col(SALES_COL.status);
  const teamIdx    = col(SALES_COL.team);
  const vertIdx    = col(SALES_COL.vertical);

  let rows = data.slice(1).filter(r => r[agentIdx] !== '' && r[agentIdx] !== null);

  // Filter by agentEmail
  if (payload && payload.agentEmail) {
    const target = String(payload.agentEmail).toLowerCase();
    rows = rows.filter(r => String(r[agentIdx]).toLowerCase() === target);
  }

  // Filter by period (YYYY-MM) — use Month column if available, else Timestamp
  if (payload && payload.period) {
    rows = rows.filter(r => {
      const period = monthIdx > -1 ? parsePeriod(r[monthIdx]) : parsePeriod(r[dateIdx]);
      return period === payload.period;
    });
  }

  return rows.map((r, i) => ({
    DealID:         'DEAL-' + (i + 1),
    AgentEmail:     r[agentIdx] || '',
    DealDate:       r[dateIdx] instanceof Date
                      ? Utilities.formatDate(r[dateIdx], Session.getScriptTimeZone(), 'yyyy-MM-dd')
                      : String(r[dateIdx] || ''),
    Revenue:        Number(r[revenueIdx]) || 0,       // Paid - Actual
    TotalSaleValue: Number(r[saleValIdx]) || 0,       // Total sale Value (informational)
    ClientName:     r[clientIdx] || '',
    Status:         statusIdx > -1 ? r[statusIdx] : '',
    Team:           teamIdx > -1 ? r[teamIdx] : '',
    Vertical:       vertIdx > -1 ? r[vertIdx] : '',
    Period:         monthIdx > -1 ? parsePeriod(r[monthIdx]) : parsePeriod(r[dateIdx]),
  }));
}

function getAllSales() {
  return getSales({});
}

// ─── Email ────────────────────────────────────────────────────────────────────

function sendInviteEmail(payload) {
  const { toEmail, toName, inviteToken, baseUrl } = payload;
  const inviteUrl = baseUrl + '/invite?token=' + inviteToken;
  MailApp.sendEmail({
    to: toEmail,
    subject: 'Dollar.v2 — You\'ve been invited',
    htmlBody: buildInviteEmail(toName, inviteUrl),
  });
  return { success: true };
}

function buildInviteEmail(name, inviteUrl) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#2563EB;margin:0 0 4px;">Dollar.v2</h2>
      <p style="color:#94A3B8;margin:0 0 32px;font-size:13px;">Target Management Platform</p>
      <h3 style="color:#0F172A;margin:0 0 8px;">Hello ${name},</h3>
      <p style="color:#475569;margin:0 0 8px;">You've been invited to join the Dollar Target Management platform.</p>
      <p style="color:#475569;margin:0 0 24px;">Click below to set your password and activate your account:</p>
      <a href="${inviteUrl}"
         style="display:inline-block;background:#2563EB;color:#fff;padding:12px 28px;
                border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Accept Invite &rarr;
      </a>
      <p style="color:#94A3B8;font-size:12px;margin-top:32px;border-top:1px solid #E2E8F0;padding-top:16px;">
        This link expires in 48 hours. If you didn't expect this email, you can ignore it.
      </p>
    </div>
  `;
}
