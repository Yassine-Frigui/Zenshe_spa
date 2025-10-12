# Multi-Service Reservation System Implementation Plan

## Overview
Migrate from single-service per reservation to multi-service bookings using the existing `reservation_items` table.

---

## Architecture Decision: reservations vs reservation_items

### ✅ `reservations` table remains the MASTER RECORD
**Purpose:** Store the booking session/appointment information

**Fields to KEEP:**
- `id` - Primary key
- `client_id` - Who is booking
- `date_reservation` - When
- `heure_debut`, `heure_fin` - Time slot
- `statut` - Status (en_attente, confirmee, etc.)
- `reservation_status` - Booking status (draft, reserved, etc.)
- `prix_final` - **TOTAL** of all services
- `client_nom`, `client_prenom`, `client_telephone`, `client_email` - Client info
- `session_id` - Session tracking
- `notes_client` - Notes
- `referral_code_id` - Referral tracking
- `jotform_submission_id` - Form submission tracking
- `date_creation`, `date_modification` - Audit fields

**Fields to DEPRECATE (but keep for backward compatibility):**
- `service_id` - ⚠️ Make NULLABLE (legacy single-service mode)
- `prix_service` - ⚠️ Deprecated (use prix_final)
- `has_healing_addon` - ⚠️ Deprecated (use reservation_items)
- `addon_price` - ⚠️ Deprecated (calculate from reservation_items)
- `addon_service_ids` - ⚠️ Deprecated (use reservation_items)

**NEW Field to ADD:**
- `uses_items_table` - TINYINT(1) - Flag: 1 = new system, 0 = legacy

---

### ✅ `reservation_items` table stores LINE ITEMS
**Purpose:** Store each individual service in the booking

**Structure:**
```sql
CREATE TABLE reservation_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reservation_id INT NOT NULL,        -- FK to reservations
  service_id INT NOT NULL,            -- FK to services
  item_type ENUM('main','addon'),     -- Type of service
  prix DECIMAL(10,2) NOT NULL,        -- Price for THIS item
  notes TEXT NULL                     -- Optional notes for this service
);
```

**Example Data:**
```
Reservation #123 - Client: Marie Dupont - Date: 2025-10-15 10:00
├── Item 1: V-Steam (10 min) - main - 40 TND
├── Item 2: Healing Add-On - addon - 30 TND
└── Item 3: Eye Massage (10 min) - main - 25 TND
Total: 95 TND
```

---

## Migration Strategy

### Phase 1: Database Migration ✅
**File:** `backend/database/migrate-to-multi-service.sql`

**Steps:**
1. ✅ Migrate existing reservations to `reservation_items`
2. ✅ Add `uses_items_table` flag to `reservations`
3. ✅ Create backward-compatible view
4. ✅ Create helper functions

**Run:**
```bash
mysql -u root -p -P 4306 < backend/database/migrate-to-multi-service.sql
```

---

### Phase 2: Backend API Updates

#### 2.1 Update ReservationModel.js

**Current:** Creates reservation with single `service_id`
**New:** Create reservation + multiple items

```javascript
// backend/src/models/Reservation.js

static async createReservation(reservationData) {
  const {
    client_id,
    services = [], // NEW: Array of {service_id, item_type, prix}
    date_reservation,
    heure_debut,
    heure_fin,
    notes_client,
    prix_final, // Total of all services
    // ... other fields
  } = reservationData;

  const queries = [];
  
  // 1. Insert main reservation
  const reservationQuery = `
    INSERT INTO reservations 
    (client_id, date_reservation, heure_debut, heure_fin, 
     statut, reservation_status, prix_final, notes_client,
     uses_items_table, ...)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ...)
  `;
  
  queries.push({
    query: reservationQuery,
    params: [client_id, date_reservation, heure_debut, heure_fin, 
             'en_attente', 'reserved', prix_final, notes_client, ...]
  });

  // 2. Execute transaction
  const results = await executeTransaction(queries);
  const reservationId = results[0].insertId;

  // 3. Insert reservation items
  if (services && services.length > 0) {
    const itemQueries = services.map(service => ({
      query: `INSERT INTO reservation_items 
              (reservation_id, service_id, item_type, prix, notes) 
              VALUES (?, ?, ?, ?, ?)`,
      params: [
        reservationId, 
        service.service_id, 
        service.item_type || 'main', 
        service.prix,
        service.notes || null
      ]
    }));
    
    await executeTransaction(itemQueries);
  }

  return reservationId;
}

// NEW: Get reservation with all items
static async getReservationWithItems(reservationId) {
  const reservation = await executeQuery(`
    SELECT * FROM reservations WHERE id = ?
  `, [reservationId]);

  if (!reservation.length) return null;

  const items = await executeQuery(`
    SELECT 
      ri.*,
      s.nom as service_nom,
      s.duree as service_duree,
      c.nom as categorie_nom
    FROM reservation_items ri
    JOIN services s ON ri.service_id = s.id
    LEFT JOIN categories_services c ON s.categorie_id = c.id
    WHERE ri.reservation_id = ?
    ORDER BY ri.item_type, ri.id
  `, [reservationId]);

  return {
    ...reservation[0],
    items: items
  };
}
```

