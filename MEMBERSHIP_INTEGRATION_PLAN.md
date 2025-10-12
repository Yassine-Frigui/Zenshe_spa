# Membership Integration Plan

## Current State Analysis

### What Exists
✅ **Backend Infrastructure:**
- `backend/src/models/Membership.js` - Complete CRUD operations
- `backend/src/routes/memberships.js` - Admin routes for managing memberships
- `backend/src/services/MultilingualService.js` - `getMembershipsWithTranslations()`
- Database tables: `memberships`, `memberships_translations`
- Public API endpoint: `/api/public/services/memberships/list`

✅ **Frontend API:**
- `frontend/src/services/api.js` - `publicAPI.getMemberships()` method

❌ **What's Missing:**
- No client-membership relationship table (e.g., `client_memberships`)
- No membership purchase/subscription flow
- No membership status tracking (active, expired, cancelled)
- No frontend UI for memberships (display, purchase, manage)
- No integration with booking flow
- No check for active membership in booking process

---

## Implementation Plan

### Phase 1: Database Schema Enhancement

#### 1.1 Create Client Memberships Table
```sql
-- backend/database/client_memberships.sql
CREATE TABLE IF NOT EXISTS client_memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    membership_id INT NOT NULL,
    
    -- Subscription details
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'active',
    
    -- Usage tracking
    services_utilises INT DEFAULT 0,
    services_restants INT NOT NULL,
    
    -- Payment info
    montant_paye DECIMAL(10,2) NOT NULL,
    mode_paiement ENUM('cash', 'card', 'bank_transfer', 'online') NOT NULL,
    
    -- Metadata
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE RESTRICT,
    
    INDEX idx_client_status (client_id, statut),
    INDEX idx_expiration (date_fin, statut)
);
```

#### 1.2 Add Membership Column to Reservations
```sql
-- backend/database/add_membership_to_reservations.sql
ALTER TABLE reservations 
ADD COLUMN client_membership_id INT NULL,
ADD COLUMN uses_membership BOOLEAN DEFAULT FALSE,
ADD FOREIGN KEY (client_membership_id) REFERENCES client_memberships(id) ON DELETE SET NULL;
```

---

### Phase 2: Backend Models & Services

#### 2.1 Create ClientMembership Model
```javascript
// backend/src/models/ClientMembership.js
class ClientMembershipModel {
    // Get active membership for a client
    static async getActiveClientMembership(clientId) {
        const query = `
            SELECT 
                cm.*,
                m.nom as membership_nom,
                m.services_par_mois
            FROM client_memberships cm
            JOIN memberships m ON cm.membership_id = m.id
            WHERE cm.client_id = ?
                AND cm.statut = 'active'
                AND cm.date_fin >= CURDATE()
                AND cm.services_restants > 0
            ORDER BY cm.date_fin DESC
            LIMIT 1
        `;
        const result = await executeQuery(query, [clientId]);
        return result[0] || null;
    }

    // Purchase/subscribe to membership
    static async purchaseMembership(clientId, membershipId, paymentData) {
        // Calculate end date based on membership type
        const membership = await MembershipModel.getMembershipById(membershipId);
        
        const query = `
            INSERT INTO client_memberships 
            (client_id, membership_id, date_debut, date_fin, services_restants, montant_paye, mode_paiement)
            VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), ?, ?, ?)
        `;
        
        const result = await executeQuery(query, [
            clientId,
            membershipId,
            membership.services_par_mois,
            paymentData.montant,
            paymentData.mode_paiement
        ]);
        
        return result.insertId;
    }

    // Use membership for a reservation
    static async useMembershipService(clientMembershipId) {
        const query = `
            UPDATE client_memberships 
            SET services_utilises = services_utilises + 1,
                services_restants = services_restants - 1
            WHERE id = ?
        `;
        return await executeQuery(query, [clientMembershipId]);
    }

    // Get client membership history
    static async getClientMembershipHistory(clientId) {
        const query = `
            SELECT 
                cm.*,
                m.nom as membership_nom,
                m.prix_mensuel
            FROM client_memberships cm
            JOIN memberships m ON cm.membership_id = m.id
            WHERE cm.client_id = ?
            ORDER BY cm.date_creation DESC
        `;
        return await executeQuery(query, [clientId]);
    }
}
```

#### 2.2 Update Reservation Model
```javascript
// backend/src/models/Reservation.js - Add method
static async createReservationWithMembership(reservationData, clientMembershipId) {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        // Create reservation
        const reservationId = await this.createReservation({
            ...reservationData,
            client_membership_id: clientMembershipId,
            uses_membership: true
        });

        // Decrement membership services
        await ClientMembershipModel.useMembershipService(clientMembershipId);

        await connection.commit();
        return reservationId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
```

