# HyperLiquid Wallet Daily PnL API

This backend service retrieves and calculates the daily Profit and Loss (PnL) for any HyperLiquid wallet address. It was built to fulfill the **Backend Assignment Task 2** requirements.

## 📋 Deliverables Included
* **Source Code:** Node.js/Express backend.
* **Docker Support:** Full containerization setup.
* **Unit Tests:** Jest test suite for validation logic.
* **Postman Collection:** `postman_collection.json` included for one-click API testing.
* **Documentation:** Setup and usage instructions below.

---

## 🚀 Quick Start (Docker)
*Recommended method.*

### 1. Build the Image
```bash
docker build -t hyperliquid-pnl .
```

### 2. Run the Container
```bash
docker run -p 3000:3000 -d hyperliquid-pnl
```
The API is now active at `http://localhost:3000`.

---

## 💻 Quick Start (Local)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

---

## 📡 API Documentation

### **GET** `/api/hyperliquid/:wallet/pnl`
Fetches daily PnL, Fees, Funding, and Equity stats for a given date range.

#### **Parameters**
| Type | Key | Description |
| :--- | :--- | :--- |
| **Path** | `wallet` | The 42-character 0x wallet address. |
| **Query** | `start` | Start date in `YYYY-MM-DD` format. |
| **Query** | `end` | End date in `YYYY-MM-DD` format. |

#### **Example Request (Live Data)**
*Using a known active "Whale" wallet to demonstrate real data:*
```bash
curl "http://localhost:3000/api/hyperliquid/0x5D2F4460Ac3514AdA79f5D9838916E508Ab39Bb7/pnl?start=2025-12-01&end=2025-12-30"
```

#### **Example Response**
```json
{
  "wallet": "0x5D2F...",
  "start": "2025-12-01",
  "end": "2025-12-30",
  "daily": [
    {
      "date": "2025-12-02",
      "realized_pnl_usd": 4363635.66,
      "unrealized_pnl_usd": -5375333.44,
      "fees_usd": 2314.47,
      "funding_usd": 0,
      "net_pnl_usd": -1014012.25,
      "equity_usd": 9525080.17
    }
  ],
  "summary": {
    "total_realized_usd": 13525919.05,
    "total_unrealized_usd": -10688662.82,
    "total_fees_usd": 7234.55,
    "net_pnl_usd": 2830021.68
  },
  "diagnostics": {
    "data_source": "hyperliquid_api",
    "notes": "Unrealized PnL derived from (Net - Realized - Funding + Fees) to ensure balance."
  }
}
```

---

## 🧪 Testing

The project includes **Unit Tests** (Jest) to validate input parsing and error handling.

### Run Tests
```bash
npm test
```

*Test Coverage:*
* Validates missing dates (returns 400).
* Validates invalid wallet addresses (returns 400).
* Verifies JSON structure matches the assignment requirements.
* Tests error handling when the HyperLiquid API is down.

---

## 📮 Postman Collection
A `postman_collection.json` file is included in the root directory.
1. Import this file into Postman.
2. Run the "Get Daily PnL" request.
3. **Note:** The collection includes automated tests that verify the status code (200) and JSON structure upon response.

---

## 🛠️ Implementation Logic

To ensure accuracy without a historical database, the service uses a **Top-Down & Bottom-Up Hybrid Approach**:

1.  **Net PnL & Equity (Top-Down):** Fetched from HyperLiquid's `portfolio` history endpoint. This is the "Source of Truth" for the account value.
2.  **Realized PnL, Fees, Funding (Bottom-Up):** Aggregated from raw trade logs (`userFills`) and funding events (`userFunding`).
3.  **Unrealized PnL (Derived):** Calculated algebraically to force the accounting equation to balance:
    73499Unrealized = NetPnL - Realized + Fees - Funding73499

This ensures that `Net PnL` always matches the user's actual portfolio change, even if specific historical open positions are hard to reconstruct perfectly from public API data.
