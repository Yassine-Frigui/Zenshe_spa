/**
 * Example: Integrating Jotform into BookingPage
 * 
 * This file shows the changes needed to integrate JotformCard into the existing BookingPage.jsx
 * 
 * INSTRUCTIONS:
 * 1. Copy the imports at the top of your BookingPage.jsx
 * 2. Add the state variables to your component
 * 3. Add the useEffect to check Jotform status
 * 4. Add the handler functions
 * 5. Update handleSubmit to include Jotform data
 * 6. Add the JotformCard component in your JSX
 */

// ==================== STEP 1: ADD IMPORTS ====================
// Add these to your existing imports in BookingPage.jsx

import JotformCard from '../../components/JotformCard';
import { checkJotformStatus, formatSubmissionData } from '../../utils/jotformUtils';

// ==================== STEP 2: ADD STATE VARIABLES ====================
// Add these state variables in your BookingPage component (around line 20-40)

const [jotformEnabled, setJotformEnabled] = useState(false);
const [jotformComplete, setJotformComplete] = useState(false);
const [jotformData, setJotformData] = useState(null);
const [jotformFormId, setJotformFormId] = useState(null);

// ==================== STEP 3: CHECK JOTFORM STATUS ====================
// Add this useEffect to check if Jotform is enabled (around line 50-100)

useEffect(() => {
  const checkJotform = async () => {
    try {
      const status = await checkJotformStatus();
      console.log('Jotform status:', status);
      setJotformEnabled(status.enabled);
      
      // You can also fetch form config if needed
      if (status.enabled) {
        // Optional: Get form ID from backend config
        // const config = await getFormConfig();
        // setJotformFormId(config.formId);
        
        // Or use environment variable
        setJotformFormId(import.meta.env.VITE_JOTFORM_FORM_ID || '241234567890123');
      }
    } catch (error) {
      console.error('Error checking Jotform status:', error);
      setJotformEnabled(false);
    }
  };
  
  checkJotform();
}, []);

// ==================== STEP 4: ADD HANDLER FUNCTIONS ====================
// Add these handler functions in your component (around line 150-200)

/**
 * Handle Jotform submission
 */
const handleJotformSubmit = (submissionData) => {
  console.log('📝 Jotform submitted:', submissionData);
  
  // Format the submission data
  const formatted = formatSubmissionData(submissionData);
  setJotformData(formatted);
  setJotformComplete(true);
  
  // Show success message (optional)
  console.log('✅ Additional form completed successfully');
};

/**
 * Handle Jotform validation status change
 */
const handleJotformValidation = (isValid) => {
  console.log('📋 Jotform validation status:', isValid);
  setJotformComplete(isValid);
};

// ==================== STEP 5: UPDATE handleSubmit ====================
// Modify your existing handleSubmit function (around line 159-230)
// Add the Jotform validation check and include jotform_submission in the data

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // *** ADD THIS: Check if Jotform is enabled and completed ***
  if (jotformEnabled && !jotformComplete) {
    setError('Please complete the additional information form before submitting your booking.');
    setLoading(false);
    // Scroll to Jotform card
    const jotformCard = document.querySelector('.jotform-card');
    if (jotformCard) {
      jotformCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  try {
    const reservationData = {
      // Client data
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      telephone: formData.telephone,
      date_naissance: null,
      adresse: '',
      
      // Reservation data
      service_id: selectedService,
      date_reservation: formData.date_reservation,
      heure_debut: formData.heure_reservation,
      notes_client: formData.notes || '',
      
      // Referral code
      referralCode: formData.referralCode || null,
      
      // Add-on data
      has_healing_addon: formData.hasHealingAddon,
      
      // Session ID for draft conversion
      session_id: sessionId,
      
      // *** ADD THIS: Include Jotform submission data ***
      jotform_submission: jotformData
    };

    console.log('Sending reservation data:', reservationData);

    const response = await publicAPI.createReservation(reservationData);
    
    // ... rest of your existing code
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    setError('Error creating reservation. Please try again.');
  } finally {
    setLoading(false);
  }
};

// ==================== STEP 6: ADD JOTFORM CARD TO JSX ====================
// Add this in your form JSX, AFTER all form fields but BEFORE the submit button
// (around line 823, before the submit button section)

{/* === ADD THIS SECTION === */}
{/* Jotform Card - Additional Information Required */}
{jotformEnabled && jotformFormId && (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 1.4, duration: 0.6 }}
    className="mb-4"
  >
    <JotformCard
      formId={jotformFormId}
      onSubmit={handleJotformSubmit}
      onValidation={handleJotformValidation}
    />
  </motion.div>
)}

{/* === MODIFY THE SUBMIT BUTTON === */}
{/* Update your existing submit button to disable it when Jotform is not complete */}
<motion.div
  className="text-center"
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay: 1.5, duration: 0.6 }}
>
  <button
    type="submit"
    className="btn btn-green text-white btn-lg px-5"
    disabled={
      loading || 
      !selectedService || 
      !formData.date_reservation || 
      !formData.heure_reservation ||
      (jotformEnabled && !jotformComplete) // *** ADD THIS LINE ***
    }
  >
    {loading ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" />
        {t('booking.form.submitting')}
      </>
    ) : (
      <>
        <FaCheck className="me-2" />
        {t('booking.form.submit')}
      </>
    )}
  </button>
  
  {/* === ADD THIS: Show message when Jotform is required === */}
  {jotformEnabled && !jotformComplete && (
    <div className="text-muted mt-2 small">
      <FaExclamationCircle className="me-1" />
      Please complete the additional information form above to continue
    </div>
  )}
</motion.div>

// ==================== STEP 7: ADD ENVIRONMENT VARIABLE ====================
// Add this to your frontend/.env file:

/*
VITE_JOTFORM_FORM_ID=your_form_id_here
*/

// ==================== NOTES ====================
/*
 * 1. Make sure to import FaExclamationCircle if you use it in the JSX:
 *    import { FaCheck, FaExclamationCircle } from 'react-icons/fa';
 * 
 * 2. The form ID should match the one in your backend .env file
 * 
 * 3. Test the integration by:
 *    - Enabling Jotform in backend .env
 *    - Creating a test form on Jotform
 *    - Trying to submit a booking without completing the Jotform
 *    - Completing the Jotform and then submitting
 * 
 * 4. The JotformCard will automatically:
 *    - Load the form in an iframe
 *    - Detect when it's completed
 *    - Update the validation status
 *    - Extract and format the submission data
 */

export default {};
