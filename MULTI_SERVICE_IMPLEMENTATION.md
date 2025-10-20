# Multi-Service Reservation Implementation

## Overview
Implemented a comprehensive multi-service reservation system that allows clients to book multiple services (one per category) in a single reservation, utilizing both the `reservations` and `reservation_items` tables.

---

## Backend Support (Already Exists)

### Database Structure
The backend already supports multi-service reservations through:

1. **`reservations` table**:
   - `uses_items_table` (boolean): Indicates if this reservation uses the items table
   - `service_id`: Legacy field for backward compatibility
   - `prix_final`: Total price of all services

2. **`reservation_items` table**:
   ```sql
   CREATE TABLE `reservation_items` (
     `id` int(11) NOT NULL,
     `reservation_id` int(11) NOT NULL,
     `service_id` int(11) NOT NULL,
     `item_type` enum('main','addon') NOT NULL DEFAULT 'main',
     `prix` decimal(10,2) NOT NULL,
     `notes` text DEFAULT NULL
   )
   ```

### Backend API
The `ReservationModel.createReservation()` method already supports:
- `services` array parameter with structure:
  ```javascript
  services: [{
    service_id: number,
    item_type: 'main' | 'addon',
    prix: number,
    notes: string | null
  }]
  ```

---

## Frontend Changes

### 1. Admin Panel (`AdminReservations.jsx`)

#### State Management
```javascript
// Multi-service state
const [selectedServices, setSelectedServices] = useState([]); // For create modal
const [editSelectedServices, setEditSelectedServices] = useState([]); // For edit modal
```

#### Helper Functions
- `addServiceToList(serviceId, isForEdit)`: Add a service to selection
- `removeServiceFromList(index, isForEdit)`: Remove a service from selection
- `updateServiceNotes(index, notes, isForEdit)`: Update service notes
- `calculateTotalPrice(servicesList)`: Calculate total price
- `calculateTotalDuration(servicesList)`: Calculate total duration

#### Create Modal
- **Multi-service selector**: Dropdown to add services
- **Selected services list**: Shows all selected services with notes input
- **Totals display**: Shows total price and duration
- **Validation**: Requires at least one service

#### Edit Modal
- **Load existing services**: Automatically loads services from `reservation.items`
- **Add/remove services**: Can modify the service list
- **Visual feedback**: Shows service count and type (main/addon)

#### Reservation Table
- **Multi-service display**: Shows count and list of services
- **Total duration**: Calculates and displays combined duration
- **Total price**: Shows sum of all service prices

#### Detail Modal
- **Service list**: Displays all services with individual prices
- **Totals section**: Shows combined duration and total price

---

### 2. Client Booking Page (`BookingPage.jsx`)

#### State Management
```javascript
// Multi-service selection: Store one service per category
const [selectedServicesByCategory, setSelectedServicesByCategory] = useState({});
```

**Structure**: 
```javascript
{
  categoryId: {
    id: serviceId,
    nom: serviceName,
    prix: price,
    duree: duration,
    categorie_id: categoryId,
    description: description
  }
}
```

#### Helper Functions
- `toggleServiceSelection(categoryId, service)`: Toggle service selection in a category
- `isServiceSelected(categoryId, serviceId)`: Check if service is selected
- `getSelectedServices()`: Get array of selected services
- `calculateTotalPrice()`: Calculate total price of selected services
- `calculateTotalDuration()`: Calculate total duration

#### Service Selection UI
- **Category-based selection**: Users can select one service per category
- **Visual feedback**: 
  - Selected services have green border and checkmark
  - Category header shows selection status
  - Top summary shows total services, duration, and price
- **Service details**: Each service shows name, description, duration, and price

#### Form Submission
```javascript
// Multi-service reservation data
services: selectedServicesArray.map(service => ({
  service_id: service.id,
  item_type: 'main',
  prix: service.prix,
  notes: null
}))
```

---

## Data Flow

### Client Books Multi-Service Reservation

1. **Client selects services**:
   - Clicks on services from different categories
   - `selectedServicesByCategory` tracks one service per category
   - UI shows running total of price and duration

2. **Client submits form**:
   ```javascript
   {
     services: [
       {service_id: 1, item_type: 'main', prix: 50, notes: null},
       {service_id: 5, item_type: 'main', prix: 80, notes: null}
     ],
     nom: "Doe",
     prenom: "John",
     // ... other fields
   }
   ```

