# Target Management Tool — Planning Reference

## Overview
A web-based target management and commission tracking tool for a sales org hierarchy.
Deployed on **Vercel**, backed by **Google Sheets** as the database.

---

## Roles & Hierarchy

```
Admin
  └── Sales Head
        └── VH (Vertical Head)
              └── Manager
                    └── Associate
```

### Who can assign targets to whom:
| Assigner       | Can Assign To |
|----------------|---------------|
| Admin          | Sales Head, VH, Manager, Associate |
| Sales Head     | VH            |
| VH             | Manager       |
| Manager        | Associate     |
| Associate      | No one        |

### Who can assign incentive structures:
- Admin, Sales Head, and Managers can assign incentive structures to agents below them.

---

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Frontend      | Next.js 14 (App Router) + Tailwind CSS |
| Backend       | Next.js API Routes (serverless)     |
| Database      | Google Sheets (via Google Sheets API v4) |
| Auth          | Custom credentials: Email + bcrypt password stored in Users sheet |
| Deployment    | Vercel                              |
| Session       | NextAuth.js (CredentialsProvider)   |

---

## Google Sheets Structure

### Sheet ID
Set via environment variable: `GOOGLE_SHEET_ID`

### Tab 1: `Users`
| Column         | Description                          |
|----------------|--------------------------------------|
| Email          | User's Gmail address (unique ID)     |
| Name           | Display name                         |
| Role           | Admin / SalesHead / VH / Manager / Associate |
| ManagerEmail   | Email of their direct manager        |
| PasswordHash   | bcryptjs hash of their password      |
| InviteToken    | UUID for invite link                 |
| InviteExpiry   | ISO timestamp                        |
| Status         | active / invited / inactive          |
| CreatedAt      | ISO timestamp                        |

### Tab 2: `Targets`
| Column              | Description                                  |
|---------------------|----------------------------------------------|
| TargetID            | UUID                                         |
| AssignedTo          | Email of the target recipient                |
| AssignedBy          | Email of the assigner                        |
| Period              | e.g. "2024-03" (YYYY-MM)                     |
| RevenueTarget       | Numeric target amount (₹)                    |
| IncentiveStructure  | 1 / 2 / 3 (which slab table applies)        |
| Notes               | Optional notes                               |
| CreatedAt           | ISO timestamp                                |
| UpdatedAt           | ISO timestamp                                |

### Tab 3: `SalesDone`
Raw dump of all deals closed by agents.

| Column         | Description                          |
|----------------|--------------------------------------|
| DealID         | Unique deal identifier               |
| AgentEmail     | Associate who closed the deal        |
| DealDate       | ISO date                             |
| Revenue        | Deal revenue amount (₹)              |
| ClientName     | Client name (optional)              |
| Notes          | Optional notes                       |
| CreatedAt      | Row creation timestamp               |

### Tab 4: `SalesDetails`
Detailed sales breakdown / enriched data per deal.

| Column         | Description                          |
|----------------|--------------------------------------|
| DealID         | FK to SalesDone                      |
| AgentEmail     | Associate email                      |
| ProductType    | Category / product                   |
| Stage          | e.g. Lead / Negotiation / Closed     |
| Amount         | Amount for this line item            |
| Period         | YYYY-MM                              |
| CapturedAt     | Timestamp                            |

---

## Incentive Structures

Three commission slab tables. Which one applies to an agent is assigned by their manager/admin.

### Structure 1 — 1st Month Slabs
| Revenue (₹)   | Slab Rate | Commission (₹) |
|---------------|-----------|----------------|
| 400,000       | 1%        | 4,000          |
| 600,000       | 2%        | 12,000         |
| 800,000       | 3%        | 24,000         |
| 900,000       | 4%        | 36,000         |
| 1,000,000     | 5%        | 50,000         |
| 1,200,000     | 6%        | 72,000         |
| 1,400,000     | 7%        | 98,000         |
| 1,500,000     | 8%        | 120,000        |

### Structure 2 — 2nd Month Slabs
| Revenue (₹)   | Slab Rate | Commission (₹) |
|---------------|-----------|----------------|
| 600,000       | 1%        | 6,000          |
| 800,000       | 2%        | 16,000         |
| 900,000       | 3%        | 27,000         |
| 1,000,000     | 4%        | 40,000         |
| 1,300,000     | 5%        | 65,000         |
| 1,500,000     | 7%        | 105,000        |