---

### Phase 3: Backend Routes

#### 3.1 Client Membership Routes
```javascript
// backend/src/routes/clientMemberships.js
const express = require('express');
const ClientMembershipModel = require('../models/ClientMembership');
const { authenticateClient } = require('../middleware/auth');
const router = express.Router();

// All routes require client authentication
router.use(authenticateClient);

// Get client's active membership
router.get('/active', async (req, res) => {
    try {
        const membership = await ClientMembershipModel.getActiveClientMembership(req.client.id);
        res.json({
            success: true,
            data: membership,
            hasActiveMembership: !!membership
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get membership history
router.get('/history', async (req, res) => {
    try {
        const history = await ClientMembershipModel.getClientMembershipHistory(req.client.id);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Purchase membership
router.post('/purchase', async (req, res) => {
    try {
        const { membershipId, paymentData } = req.body;
        const clientMembershipId = await ClientMembershipModel.purchaseMembership(
            req.client.id,
            membershipId,
            paymentData
        );
        res.status(201).json({
            success: true,
            message: 'Abonnement activé avec succès',
            clientMembershipId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
```

#### 3.2 Update Reservation Routes
```javascript
// backend/src/routes/reservations.js - Add logic
router.post('/', async (req, res) => {
    try {
        // Check if client has active membership (if logged in)
        let clientMembershipId = null;
        if (req.client && req.body.useMembership) {
            const membership = await ClientMembershipModel.getActiveClientMembership(req.client.id);
            if (membership && membership.services_restants > 0) {
                clientMembershipId = membership.id;
            }
        }

        // Create reservation
        const reservationId = clientMembershipId
            ? await ReservationModel.createReservationWithMembership(req.body, clientMembershipId)
            : await ReservationModel.createReservation(req.body);

        res.status(201).json({ success: true, reservationId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
```

---

### Phase 4: Frontend Implementation

#### 4.1 Update API Service
```javascript
// frontend/src/services/api.js - Add to clientAPI
clientAPI: {
    // ... existing methods
    
    // Membership methods
    getActiveMembership: () => axios.get('/api/client/memberships/active'),
    getMembershipHistory: () => axios.get('/api/client/memberships/history'),
    purchaseMembership: (data) => axios.post('/api/client/memberships/purchase', data),
}
```

#### 4.2 Create Membership Context
```jsx
// frontend/src/contexts/MembershipContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { clientAPI } from '../services/api';
import { useAuth } from './AuthContext';

const MembershipContext = createContext();

export const useMembership = () => useContext(MembershipContext);

export const MembershipProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [activeMembership, setActiveMembership] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchActiveMembership();
        } else {
            setActiveMembership(null);
        }
    }, [isAuthenticated]);

    const fetchActiveMembership = async () => {
        try {
            setLoading(true);
            const response = await clientAPI.getActiveMembership();
            setActiveMembership(response.data.data);
        } catch (error) {
            console.error('Error fetching membership:', error);
            setActiveMembership(null);
        } finally {
            setLoading(false);
        }
    };

    const hasActiveMembership = () => {
        return activeMembership && activeMembership.services_restants > 0;
    };

    return (
        <MembershipContext.Provider value={{
            activeMembership,
            hasActiveMembership,
            loading,
            refreshMembership: fetchActiveMembership
        }}>
            {children}
        </MembershipContext.Provider>
    );
};
```

#### 4.3 Update BookingPage
```jsx
// frontend/src/pages/client/BookingPage.jsx - Key changes
import { useMembership } from '../../contexts/MembershipContext';
import { useAuth } from '../../contexts/AuthContext';

const BookingPage = () => {
    const { isAuthenticated } = useAuth();
    const { activeMembership, hasActiveMembership } = useMembership();
    const [useMembershipForBooking, setUseMembershipForBooking] = useState(false);

    // Show membership option if logged in and has active membership
    const canUseMembership = isAuthenticated && hasActiveMembership();

    return (
        <div className="booking-page">
            {/* Show membership banner if available */}
            {canUseMembership && (
                <motion.div className="alert alert-success mb-4">
                    <h5>🎉 Vous avez un abonnement actif!</h5>
                    <p>
                        Abonnement: <strong>{activeMembership.membership_nom}</strong><br/>
                        Services restants: <strong>{activeMembership.services_restants}</strong>
                    </p>
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="useMembership"
                            checked={useMembershipForBooking}
                            onChange={(e) => setUseMembershipForBooking(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="useMembership">
                            Utiliser mon abonnement pour cette réservation (pas besoin de sélectionner un service ni de remplir le formulaire de décharge)
                        </label>
                    </div>
                </motion.div>
            )}

            {/* Hide service selection if using membership */}
            {!useMembershipForBooking && (
                <div className="service-selection">
                    {/* Existing service selection UI */}
                </div>
            )}

            {/* Hide JotForm if using membership */}
            {!useMembershipForBooking && (
                <div className="jotform-section">
                    {/* Existing JotForm */}
                </div>
            )}

            {/* Simplified form for membership bookings */}
            {useMembershipForBooking && (
                <div className="membership-booking-form">
                    <h5>Réservation avec votre abonnement</h5>
                    <p className="text-muted">
                        Sélectionnez simplement votre créneau horaire. Les informations de votre compte seront utilisées automatiquement.
                    </p>
                    {/* Only show date/time picker */}
                </div>
            )}
        </div>
    );
};
```

