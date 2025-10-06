/**
 * Example: Displaying Jotform Submissions in AdminReservations
 * 
 * This file shows how to display Jotform submission data in the admin panel.
 * 
 * INSTRUCTIONS:
 * 1. Import JotformSubmissionView component
 * 2. Add it to the reservation detail modal or table
 */

// ==================== STEP 1: ADD IMPORT ====================
// Add this to your imports in AdminReservations.jsx

import JotformSubmissionView from '../../components/JotformSubmissionView';

// ==================== STEP 2: ADD TO RESERVATION TABLE ====================
// You can add a column to show if a reservation has Jotform data
// In your table columns (around line 500-700), add this column:

{/* Jotform Column */}
<th>Form</th>

// And in your table body, add this cell:

<td>
  {reservation.jotform_submission ? (
    <Badge bg="success" className="d-flex align-items-center">
      <FaCheckCircle className="me-1" />
      Completed
    </Badge>
  ) : (
    <Badge bg="secondary">N/A</Badge>
  )}
</td>

// ==================== STEP 3: ADD TO DETAIL MODAL ====================
// In your reservation detail modal (around line 700-950), add this section:

{/* === ADD THIS SECTION in your modal body === */}

{/* Jotform Submission Section */}
<div className="mt-4">
  <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
    <FaFileAlt className="me-2" />
    Additional Form Submission
  </h6>
  
  <JotformSubmissionView 
    submission={selectedReservation?.jotform_submission}
    compact={true}
  />
</div>

// ==================== ALTERNATIVE: FULL VIEW IN MODAL ====================
// If you want to show the full submission in the modal instead of compact view:

<div className="mt-4">
  <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
    <FaFileAlt className="me-2" />
    Additional Form Submission
  </h6>
  
  {selectedReservation?.jotform_submission ? (
    <JotformSubmissionView 
      submission={selectedReservation.jotform_submission}
      compact={false}
    />
  ) : (
    <div className="alert alert-info">
      <FaInfoCircle className="me-2" />
      No additional form was submitted with this reservation.
    </div>
  )}
</div>

// ==================== STEP 4: ADD TO CREATE/EDIT MODAL ====================
// If you want to show Jotform data when editing a reservation:

{/* In the edit modal, add this read-only section */}
<div className="row mt-4">
  <div className="col-12">
    <h6 className="fw-bold text-secondary mb-3">
      <FaFileAlt className="me-2" />
      Additional Form Data (Read-Only)
    </h6>
    
    {editFormData?.jotform_submission ? (
      <JotformSubmissionView 
        submission={editFormData.jotform_submission}
        compact={true}
      />
    ) : (
      <div className="alert alert-secondary">
        No additional form data available
      </div>
    )}
  </div>
</div>

// ==================== STEP 5: ADD ICONS IMPORT ====================
// Make sure you have these icons imported at the top:

import { 
  FaCalendarAlt, 
  FaUser, 
  FaEdit, 
  FaTrash, 
  FaCheckCircle,
  FaFileAlt,  // *** ADD THIS ***
  FaInfoCircle  // *** ADD THIS ***
} from 'react-icons/fa';

// ==================== EXAMPLE: FULL MODAL BODY WITH JOTFORM ====================
// Here's a complete example of a modal body with Jotform section:

<Modal.Body>
  {/* Client Information */}
  <div className="mb-4">
    <h6 className="fw-bold text-primary mb-3">
      <FaUser className="me-2" />
      Client Information
    </h6>
    <div className="row">
      <div className="col-md-6">
        <p><strong>Name:</strong> {selectedReservation?.client_prenom} {selectedReservation?.client_nom}</p>
        <p><strong>Phone:</strong> {selectedReservation?.client_telephone}</p>
      </div>
      <div className="col-md-6">
        <p><strong>Email:</strong> {selectedReservation?.client_email}</p>
      </div>
    </div>
  </div>

  {/* Reservation Details */}
  <div className="mb-4">
    <h6 className="fw-bold text-primary mb-3">
      <FaCalendarAlt className="me-2" />
      Reservation Details
    </h6>
    <div className="row">
      <div className="col-md-6">
        <p><strong>Service:</strong> {selectedReservation?.service_nom}</p>
        <p><strong>Date:</strong> {formatDate(selectedReservation?.date_reservation)}</p>
      </div>
      <div className="col-md-6">
        <p><strong>Time:</strong> {selectedReservation?.heure_debut}</p>
        <p><strong>Status:</strong> {selectedReservation?.statut}</p>
      </div>
    </div>
  </div>

  {/* === ADD THIS: Jotform Submission Section === */}
  <div className="mb-4">
    <h6 className="fw-bold text-primary mb-3">
      <FaFileAlt className="me-2" />
      Additional Form Submission
    </h6>
    <JotformSubmissionView 
      submission={selectedReservation?.jotform_submission}
      compact={true}
    />
  </div>

  {/* Notes */}
  <div>
    <h6 className="fw-bold text-primary mb-3">Notes</h6>
    <p>{selectedReservation?.notes_client || 'No notes'}</p>
  </div>
