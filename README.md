# Backend Ledger - Banking System API & Web Platform

Full-stack banking ledger and financial transaction management application designed with double-entry accounting principles, secure JWT authentication, multi-account handling, real-time transaction processing, and an interactive modern client dashboard.

---

## Overview

Backend Ledger is a production-style banking ledger designed to ensure balance consistency across accounts. It records all transfers as immutable ledger entries, enforcing debit/credit balance verification, atomic updates, and user session protection.

---

## Architecture & Features

- User Authentication: Secure signup, login, password hashing with bcryptjs, and JWT cookie management.
- Multi-Account Management: Create and view multiple accounts with initial balance seeding and real-time status tracking.
- Transaction Processing: Double-entry ledger architecture supporting credit and debit transfers with atomic balances.
- Interactive Web Dashboard: Modern web UI (`frontend/`) with login, register, transfer money, transaction history, and balance cards.
- Email Notifications: Nodemailer integration for transaction alerts and account verification.
- CORS Middleware: Configured for seamless communication between the client interface and API server.

---

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript (Fetch API)
- Backend: Node.js, Express 5
- Database: MongoDB, Mongoose ODM
- Security & Auth: JWT, bcryptjs, cookie-parser, cors
- Utilities: dotenv, nodemailer

---

## Project Structure

```
├── frontend/
│   ├── css/
│   ├── js/
│   ├── dashboard.html
│   └── index.html
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── app.js
├── server.js
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB instance (local or MongoDB Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jitendra-io/Backend-Ledger.git
   cd Backend-Ledger
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your values:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/banking_ledger
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

5. Access the application:
   Open `frontend/index.html` in your web browser.

---

## API Reference

### Authentication
- `POST /api/v1/auth/register` - Create a new user account
- `POST /api/v1/auth/login` - Authenticate user and receive JWT cookie
- `GET /api/v1/auth/logout` - Clear user authentication cookie

### Accounts
- `POST /api/v1/accounts/create` - Create a new bank account
- `GET /api/v1/accounts` - Retrieve all accounts for the authenticated user

### Transactions & Ledger
- `POST /api/v1/transactions/transfer` - Execute an atomic money transfer
- `GET /api/v1/transactions/history` - Retrieve transaction logs and ledger history

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
