# Membership Scheduling Feature - Table Alter Approach

## Overview
Implemented a "Schedule Membership" feature that allows logged-in clients to pre-select a membership plan before visiting the spa. The membership remains in "pending" status until an admin manually activates it at the spa.

## User Flow

```
┌────────────────────────────────────────────────────┐
│  CLIENT (Logged in, no active membership)         │
│  ↓                                                  │
│  1. Visits Booking Page → Memberships Tab         │
│  2. Sees "Schedule Membership" form                │
│  3. Selects membership type & duration             │
│  4. Clicks "Planifier cet abonnement"             │
│  5. Receives confirmation message                  │
│                                                    │
│  CLIENT visits spa                                 │
│  ↓                                                  │
│  ADMIN sees pending membership in dashboard        │
│  ↓                                                  │
│  ADMIN activates membership + processes payment    │
│  ↓                                                  │
│  CLIENT can now book with membership               │
└────────────────────────────────────────────────────┘
```

## Database Changes

### Altered Table: `client_memberships`

**File**: `zenshe_db_flow/update 7.sql`

Added new columns to existing `client_memberships` table:
- `date_activated` DATETIME NULL - When admin activated the scheduled membership
- `date_cancelled` DATETIME NULL - When membership was cancelled
- `activated_by` INT(11) NULL - Admin user ID who activated the membership

**Existing columns used:**
- `statut` ENUM - Uses 'pending' for scheduled, 'active' for activated, 'cancelled' for cancelled
- `duree_engagement` - Duration in months (1 or 3)
- `montant_paye` - Expected amount (conceptually "montant_prevu" for pending)
- `date_creation` - When membership was scheduled
- `notes` - Admin notes

### Updated Stored Procedure: `sp_purchase_membership`

Enhanced to handle both immediate and scheduled memberships:
- `p_is_scheduled` BOOLEAN parameter to distinguish between immediate purchase and scheduling
- For scheduled memberships: Creates record with 'pending' status
- For immediate purchases: Creates record with 'active' status

### New Stored Procedure: `sp_activate_scheduled_membership`

Handles activation process:
1. Validates scheduled membership exists and is pending
2. Checks client doesn't already have active membership
3. Updates dates and status to 'active'
4. Records which admin activated it

### View: `v_pending_scheduled_memberships`

Admin-friendly view showing all pending memberships with client details.

## Frontend Implementation

### BookingPage.jsx Changes

#### New State Variables
```javascript
const [availableMemberships, setAvailableMemberships] = useState([]);
const [selectedMembershipPlan, setSelectedMembershipPlan] = useState('');
const [selectedDuration, setSelectedDuration] = useState(1);
const [showScheduleSuccess, setShowScheduleSuccess] = useState(false);
const [schedulingMembership, setSchedulingMembership] = useState(false);
```

#### New Functions
```javascript
// Fetch available membership plans
const fetchMemberships = async () => { ... }

// Handle schedule membership submission
const handleScheduleMembership = async () => {
    // Validates selection
    // Calls API to save scheduled membership
    // Shows success message
    // Auto-hides after 5 seconds
}
```

#### Enhanced UI (Membership Tab - Logged In Users Without Membership)

**Before** (Simple alert):
```
⚠️ You need a membership
- View memberships
- Visit spa
[Buttons]
```

**After** (Interactive scheduling form):
```
⚠️ You don't have an active membership
But you can pre-select one now!

┌─ Planifier un abonnement ──────────────┐
│                                         │
│  [Select membership type dropdown]     │
│  [Select duration: 1 or 3 months]      │
│  [Planifier cet abonnement button]     │
│                                         │
│  Price updates dynamically based on    │
│  selection (1 month vs 3 months)       │
└─────────────────────────────────────────┘

✅ Success message appears after scheduling
```

## Backend Implementation

### New API Endpoints

**File**: `backend/src/routes/clientMemberships.js`

#### 1. POST `/api/client/memberships/schedule`
**Purpose**: Client schedules a membership  
**Auth**: Required (authenticateClient)  
**Request Body**:
```json
{
  "membership_id": 2,
  "duree_mois": 3
}
```

**Validation**:
- Checks if client already has pending scheduled membership
- Checks if client already has active membership
- Validates membership exists and is active
- Validates duration (1 or 3 months only)

**Response** (Success):
```json
{
  "success": true,
  "message": "Abonnement planifié avec succès...",
  "data": {
    "id": 15,
    "membership_nom": "GOLD",
    "duree_mois": 3,
    "montant_prevu": 550.00
  }
}
```