</Modal.Body>

// ==================== EXAMPLE: RESERVATION CARD WITH JOTFORM BADGE ====================
// If you're using card layout instead of table:

<Card className="reservation-card mb-3">
  <Card.Body>
    <div className="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h5 className="mb-1">
          {reservation.client_prenom} {reservation.client_nom}
        </h5>
        <p className="text-muted mb-0">
          {formatDate(reservation.date_reservation)} at {reservation.heure_debut}
        </p>
      </div>
      
      <div className="d-flex gap-2">
        {/* === ADD THIS: Jotform Badge === */}
        {reservation.jotform_submission && (
          <Badge bg="success" pill className="d-flex align-items-center">
            <FaFileAlt className="me-1" />
            Form
          </Badge>
        )}
        
        <Badge bg={getStatusColor(reservation.statut)}>
          {reservation.statut}
        </Badge>
      </div>
    </div>

    <div className="mb-2">
      <strong>Service:</strong> {reservation.service_nom}
    </div>

    {/* === ADD THIS: Show Jotform indicator === */}
    {reservation.jotform_submission && (
      <div className="mt-2 p-2 bg-light rounded">
        <small className="text-muted d-flex align-items-center">
          <FaCheckCircle className="text-success me-1" />
          Additional form completed with {
            Object.keys(reservation.jotform_submission.answers || {}).length
          } responses
        </small>
      </div>
    )}

    <div className="mt-3 d-flex gap-2">
      <Button 
        variant="outline-primary" 
        size="sm"
        onClick={() => openModal(reservation)}
      >
        <FaEye className="me-1" />
        View Details
      </Button>
      {/* ... other buttons ... */}
    </div>
  </Card.Body>
</Card>

// ==================== FILTERING BY JOTFORM STATUS ====================
// You can add a filter to show only reservations with Jotform submissions:

const [showOnlyWithForm, setShowOnlyWithForm] = useState(false);

// Filter logic:
const filteredReservations = reservations.filter(res => {
  // ... existing filters ...
  
  // Filter by Jotform submission
  if (showOnlyWithForm && !res.jotform_submission) {
    return false;
  }
  
  return true;
});

// Add filter UI:
<Form.Check
  type="checkbox"
  label="Show only with completed forms"
  checked={showOnlyWithForm}
  onChange={(e) => setShowOnlyWithForm(e.target.checked)}
  className="mb-3"
/>

// ==================== EXPORT DATA WITH JOTFORM ====================
// When exporting reservations to CSV, include Jotform data:

const exportToCSV = () => {
  const csvData = reservations.map(res => {
    const jotformAnswers = res.jotform_submission?.answers || {};
    const readableAnswers = Object.entries(jotformAnswers).map(
      ([key, value]) => `${value.text}: ${value.answer}`
    ).join(' | ');
    
    return {
      ID: res.id,
      Client: `${res.client_prenom} ${res.client_nom}`,
      Email: res.client_email,
      Phone: res.client_telephone,
      Service: res.service_nom,
      Date: res.date_reservation,
      Time: res.heure_debut,
      Status: res.statut,
      'Form Completed': res.jotform_submission ? 'Yes' : 'No',
      'Form Responses': readableAnswers || 'N/A'
    };
  });
  
  // ... convert to CSV and download ...
};

// ==================== NOTES ====================
/*
 * 1. The JotformSubmissionView component has two modes:
 *    - compact={true}: Shows a summary with "View Details" button
 *    - compact={false}: Shows the full submission data
 * 
 * 2. The component automatically handles:
 *    - Null/empty submissions (shows appropriate message)
 *    - JSON parsing (if needed)
 *    - Formatting of answers into readable format
 * 
 * 3. Submission data structure:
 *    {
 *      submissionID: "123456",
 *      formID: "789012",
 *      created_at: "2025-01-01T12:00:00Z",
 *      answers: {
 *        "1": { text: "Question 1", answer: "Answer 1" },
 *        "2": { text: "Question 2", answer: "Answer 2" }
 *      }
 *    }
 * 
 * 4. You can customize the styling by editing:
 *    frontend/src/components/JotformSubmissionView.css
 */

export default {};
