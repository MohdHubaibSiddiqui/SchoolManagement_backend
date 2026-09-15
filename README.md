# School Management Backend

Backend for **School Management Web Application with Student & Fee Management**.

## Stack

- Node.js
- Express.js
- MongoDB / Mongoose
- JWT authentication
- bcryptjs password hashing

## Setup

```bash
npm install
```

Create `.env` from `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/schoolManagementDB
JWT_SECRET=your_strong_secret
```

Seed demo data:

```bash
npm run seed
```

Start development server:

```bash
npm run dev
```

## Demo Accounts

Admin:
- Email: `admin@school.com`
- Password: `admin123`

Finance:
- Email: `finance@school.com`
- Password: `finance123`

## Main API Routes

### Authentication
- `POST /api/auth/login`

### Students
- `GET /api/students`
- `GET /api/students/:id`
- `POST /api/students` — Admin
- `PUT /api/students/:id` — Admin
- `DELETE /api/students/:id` — Admin

Search/filter:
- `/api/students?search=STU001`
- `/api/students?classId=<classId>`

### Classes
- `GET /api/classes`

### Finance Users — Admin only
- `GET /api/finance-users`
- `POST /api/finance-users`
- `PUT /api/finance-users/:id`
- `PATCH /api/finance-users/:id/status`
- `DELETE /api/finance-users/:id`

### Fees
- `GET /api/fees?month=2026-09`
- `GET /api/fees?month=2026-09&classId=<classId>&status=Unpaid`
- `GET /api/fees?month=2026-09&classId=<classId>&status=Paid`
- `GET /api/fees/structures`
- `PATCH /api/fees/:id/pay` — Finance
- `PATCH /api/fees/:id` — Finance

### Dashboard
- `GET /api/dashboard?month=2026-09`

### Monthly Report
- `GET /api/reports/monthly?month=2026-09`

## Authorization

Send the JWT in the header:

```text
Authorization: Bearer <token>
```

Backend permission checks:
- Admin: student CRUD, finance user management, fee overview, reports.
- Finance: view students, manage fees/payments, reports.
- Public users: no dashboard/student/fee access.

## Fee Rules

- Class 1 to Class 10
- Day Scholar: ₹500/month
- Hostler: ₹300/month
- One fee record per student per month
- Paid/Unpaid status is maintained separately for every month
