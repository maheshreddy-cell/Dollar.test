/**
 * Dollar Target Management Tool — Google Apps Script Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this entire file into Code.gs
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the web app URL → add to Vercel env as APPS_SCRIPT_URL
 * 5. Sheet must have 4 tabs: Users | Targets | SalesDone | SalesDetails
 *
 * SHEET COLUMN HEADERS (row 1 of each tab — add these manually):
 * Users:        Email | Name | Role | ManagerEmail | PasswordHash | InviteToken | InviteExpiry | Status | CreatedAt
 * Targets:      TargetID | AssignedTo | AssignedBy | Period | RevenueTarget | IncentiveStructure | Notes | CreatedAt | UpdatedAt
 * SalesDone:    DealID | AgentEmail | DealDate | Revenue | ClientName | Notes | CreatedAt
 * SalesDetails: DealID | AgentEmail | ProductType | Stage | Amount | Period | CapturedAt
 */

// ─── Entry Points ────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const { action, payload } = JSON.parse(e.postData.contents);
    const handlers = {
      // Users
      getUser:          () => getUser(payload.email),
      getUsers:         () => getUsers(payload),
      getUserByToken:   () => getUserByToken(payload.token),
      createUser:       () => createUser(payload),
      updateUser:       () => updateUser(payload),
      // Targets
      getTargets:       () => getTargets(payload),
      createTarget:     () => createTarget(payload),
      updateTarget:     () => updateTarget(payload),
      // Sales
      getSales:         () => getSales(payload),
      getAllSales:       () => getAllSales(),
      // Email
      sendInviteEmail:  () => sendInviteEmail(payload),
    };
    if (!handlers[action]) return respond({ error: 'Unknown action: ' + action }, 400);
    return respond(handlers[action]());
  } catch (err) {
    return respond({ error: err.message }, 500);
  }
}

// Allow CORS preflight
function doGet(e) {
  return respond({ status: 'ok', version: '1.0' });
}

function respond(data, status) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ─── Sheet Helpers ────────────────────────────────────────────────────────────

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  const [headers, ...rows] = sheet.getDataRange().getValues();
  return rows
    .filter(r => r[0] !== '')
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

function findRowIndex(sheet, colIndex, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]).toLowerCase() === String(value).toLowerCase()) {
      return i + 1; // 1-based sheet row
    }
  }
  return -1;
}

// ─── Users ────────────────────────────────────────────────────────────────────

function getUser(email) {
  const sheet = getSheet('Users');
  const users = sheetToObjects(sheet);
  return users.find(u => u.Email && u.Email.toLowerCase() === email.toLowerCase()) || null;
}

function getUsers(payload) {
  const sheet = getSheet('Users');
  let users = sheetToObjects(sheet);
  if (payload && payload.managerEmail) {
    users = users.filter(u => u.ManagerEmail === payload.managerEmail);
  }
  if (payload && payload.role) {
    users = users.filter(u => u.Role === payload.role);
  }
  // Strip password hashes
  return users.map(u => ({ ...u, PasswordHash: '' }));
}

function getUserByToken(token) {
  const sheet = getSheet('Users');
  const users = sheetToObjects(sheet);
  const user = users.find(u => u.InviteToken === token);
  if (!user) return null;
  return { ...user, PasswordHash: '' };
}

function createUser(payload) {
  const sheet = getSheet('Users');
  sheet.appendRow([
    payload.email,
    payload.name,
    payload.role,
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
        name: payload.name,
        role: payload.role,
        manageremail: payload.managerEmail,
        passwordhash: payload.passwordHash,
        invitetoken: payload.inviteToken,
        inviteexpiry: payload.inviteExpiry,
        status: payload.status,
      };

      Object.entries(updates).forEach(([key, val]) => {
        if (val !== undefined && colMap[key] !== undefined) {
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
        revenuetarget: payload.revenueTarget,
        incentivestructure: payload.incentiveStructure,
        notes: payload.notes,
        period: payload.period,
        updatedat: new Date().toISOString(),
      };

      Object.entries(updates).forEach(([key, val]) => {
        if (val !== undefined && colMap[key] !== undefined) {
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
  let deals = sheetToObjects(sheet).map(d => ({
    ...d,
    Revenue: Number(d.Revenue) || 0,
  }));

  if (payload && payload.agentEmail) {
    deals = deals.filter(d =>
      String(d.AgentEmail).toLowerCase() === String(payload.agentEmail).toLowerCase()
    );
  }
  if (payload && payload.period) {
    deals = deals.filter(d =>
      d.DealDate && String(d.DealDate).startsWith(payload.period)
    );
  }
  return deals;
}

function getAllSales() {
  const sheet = getSheet('SalesDone');
  return sheetToObjects(sheet).map(d => ({
    ...d,
    Revenue: Number(d.Revenue) || 0,
  }));
}

// ─── Email ────────────────────────────────────────────────────────────────────

function sendInviteEmail(payload) {
  const { toEmail, toName, inviteToken, baseUrl } = payload;
  const inviteUrl = `${baseUrl}/invite?token=${inviteToken}`;

  MailApp.sendEmail({
    to: toEmail,
    subject: 'You\'ve been invited to Dollar — Target Management',
    htmlBody: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563EB; margin-bottom: 8px;">Dollar</h2>
        <h3 style="color: #0F172A;">Hello ${toName},</h3>
        <p style="color: #475569;">You've been invited to join the Target Management platform.</p>
        <p style="color: #475569;">Click below to set your password and activate your account:</p>
        <a href="${inviteUrl}"
           style="display:inline-block;background:#2563EB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Accept Invite
        </a>
        <p style="color:#94A3B8;font-size:12px;margin-top:24px;">
          This link expires in 48 hours. If you didn't expect this, please ignore.
        </p>
      </div>
    `,
  });
  return { success: true };
}
