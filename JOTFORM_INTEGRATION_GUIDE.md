# Jotform Integration Guide

This guide explains how to integrate Jotform into your ZenShe Spa booking system.

## Overview

The Jotform integration adds an additional form step to the booking process. Clients must complete both the native booking form AND the Jotform before their reservation can be submitted. This allows you to collect additional information, custom fields, or any other data you need.

## Features

- ✅ Seamless embedding of Jotform in the booking flow
- ✅ Form validation before reservation submission
- ✅ Submission data stored with each reservation
- ✅ Admin view of all form submissions
- ✅ No additional database tables required (stored as JSON)
- ✅ Easy to enable/disable via configuration

## Setup Instructions

### 1. Create Your Jotform

1. Go to [Jotform](https://www.jotform.com/) and sign in
2. Create a new form with the fields you need
3. Customize the form design to match your brand
4. Publish the form
5. Note down your **Form ID** (the number in the form URL: `https://form.jotform.com/XXXXXXXXX`)

### 2. Get Your Jotform API Key

1. Go to [My Account → API](https://www.jotform.com/myaccount/api)
2. Create a new API Key
3. Copy the API key

### 3. Configure Backend

1. Open `backend/.env` file (or create from `.env.example`)
2. Add the following configuration:

```env
# Jotform Configuration
JOTFORM_ENABLED=true
JOTFORM_API_KEY=your_api_key_here
JOTFORM_API_URL=https://api.jotform.com
JOTFORM_FORM_ID=your_form_id_here
JOTFORM_WEBHOOK_URL=http://localhost:5000/api/jotform/webhook
```

3. Replace `your_api_key_here` with your actual API key
4. Replace `your_form_id_here` with your form ID

### 4. Run Database Migration

Run the SQL migration to add the `jotform_submission` column:

```bash
# Connect to your MySQL database
mysql -u root -p zenshespa_database

# Run the migration
source backend/database/add_jotform_submission.sql
```

Or use your preferred MySQL client to execute the SQL file.

### 5. Restart Backend Server

```bash
cd backend
npm run dev
```

### 6. Configure Frontend

The frontend is already configured! You just need to integrate the `JotformCard` component into your `BookingPage`.

## Integration in BookingPage

Here's how to integrate the Jotform into your booking page:

### Step 1: Import the Component

```javascript
import JotformCard from '../components/JotformCard';
import { checkJotformStatus, formatSubmissionData } from '../utils/jotformUtils';
```

### Step 2: Add State Variables

```javascript
const [jotformEnabled, setJotformEnabled] = useState(false);
const [jotformComplete, setJotformComplete] = useState(false);
const [jotformData, setJotformData] = useState(null);
```

### Step 3: Check Jotform Status on Mount

```javascript
useEffect(() => {
  const checkJotform = async () => {
    try {
      const status = await checkJotformStatus();
      setJotformEnabled(status.enabled);
    } catch (error) {
      console.error('Error checking Jotform status:', error);
    }
  };
  
  checkJotform();
}, []);
```

### Step 4: Add Handlers

```javascript
const handleJotformSubmit = (submissionData) => {
  console.log('Jotform submitted:', submissionData);
  const formatted = formatSubmissionData(submissionData);
  setJotformData(formatted);
  setJotformComplete(true);
};

const handleJotformValidation = (isValid) => {
  setJotformComplete(isValid);
};
```

### Step 5: Update Form Submission

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Check if Jotform is enabled and completed
  if (jotformEnabled && !jotformComplete) {
    alert('Please complete the additional information form before booking.');
    return;
  }
  
  // Include Jotform data in reservation
  const reservationData = {
    nom: formData.nom,
    prenom: formData.prenom,
    // ... other fields
    jotform_submission: jotformData // Add this
  };
  
  // ... rest of your submission code
};
```

### Step 6: Add Component to JSX

Place this AFTER your main booking form but BEFORE the submit button:

```jsx
{/* Main booking form */}
<form onSubmit={handleSubmit}>
  {/* Your existing form fields */}
  
  {/* Jotform Card - appears after main form fields */}
  {jotformEnabled && (
    <JotformCard
      formId={process.env.REACT_APP_JOTFORM_FORM_ID}
      onSubmit={handleJotformSubmit}
      onValidation={handleJotformValidation}
    />
  )}
  
  {/* Submit button - disabled until both forms are complete */}
  <button
    type="submit"
    disabled={loading || (jotformEnabled && !jotformComplete)}
  >
    Submit Booking
  </button>
</form>
```

## Admin View Integration

To display Jotform submissions in the admin panel:

### Import the Component

```javascript
import JotformSubmissionView from '../../components/JotformSubmissionView';
```

### Use in Reservation Details

```jsx
{/* In your reservation detail modal or view */}
<div className="reservation-jotform-section">
  <h6>Additional Form Submission</h6>
  <JotformSubmissionView 
    submission={reservation.jotform_submission}
    compact={true}
  />
</div>
```

## API Endpoints

The following API endpoints are available:

### Check Status
```
GET /api/jotform/status
```

### Get Form Details
```
GET /api/jotform/form
```

### Get Submission
```
GET /api/jotform/submission/:id
```

### Validate Submission
```
POST /api/jotform/validate-submission
Body: { submissionData: {...} }
```

### Webhook (Optional)
```
POST /api/jotform/webhook
```

## Database Schema

The `jotform_submission` column is added to the `reservations` table:

```sql
ALTER TABLE reservations 
ADD COLUMN jotform_submission JSON DEFAULT NULL 
COMMENT 'Stores Jotform submission data including all answers and metadata';
```

Data structure:
```json
{
  "submissionID": "123456789",
  "formID": "987654321",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z",
  "answers": {
    "1": {
      "text": "Full Name",
      "answer": "John Doe"
    },
    "2": {
      "text": "Email",
      "answer": "john@example.com"
    }
  },
  "ip": "192.168.1.1",
  "status": "ACTIVE"
}
```

## Troubleshooting

### Form Not Loading

1. Check if `JOTFORM_ENABLED=true` in `.env`
2. Verify your API key is correct
3. Check browser console for errors
4. Ensure form ID is correct

### Submission Not Saving

1. Verify database migration was successful
2. Check backend logs for errors
3. Ensure `jotform_submission` column exists in `reservations` table

### CORS Issues

If you encounter CORS errors:

1. Check that your domain is whitelisted in Jotform settings
2. Verify CORS configuration in `backend/src/app.js`

## Security Considerations

- API keys are stored in `.env` and never exposed to frontend
- Submissions are validated before storage
- Data is sanitized and stored as JSON
- Rate limiting is applied to API endpoints

## Customization

### Custom Styling

Edit `frontend/src/components/JotformCard.css` to customize the card appearance.

### Custom Validation

Modify `backend/src/services/JotFormService.js` → `validateSubmission()` to add custom validation rules.

### Webhook Processing

Implement custom webhook handling in `backend/src/routes/jotform.js` → `/webhook` endpoint.

## Support

For Jotform-specific questions, visit:
- [Jotform API Documentation](https://api.jotform.com/docs/)
- [Jotform Help Center](https://www.jotform.com/help/)

For integration issues, check the backend logs or browser console.

---

**Last Updated:** January 2025
**Version:** 1.0.0
