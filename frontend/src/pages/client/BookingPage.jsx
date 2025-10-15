import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Nav, Alert } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCalendarAlt, FaClock, FaUser, FaPhone, FaEnvelope, FaCheck, FaStar, FaInfoCircle, FaSave, FaFileSignature, FaCrown, FaExclamationTriangle } from 'react-icons/fa';
import { publicAPI, clientAPI } from '../../services/api';
import { useMembership } from '../../contexts/MembershipContext';
import ReservationConfirmation from './ReservationConfirmation';
import CompleteJotForm from '../../components/CompleteJotForm';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as Yup from 'yup';

const BookingPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const serviceIdFromUrl = searchParams.get('service') || '';
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedService, setSelectedService] = useState(serviceIdFromUrl);
  const [sessionId, setSessionId] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  
  // Membership hook - must be called BEFORE any state that uses same name
  const { activeMembership, hasActiveMembership, isAuthenticated } = useMembership();
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    date_reservation: '',
    heure_reservation: '',
    notes: '',
    referralCode: '',
    hasHealingAddon: false
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reservationData, setReservationData] = useState(null);
  const [error, setError] = useState('');
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [waiverSubmitted, setWaiverSubmitted] = useState(false);
  const [waiverData, setWaiverData] = useState(null);
  
  // MEMBERSHIP: New state for membership bookings (renamed to avoid conflict with useMembership hook)
  const [useClientMembership, setUseClientMembership] = useState(false);
  
  // TAB STATE: 'standard' or 'membership'
  const [bookingTab, setBookingTab] = useState('standard');
  
  // MEMBERSHIP SCHEDULING: For users to pre-select membership before visiting spa
  const [availableMemberships, setAvailableMemberships] = useState([]);
  const [selectedMembershipPlan, setSelectedMembershipPlan] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(1); // 1 or 3 months
  const [showScheduleSuccess, setShowScheduleSuccess] = useState(false);
  const [schedulingMembership, setSchedulingMembership] = useState(false);

  // horrairex horaires disponibles
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30'
  ];

  useEffect(() => {
    fetchServices(); // This now also fetches categories
    fetchMemberships(); // Fetch available memberships for dropdown (public endpoint - no auth required)
    
    // Generate unique session ID and store in sessionStorage (not localStorage)
    initializeSession();
  }, [i18n.language]); // Re-fetch when language changes

  // Initialize session with unique ID that persists only for this tab session
  const initializeSession = async () => {
    let currentSessionId = sessionStorage.getItem('zenshe_booking_session');
    
    if (!currentSessionId) {
      // Generate truly unique session ID
      currentSessionId = 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
      sessionStorage.setItem('zenshe_booking_session', currentSessionId);
    }
    
    setSessionId(currentSessionId);
    
    // Try to load existing draft for this session
    try {
      const response = await publicAPI.getDraft(currentSessionId);
      if (response.data.success && response.data.data) {
        const draftData = response.data.data;
        
        // Convert draft field names to form field names
        const formData = {
          nom: draftData.nom || '',
          prenom: draftData.prenom || '',
          email: draftData.email || '',
          telephone: draftData.telephone || '',
          date_reservation: draftData.date_reservation || '',
          heure_reservation: draftData.heure_reservation || '',
          notes: draftData.notes || ''
        };
        
        setFormData(formData);
        if (draftData.service_id) {
          setSelectedService(draftData.service_id.toString());
        }
        setAutoSaveStatus('📄 Brouillon chargé');
        setTimeout(() => setAutoSaveStatus(''), 3000);
      }
    } catch (error) {
      // 404 is expected when no draft exists - this is normal for new sessions
      if (error.response?.status !== 404) {
        console.error('Erreur lors du chargement du brouillon:', error);
      }
      // For 404 or any other error, just continue with empty form - no need to show error to user
    }
  };

  const fetchServices = async () => {
    try {
      // Fetch services and categories in parallel
      const [servicesRes, categoriesRes] = await Promise.all([
        publicAPI.getServices(),
        publicAPI.getCategories()
      ]);
      
      // Handle services response - wrapped in {success, services, ...}
      const servicesData = servicesRes.data.services || servicesRes.data || [];
      
      // Handle categories response - wrapped in {success, data, ...}
      const categoriesData = categoriesRes.data.data || categoriesRes.data || [];

      setServices(Array.isArray(servicesData) ? servicesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
      setServices([]);
      setCategories([]);
    }
  };

  const fetchMemberships = async () => {
    try {
      console.log('🔍 Fetching memberships from PUBLIC API (no auth required)...');
      const response = await publicAPI.getMemberships();
      console.log('✅ Memberships loaded:', response.data);
      const membershipsData = response.data.memberships || response.data || [];
      setAvailableMemberships(Array.isArray(membershipsData) ? membershipsData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des abonnements:', error);
      setAvailableMemberships([]);
    }
  };

  const handleScheduleMembership = async () => {
    if (!selectedMembershipPlan) {
      setError('Veuillez sélectionner un abonnement');
      return;
    }

    setSchedulingMembership(true);
    setError('');

    try {
      const response = await clientAPI.scheduleMembership({
        membership_id: selectedMembershipPlan,
        duree_mois: selectedDuration
      });

      setShowScheduleSuccess(true);
      setSelectedMembershipPlan('');
      setSelectedDuration(1);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowScheduleSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Erreur lors de la planification de l\'abonnement:', error);
      setError(error.response?.data?.message || 'Erreur lors de la planification de l\'abonnement');
    } finally {
      setSchedulingMembership(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServiceChange = (serviceId) => {
    setSelectedService(serviceId);
    // Immediately update the same draft when service is selected
    if (sessionId && formData.telephone && formData.telephone.trim() !== '') {
      saveDraft({ 
        ...formData, 
        service_id: serviceId,
        heure_reservation: formData.heure_reservation
      });
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date_reservation: date
    }));
    
    // Simuler la vérification des horrairex disponibles
    // En production, ceci ferait un appel API pour vérifier les disponibilités
    const randomAvailable = timeSlots.filter(() => Math.random() > 0.3);
    setAvailableSlots(randomAvailable);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // If on membership tab, automatically use membership
    const useMembership = bookingTab === 'membership' || useClientMembership;

    // Validation: service required UNLESS using membership
    if (!useMembership && !selectedService) {
      setError('Veuillez sélectionner un service');
      setLoading(false);
      return;
    }

    // Validation: must be authenticated to use membership
    if (useMembership && !isAuthenticated) {
      setError('Vous devez être connecté pour utiliser votre abonnement');
      setLoading(false);
      return;
    }

    // Validation: must have active membership with services remaining
    if (useMembership && (!activeMembership || activeMembership.services_restants <= 0)) {
      setError("Vous n'avez pas d'abonnement actif ou plus de services disponibles");
      setLoading(false);
      return;
    }

    try {
      const reservationData = {
        // Client data
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        date_naissance: null, // Optional field
        adresse: '', // Optional field
        
        // Reservation data
        service_id: useMembership ? null : selectedService, // No service when using membership
        date_reservation: formData.date_reservation,
        heure_debut: formData.heure_reservation,
        notes_client: formData.notes || '',
        
        // Referral code
        referralCode: formData.referralCode || null,
        
        // Add-on data
        has_healing_addon: formData.hasHealingAddon,
        
        // Session ID for draft conversion
        session_id: sessionId,
        
        // Membership data
        useMembership: useMembership,
        clientMembershipId: useMembership ? activeMembership?.id : null
      };

      // Secure logging for production
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending reservation data:', reservationData);
      }

      const response = await publicAPI.createReservation(reservationData);
      if (process.env.NODE_ENV === 'development') {
        console.log('Reservation response:', response);
      }
      
      // Store reservation data for confirmation page
      setReservationData({
        reservation: response.data.reservation,
        service: response.data.reservation.service || services.find(s => s.id == selectedService),
        clientData: response.data.reservation.client || {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone
        }
      });
      
      // Show confirmation page instead of success page
      setShowConfirmation(true);
      
      // Delete the draft after successful reservation (clean up)
      if (sessionId) {
        try {
          await publicAPI.deleteDraft(sessionId);
          sessionStorage.removeItem('zenshe_booking_session'); // Clear session storage
        } catch (error) {
          console.error('Erreur lors de la suppression du brouillon:', error);
        }
      }
      
      // Reset form
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_reservation: '',
        heure_reservation: '',
        notes: ''
      });
      setSelectedService('');
      setAvailableSlots([]);
    } catch (error) {
      console.error('Erreur réservation complète:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Une erreur est survenue lors de la réservation. Veuillez réessayer.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Données invalides. Veuillez vérifier vos informations.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Service non trouvé. Veuillez sélectionner un autre service.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erreur du serveur. Veuillez contacter le support.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Réservation à partir de demain
    return today.toISOString().split('T')[0];
  };

  const selectedServiceData = Array.isArray(services) 
    ? services.find(s => s.id === parseInt(selectedService))
    : null;

  // Group services by category
  const servicesByCategory = Array.isArray(categories) ? categories.map(category => {
    // Get services that directly belong to this category (base services and addons)
    const directServices = Array.isArray(services) ? services.filter(service => service.categorie_id === category.id) : [];
    
    // Get variant and package services that belong to services in this category
    const relatedServices = Array.isArray(services) ? services.filter(service => {
      if (!service.parent_service_id || service.categorie_id) return false; // Avoid double counting
      // Find the parent service and check if it belongs to this category
      const parentService = services.find(s => s.id === service.parent_service_id);
      return parentService && parentService.categorie_id === category.id;
    }) : [];
    
    const allCategoryServices = [...directServices, ...relatedServices];
    
    return {
      ...category,
      services: allCategoryServices
    };
  }).filter(category => category.services.length > 0) : [];
  
  // Add uncategorized services (if any) to a special category
  const uncategorizedServices = Array.isArray(services) ? services.filter(service => 
    !service.categorie_id && 
    !service.parent_service_id && 
    service.service_type !== 'addon'
  ) : [];
  
  if (uncategorizedServices.length > 0) {
    servicesByCategory.push({
      id: 'uncategorized',
      nom: 'Autres Services',
      couleur_theme: '#888888',
      services: uncategorizedServices
    });
  }

  // Auto-save function - updates the SAME draft every time
  const saveDraft = useCallback(async (data) => {
    if (!sessionId) return;
    
    // Only save if client has provided at least a phone number (minimum requirement)
    if (!data.telephone || data.telephone.trim() === '') {
      return; // Don't save draft without phone number
    }
    
    try {
      const draftData = {
        sessionId,
        ...data,
        service_id: selectedService || null,
        // Convert heure_reservation to the draft format
        heure_reservation: data.heure_reservation
      };
      
      await publicAPI.saveDraft(draftData);
      setAutoSaveStatus('💾 Auto-sauvegardé');
      setTimeout(() => setAutoSaveStatus(''), 1500);
    } catch (error) {
      console.error('Erreur auto-sauvegarde:', error);
      setAutoSaveStatus('⚠️ Erreur sauvegarde');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  }, [sessionId, selectedService]);

  // Auto-save with debouncing - always updates the SAME draft
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only auto-save if client has at least a phone number (spa's minimum requirement)
      const hasPhoneNumber = formData.telephone && formData.telephone.trim() !== '';
      if (hasPhoneNumber && sessionId) {
        saveDraft(formData); // Always updates the same draft for this session
      }
    }, 1500); // Save 1.5 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [formData, saveDraft, sessionId]);

  // Confirmation page handlers
  const handleEditReservation = () => {
    setShowConfirmation(false);
    // Keep the form data intact for editing
  };

  const handleConfirmReservation = async (reservation, method = 'code') => {
    try {
      // If waiver data exists, submit it now along with the reservation
      if (waiverData) {
        console.log('📤 Submitting waiver data to backend...');
        
        try {
          const waiverSubmissionData = {
            sessionId: sessionId || null,
            formId: waiverData.form_id,
            submission: waiverData
          };
          
          const waiverResponse = await publicAPI.submitJotForm(waiverSubmissionData);
          console.log('✅ Waiver submitted successfully:', waiverResponse.data);
        } catch (waiverError) {
          console.error('❌ Waiver submission error:', waiverError);
          // Don't block reservation confirmation if waiver fails
          alert('⚠️ La décharge n\'a pas pu être enregistrée, mais votre réservation est confirmée.');
        }
      }
      
      // Delete the draft after confirmation
      if (sessionId) {
        try {
          await publicAPI.deleteDraft(sessionId);
          sessionStorage.removeItem('zenshe_booking_session');
        } catch (error) {
          console.error('Erreur lors de la suppression du brouillon:', error);
        }
      }
      
      // Reset form and show success
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_reservation: '',
        heure_reservation: '',
        notes: ''
      });
      setSelectedService('');
      setAvailableSlots([]);
      setWaiverData(null);
      setWaiverSubmitted(false);
      
      setShowConfirmation(false);
      setSuccess(true);
    } catch (error) {
      console.error('❌ Error in confirmation process:', error);
      alert('Une erreur s\'est produite. Veuillez réessayer.');
    }
  };

  const handleCancelReservation = () => {
    setShowConfirmation(false);
    setReservationData(null);
    // Optionally delete the reservation from backend
  };

  // Waiver modal handlers
  const handleWaiverDataReady = (formDataFromJotForm) => {
    console.log('✅ Waiver form data collected (NOT submitted yet):', formDataFromJotForm);
    setWaiverData(formDataFromJotForm);
    setWaiverSubmitted(true);
    setShowWaiverModal(false);
    setAutoSaveStatus('📄 Données de décharge prêtes');
    setTimeout(() => setAutoSaveStatus(''), 3000);
  };

  const handleWaiverError = (error) => {
    console.error('❌ Waiver data collection error:', error);
    alert('Erreur lors de la collecte des données de décharge. Veuillez réessayer.');
  };

  // Show confirmation page
  if (showConfirmation && reservationData) {
    return (
      <ReservationConfirmation
        reservationData={reservationData}
        onEdit={handleEditReservation}
        onConfirm={handleConfirmReservation}
        onCancel={handleCancelReservation}
      />
    );
  }

  if (success && reservationData) {
    const { reservation, service, clientData } = reservationData;
    
    // Format date for display
    const reservationDate = new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <motion.div
        className="booking-success py-5"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{ minHeight: '80vh' }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10 text-center">
              <motion.div
                className="success-card bg-white rounded-4 shadow-lg p-5"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="success-icon mb-4">
                  <FaCheck className="text-success" style={{ fontSize: '4rem' }} />
                </div>
                <h2 className="text-green fw-bold mb-3">
                  <FaStar className="me-2" /> {t('booking.confirmedTitle', 'Réservation confirmée !')} <FaStar className="ms-2" />
                </h2>
                <p className="lead text-muted mb-4">
                  Votre rendez-vous a été enregistré avec succès. Vous recevrez un email de confirmation avec tous les détails.
                </p>
                
                {/* Reservation Details */}
                <div className="bg-light border-left border-green p-4 rounded mb-4 text-start">
                  <h5 className="text-green mb-3"><FaFileSignature className="me-2" /> {t('booking.detailsTitle', "Détails de votre réservation")}</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong><FaBullseye className="me-2" /> Service :</strong> {service?.nom}</p>
                      <p><strong><FaCalendarAlt className="me-2" /> Date :</strong> {reservationDate}</p>
                      <p><strong><FaClock className="me-2" /> Heure :</strong> {reservation.heure_debut}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong><FaUser className="me-2" /> Client :</strong> {clientData.prenom} {clientData.nom}</p>
                      <p><strong><FaEnvelope className="me-2" /> Email :</strong> {clientData.email}</p>
                      <p><strong><FaMoneyBill className="me-2" /> Prix :</strong> {service?.prix} DT</p>
                    </div>
                  </div>
                </div>

                {/* Email notification */}
                <div className="alert alert-info mb-4">
                  <h6 className="alert-heading">📧 Email de confirmation envoyé !</h6>
                  <p className="mb-0">
                    Un email de confirmation avec un <strong>code de vérification</strong> a été envoyé à <strong>{clientData.email}</strong>. 
                    Présentez ce code lors de votre visite.
                  </p>
                </div>

                <div className="alert alert-warning">
                  <p className="mb-0 text-warning">
                    <strong>⚠️ Important :</strong> Veuillez arriver 10 minutes avant votre rendez-vous pour l'accueil.
                  </p>
                </div>

                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                  <button
                    className="btn btn-green btn-lg px-4"
                    onClick={() => {
                      setSuccess(false);
                      setReservationData(null);
                    }}
                  >
                    {t('booking.form.newBooking')}
                  </button>
                  <Link to="/client/services" className="btn btn-outline-green btn-lg px-4">
                    Voir nos services
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Validation schema for Formik
  const BookingSchema = Yup.object().shape({
    nom: Yup.string().required('Nom requis'),
    prenom: Yup.string().required('Prénom requis'),
    email: Yup.string().email('Email invalide').required('Email requis'),
    telephone: Yup.string().required('Téléphone requis'),
    date_reservation: Yup.date().required('Date requise'),
    heure_reservation: Yup.string().required('Heure requise'),
    notes: Yup.string(),
  });

  return (
    <div className="booking-page">
      {/* Hero Section */}
      <motion.section 
        className="hero-booking py-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          background: 'linear-gradient(135deg, var(--secondary-green) 0%, var(--accent-green) 100%)',
          minHeight: '40vh'
        }}
      >
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <h1 className="display-4 fw-bold text-white mb-4">
                  <FaCalendarAlt className="me-3" />
                  {t('booking.hero.title')}
                </h1>
                <p className="lead text-white mb-4">
                  {t('booking.hero.subtitle')}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Booking Form */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <motion.div
                className="booking-form-card bg-white rounded-4 shadow-lg"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <div className="card-body p-5">
                  {/* TAB NAVIGATION */}
                  <Nav variant="tabs" className="mb-4 border-bottom pb-3">
                    <Nav.Item>
                      <Nav.Link
                        active={bookingTab === 'standard'}
                        onClick={() => setBookingTab('standard')}
                        className={`px-4 py-2 fw-bold ${
                          bookingTab === 'standard' ? 'text-green' : 'text-muted'
                        }`}
                        style={{
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          borderBottom: bookingTab === 'standard' ? '3px solid var(--primary-green)' : 'none',
                          background: 'transparent',
                          borderRadius: 0
                        }}
                      >
                        <FaCalendarAlt className="me-2" />
                        {t('booking.tab.service')}                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        active={bookingTab === 'membership'}
                        onClick={() => {
                          if (!isAuthenticated || !hasActiveMembership()) {
                            // Don't switch tabs - will show alert instead
                            setBookingTab('membership');
                          } else {
                            setBookingTab('membership');
                            setUseClientMembership(true);
                          }
                        }}
                        className={`px-4 py-2 fw-bold ${
                          bookingTab === 'membership' ? 'text-warning' : 'text-muted'
                        }`}
                        style={{
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          borderBottom: bookingTab === 'membership' ? '3px solid #FFD700' : 'none',
                          background: 'transparent',
                          borderRadius: 0
                        }}
                      >
                        <FaCrown className="me-2" />
                        {t('booking.tab.membership')}
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  {/* Auto-save status indicator */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold text-green mb-0">
                      {bookingTab === 'standard' ? t('booking.form.title') : t('booking.form.title_with_membership')}
                    </h3>
                    <div className="d-flex flex-column align-items-end">
                      {sessionId && (
                        <small className="text-muted mb-1">
                          {t('booking.form.session')}: {sessionId.slice(-8)}
                        </small>
                      )}
                      {autoSaveStatus && (
                        <div className="auto-save-status">
                          <small className={`text-${autoSaveStatus.includes('💾') ? 'success' : autoSaveStatus.includes('⚠️') ? 'danger' : 'info'}`}>
                            {autoSaveStatus}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MEMBERSHIP TAB - Alert for non-members */}
                  {bookingTab === 'membership' && (!isAuthenticated || !hasActiveMembership()) && (
                    <div className="mb-4">
                      {/* Success message for scheduled membership */}
                      {showScheduleSuccess && (
                        <Alert variant="success" className="mb-3">
                          <div className="d-flex align-items-center">
                            <FaCheck className="me-3" style={{ fontSize: '1.5rem' }} />
                            <div>
                              <h5 className="alert-heading mb-1">{t('booking.schedule.success_title')}</h5>
                              <p className="mb-0">
                                {t('booking.schedule.success_message')}
                              </p>
                            </div>
                          </div>
                        </Alert>
                      )}

                      <Alert variant="warning" className="d-flex align-items-start">
                        <FaExclamationTriangle className="me-3 mt-1" style={{ fontSize: '1.5rem' }} />
                        <div className="w-100">
                          <h5 className="alert-heading">{t('booking.required.title')}</h5>
                          {!isAuthenticated ? (
                            <div className="mb-3">
                              <p className="mb-2">{t('booking.required.instructions_intro')}</p>
                              <ol className="mt-2 mb-2">
                                <li>{t('booking.required.create_account')}</li>
                                <li>{t('booking.required.view_offers', { link: '<a href="/services">' + t('booking.required.offers_link_text') + '</a>' })}</li>
                                <li>{t('booking.required.visit_spa')}</li>
                              </ol>
                            </div>
                          ) : (
                            <p className="mb-3">
                              {t('booking.required.no_active_membership_notice')}
                            </p>
                          )}

                          {/* SCHEDULING FORM - Only for logged-in users */}
                          {isAuthenticated && !showScheduleSuccess && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.3 }}
                              className="border-top pt-3 mt-3"
                            >
                              <h6 className="mb-3">
                                <FaCrown className="me-2 text-warning" />
                                {t('booking.schedule.title')}
                              </h6>
                              <p className="small text-muted mb-3">
                                {t('booking.schedule.subtitle')}
                              </p>

                              {error && (
                                <div className="alert alert-danger alert-sm mb-3">{error}</div>
                              )}

                              <div className="row g-3">
                                <div className="col-md-7">
                                  <label className="form-label small fw-bold">{t('booking.schedule.type_label')}</label>
                                  <select
                                    className="form-select"
                                    value={selectedMembershipPlan}
                                    onChange={(e) => setSelectedMembershipPlan(e.target.value)}
                                    disabled={schedulingMembership}
                                  >
                                    <option value="">{t('booking.schedule.select_membership')}</option>
                                    {availableMemberships.map((membership) => (
                                      <option key={membership.id} value={membership.id}>
                                        {membership.membership_nom || membership.nom} - {membership.services_par_mois} {t('memberships.services_per_month')}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-md-5">
                                  <label className="form-label small fw-bold">{t('booking.schedule.duration_label')}</label>
                                  <select
                                    className="form-select"
                                    value={selectedDuration}
                                    onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                                    disabled={schedulingMembership || !selectedMembershipPlan}
                                  >
                                    <option value={1}>
                                      {t('booking.schedule.one_month')} - {selectedMembershipPlan && availableMemberships.find(m => m.id == selectedMembershipPlan)?.prix_mensuel}€
                                    </option>
                                    <option value={3}>
                                      {t('booking.schedule.three_months')} - {selectedMembershipPlan && availableMemberships.find(m => m.id == selectedMembershipPlan)?.prix_3_mois}€
                                    </option>
                                  </select>
                                </div>
                              </div>

                              <button
                                className="btn btn-warning mt-3"
                                onClick={handleScheduleMembership}
                                disabled={!selectedMembershipPlan || schedulingMembership}
                              >
                                {schedulingMembership ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    {t('booking.schedule.saving')}
                                  </>
                                ) : (
                                  <>
                                    <FaCheck className="me-2" />
                                    {t('booking.schedule.button_label')}
                                  </>
                                )}
                              </button>
                            </motion.div>
                          )}

                          <div className="d-flex gap-2 mt-3 flex-wrap">
                            {!isAuthenticated && (
                              <Link to="/client/login" className="btn btn-sm btn-warning">
                                <FaUser className="me-2" />
                                Se connecter
                              </Link>
                            )}
                            <Link to="/services" className="btn btn-sm btn-outline-warning">
                              <FaCrown className="me-2" />
                              Voir les abonnements
                            </Link>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setBookingTab('standard')}
                            >
                              {t('booking.tab.service')}
                            </button>
                          </div>
                        </div>
                      </Alert>
                    </div>
                  )}
                  
                  {/* Only show form if on standard tab OR on membership tab with valid membership */}
                  {(bookingTab === 'standard' || (bookingTab === 'membership' && isAuthenticated && hasActiveMembership())) && (
                  <form onSubmit={handleSubmit} className="booking-form">
                    {/* MEMBERSHIP BANNER - Only show on standard tab */}
                    {bookingTab === 'standard' && isAuthenticated && hasActiveMembership() && (
                      <motion.div 
                        className="alert alert-success border-2 border-success mb-4"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <div className="d-flex align-items-start">
                          <FaCrown className="text-warning me-3" style={{ fontSize: '2rem' }} />
                          <div className="flex-grow-1">
                            <h5 className="mb-2">
                              🎉 Vous avez un abonnement actif!
                            </h5>
                            <p className="mb-2">
                              <strong>Abonnement:</strong> {activeMembership?.membership_nom}<br/>
                              <strong>Services restants:</strong> {activeMembership?.services_restants} / {activeMembership?.services_total}
                            </p>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="useClientMembership"
                                checked={useClientMembership}
                                onChange={(e) => setUseClientMembership(e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor="useClientMembership">
                                <strong>Utiliser mon abonnement</strong> - Pas besoin de sélectionner un service ni de remplir le formulaire de décharge
                              </label>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Service Selection - Hidden if using membership OR on membership tab */}
                    {bookingTab === 'standard' && !useClientMembership && (
                      <>
                        <motion.div
                          className="mb-4"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.6, duration: 0.6 }}
                        >
                          <label className="form-label fw-bold text-green">
                            <FaStar className="me-2" />
                            {t('booking.form.selectService')}
                          </label>
                          
                          {servicesByCategory.length > 0 ? servicesByCategory.map((category) => (
                            <div key={category.id} className="mb-4">
                              <div className="category-header">
                                {category.nom}
                                <small className="ms-2 opacity-75">
                                  ({category.services.length} {category.services.length > 1 ? t('booking.form.services_count_plural') : t('booking.form.services_count')})
                                </small>
                              </div>
                              <div className="row">
                                {category.services.map((service) => (
                                  <div key={service.id} className="col-md-6 mb-3">
                                    <motion.div
                                      className={`service-card ${
                                        selectedService === service.id.toString() 
                                          ? 'selected border-green' 
                                          : 'border border-light'
                                      }`}
                                      onClick={() => handleServiceChange(service.id.toString())}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                          <h6 className="fw-bold text-green mb-1">
                                            {service.nom}
                                          </h6>
                                          <p className="text-muted small mb-2">
                                            {service.description}
                                          </p>
                                          <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center">
                                              <FaClock className="text-green me-1" size={12} />
                                              <span className="small text-muted me-3">
                                                {service.duree} {t('booking.form.duration')}
                                              </span>
                                              <span className="fw-bold text-green">
                                                {service.prix}DT
                                              </span>
                                            </div>
                                            <Link 
                                              to={`/services/${service.id}`}
                                              className="btn btn-sm btn-outline-green text-decoration-none"
                                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <FaInfoCircle className="me-1" size={10} />
                                              {t('booking.form.serviceDetails')}
                                            </Link>
                                          </div>
                                        </div>
                                        <div className={`form-check-input ms-2 ${
                                          selectedService === service.id.toString() ? 'bg-green-500 border-green-500' : ''
                                        }`}>
                                          {selectedService === service.id.toString() && '✓'}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )) : (
                            <div className="text-center py-4">
                              <p className="text-muted">Chargement des services...</p>
                            </div>
                          )}
                        </motion.div>
                      </>
                    )}

                    {/* Personal Information */}
                        <motion.div
                          className="mb-4"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.6 }}
                        >
                          <h5 className="fw-bold text-green mb-3">
                            <FaUser className="me-2" />
                            {t('booking.form.personalInfo')}
                          </h5>
                          
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">{t('booking.form.firstName')}</label>
                              <input
                                type="text"
                                className="form-control form-control-lg"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleInputChange}
                                placeholder={t('booking.form.placeholders.firstName')}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">{t('booking.form.lastName')}</label>
                              <input
                                type="text"
                                className="form-control form-control-lg"
                                name="nom"
                                value={formData.nom}
                                onChange={handleInputChange}
                                placeholder={t('booking.form.placeholders.lastName')}
                              />
                            </div>
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">
                                <FaEnvelope className="me-2" />
                                {t('booking.form.email')}
                              </label>
                              <input
                                type="email"
                                className="form-control form-control-lg"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder={t('booking.form.placeholders.email')}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">
                                <FaPhone className="me-2" />
                                {t('booking.form.phone')} 
                              </label>
                              <input
                                type="tel"
                                className="form-control form-control-lg"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleInputChange}
                                placeholder={t('booking.form.placeholders.phone')}
                              />
                            </div>
                          </div>
                        </motion.div>

                        {/* Date & Time Selection */}
                        <motion.div
                          className="mb-4"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.0, duration: 0.6 }}
                        >
                          <h5 className="fw-bold text-green mb-3">
                            <FaCalendarAlt className="me-2" />
                            {t('booking.form.dateTime.title')}
                          </h5>
                          
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">{t('booking.form.dateTime.date')}</label>
                              <input
                                type="date"
                                className="form-control form-control-lg"
                                name="date_reservation"
                                value={formData.date_reservation}
                                onChange={(e) => handleDateChange(e.target.value)}
                                min={getMinDate()}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">{t('booking.form.dateTime.time')}</label>
                              <select
                                className="form-select form-select-lg"
                                name="heure_reservation"
                                value={formData.heure_reservation}
                                onChange={handleInputChange}
                                disabled={!formData.date_reservation}
                              >
                                <option value="">{t('booking.form.dateTime.selectTime')}</option>
                                {availableSlots.map((slot) => (
                                  <option key={slot} value={slot}>
                                    {slot}
                                  </option>
                                ))}
                              </select>
                              {formData.date_reservation && availableSlots.length === 0 && (
                                <div className="text-muted small mt-1">
                                  {t('booking.form.dateTime.noAvailableSlots')}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>

                        {/* Healing Add-On */}
                        {selectedService && [1, 2, 3].includes(parseInt(selectedService)) && (
                          <motion.div
                            className="mb-4"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 1.1, duration: 0.6 }}
                          >
                            <h5 className="fw-bold text-green mb-3">
                              {t('booking.form.addons.title')}
                            </h5>
                            <div className="form-check p-3 border rounded bg-light">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="healingAddon"
                                name="hasHealingAddon"
                                checked={formData.hasHealingAddon}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label fw-bold ms-2" htmlFor="healingAddon">
                                {t('booking.form.addons.healing.title')} (+50 DT)
                              </label>
                              <p className="text-muted small mb-0 mt-1">
                                {t('booking.form.addons.healing.description')}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Referral Code */}
                        <motion.div
                          className="mb-4"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.2, duration: 0.6 }}
                        >
                          <label className="form-label">{t('booking.form.referralCode.label')}</label>
                          <input
                            type="text"
                            className="form-control"
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleInputChange}
                            placeholder={t('booking.form.referralCode.placeholder')}
                          />
                          <div className="form-text text-muted">
                            {t('booking.form.referralCode.description')}
                          </div>
                        </motion.div>

                        {/* Notes */}
                        <motion.div
                          className="mb-4"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.3, duration: 0.6 }}
                        >
                          <label className="form-label">{t('booking.form.notes.label')}</label>
                          <textarea
                            className="form-control"
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder={t('booking.form.notes.placeholder')}
                          />
                        </motion.div>

                        {/* Waiver Button - Hidden if using membership OR on membership tab */}
                        {bookingTab === 'standard' && !useClientMembership && (
                          <motion.div
                            className="text-center mb-3"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1.4, duration: 0.6 }}
                          >
                            <button
                              type="button"
                              className={`btn ${waiverSubmitted ? 'btn-success' : 'btn-outline-green'} btn-lg px-4 me-3`}
                              onClick={() => setShowWaiverModal(true)}
                            >
                              <FaFileSignature className="me-2" />
                              {waiverSubmitted ? '✅ Décharge complétée' : 'Remplir la décharge'}
                            </button>
                            {waiverSubmitted && (
                              <small className="text-success d-block mt-2">
                                ✓ Votre décharge a été enregistrée avec succès
                              </small>
                            )}
                          </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.div
                          className="text-center"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 1.5, duration: 0.6 }}
                        >
                          <button
                            type="submit"
                            className="btn btn-green text-white btn-lg px-5"
                            disabled={loading || !selectedService || !formData.date_reservation || !formData.heure_reservation}
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
                        </motion.div>
                      </form>
                  )}
                  {/* End of conditional form rendering */}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <FaCalendarAlt className="text-green mb-3" size={40} />
                <h5 className="fw-bold text-green">{t('booking.easyBooking.title')}</h5>
                <p className="text-muted">
                  {t('booking.easyBooking.description')}
                </p>
              </motion.div>
            </div>
            <div className="col-md-4 text-center mb-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <FaPhone className="text-green mb-3" size={40} />
                <h5 className="fw-bold text-green">{t('booking.supportAvailable.title')}</h5>
                <p className="text-muted">
                  {t('booking.supportAvailable.description')}
                </p>
              </motion.div>
            </div>
            <div className="col-md-4 text-center mb-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <FaSave className="text-green mb-3" size={40} />
                <h5 className="fw-bold text-green">{t('booking.smartSave.title')}</h5>
                <p className="text-muted">
                  {t('booking.smartSave.description')}
                </p>
              </motion.div>
            </div>
            <div className="col-md-4 text-center mb-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <FaCheck className="text-green mb-3" size={40} />
                <h5 className="fw-bold text-green">{t('booking.autoReminder.title')}</h5>
                <p className="text-muted">
                  {t('booking.autoReminder.description')}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Waiver Modal */}
      {showWaiverModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowWaiverModal(false)}
        >
          <div 
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header bg-green text-white">
                <h5 className="modal-title">
                  <FaFileSignature className="me-2" />
                  {t('booking.waiver.title')}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowWaiverModal(false)}
                ></button>
              </div>
              <div className="modal-body p-0">
                <CompleteJotForm
                  onFormReady={handleWaiverDataReady}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWaiverModal(false)}
                >
                  {t('booking.waiver.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
