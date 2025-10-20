import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt,
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaCheck,
  FaTimes,
  FaClock,
  FaCalendarCheck,
  FaSave,
  FaUser,
  FaClipboardCheck,
  FaFileSignature
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import WaiverModal from '../../components/WaiverModal';

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [dateFilter, setDateFilter] = useState('tous');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [editFormData, setEditFormData] = useState({
    statut: '',
    service_id: '',
    client_nom: '',
    client_prenom: '',
    client_telephone: '',
    client_email: '',
    notes_client: '',
    heure_debut: '',
    heure_fin: ''
  });
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    service_id: '',
    date_reservation: '',
    heure_debut: '',
    heure_fin: '',
    client_nom: '',
    client_prenom: '',
    client_telephone: '',
    client_email: '',
    notes_client: '',
    statut: 'en_attente'
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New state for pills and pending actions
  const [activePill, setActivePill] = useState('all');
  const [pendingActions, setPendingActions] = useState([]);
  const [pendingActionsLoading, setPendingActionsLoading] = useState(false);

  // Multi-service state
  const [selectedServices, setSelectedServices] = useState([]); // For create modal
  const [editSelectedServices, setEditSelectedServices] = useState([]); // For edit modal
  const [showServiceSelector, setShowServiceSelector] = useState(false);

  useEffect(() => {
    fetchReservations();
    fetchServices();
  }, [dateFilter, statusFilter, activePill]);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm]);

  // New effect for pending actions
  useEffect(() => {
    if (activePill === 'admin_approval') {
      fetchPendingActions();
    }
  }, [activePill]);

  const fetchServices = async () => {
    try {
      const response = await adminAPI.getServicesAdmin();
      setServices(response.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
    }
  };

  const fetchPendingActions = async () => {
    try {
      setPendingActionsLoading(true);
      const response = await adminAPI.getPendingActionReservations();
      setPendingActions(response.data?.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des actions en attente:', error);
      setPendingActions([]);
    } finally {
      setPendingActionsLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on filters and active pill
      const filters = {};
      
      if (dateFilter && dateFilter !== 'tous') {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);
        
        switch (dateFilter) {
          case 'aujourd_hui':
            filters.date = today;
            break;
          case 'demain':
            filters.date = tomorrow;
            break;
          case 'ce_mois':
            filters.date_debut = `${thisMonth}-01`;
            filters.date_fin = `${thisMonth}-31`;
            break;
          case 'cette_semaine':
            const startOfWeek = new Date();
            const endOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
            filters.date_debut = startOfWeek.toISOString().split('T')[0];
            filters.date_fin = endOfWeek.toISOString().split('T')[0];
            break;
        }
      }
      
      // Apply pill-based filtering
      if (activePill === 'drafts') {
        filters.reservation_status = 'draft';
      } else if (activePill === 'admin_approval') {
        filters.statut = 'confirmee';
        // For admin approval, we want past due reservations
        const now = new Date();
        filters.date_max = now.toISOString().split('T')[0];
        filters.time_max = now.toTimeString().split(' ')[0];
      } else {
        // All reservations - exclude drafts
        filters.exclude_drafts = true;
      }
      
      if (statusFilter && statusFilter !== 'tous' && activePill !== 'drafts' && activePill !== 'admin_approval') {
        filters.statut = statusFilter;
      }
      
      const response = await adminAPI.getReservations(filters);
      const data = response.data;
      
      // Transform data to match frontend expectations
      const transformedReservations = data.map(reservation => ({
        id: reservation.id,
        client: {
          nom: reservation.client_nom?.split(' ').pop() || '',
          prenom: reservation.client_nom?.split(' ')[0] || '',
          telephone: reservation.client_telephone || '',
          email: reservation.client_email || ''
        },
        service: {
          nom: reservation.service_nom,
          duree: reservation.service_duree,
          prix: reservation.prix_final
        },
        date_reservation: reservation.date_reservation,
        heure_reservation: reservation.heure_debut,
        statut: reservation.statut,
        notes: reservation.notes_client || '',
        is_draft: reservation.is_draft || reservation.statut === 'draft',
        session_id: reservation.session_id,
        created_at: reservation.date_creation,
        jotform_submission_id: reservation.jotform_submission_id,
        reminder_sent: reservation.reminder_sent,
        reminder_sent_at: reservation.reminder_sent_at
      }));
      
      setReservations(transformedReservations);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    // Only filter by search term since status and date filters are handled on backend
    if (searchTerm) {
      filtered = filtered.filter(res => 
        res.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.service.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.client.telephone.includes(searchTerm)
      );
    }

    setFilteredReservations(filtered);
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      'draft': { bg: 'light text-dark', text: 'Brouillon', icon: FaEdit },
      'en_attente': { bg: 'warning', text: 'En attente', icon: FaClock },
      'confirmee': { bg: 'success', text: 'Confirmée', icon: FaCheck },
      'en_cours': { bg: 'primary', text: 'En cours', icon: FaClipboardCheck },
      'terminee': { bg: 'info', text: 'Terminée', icon: FaCalendarCheck },
      'annulee': { bg: 'danger', text: 'Annulée', icon: FaTimes },
      'absent': { bg: 'secondary', text: 'Absent', icon: FaUser }
    };
    
    const config = statusConfig[statut] || { bg: 'secondary', text: 'Inconnu', icon: FaEdit };
    const IconComponent = config.icon;
    
    return (
      <span className={`badge bg-${config.bg} d-flex align-items-center gap-1`}>
        <IconComponent size={12} />
        {config.text}
      </span>
    );
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      setIsUpdating(true);
      await adminAPI.updateReservationStatus(reservationId, newStatus);
      
      // Update local state
      setReservations(prev => prev.map(res => 
        res.id === reservationId ? { ...res, statut: newStatus } : res
      ));
      
      // Show success message
      alert('Statut mis à jour avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (reservation) => {
    setSelectedReservation(reservation);
    setEditFormData({
      statut: reservation.statut,
      service_id: reservation.service_id || '',
      client_nom: reservation.client.nom,
      client_prenom: reservation.client.prenom,
      client_telephone: reservation.client.telephone,
      client_email: reservation.client.email,
      notes_client: reservation.notes || '',
      heure_debut: reservation.heure_reservation || '',
      heure_fin: reservation.heure_fin || ''
    });
    
    // Load existing services if using items table
    if (reservation.uses_items_table && reservation.items) {
      setEditSelectedServices(reservation.items.map(item => ({
        service_id: item.service_id,
        item_type: item.item_type,
        prix: parseFloat(item.prix),
        notes: item.notes || '',
        service_nom: item.service_nom,
        service_duree: item.service_duree,
        id: item.id // Keep the reservation_item id for updates
      })));
    } else {
      setEditSelectedServices([]);
    }
    
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReservation) return;

    try {
      setIsUpdating(true);
      
      // Update reservation status and details
      await adminAPI.updateReservationStatus(
        selectedReservation.id, 
        editFormData.statut, 
        editFormData.notes_client
      );

      // Update client details, service, and time if provided
      const updateData = {};
      if (editFormData.client_nom) updateData.client_nom = editFormData.client_nom;
      if (editFormData.client_prenom) updateData.client_prenom = editFormData.client_prenom;
      if (editFormData.client_telephone) updateData.client_telephone = editFormData.client_telephone;
      if (editFormData.client_email) updateData.client_email = editFormData.client_email;
      if (editFormData.notes_client) updateData.notes_client = editFormData.notes_client;
      if (editFormData.heure_debut) updateData.heure_debut = editFormData.heure_debut;
      if (editFormData.heure_fin) updateData.heure_fin = editFormData.heure_fin;
      
      // Multi-service update
      if (editSelectedServices.length > 0) {
        updateData.services = editSelectedServices.map(s => ({
          service_id: s.service_id,
          item_type: s.item_type,
          prix: s.prix,
          notes: s.notes || null
        }));
      } else if (editFormData.service_id && editFormData.service_id !== selectedReservation.service_id) {
        // Fallback to single service update
        updateData.service_id = editFormData.service_id;
      }
      
      if (Object.keys(updateData).length > 0) {
        await adminAPI.updateReservation(selectedReservation.id, updateData);
      }

      // Refresh reservations
      await fetchReservations();
      
      // Close modal and show success
      setShowEditModal(false);
      setEditSelectedServices([]);
      alert('Réservation mise à jour avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de la réservation');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConvertDraft = async (reservationId) => {
    try {
      const response = await adminAPI.convertDraftReservation(reservationId);
      if (response.data) {
        // Refresh the reservations list
        fetchReservations();
        // Show success message
        alert('Brouillon converti en réservation confirmée !');
      }
    } catch (error) {
      console.error('Erreur lors de la conversion du brouillon:', error);
      alert('Erreur lors de la conversion du brouillon');
    }
  };

  const handleDelete = (reservationId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      setReservations(prev => prev.filter(res => res.id !== reservationId));
    }
  };

  const openModal = (reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setCreateFormData({
      service_id: '',
      date_reservation: '',
      heure_debut: '',
      heure_fin: '',
      client_nom: '',
      client_prenom: '',
      client_telephone: '',
      client_email: '',
      notes_client: '',
      statut: 'en_attente'
    });
    setSelectedServices([]); // Reset selected services
    setShowCreateModal(true);
  };

  // Multi-service helper functions
  const addServiceToList = (serviceId, isForEdit = false) => {
    const service = services.find(s => s.id === parseInt(serviceId));
    if (!service) return;

    const serviceItem = {
      service_id: service.id,
      item_type: 'main',
      prix: parseFloat(service.prix),
      notes: '',
      service_nom: service.nom,
      service_duree: service.duree
    };

    if (isForEdit) {
      setEditSelectedServices(prev => [...prev, serviceItem]);
    } else {
      setSelectedServices(prev => [...prev, serviceItem]);
    }
  };

  const removeServiceFromList = (index, isForEdit = false) => {
    if (isForEdit) {
      setEditSelectedServices(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedServices(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateServiceNotes = (index, notes, isForEdit = false) => {
    if (isForEdit) {
      setEditSelectedServices(prev => prev.map((item, i) => 
        i === index ? { ...item, notes } : item
      ));
    } else {
      setSelectedServices(prev => prev.map((item, i) => 
        i === index ? { ...item, notes } : item
      ));
    }
  };

  const calculateTotalPrice = (servicesList) => {
    return servicesList.reduce((sum, item) => sum + parseFloat(item.prix || 0), 0).toFixed(2);
  };

  const calculateTotalDuration = (servicesList) => {
    return servicesList.reduce((sum, item) => sum + parseInt(item.service_duree || 0), 0);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      
      // Validate that at least one service is selected
      if (selectedServices.length === 0) {
        alert('Veuillez sélectionner au moins un service');
        setIsCreating(false);
        return;
      }

      // Create the reservation with multi-service support
      const reservationData = {
        // Multi-service data
        services: selectedServices.map(s => ({
          service_id: s.service_id,
          item_type: s.item_type,
          prix: s.prix,
          notes: s.notes || null
        })),
        date_reservation: createFormData.date_reservation,
        heure_debut: createFormData.heure_debut,
        heure_fin: createFormData.heure_fin,
        nom: createFormData.client_nom,
        prenom: createFormData.client_prenom,
        telephone: createFormData.client_telephone,
        email: createFormData.client_email,
        notes_client: createFormData.notes_client,
        statut: createFormData.statut
      };

      await adminAPI.createReservation(reservationData);

      // Refresh reservations
      await fetchReservations();
      
      // Close modal and show success
      setShowCreateModal(false);
      setSelectedServices([]);
      alert('Réservation créée avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la réservation');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateInputChange = (field, value) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePillChange = (pillType) => {
    setActivePill(pillType);
    setStatusFilter('tous'); // Reset status filter when changing pills
    setDateFilter('tous'); // Reset date filter when changing pills
  };

  const handleAction = async (reservationId, action) => {
    try {
      setIsUpdating(true);
      await adminAPI.updateReservationAction(reservationId, action);
      
      // Update local state
      setReservations(prev => prev.map(res => 
        res.id === reservationId ? { ...res, statut: action === 'completed' ? 'terminee' : 'no_show' } : res
      ));
      
      // Remove from pending actions if it was there
      setPendingActions(prev => prev.filter(res => res.id !== reservationId));
      
      // Refresh data
      await fetchReservations();
      if (activePill === 'admin_approval') {
        await fetchPendingActions();
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'action:', error);
      alert('Erreur lors de la mise à jour de la réservation');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-pink-500 mb-3" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-muted">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-reservations">
      {/* Header */}
      <motion.div
        className="page-header mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="row align-items-center">
          <div className="col">
            <h1 className="h3 fw-bold text-dark mb-1">
              <FaCalendarAlt className="text-primary me-2" />
              Réservations
            </h1>
            <p className="text-muted mb-0">
              Gérez les rendez-vous de votre salon
            </p>
          </div>
          <div className="col-auto">
            <motion.button
              className="btn btn-pink"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
            >
              <FaPlus className="me-2" />
              Nouvelle réservation
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="filters-section mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Pills Navigation */}
        <div className="d-flex gap-2 mb-3">
          <button
            className={`btn ${activePill === 'all' ? 'btn-primary' : 'btn-outline-primary'} rounded-pill px-4`}
            onClick={() => handlePillChange('all')}
          >
            Toutes les réservations
            {activePill === 'all' && (
              <span className="badge bg-white text-primary ms-2">{filteredReservations.length}</span>
            )}
          </button>
          <button
            className={`btn ${activePill === 'drafts' ? 'btn-warning' : 'btn-outline-warning'} rounded-pill px-4`}
            onClick={() => handlePillChange('drafts')}
          >
            Brouillons
            {activePill === 'drafts' && (
              <span className="badge bg-white text-warning ms-2">{filteredReservations.length}</span>
            )}
          </button>
          <button
            className={`btn ${activePill === 'admin_approval' ? 'btn-danger' : 'btn-outline-danger'} rounded-pill px-4`}
            onClick={() => handlePillChange('admin_approval')}
          >
            Action requise
            {activePill === 'admin_approval' && (
              <span className="badge bg-white text-danger ms-2">{filteredReservations.length}</span>
            )}
          </button>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Rechercher par nom ou service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {activePill !== 'drafts' && activePill !== 'admin_approval' && (
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="tous">Tous les statuts</option>
                    <option value="en_attente">En attente</option>
                    <option value="confirmee">Confirmée</option>
                    <option value="en_cours">En cours</option>
                    <option value="terminee">Terminée</option>
                    <option value="annulee">Annulée</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              )}
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="tous">Toutes les dates</option>
                  <option value="aujourd_hui">Aujourd'hui</option>
                  <option value="demain">Demain</option>
                  <option value="cette_semaine">Cette semaine</option>
                </select>
              </div>
              <div className="col-md-2">
                <span className="badge bg-light text-dark fs-6 w-100 py-2">
                  {filteredReservations.length} résultat(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pending Actions Section */}
      {activePill === 'admin_approval' && (
        <motion.div
          className="pending-actions-section mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="card border-danger shadow-sm">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">
                <FaClock className="me-2" />
                Actions requises ({pendingActions.length})
              </h5>
            </div>
            <div className="card-body">
              {pendingActionsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-danger" />
                </div>
              ) : !Array.isArray(pendingActions) || pendingActions.length === 0 ? (
                <p className="text-muted mb-0">Aucune action requise pour le moment.</p>
              ) : (
                <div className="row g-3">
                  {pendingActions.map(reservation => (
                    <div key={reservation.id} className="col-md-6 col-lg-4">
                      <div className="card border-warning">
                        <div className="card-body">
                          <h6 className="card-title text-danger">
                            {reservation.client_nom}
                          </h6>
                          <p className="card-text mb-2">
                            <strong>Service:</strong> {reservation.service_nom}<br/>
                            <strong>Date:</strong> {new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}<br/>
                            <strong>Heure:</strong> {reservation.heure_debut}<br/>
                            <strong>Tél:</strong> {reservation.client_telephone}
                          </p>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleAction(reservation.id, 'completed')}
                              disabled={isUpdating}
                            >
                              <FaCheck className="me-1" />
                              Terminée
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleAction(reservation.id, 'no_show')}
                              disabled={isUpdating}
                            >
                              <FaTimes className="me-1" />
                              No-show
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Reservations Table */}
      <motion.div
        className="reservations-table"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 px-4 py-3">Cliente</th>
                    <th className="border-0 py-3">Service</th>
                    <th className="border-0 py-3">Date & Heure</th>
                    <th className="border-0 py-3">Statut</th>
                    <th className="border-0 py-3">Prix</th>
                    <th className="border-0 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <FaCalendarAlt className="mb-3" size={48} />
                        <p className="mb-0">Aucune réservation trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((reservation, index) => (
                      <motion.tr
                        key={reservation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.05, duration: 0.4 }}
                        className="border-bottom"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <strong className="text-dark">
                                {reservation.is_draft ? (
                                  <span className="badge bg-warning text-dark me-2">DRAFT</span>
                                ) : null}
                                {reservation.client.prenom} {reservation.client.nom}
                              </strong>
                              <motion.button
                                className="btn btn-outline-primary"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => openModal(reservation)}
                                title="Voir détails"
                                style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px',
                                  minWidth: 'auto',
                                  height: '20px'
                                }}
                              >
                                <FaEye size={10} />
                              </motion.button>
                            </div>
                            <div className="small text-muted">
                              {reservation.client.telephone}
                            </div>
                            <div className="small text-muted">
                              {reservation.client.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            {reservation.uses_items_table && reservation.items ? (
                              <>
                                <span className="fw-semibold">
                                  {reservation.items.length} service(s)
                                </span>
                                <div className="small text-muted">
                                  {reservation.items.map((item, idx) => (
                                    <div key={idx}>• {item.service_nom}</div>
                                  ))}
                                </div>
                                <div className="small text-primary mt-1">
                                  <FaClock className="me-1" size={12} />
                                  {reservation.total_duration || calculateTotalDuration(reservation.items)} min total
                                </div>
                              </>
                            ) : reservation.service ? (
                              <>
                                <span className="fw-semibold">{reservation.service.nom}</span>
                                <div className="small text-muted">
                                  <FaClock className="me-1" size={12} />
                                  {reservation.service.duree} min
                                </div>
                              </>
                            ) : (
                              <span className="text-muted">Service non disponible</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <span className="fw-semibold">
                              {new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}
                            </span>
                            <div className="small text-muted">
                              {reservation.heure_reservation}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          {getStatusBadge(reservation.statut)}
                        </td>
                        <td className="py-3">
                          <span className="fw-bold text-success">
                            {reservation.uses_items_table && reservation.items ? (
                              <>
                                {calculateTotalPrice(reservation.items)}DT
                                <div className="small text-muted">
                                  ({reservation.items.length} service(s))
                                </div>
                              </>
                            ) : reservation.service ? (
                              <>{reservation.service.prix}DT</>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex gap-1 flex-wrap">
                            <motion.button
                              className="btn btn-sm btn-outline-primary"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openModal(reservation)}
                              title="Voir détails"
                            >
                              <FaEye size={12} />
                            </motion.button>

                            <motion.button
                              className="btn btn-sm btn-outline-warning"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openEditModal(reservation)}
                              title="Modifier statut et détails"
                              disabled={isUpdating}
                            >
                              <FaEdit size={12} />
                            </motion.button>
                            
                            {reservation.is_draft ? (
                              <motion.button
                                className="btn btn-sm btn-outline-success"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleConvertDraft(reservation.id)}
                                title="Convertir en réservation"
                                disabled={isUpdating}
                              >
                                <FaCalendarCheck size={12} />
                              </motion.button>
                            ) : (
                              <>
                                {reservation.statut === 'en_attente' && (
                                  <motion.button
                                    className="btn btn-sm btn-outline-success"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatusChange(reservation.id, 'confirmee')}
                                    title="Confirmer"
                                    disabled={isUpdating}
                                  >
                                    <FaCheck size={12} />
                                  </motion.button>
                                )}
                                
                                {['en_attente', 'confirmee'].includes(reservation.statut) && (
                                  <motion.button
                                    className="btn btn-sm btn-outline-danger"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatusChange(reservation.id, 'annulee')}
                                    title="Annuler"
                                    disabled={isUpdating}
                                  >
                                    <FaTimes size={12} />
                                  </motion.button>
                                )}
                              </>
                            )}
                            
                            <motion.button
                              className="btn btn-sm btn-outline-info"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Appeler"
                            >
                              <FaPhone size={12} />
                            </motion.button>
                            
                            <motion.button
                              className="btn btn-sm btn-outline-secondary"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(reservation.id)}
                              title="Supprimer"
                              disabled={isUpdating}
                            >
                              <FaTrash size={12} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de détails */}
      {showModal && selectedReservation && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <FaCalendarCheck className="text-primary me-2" />
                  Détails de la réservation #{selectedReservation.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">Informations client</h6>
                    <div className="mb-2">
                      <strong>Nom:</strong> {selectedReservation.client.prenom} {selectedReservation.client.nom}
                    </div>
                    <div className="mb-2">
                      <strong>Email:</strong> {selectedReservation.client.email}
                    </div>
                    <div className="mb-3">
                      <strong>Téléphone:</strong> {selectedReservation.client.telephone}
                    </div>
                    
                    <h6 className="fw-bold text-primary mb-3">
                      Service{selectedReservation.uses_items_table && selectedReservation.items?.length > 1 ? 's' : ''}
                    </h6>
                    {selectedReservation.uses_items_table && selectedReservation.items ? (
                      <>
                        {selectedReservation.items.map((item, idx) => (
                          <div key={idx} className="mb-3 p-2 bg-light rounded">
                            <div className="mb-1">
                              <strong>{idx + 1}. {item.service_nom}</strong>
                              {item.item_type === 'addon' && (
                                <span className="badge bg-info ms-2">Add-on</span>
                              )}
                            </div>
                            <div className="mb-1">
                              <strong>Durée:</strong> {item.service_duree} minutes
                            </div>
                            <div className="mb-1">
                              <strong>Prix:</strong> {item.prix}DT
                            </div>
                            {item.notes && (
                              <div className="small text-muted">
                                <strong>Notes:</strong> {item.notes}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="mb-3 p-2 bg-primary bg-opacity-10 rounded">
                          <div className="d-flex justify-content-between">
                            <strong>Durée totale:</strong>
                            <strong>{selectedReservation.total_duration || calculateTotalDuration(selectedReservation.items)} minutes</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <strong>Prix total:</strong>
                            <strong className="text-success">{calculateTotalPrice(selectedReservation.items)}DT</strong>
                          </div>
                        </div>
                      </>
                    ) : selectedReservation.service ? (
                      <>
                        <div className="mb-2">
                          <strong>Service:</strong> {selectedReservation.service.nom}
                        </div>
                        <div className="mb-2">
                          <strong>Durée:</strong> {selectedReservation.service.duree} minutes
                        </div>
                        <div className="mb-3">
                          <strong>Prix:</strong> {selectedReservation.service.prix}DT
                        </div>
                      </>
                    ) : (
                      <div className="text-muted">Aucun service associé</div>
                    )}
                  </div>
                  
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">Rendez-vous</h6>
                    <div className="mb-2">
                      <strong>Date:</strong> {new Date(selectedReservation.date_reservation).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="mb-2">
                      <strong>Heure:</strong> {selectedReservation.heure_reservation}
                    </div>
                    <div className="mb-2">
                      <strong>Statut:</strong> {getStatusBadge(selectedReservation.statut)}
                    </div>
                    <div className="mb-3">
                      <strong>Réservé le:</strong> {new Date(selectedReservation.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    
                    {selectedReservation.notes && (
                      <>
                        <h6 className="fw-bold text-primary mb-3">Notes client</h6>
                        <div className="bg-light p-3 rounded mb-3">
                          {selectedReservation.notes}
                        </div>
                      </>
                    )}
                    
                    {selectedReservation.notes_admin && (
                      <>
                        <h6 className="fw-bold text-warning mb-3">Notes administrateur</h6>
                        <div className="bg-warning bg-opacity-10 p-3 rounded">
                          {selectedReservation.notes_admin}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <div className="d-flex gap-2 w-100">
                  {selectedReservation.jotform_submission_id && (
                    <button 
                      className="btn btn-info"
                      onClick={() => {
                        setCurrentSubmissionId(selectedReservation.jotform_submission_id);
                        setShowWaiverModal(true);
                      }}
                    >
                      <FaFileSignature className="me-2" />
                      Voir Décharge
                    </button>
                  )}
                  <button className="btn btn-outline-success">
                    <FaPhone className="me-2" />
                    Appeler
                  </button>
                  <button className="btn btn-outline-primary">
                    <FaEnvelope className="me-2" />
                    Email
                  </button>
                  <button 
                    className="btn btn-outline-warning"
                    onClick={() => {
                      setShowModal(false);
                      openEditModal(selectedReservation);
                    }}
                  >
                    <FaEdit className="me-2" />
                    Modifier
                  </button>
                  <button
                    className="btn btn-secondary ms-auto"
                    onClick={() => setShowModal(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedReservation && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <FaEdit className="text-warning me-2" />
                  Modifier la réservation #{selectedReservation.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                />
              </div>
              
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="row">
                    {/* Status Section */}
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">
                        <FaClipboardCheck className="me-2" />
                        Statut de la réservation
                      </h6>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Statut actuel</label>
                        <div className="mb-2">
                          {getStatusBadge(selectedReservation.statut)}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Nouveau statut</label>
                        <select
                          className="form-select"
                          value={editFormData.statut}
                          onChange={(e) => handleInputChange('statut', e.target.value)}
                          required
                        >
                          <option value="draft">Brouillon</option>
                          <option value="en_attente">En attente</option>
                          <option value="confirmee">Confirmée</option>
                          <option value="en_cours">En cours</option>
                          <option value="terminee">Terminée</option>
                          <option value="annulee">Annulée</option>
                          <option value="no_show">Absent (No-show)</option>
                        </select>
                        <div className="form-text">
                          Sélectionnez le nouveau statut pour cette réservation
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Notes client</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={editFormData.notes_client}
                          onChange={(e) => handleInputChange('notes_client', e.target.value)}
                          placeholder="Notes ou demandes spéciales du client..."
                        />
                      </div>

                      {/* Multi-Service Management */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Services 
                          <small className="text-muted ms-2">({editSelectedServices.length} service(s))</small>
                        </label>
                        
                        {/* Service Selector */}
                        <div className="input-group mb-2">
                          <select
                            className="form-select"
                            onChange={(e) => {
                              if (e.target.value) {
                                addServiceToList(e.target.value, true);
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">+ Ajouter un service</option>
                            {services.map(service => (
                              <option key={service.id} value={service.id}>
                                {service.nom} - {service.prix}DT ({service.duree}min)
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Selected Services List */}
                        {editSelectedServices.length > 0 ? (
                          <div className="border rounded p-2 mb-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {editSelectedServices.map((service, index) => (
                              <div key={index} className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2">
                                <div className="flex-grow-1">
                                  <strong>{service.service_nom}</strong>
                                  <div className="small text-muted">
                                    {service.prix}DT • {service.service_duree}min
                                    {service.item_type === 'addon' && <span className="badge bg-info ms-1">Add-on</span>}
                                  </div>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm mt-1"
                                    placeholder="Notes (optionnel)"
                                    value={service.notes}
                                    onChange={(e) => updateServiceNotes(index, e.target.value, true)}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger ms-2"
                                  onClick={() => removeServiceFromList(index, true)}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="alert alert-info mb-2">
                            <small>Aucun service. Ajoutez des services ci-dessus.</small>
                          </div>
                        )}
                        
                        {/* Totals Display */}
                        {editSelectedServices.length > 0 && (
                          <div className="bg-primary bg-opacity-10 p-2 rounded">
                            <div className="d-flex justify-content-between">
                              <span className="fw-bold">Prix total:</span>
                              <span className="text-primary fw-bold">{calculateTotalPrice(editSelectedServices)} DT</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="fw-bold">Durée totale:</span>
                              <span className="text-primary fw-bold">{calculateTotalDuration(editSelectedServices)} min</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="form-text">
                          Modifiez la liste des services pour cette réservation
                        </div>
                      </div>
                    </div>

                    {/* Client Details Section */}
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">
                        <FaUser className="me-2" />
                        Détails du client
                      </h6>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Prénom</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.client_prenom}
                          onChange={(e) => handleInputChange('client_prenom', e.target.value)}
                          placeholder="Prénom du client"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Nom</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.client_nom}
                          onChange={(e) => handleInputChange('client_nom', e.target.value)}
                          placeholder="Nom du client"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Téléphone</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={editFormData.client_telephone}
                          onChange={(e) => handleInputChange('client_telephone', e.target.value)}
                          placeholder="Numéro de téléphone"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={editFormData.client_email}
                          onChange={(e) => handleInputChange('client_email', e.target.value)}
                          placeholder="Adresse email"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Info (Read-only) */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <h6 className="fw-bold text-primary mb-3">Informations de la réservation</h6>
                      <div className="bg-light p-3 rounded">
                        <div className="row">
                          <div className="col-md-4">
                            <strong>Service:</strong> {selectedReservation.service.nom}
                          </div>
                          <div className="col-md-4">
                            <strong>Date:</strong> {new Date(selectedReservation.date_reservation).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="col-md-4">
                            <strong>Heure:</strong> {selectedReservation.heure_reservation}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-0">
                  <div className="d-flex gap-2 w-100">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditModal(false)}
                      disabled={isUpdating}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Sauvegarder les modifications
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <FaPlus className="text-success me-2" />
                  Nouvelle réservation
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                />
              </div>
              
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body">
                  <div className="row">
                    {/* Reservation Details Section */}
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">
                        <FaCalendarAlt className="me-2" />
                        Détails de la réservation
                      </h6>
                      
                      {/* Multi-Service Selection */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Services <span className="text-danger">*</span>
                          <small className="text-muted ms-2">({selectedServices.length} sélectionné(s))</small>
                        </label>
                        
                        {/* Service Selector */}
                        <div className="input-group mb-2">
                          <select
                            className="form-select"
                            onChange={(e) => {
                              if (e.target.value) {
                                addServiceToList(e.target.value, false);
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">+ Ajouter un service</option>
                            {services.map(service => (
                              <option key={service.id} value={service.id}>
                                {service.nom} - {service.prix}DT ({service.duree}min)
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Selected Services List */}
                        {selectedServices.length > 0 ? (
                          <div className="border rounded p-2 mb-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {selectedServices.map((service, index) => (
                              <div key={index} className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2">
                                <div className="flex-grow-1">
                                  <strong>{service.service_nom}</strong>
                                  <div className="small text-muted">
                                    {service.prix}DT • {service.service_duree}min
                                  </div>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm mt-1"
                                    placeholder="Notes (optionnel)"
                                    value={service.notes}
                                    onChange={(e) => updateServiceNotes(index, e.target.value, false)}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger ms-2"
                                  onClick={() => removeServiceFromList(index, false)}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="alert alert-warning mb-2">
                            <small>Aucun service sélectionné. Veuillez ajouter au moins un service.</small>
                          </div>
                        )}
                        
                        {/* Totals Display */}
                        {selectedServices.length > 0 && (
                          <div className="bg-primary bg-opacity-10 p-2 rounded">
                            <div className="d-flex justify-content-between">
                              <span className="fw-bold">Prix total:</span>
                              <span className="text-primary fw-bold">{calculateTotalPrice(selectedServices)} DT</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="fw-bold">Durée totale:</span>
                              <span className="text-primary fw-bold">{calculateTotalDuration(selectedServices)} min</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Date <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          value={createFormData.date_reservation}
                          onChange={(e) => handleCreateInputChange('date_reservation', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Heure début <span className="text-danger">*</span></label>
                        <input
                          type="time"
                          className="form-control"
                          value={createFormData.heure_debut}
                          onChange={(e) => handleCreateInputChange('heure_debut', e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Heure fin</label>
                        <input
                          type="time"
                          className="form-control"
                          value={createFormData.heure_fin}
                          onChange={(e) => handleCreateInputChange('heure_fin', e.target.value)}
                        />
                        <div className="form-text">
                          L'heure de fin sera calculée automatiquement selon la durée totale des services
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Statut initial</label>
                        <select
                          className="form-select"
                          value={createFormData.statut}
                          onChange={(e) => handleCreateInputChange('statut', e.target.value)}
                        >
                          <option value="draft">Brouillon</option>
                          <option value="en_attente">En attente</option>
                          <option value="confirmee">Confirmée</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Notes client</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={createFormData.notes_client}
                          onChange={(e) => handleCreateInputChange('notes_client', e.target.value)}
                          placeholder="Notes ou demandes spéciales du client..."
                        />
                      </div>
                    </div>

                    {/* Client Details Section */}
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">
                        <FaUser className="me-2" />
                        Informations du client
                      </h6>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Prénom <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={createFormData.client_prenom}
                          onChange={(e) => handleCreateInputChange('client_prenom', e.target.value)}
                          placeholder="Prénom du client"
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Nom <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={createFormData.client_nom}
                          onChange={(e) => handleCreateInputChange('client_nom', e.target.value)}
                          placeholder="Nom du client"
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Téléphone <span className="text-danger">*</span></label>
                        <input
                          type="tel"
                          className="form-control"
                          value={createFormData.client_telephone}
                          onChange={(e) => handleCreateInputChange('client_telephone', e.target.value)}
                          placeholder="Numéro de téléphone"
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className="form-control"
                          value={createFormData.client_email}
                          onChange={(e) => handleCreateInputChange('client_email', e.target.value)}
                          placeholder="Adresse email"
                          required
                        />
                      </div>

                      <div className="alert alert-info">
                        <small>
                          <strong>Note:</strong> Si le client existe déjà avec cet email, 
                          ses informations seront mises à jour. Sinon, un nouveau client sera créé.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-0">
                  <div className="d-flex gap-2 w-100">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCreateModal(false)}
                      disabled={isCreating}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success d-flex align-items-center gap-2"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          Création...
                        </>
                      ) : (
                        <>
                          <FaPlus />
                          Créer la réservation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}

      {/* Waiver Modal */}
      {showWaiverModal && currentSubmissionId && (
        <WaiverModal
          submissionId={currentSubmissionId}
          onClose={() => {
            setShowWaiverModal(false);
            setCurrentSubmissionId(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminReservations;
