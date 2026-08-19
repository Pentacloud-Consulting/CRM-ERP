# ERP System Objects: What They Are & Why We Use Them

This document breaks down every major object in the Freight Forwarding ERP system. It explains what each object is and the business reason why it exists, organized by the flow of operations.

---

## 🤝 CRM & Sales (Acquiring the Business)

### 1. Leads
- **What it is:** A potential new business inquiry. For example, a company calling to ask for a rate to ship electronics from Doha to London.
- **Why we use it:** To capture raw inquiries before they are verified. It helps the sales team track who they need to follow up with without cluttering the main database with unverified data.

### 2. Accounts
- **What it is:** A verified business entity (e.g., "Pentacloud LLP") that you do business with.
- **Why we use it:** To centralize all information about a company. Every shipment, opportunity, and contact person is tied to an Account so you can see your entire relationship with that business in one place.

### 3. Contacts
- **What it is:** The actual human beings who work at an Account (e.g., "John Doe, Logistics Manager").
- **Why we use it:** So your team knows exactly who to email or call for approvals, billing, or operational emergencies.

### 4. Opportunities
- **What it is:** A specific potential deal with an Account. (e.g., "Pentacloud wants to ship 1,000kg of phones next week").
- **Why we use it:** To track the sales pipeline. It helps management forecast revenue and track how close the sales team is to winning specific deals. When "Won", it automatically creates a Shipment.

---

## 📦 Operations (Executing the Shipment)

### 5. Shipments
- **What it is:** The central operational record for moving a customer's cargo from Point A to Point B.
- **Why we use it:** This is the heart of the system. It ties everything together—it links the customer to the tracking events, customs clearances, waybills, and bookings. If a customer asks "Where is my cargo?", you look at the Shipment record.

### 6. Booking Requests
- **What it is:** A formal request sent to an airline (Carrier) asking for space on their airplane for your shipment.
- **Why we use it:** Airlines have limited space. You cannot just drop cargo at the airport; you must request an allocation of weight and volume on a specific flight and wait for the airline to confirm it.

### 7. Air Waybills (AWB)
- **What it is:** The official contract of carriage and receipt of goods.
  - **Master AWB (MAWB):** The contract between you (the Freight Forwarder) and the Airline.
  - **House AWB (HAWB):** The contract between you and your Customer.
- **Why we use it:** It is a strict legal requirement for international air freight. It governs liability, proves ownership of the goods, and is required by customs agencies worldwide. 

### 8. Customs Clearances
- **What it is:** The declaration to government authorities detailing what goods are entering or leaving a country.
- **Why we use it:** Without customs clearance, cargo cannot legally cross international borders. This record tracks declaration numbers, HS codes, and whether the goods are "Cleared" or "Held" for inspection.

---

## ✈️ Logistics & Ground Handling (Physical Movement)

### 9. ULD Build-Up
- **What it is:** The physical process of packing dozens of individual loose shipments into one large standardized aircraft container or pallet (Unit Load Device).
- **Why we use it:** Airlines need to load planes in minutes, not hours. By consolidating many small shipments into one large ULD at your warehouse, the airline can just slide the container directly onto the aircraft.

### 10. Flight Manifests
- **What it is:** The master list of every piece of cargo, ULD, and Air Waybill loaded onto a specific flight (e.g., "QR8410 on Aug 18").
- **Why we use it:** The airline and the destination airport need a complete, accurate list of exactly what is on the airplane for weight/balance calculations, safety, and offloading preparation.

### 11. Tracking Board
- **What it is:** A visual dashboard that collects status updates (FSU messages like RCS, DEP, ARR, DLV) from airlines and ground handlers.
- **Why we use it:** To monitor the real-time physical location of all active cargo in one place. It allows operations teams to proactively spot delays (like a missed flight) before the customer calls to complain.
