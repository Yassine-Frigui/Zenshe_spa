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
  FaCalendarCheck
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [dateFilter, setDateFilter] = useState('tous');
  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on filters
      const filters = {};
      
      if (dateFilter && dateFilter !== 'tous') {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);
        
        switch (dateFilter) {
          case 'aujourd_hui':
            filters.date = today;
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
      
      if (statusFilter && statusFilter !== 'tous') {
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
        created_at: reservation.date_creation
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
      'en_attente': { bg: 'warning', text: 'En attente' },
      'confirmee': { bg: 'success', text: 'Confirmée' },
      'en_cours': { bg: 'primary', text: 'En cours' },
      'terminee': { bg: 'info', text: 'Terminée' },
      'annulee': { bg: 'danger', text: 'Annulée' },
      'no_show': { bg: 'secondary', text: 'Absent' },
      'draft': { bg: 'light text-dark', text: 'Brouillon' }
    };
    
    const config = statusConfig[statut] || { bg: 'secondary', text: 'Inconnu' };
    return <span className={`badge bg-${config.bg}`}>{config.text}</span>;
  };

  const handleStatusChange = (reservationId, newStatus) => {
    setReservations(prev => prev.map(res => 
      res.id === reservationId ? { ...res, statut: newStatus } : res
    ));
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
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="draft">Brouillons</option>
                  <option value="en_attente">En attente</option>
                  <option value="confirmee">Confirmée</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                  <option value="annulee">Annulée</option>
                  <option value="no_show">Absent</option>
                </select>
              </div>
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
                            <span className="fw-semibold">{reservation.service.nom}</span>
                            <div className="small text-muted">
                              <FaClock className="me-1" size={12} />
                              {reservation.service.duree} min
                            </div>
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
                            {reservation.service.prix}DT
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex gap-1">
                            <motion.button
                              className="btn btn-sm btn-outline-primary"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openModal(reservation)}
                              title="Voir détails"
                            >
                              <FaEye size={12} />
                            </motion.button>
                            
                            {reservation.is_draft ? (
                              <motion.button
                                className="btn btn-sm btn-outline-success"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleConvertDraft(reservation.id)}
                                title="Convertir en réservation"
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
                                    onClick={() => handleStatusChange(reservation.id, 'confirmé')}
                                    title="Confirmer"
                                  >
                                    <FaCheck size={12} />
                                  </motion.button>
                                )}
                                
                                {reservation.statut !== 'terminé' && reservation.statut !== 'annulé' && (
                                  <motion.button
                                    className="btn btn-sm btn-outline-warning"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatusChange(reservation.id, 'annulé')}
                                    title="Annuler"
                                  >
                                    <FaTimes size={12} />
                                  </motion.button>
                                )}
                              </>
                            )}
                            
                            <motion.button
                              className="btn btn-sm btn-outline-success"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Appeler"
                            >
                              <FaPhone size={12} />
                            </motion.button>
                            
                            <motion.button
                              className="btn btn-sm btn-outline-danger"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(reservation.id)}
                              title="Supprimer"
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
                    
                    <h6 className="fw-bold text-primary mb-3">Service</h6>
                    <div className="mb-2">
                      <strong>Service:</strong> {selectedReservation.service.nom}
                    </div>
                    <div className="mb-2">
                      <strong>Durée:</strong> {selectedReservation.service.duree} minutes
                    </div>
                    <div className="mb-3">
                      <strong>Prix:</strong> {selectedReservation.service.prix}DT
                    </div>
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
                        <h6 className="fw-bold text-primary mb-3">Notes</h6>
                        <div className="bg-light p-3 rounded">
                          {selectedReservation.notes}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <div className="d-flex gap-2 w-100">
                  <button className="btn btn-outline-success">
                    <FaPhone className="me-2" />
                    Appeler
                  </button>
                  <button className="btn btn-outline-primary">
                    <FaEnvelope className="me-2" />
                    Email
                  </button>
                  <button className="btn btn-outline-secondary">
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
    </div>
  );
};

export default AdminReservations;