#### 4.4 Create MembershipsPage
```jsx
// frontend/src/pages/client/MembershipsPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { publicAPI, clientAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useMembership } from '../../contexts/MembershipContext';

const MembershipsPage = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const { activeMembership, refreshMembership } = useMembership();
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMemberships();
    }, []);

    const fetchMemberships = async () => {
        try {
            const response = await publicAPI.getMemberships();
            setMemberships(response.data || []);
        } catch (error) {
            console.error('Error fetching memberships:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (membershipId) => {
        if (!isAuthenticated) {
            // Redirect to login
            return;
        }

        try {
            await clientAPI.purchaseMembership({
                membershipId,
                paymentData: { /* payment details */ }
            });
            refreshMembership();
            // Show success message
        } catch (error) {
            console.error('Error purchasing membership:', error);
        }
    };

    return (
        <div className="memberships-page">
            <HeroSection title="Nos Abonnements" />
            
            {/* Active membership display */}
            {activeMembership && (
                <motion.div className="active-membership-card">
                    <h4>Votre abonnement actif</h4>
                    <p>{activeMembership.membership_nom}</p>
                    <p>Services restants: {activeMembership.services_restants}</p>
                    <p>Expire le: {new Date(activeMembership.date_fin).toLocaleDateString()}</p>
                </motion.div>
            )}

            {/* Available memberships */}
            <div className="memberships-grid">
                {memberships.map(membership => (
                    <motion.div key={membership.id} className="membership-card">
                        <h3>{membership.nom}</h3>
                        <p>{membership.description}</p>
                        <div className="price">
                            {membership.prix_mensuel} DT/mois
                        </div>
                        <ul className="avantages">
                            {membership.avantages?.split('\n').map((avantage, i) => (
                                <li key={i}>{avantage}</li>
                            ))}
                        </ul>
                        <button 
                            onClick={() => handlePurchase(membership.id)}
                            disabled={!isAuthenticated}
                        >
                            S'abonner
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MembershipsPage;
```

---

## Implementation Steps

1. **Database Setup** (30 min)
   - Run SQL scripts to create `client_memberships` table
   - Add membership columns to `reservations` table
   - Test schema with sample data

2. **Backend Models** (1 hour)
   - Create `ClientMembership.js` model
   - Update `Reservation.js` model
   - Test CRUD operations

3. **Backend Routes** (1 hour)
   - Create `/api/client/memberships/*` routes
   - Update reservation routes to handle memberships
   - Add authentication middleware
   - Test with Postman

4. **Frontend Context** (30 min)
   - Create `MembershipContext`
   - Integrate with existing `AuthContext`
   - Test state management

5. **Frontend UI** (2 hours)
   - Create `MembershipsPage`
   - Update `BookingPage` with membership logic
   - Add membership display in client dashboard
   - Style components

6. **Testing & Polish** (1 hour)
   - End-to-end testing
   - Error handling
   - Loading states
   - Success/error messages

---

## Benefits of This Approach

✅ **No JotForm for members** - Waiver already on file from initial signup  
✅ **No service selection needed** - Membership grants access to any service  
✅ **Simplified booking** - Just pick date/time  
✅ **Usage tracking** - Services remaining decrements automatically  
✅ **Revenue tracking** - Membership purchases tracked separately  
✅ **Client retention** - Incentivizes repeat visits  

---

## Next Steps

Would you like me to:
1. **Create the database migration files** first?
2. **Build the backend models and routes**?
3. **Create the frontend components**?
4. **Do a full implementation in one go**?

Let me know which approach you prefer!