#### 2. GET `/api/client/memberships/pending`
**Purpose**: Get client's pending scheduled membership  
**Auth**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "client_id": 12,
    "membership_id": 2,
    "membership_nom": "GOLD",
    "services_par_mois": 5,
    "duree_mois": 3,
    "montant_prevu": 550.00,
    "statut": "pending",
    "date_scheduled": "2025-10-11T10:30:00"
  },
  "hasPending": true
}
```

#### 3. DELETE `/api/client/memberships/scheduled/:id`
**Purpose**: Cancel a scheduled membership (before activation)  
**Auth**: Required  
**Validation**: Verifies ownership and pending status  
**Response**:
```json
{
  "success": true,
  "message": "Abonnement planifié annulé avec succès"
}
```

### Frontend API Methods

**File**: `frontend/src/services/api.js`

```javascript
clientAPI: {
  // ... existing methods
  
  // Schedule Membership (pre-select before visiting spa)
  scheduleMembership: (data) => axios.post('/api/client/memberships/schedule', data),
  getPendingMembership: () => axios.get('/api/client/memberships/pending'),
  cancelScheduledMembership: (id) => axios.delete(`/api/client/memberships/scheduled/${id}`),
}
```

## Admin Dashboard Enhancement (TODO)

### Pending Memberships Section

Add to AdminMemberships.jsx dashboard:

```javascript
// Show pending scheduled memberships at top
<Card className="mb-4">
  <Card.Header>
    <h5>Abonnements en attente d'activation</h5>
  </Card.Header>
  <Card.Body>
    <Table>
      <thead>
        <tr>
          <th>Client</th>
          <th>Abonnement</th>
          <th>Durée</th>
          <th>Montant</th>
          <th>Date planifiée</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {pendingScheduled.map(scheduled => (
          <tr key={scheduled.id}>
            <td>{scheduled.client_prenom} {scheduled.client_nom}</td>
            <td>{scheduled.membership_nom}</td>
            <td>{scheduled.duree_mois} mois</td>
            <td>{scheduled.montant_prevu}€</td>
            <td>{formatDate(scheduled.date_scheduled)}</td>
            <td>
              <Button onClick={() => handleActivate(scheduled.id)}>
                Activer
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </Card.Body>
</Card>
```

### Admin API Methods Needed

```javascript
adminAPI: {
  // ... existing methods
  
  // Scheduled Memberships Management
  getPendingScheduledMemberships: () => axios.get('/api/admin/scheduled-memberships/pending'),
  activateScheduledMembership: (id, data) => 
    axios.post(`/api/admin/scheduled-memberships/${id}/activate`, data),
  cancelScheduledMembership: (id, reason) => 
    axios.delete(`/api/admin/scheduled-memberships/${id}`, { data: { reason } }),
}
```

### Backend Admin Routes Needed

**File**: `backend/src/routes/adminClientMemberships.js` (add these)

```javascript
// GET /api/admin/scheduled-memberships/pending
router.get('/scheduled-memberships/pending', authenticateAdmin, async (req, res) => {
  // Query v_pending_scheduled_memberships view
  // Return list of pending scheduled memberships
});

// POST /api/admin/scheduled-memberships/:id/activate
router.post('/scheduled-memberships/:id/activate', authenticateAdmin, async (req, res) => {
  // Call sp_activate_scheduled_membership stored procedure
  // Pass admin_id and methode_paiement
  // Return success message
});

// DELETE /api/admin/scheduled-memberships/:id
router.delete('/scheduled-memberships/:id', authenticateAdmin, async (req, res) => {
  // Update status to 'cancelled'
  // Add admin notes if provided
  // Return success message
});
```

## Testing Checklist

### Database Setup
- [ ] Run `update 7.sql` migration (alters existing client_memberships table)
- [ ] Verify new columns added: date_activated, date_cancelled, activated_by
- [ ] Verify stored procedures updated/created
- [ ] Verify view created
- [ ] Test sample data inserted

### Frontend Testing

**Test 1: Non-logged user**
1. Navigate to `/booking`
2. Click "Abonnement" tab
3. Should see alert with login button
4. Should NOT see scheduling form

**Test 2: Logged user without membership - Schedule**
1. Login as user without active membership
2. Navigate to `/booking` → Abonnement tab
3. Should see scheduling form
4. Select membership type (e.g., GOLD)
5. Select duration (1 or 3 months)
6. Verify price updates correctly
7. Click "Planifier cet abonnement"
8. Should see success message ✅
9. Try scheduling again
10. Should see error: "already has pending scheduled membership"

**Test 3: Logged user with active membership**
1. Login as user with active membership
2. Navigate to `/booking` → Abonnement tab
3. Should see simplified booking form
4. Should NOT see scheduling form (already has membership)

**Test 4: Cancel scheduled membership**
1. After scheduling a membership
2. Call API: `DELETE /api/client/memberships/scheduled/:id`
3. Should cancel successfully
4. Should be able to schedule again

### Backend Testing

**Test API Endpoints:**

```bash
# Schedule membership
POST http://localhost:5000/api/client/memberships/schedule
Authorization: Bearer {clientToken}
Content-Type: application/json

{
  "membership_id": 2,
  "duree_mois": 3
}

# Get pending
GET http://localhost:5000/api/client/memberships/pending
Authorization: Bearer {clientToken}

# Cancel scheduled
DELETE http://localhost:5000/api/client/memberships/scheduled/1
Authorization: Bearer {clientToken}
```

### Admin Testing (After implementing admin routes)
1. Login as admin
2. Navigate to memberships dashboard
3. Should see "Pending Scheduled Memberships" section
4. Select a pending membership
5. Click "Activate"
6. Enter payment method
7. Submit
8. Should activate membership
9. Client should now have active membership
10. Scheduled membership status should be 'activated'

## Edge Cases Handled

1. **Client already has pending scheduled membership**
   - Error: "Vous avez déjà un abonnement planifié en attente"
   - Solution: Must visit spa to activate or cancel first

2. **Client already has active membership**
   - Error: "Vous avez déjà un abonnement actif"
   - Solution: Cannot schedule while active membership exists

3. **Invalid duration**
   - Error: "La durée doit être 1 ou 3 mois"
   - Solution: Only 1 or 3 months allowed

4. **Membership doesn't exist or inactive**
   - Error: "Abonnement non trouvé ou inactif"
   - Solution: Select valid active membership

5. **Not logged in**
   - Form not shown
   - Shows login prompt instead

## Security Considerations

1. **Authentication**: All scheduling routes require `authenticateClient` middleware
2. **Ownership verification**: Clients can only cancel their own scheduled memberships
3. **Status validation**: Can only cancel pending (not activated/cancelled)
4. **SQL injection prevention**: Using parameterized queries
5. **Admin-only activation**: Only admins can activate scheduled memberships

## Price Calculation

```javascript
// Frontend
const selectedMembership = availableMemberships.find(m => m.id == selectedMembershipPlan);
const price = selectedDuration === 1 
  ? selectedMembership?.prix_mensuel 
  : selectedMembership?.prix_3_mois;

// Backend (same logic)
const montant_prevu = duration === 1 
  ? membershipData.prix_mensuel 
  : membershipData.prix_3_mois;
```

## Files Modified/Created

### Created
1. ✅ `zenshe_db_flow/update 7.sql` (233 lines)
   - Alters existing client_memberships table with new columns
   - Updates stored procedures for scheduled memberships
   - Creates view for admin dashboard

### Modified
2. ✅ `frontend/src/pages/client/BookingPage.jsx`
   - Added 5 new state variables
   - Added `fetchMemberships()` function
   - Added `handleScheduleMembership()` function
   - Enhanced membership tab UI with scheduling form
   - Added success message display

3. ✅ `frontend/src/services/api.js`
   - Added 3 new clientAPI methods
   - Added 3 new adminAPI methods for scheduled memberships

4. ✅ `backend/src/routes/clientMemberships.js`
   - Updated POST `/schedule` endpoint to use client_memberships table
   - Updated GET `/pending` endpoint to query client_memberships
   - Updated DELETE `/scheduled/:id` endpoint to use client_memberships

5. ✅ `backend/src/routes/adminClientMemberships.js`
   - Added GET `/scheduled/pending` endpoint
   - Added POST `/scheduled/:id/activate` endpoint
   - Added DELETE `/scheduled/:id` endpoint

### To Be Created (Admin Dashboard UI)
6. ⏳ Admin UI section in AdminMemberships.jsx for pending scheduled memberships

## Summary

### ✅ Completed
- Database schema for scheduled memberships
- Stored procedure for activation
- Client-facing scheduling UI in booking page
- Backend API for scheduling/viewing/cancelling
- Frontend integration with real-time price updates
- Success/error handling
- Edge case validation

### ⏳ Pending
- Admin dashboard UI for viewing pending scheduled memberships
- Admin backend routes for activating scheduled memberships
- Admin ability to add notes when activating
- Email notifications (optional)

### 🎯 Next Steps
1. Run database migration: `update 7.sql` (alters client_memberships table)
2. Test client scheduling flow
3. Add admin UI to AdminMemberships.jsx to display pending scheduled memberships
4. Test full flow: Schedule → Admin activate → Client can book

---

**Status**: Client-side scheduling complete ✅ | Admin activation pending ⏳
