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