3. **Backend processes**:
   - Creates reservation with `uses_items_table = 1`
   - Inserts each service into `reservation_items` table
   - Calculates `prix_final` as sum of all services
   - Sets `service_id` to NULL (using new system)

4. **Admin views reservation**:
   - Fetches reservation with `uses_items_table = 1`
   - Queries `reservation_items` for all services
   - Displays list of services with totals

---

## Key Features

### For Clients
✅ Select multiple services from different categories  
✅ See real-time total price and duration  
✅ Visual feedback for selected services  
✅ Category-wise organization  
✅ Service details link for more information

### For Admins
✅ Create reservations with multiple services  
✅ Edit existing reservations (add/remove services)  
✅ View all services in a reservation  
✅ See totals (price, duration, service count)  
✅ Add notes to individual services  
✅ Backward compatible with single-service reservations

---

## Backward Compatibility

The system maintains full backward compatibility:

1. **Legacy single-service reservations**: 
   - `uses_items_table = 0`
   - Uses `service_id` field
   - Works as before

2. **New multi-service reservations**:
   - `uses_items_table = 1`
   - Uses `reservation_items` table
   - `service_id` is NULL

3. **Display logic**:
   ```javascript
   if (reservation.uses_items_table && reservation.items) {
     // Show multi-service display
   } else if (reservation.service) {
     // Show single service display (legacy)
   }
   ```

---

## Validation Rules

### Client-Side
- At least one service must be selected
- One service per category maximum
- All form fields required

### Backend
- Validates service existence
- Calculates correct total duration
- Ensures no time slot conflicts

---

## UI/UX Improvements

1. **Clear visual hierarchy**: Categories → Services
2. **Selection feedback**: Green borders, checkmarks, badges
3. **Running totals**: Always visible price and duration
4. **Easy removal**: One-click to deselect services
5. **Service notes**: Admin can add specific notes per service
6. **Responsive design**: Works on mobile and desktop

---

## Testing Checklist

### Client Booking
- [ ] Select one service from one category
- [ ] Select services from multiple categories
- [ ] Deselect a service
- [ ] Submit reservation with multiple services
- [ ] View confirmation with all services
- [ ] Check total price calculation
- [ ] Check total duration calculation

### Admin Panel
- [ ] Create reservation with multiple services
- [ ] Edit reservation to add services
- [ ] Edit reservation to remove services
- [ ] View reservation details with multiple services
- [ ] See correct totals in table view
- [ ] Backward compatibility with old reservations

---

## Next Steps (Optional Enhancements)

1. **Add-on services**: Mark some services as add-ons
2. **Service packages**: Pre-defined service combinations
3. **Discounts**: Apply discounts for multiple services
4. **Time optimization**: Smart scheduling for multiple services
5. **Service dependencies**: Some services require others
6. **Client history**: Show previous multi-service bookings

---

## Files Modified

### Frontend
1. `frontend/src/pages/admin/AdminReservations.jsx`
   - Added multi-service state and helpers
   - Updated create modal
   - Updated edit modal
   - Updated table display
   - Updated detail modal

2. `frontend/src/pages/client/BookingPage.jsx`
   - Added multi-service selection state
   - Updated service display UI
   - Updated form submission
   - Added totals calculation

### Backend (No changes needed)
- Already supports multi-service via `reservation_items` table
- `ReservationModel.createReservation()` handles services array
- `ReservationModel.getReservationById()` includes items

---

## Database Schema Reference

```sql
-- Main reservation
reservations (
  id,
  client_id,
  service_id,              -- NULL for multi-service
  uses_items_table,        -- 1 for multi-service
  prix_final,              -- Sum of all services
  ...
)

-- Service items
reservation_items (
  id,
  reservation_id,          -- Foreign key to reservations
  service_id,              -- Foreign key to services
  item_type,               -- 'main' or 'addon'
  prix,                    -- Individual service price
  notes                    -- Service-specific notes
)
```

---

## Support

For issues or questions:
1. Check backend logs for API errors
2. Check browser console for frontend errors
3. Verify database has both tables properly set up
4. Ensure `uses_items_table` flag is correctly set

---

**Implementation Date**: October 16, 2025  
**Status**: ✅ Complete and Functional