#### 2.2 Update Booking Routes

**backend/src/routes/reservations.js:**

```javascript
// POST /api/reservations - Create new reservation
router.post('/', async (req, res) => {
  try {
    const {
      services, // NEW: Array of services
      date_reservation,
      heure_reservation,
      notes_client,
      // ... other fields
    } = req.body;

    // Calculate total price
    const prix_final = services.reduce((sum, s) => sum + parseFloat(s.prix), 0);

    // Calculate time slot based on all services
    const totalDuration = await calculateTotalDuration(services);
    const heure_fin = calculateEndTime(heure_reservation, totalDuration);

    const reservationId = await ReservationModel.createReservation({
      services, // Pass array of services
      date_reservation,
      heure_debut: heure_reservation,
      heure_fin,
      prix_final,
      notes_client,
      uses_items_table: 1,
      // ... other fields
    });

    const reservation = await ReservationModel.getReservationWithItems(reservationId);

    res.json({
      success: true,
      reservation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate total duration
async function calculateTotalDuration(services) {
  let totalMinutes = 0;
  
  for (const service of services) {
    const serviceData = await executeQuery(
      'SELECT duree FROM services WHERE id = ?',
      [service.service_id]
    );
    if (serviceData.length) {
      totalMinutes += serviceData[0].duree;
    }
  }
  
  return totalMinutes;
}
```

---

### Phase 3: Frontend Updates

#### 3.1 Update BookingPage.jsx State

**Current:** Single service selection
**New:** Multiple service selection

```jsx
// frontend/src/pages/client/BookingPage.jsx

const BookingPage = () => {
  // OLD: const [selectedService, setSelectedService] = useState('');
  
  // NEW: Multiple services
  const [selectedServices, setSelectedServices] = useState([]);
  // Array of: {id, nom, prix, duree, item_type}

  // Add service to cart
  const handleAddService = (service) => {
    // Check if already added
    if (selectedServices.find(s => s.id === service.id)) {
      // Already in cart - remove it
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    } else {
      // Add to cart
      setSelectedServices(prev => [...prev, {
        id: service.id,
        nom: service.nom,
        prix: service.prix,
        duree: service.duree,
        item_type: 'main'
      }]);
    }
  };

  // Add addon
  const handleAddAddon = (addon) => {
    setSelectedServices(prev => [...prev, {
      id: addon.id,
      nom: addon.nom,
      prix: addon.prix,
      duree: addon.duree,
      item_type: 'addon'
    }]);
  };

  // Remove service
  const handleRemoveService = (serviceId) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  // Calculate totals
  const totalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.prix), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + parseInt(s.duree), 0);

  return (
    <div>
      {/* Service Selection with Checkboxes */}
      <ServiceSelector 
        services={services}
        selectedServices={selectedServices}
        onToggleService={handleAddService}
      />

      {/* Cart Summary */}
      <CartSummary 
        selectedServices={selectedServices}
        totalPrice={totalPrice}
        totalDuration={totalDuration}
        onRemoveService={handleRemoveService}
      />

      {/* Booking Form */}
      <BookingForm 
        services={selectedServices}
        totalPrice={totalPrice}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
```

#### 3.2 Create CartSummary Component

```jsx
// frontend/src/components/booking/CartSummary.jsx

const CartSummary = ({ selectedServices, totalPrice, totalDuration, onRemoveService }) => {
  if (selectedServices.length === 0) {
    return (
      <div className="cart-empty">
        <FaShoppingCart />
        <p>No services selected</p>
      </div>
    );
  }

  return (
    <Card className="cart-summary">
      <Card.Header>
        <FaShoppingCart className="me-2" />
        Selected Services ({selectedServices.length})
      </Card.Header>
      <Card.Body>
        <ListGroup variant="flush">
          {selectedServices.map((service, index) => (
            <ListGroup.Item key={`${service.id}-${index}`} className="d-flex justify-content-between">
              <div>
                <strong>{service.nom}</strong>
                <Badge bg={service.item_type === 'addon' ? 'info' : 'success'} className="ms-2">
                  {service.item_type}
                </Badge>
                <div className="text-muted small">
                  <FaClock className="me-1" />
                  {service.duree} min
                </div>
              </div>
              <div className="d-flex align-items-center">
                <span className="fw-bold me-3">{service.prix} TND</span>
                <Button 
                  size="sm" 
                  variant="outline-danger"
                  onClick={() => onRemoveService(service.id)}
                >
                  <FaTrash />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        
        <div className="cart-totals mt-3 pt-3 border-top">
          <div className="d-flex justify-content-between mb-2">
            <span>Total Duration:</span>
            <strong>{totalDuration} minutes</strong>
          </div>
          <div className="d-flex justify-content-between">
            <span className="h5">Total Price:</span>
            <strong className="h5 text-green">{totalPrice.toFixed(2)} TND</strong>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
```

