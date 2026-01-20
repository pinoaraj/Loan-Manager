# PLAN-partial-payments

## 1. Goal
Ensure that users can view a detailed history of **all** partial payments received for a specific scheduled payment (cuota) within the **Loan Detail** page ("Prestamo-detalle -> Cronograma de prestamos").

## 2. User Requirements
- **Location**: Loan Detail Page (`LoanDetail.jsx`).
- **Context**: "Cronograma de Pagos" table.
- **Trigger**: User sees a payment with status "Partial".
- **Action**: User expands the row (via "Arrow Down").
- **Content**: A list of all individual transactions (date, time, amount) that make up the partial collected amount.

## 3. Current State Analysis
- **Frontend (`LoanDetail.jsx`)**: Code inspection suggests an expandable row mechanism (`expandedPaymentId`) already exists, conditionally rendered if `p.transactions.length > 0`.
- **Backend (`/api/loans/:id`)**: Need to verify if `transactions` are being correctly included in the response.

## 4. Implementation Steps

### Phase 1: Verification (Diagnosis)
- [ ] **Backend Check**: Verify `server/routes/loans.js` `GET /:id` includes `payments: { include: { transactions: true } }`.
- [ ] **Frontend Check**: Verify `LoanDetail.jsx` receives and renders `transactions`.
- [ ] **Data Check**: Ensure "Partial" payments actually have linked `PaymentTransaction` records in the database.

### Phase 2: Fix / Enhancement
- [ ] **Force Visibility**: If the arrow is hidden because `transactions` is empty but status is "Partial" (data inconsistency), show the arrow anyway or fix the data.
- [ ] **UI Polish**: Ensure the expanded table clearly shows Date, Time (HH:mm), and Amount as requested.
- [ ] **Refinement**: Ensure the "Arrow Down" is obvious and intuitive.

### Phase 3: Validation
- [ ] Create a loan with a partial payment.
- [ ] Navigate to Loan Detail.
- [ ] Verify arrow appears.
- [ ] Click arrow and verify list of transactions (Date + Time).

## 5. Agent Assignments
- **Backend Specialist**: Verify Prisma queries.
- **Frontend Specialist**: Polish `LoanDetail` UI.
