# Backend API Specification for Frontend Integration

## Overview
This document outlines the requirements for connecting your Svelte frontend to the existing `cc-pay-api` backend. The backend is built with Express and uses a custom session-based authentication flow exchanged via Google Sign-In.

## Base Configuration
- **Base URL**: `http://localhost:5432` (Locally)
- **CORS**: Enabled globally (Frontend can call from any origin)
- **Content-Type**: Requests should generally set `Content-Type: application/json`

## Authentication Flow
The backend uses a session token system. The frontend must implement the following flow:
1.  **Google Sign-In**: User signs in on frontend -> retrieves Google `id_token`.
2.  **Start Session**: Frontend `POST`s `id_token` to `/start_session`.
3.  **Store Token**: Backend returns a `session_token`. Frontend **must** save this (e.g., `localStorage` or Svelte Store).
4.  **Authenticated Calls**: All protected endpoints (`/balance`, `/pay`, `/history`) require this `session_token` in the JSON body.

## API Endpoints

### 1. Authentication
#### `POST /start_session`
Exchanges a Google ID token for a backend session token.
- **Body**: `{ "id_token": "..." }`
- **Response**: `{ "message": "Session started", "session_token": "..." }`

#### `POST /end_session`
Logs out the user server-side.
- **Body**: `{ "session_token": "..." }`
- **Response**: `"Logged out"`

### 2. User User Operations
#### `POST /balance`
Get current user balance.
- **Body**: `{ "session_token": "..." }`
- **Response**: `{ "balance": 1234 }`

#### `POST /history`
Get transaction history.
- **Body**: `{ "session_token": "..." }`
- **Response**: `[ { "timestamp": ..., "amount": ..., "direction": "IN|OUT", "counterparty": "..." }, ... ]`

#### `POST /pay`
Make a payment to a merchant.
- **Body**:
  ```json
  {
    "session_token": "...",
    "merchant_name": "Kantin Kejujuran",
    "amount": 5000
  }
  ```
- **Response**: `"Payment completed"` or Error message

### 3. Public Data
#### `GET /merchants`
List all available merchants.
- **No Body Required**
- **Response**: `[ { "name": "...", "balance": ... }, ... ]`

### 4. Admin Operations
#### `POST /set_balances`
Distribute balances to students.
- **Body**:
  ```json
  {
    "session_token": "...",
    "amount": 1000,
    "nis": ["123", "456"],  // Optional: Target by NIS
    "emails": ["..."]       // Optional: Target by Email
  }
  ```
- **Response**: `"Balances credited successfully"`

## Next Steps for Frontend
1.  Install a request library (like `axios` or standard `fetch`).
2.  Create a centralized API helper in Svelte (e.g., `lib/api.js`) to handle the `session_token` injection automatically.
3.  Implement Google Sign-In button to get the initial `id_token`.