#### 3.3 Update Service Selection UI

```jsx
// Show services with checkboxes instead of radio buttons

{servicesByCategory.map((category) => (
  <div key={category.id} className="mb-4">
    <h5>{category.nom}</h5>
    <div className="row">
      {category.services.map((service) => {
        const isSelected = selectedServices.some(s => s.id === service.id);
        
        return (
          <div key={service.id} className="col-md-6 mb-3">
            <Card 
              className={`service-card ${isSelected ? 'selected border-green' : ''}`}
              onClick={() => handleAddService(service)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <Form.Check 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Controlled by card click
                        className="me-2"
                      />
                      <h6 className="mb-0">{service.nom}</h6>
                    </div>
                    <p className="text-muted small mb-2">{service.description}</p>
                    <div className="d-flex gap-3">
                      <small>
                        <FaClock className="me-1" />
                        {service.duree} min
                      </small>
                      <small className="fw-bold text-green">
                        {service.prix} TND
                      </small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        );
      })}
    </div>
  </div>
))}
```

#### 3.4 Update Form Submission

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  if (selectedServices.length === 0) {
    toast.error('Please select at least one service');
    return;
  }

  try {
    setLoading(true);

    // Prepare services data
    const services = selectedServices.map(s => ({
      service_id: s.id,
      item_type: s.item_type,
      prix: s.prix,
      notes: null
    }));

    const reservationData = {
      services, // Array of services
      date_reservation: formData.date_reservation,
      heure_reservation: formData.heure_reservation,
      notes_client: formData.notes_client,
      client_nom: formData.nom,
      client_prenom: formData.prenom,
      client_email: formData.email,
      client_telephone: formData.telephone,
    };

    const response = await publicAPI.createReservation(reservationData);

    if (response.data.success) {
      toast.success('Reservation created successfully!');
      navigate(`/confirmation/${response.data.reservation.id}`);
    }
  } catch (error) {
    toast.error('Error creating reservation');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

---

## Implementation Checklist

### Database ✅
- [ ] Run migration script: `migrate-to-multi-service.sql`
- [ ] Verify existing reservations migrated to `reservation_items`
- [ ] Test helper functions and views

### Backend
- [ ] Update `Reservation.js` model
  - [ ] `createReservation()` - Accept services array
  - [ ] `getReservationWithItems()` - New method
  - [ ] `updateReservation()` - Support items
- [ ] Update `reservations.js` routes
  - [ ] POST `/api/reservations` - Accept services array
  - [ ] GET `/api/reservations/:id` - Return with items
  - [ ] Calculate total duration helper
- [ ] Update public routes
  - [ ] POST `/api/public/reservations` - Multi-service support
- [ ] Test API endpoints

### Frontend
- [ ] Update `BookingPage.jsx`
  - [ ] Change from single to multiple selection
  - [ ] Add cart state management
  - [ ] Calculate totals (price + duration)
- [ ] Create `CartSummary` component
- [ ] Update service selection UI (checkboxes)
- [ ] Update form submission
- [ ] Update confirmation page to show all services
- [ ] Test booking flow end-to-end

### Admin Panel
- [ ] Update reservations table to show service count
- [ ] Update reservation details to show all items
- [ ] Update edit reservation form

### Testing
- [ ] Test single-service booking (backward compatible)
- [ ] Test multi-service booking
- [ ] Test addon handling
- [ ] Test price calculations
- [ ] Test duration calculations
- [ ] Test legacy reservations still work

---

## Backward Compatibility

The system will support BOTH modes:
1. **Legacy Mode**: `service_id` populated, `uses_items_table = 0`
2. **New Mode**: `service_id` NULL, `uses_items_table = 1`, services in `reservation_items`

This allows gradual migration without breaking existing functionality.

---

## Benefits

✅ **Multiple services per booking** - Users can book V-Steam + Massage + Eye Treatment in one reservation
✅ **Flexible add-ons** - Any service can be added as main or addon
✅ **Accurate pricing** - Each item has its own price
✅ **Better analytics** - Track which services are booked together
✅ **Scalable** - Easy to add package deals, combos, etc.
✅ **Backward compatible** - Old reservations still work

---

## Next Steps

1. **Review this plan** - Confirm architecture decisions
2. **Run database migration** - Execute SQL script
3. **Update backend** - Implement API changes
4. **Update frontend** - Build multi-service UI
5. **Test thoroughly** - All booking scenarios
6. **Deploy** - Gradual rollout with feature flag

Would you like me to proceed with any specific phase?