### Structure 3 — 3rd Month Slabs
| Revenue (₹)   | Slab Rate | Commission (₹) |
|---------------|-----------|----------------|
| 750,000       | 0.50%     | 3,750          |
| 850,000       | 1%        | 8,500          |
| 950,000       | 2%        | 19,000         |
| 1,050,000     | 3%        | 31,500         |
| 1,250,000     | 4%        | 50,000         |
| 1,550,000     | 6%        | 93,000         |

### Commission Calculation Logic
- Find the highest slab tier where `actualRevenue >= slabRevenue`
- Apply that slab's rate to the full actual revenue
- Example: Revenue = ₹1,100,000 on Structure 1 → falls in 6% slab → commission = ₹66,000

---

## Authentication Flow

1. User visits `/login`
2. Enters Gmail address + password
3. API route queries `Users` sheet, finds row by email
4. Compares submitted password against stored `PasswordHash` (bcryptjs)
5. On success → NextAuth issues JWT session cookie
6. Role stored in JWT for client-side route protection

### Invite Flow
1. Admin/Manager creates user → writes row to `Users` sheet with `Status: invited`, `InviteToken`, `InviteExpiry`
2. System emails invite link: `/invite?token=<UUID>`
3. User sets their password → `PasswordHash` written back to sheet, `Status: active`

---

## Pages / Routes

| Route                  | Access          | Description                                 |
|------------------------|-----------------|---------------------------------------------|
| `/login`               | Public          | Email + password login                      |
| `/invite`              | Public (token)  | Accept invite, set password                 |
| `/dashboard`           | All roles       | Overview: my targets, my team's progress    |
| `/targets`             | All roles       | View targets assigned to me                 |
| `/targets/assign`      | Admin/SH/VH/Mgr | Assign targets to subordinates              |
| `/team`                | Admin/SH/VH/Mgr | View team members and their status          |
| `/users`               | Admin           | Full user management                        |
| `/incentives`          | Admin/SH/Mgr    | View and assign incentive structures        |
| `/reports`             | Admin/SH/VH     | Revenue vs target reports                   |
| `/api/auth/[...nextauth]` | -            | NextAuth handler                            |
| `/api/users`           | -               | CRUD on Users sheet                         |
| `/api/targets`         | -               | CRUD on Targets sheet                       |
| `/api/sales`           | -               | Read SalesDone + SalesDetails               |
| `/api/commission`      | -               | Calculate commission for agent + period     |

---

## Key Features

### Dashboard (per role)
- **Associate**: My target this month, my actual revenue, estimated commission
- **Manager**: Team targets vs actuals, each associate's progress bar
- **VH/Sales Head**: Rolled-up view across managers
- **Admin**: Full org view

### Target Assignment
- Select subordinate from dropdown (filtered by role hierarchy)
- Set revenue target (₹) for a period (month picker)
- Assign incentive structure (1 / 2 / 3)
- Optional notes
- Saves row to `Targets` sheet

### Commission Calculator
- Pulls agent's `SalesDone` rows for selected period
- Sums revenue
- Applies assigned incentive structure's slab logic
- Displays breakdown: revenue achieved, slab applied, commission earned

---

## Environment Variables

```env
# Google
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SHEET_ID=...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-vercel-domain.vercel.app

# Email (for invites)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

---

## Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── invite/page.tsx
│   ├── dashboard/page.tsx
│   ├── targets/
│   │   ├── page.tsx
│   │   └── assign/page.tsx
│   ├── team/page.tsx
│   ├── users/page.tsx
│   ├── incentives/page.tsx
│   ├── reports/page.tsx
│   └── layout.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── users/route.ts
│   ├── targets/route.ts
│   ├── sales/route.ts
│   └── commission/route.ts
├── lib/
│   ├── sheets.ts          # Google Sheets read/write helpers
│   ├── auth.ts            # NextAuth config
│   ├── incentives.ts      # Commission calculation logic
│   └── roles.ts           # Role hierarchy + permission helpers
├── components/
│   ├── layout/Sidebar.tsx
│   ├── targets/TargetForm.tsx
│   ├── targets/TargetCard.tsx
│   ├── users/UserTable.tsx
│   └── dashboard/ProgressBar.tsx
├── middleware.ts           # Route protection by role
├── PLANNING.md             # This file
└── .env.local
```

---

## Build Order

1. [ ] Init Next.js project with Tailwind
2. [ ] Google Sheets API helper (`lib/sheets.ts`)
3. [ ] NextAuth credentials provider reading from Users sheet
4. [ ] Role-based middleware
5. [ ] Login page
6. [ ] Dashboard (role-aware)
7. [ ] Target assignment form + list
8. [ ] Incentive structure assignment
9. [ ] Commission calculator
10. [ ] User management (invite flow)
11. [ ] Reports page
12. [ ] Deploy to Vercel
