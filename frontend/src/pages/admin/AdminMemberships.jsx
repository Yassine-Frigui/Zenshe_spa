import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCrown,
  FaPlus,
  FaSearch,
  FaEye,
  FaTimes,
  FaSave,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaFilter
} from 'react-icons/fa';
import { adminAPI, publicAPI } from '../../services/api';

const AdminMemberships = () => {
  const [clientMemberships, setClientMemberships] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredMemberships, setFilteredMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [formData, setFormData] = useState({
    client_id: '',
    membership_id: '',
    duree_engagement: 1,
    mode_paiement: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMemberships();
  }, [clientMemberships, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membershipsRes, clientsRes] = await Promise.all([
        publicAPI.getMemberships(),
        adminAPI.getClients()
      ]);
      
      setMemberships(membershipsRes.data.memberships || []);
      setClients(clientsRes.data.clients || []);
      
      // Fetch client memberships - we'll need to create this endpoint
      await fetchClientMemberships();
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientMemberships = async () => {
    try {
      // This endpoint needs to be created in backend
      const response = await adminAPI.getAllClientMemberships();
      setClientMemberships(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des abonnements clients:', error);
      setClientMemberships([]);
    }
  };

  const filterMemberships = () => {
    let filtered = [...clientMemberships];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.statut === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.client_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.client_prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.membership_nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMemberships(filtered);
  };

  const handleAddMembership = async (e) => {
    e.preventDefault();
    
    try {
      await adminAPI.createClientMembership(formData);
      alert('Abonnement ajouté avec succès!');
      setShowAddModal(false);
      resetForm();
      fetchClientMemberships();
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Erreur lors de l\'ajout de l\'abonnement');
    }
  };

  const handleCancelMembership = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet abonnement?')) return;
    
    try {
      await adminAPI.cancelClientMembership(id);
      alert('Abonnement annulé');
      fetchClientMemberships();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'annulation');
    }
  };

  const handleStatusChange = async () => {
    if (!selectedMembership || !newStatus) return;

    try {
      await adminAPI.updateClientMembershipStatus(selectedMembership.id, { statut: newStatus });
      alert('Statut mis à jour avec succès!');
      setShowStatusModal(false);
      setSelectedMembership(null);
      setNewStatus('');
      fetchClientMemberships();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const openStatusModal = (membership) => {
    setSelectedMembership(membership);
    setNewStatus(membership.statut);
    setShowStatusModal(true);
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      membership_id: '',
      duree_engagement: 1,
      mode_paiement: 'cash',
      notes: ''
    });
  };

  const getMembershipBadgeColor = (nom) => {
    const colors = {
      'SILVER': 'secondary',
      'GOLD': 'warning',
      'PLATINUM': 'light',
      'VIP': 'purple'
    };
    return colors[nom] || 'primary';
  };

  const getStatusBadge = (statut) => {
    const badges = {
      'active': { color: 'success', icon: FaCheckCircle, text: 'Actif' },
      'expired': { color: 'danger', icon: FaTimesCircle, text: 'Expiré' },
      'cancelled': { color: 'dark', icon: FaTimes, text: 'Annulé' },
      'pending': { color: 'warning', icon: FaInfoCircle, text: 'En attente' }
    };
    const badge = badges[statut] || badges['pending'];
    const Icon = badge.icon;
    
    return (
      <span className={`badge bg-${badge.color}`}>
        <Icon className="me-1" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-memberships p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              <FaCrown className="me-2 text-warning" />
              Gestion des Abonnements
            </h2>
            <p className="text-muted mb-0">
              Gérer les abonnements des clients
            </p>
          </div>
          <button 
            className="btn btn-success"
            onClick={() => setShowAddModal(true)}
          >
            <FaPlus className="me-2" />
            Ajouter un abonnement
          </button>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Total Abonnements</p>
                    <h3 className="mb-0">{clientMemberships.length}</h3>
                  </div>
                  <div className="text-success">
                    <FaCrown size={30} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Actifs</p>
                    <h3 className="mb-0 text-success">
                      {clientMemberships.filter(m => m.statut === 'active').length}
                    </h3>
                  </div>
                  <div className="text-success">
                    <FaCheckCircle size={30} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Expirés</p>
                    <h3 className="mb-0 text-danger">
                      {clientMemberships.filter(m => m.statut === 'expired').length}
                    </h3>
                  </div>
                  <div className="text-danger">
                    <FaTimesCircle size={30} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Revenu Mensuel</p>
                    <h3 className="mb-0 text-info">
                      {clientMemberships
                        .filter(m => m.statut === 'active')
                        .reduce((sum, m) => sum + (parseFloat(m.montant_paye) || 0), 0)
                        .toFixed(2)} DT
                    </h3>
                  </div>
                  <div className="text-info">
                    <FaMoneyBillWave size={30} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher par client, email, ou type d'abonnement..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaFilter />
                  </span>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="expired">Expirés</option>
                    <option value="cancelled">Annulés</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Memberships Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Client</th>
                    <th>Abonnement</th>
                    <th>Période</th>
                    <th>Services</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberships.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        <FaCrown size={40} className="mb-2 opacity-50" />
                        <p className="mb-0">Aucun abonnement trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMemberships.map((membership) => (
                      <tr key={membership.id}>
                        <td>
                          <div>
                            <strong>{membership.client_prenom} {membership.client_nom}</strong>
                            <br />
                            <small className="text-muted">{membership.client_email}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge bg-${getMembershipBadgeColor(membership.membership_nom)} px-3 py-2`}>
                            <FaCrown className="me-1" />
                            {membership.membership_nom}
                          </span>
                        </td>
                        <td>
                          <div className="small">
                            <div className="mb-1">
                              <FaCalendarAlt className="me-1 text-muted" size={12} />
                              {new Date(membership.date_debut).toLocaleDateString('fr-FR')}
                            </div>
                            <div>
                              <FaCalendarAlt className="me-1 text-muted" size={12} />
                              {new Date(membership.date_fin).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <strong className="text-success">{membership.services_restants}</strong>
                            <span className="text-muted"> / {membership.services_total}</span>
                            <br />
                            <small className="text-muted">
                              {membership.services_utilises} utilisés
                            </small>
                          </div>
                        </td>
                        <td>
                          <strong>{membership.montant_paye} DT</strong>
                          <br />
                          <small className="text-muted">
                            {membership.mode_paiement}
                          </small>
                        </td>
                        <td>
                          {getStatusBadge(membership.statut)}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button 
                              className="btn btn-outline-primary"
                              onClick={() => {
                                setSelectedMembership(membership);
                                setShowDetailsModal(true);
                              }}
                              title="Voir détails"
                            >
                              <FaEye />
                            </button>
                            <button 
                              className="btn btn-outline-secondary"
                              onClick={() => openStatusModal(membership)}
                              title="Modifier statut"
                            >
                              <FaInfoCircle />
                            </button>
                            {membership.statut === 'active' && (
                              <button 
                                className="btn btn-outline-danger"
                                onClick={() => handleCancelMembership(membership.id)}
                                title="Annuler"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Membership Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="modal-content bg-white rounded shadow-lg"
              style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header border-bottom p-4">
                <h5 className="modal-title">
                  <FaPlus className="me-2" />
                  Ajouter un Abonnement
                </h5>
                <button 
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddMembership}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label">
                      <FaUser className="me-2" />
                      Client *
                    </label>
                    <select
                      className="form-select"
                      value={formData.client_id}
                      onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                      required
                    >
                      <option value="">Sélectionner un client...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.prenom} {client.nom} ({client.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <FaCrown className="me-2" />
                      Type d'Abonnement *
                    </label>
                    <select
                      className="form-select"
                      value={formData.membership_id}
                      onChange={(e) => setFormData({...formData, membership_id: e.target.value})}
                      required
                    >
                      <option value="">Sélectionner un abonnement...</option>
                      {memberships.map(membership => (
                        <option key={membership.id} value={membership.id}>
                          {membership.nom} - {membership.prix_mensuel}DT/mois ({membership.services_par_mois} services)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <FaCalendarAlt className="me-2" />
                        Durée d'engagement *
                      </label>
                      <select
                        className="form-select"
                        value={formData.duree_engagement}
                        onChange={(e) => setFormData({...formData, duree_engagement: parseInt(e.target.value)})}
                        required
                      >
                        <option value="1">1 mois</option>
                        <option value="3">3 mois (prix réduit si applicable)</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <FaMoneyBillWave className="me-2" />
                        Mode de paiement *
                      </label>
                      <select
                        className="form-select"
                        value={formData.mode_paiement}
                        onChange={(e) => setFormData({...formData, mode_paiement: e.target.value})}
                        required
                      >
                        <option value="cash">Espèces</option>
                        <option value="card">Carte bancaire</option>
                        <option value="bank_transfer">Virement bancaire</option>
                        <option value="online">Paiement en ligne</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes (optionnel)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Notes administratives..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top p-4">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    <FaTimes className="me-2" />
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                  >
                    <FaSave className="me-2" />
                    Ajouter l'abonnement
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedMembership && (
          <motion.div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              className="modal-content bg-white rounded shadow-lg"
              style={{ maxWidth: '700px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header border-bottom p-4">
                <h5 className="modal-title">
                  <FaCrown className="me-2" />
                  Détails de l'Abonnement
                </h5>
                <button 
                  className="btn-close"
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-muted small">Client</label>
                    <p className="fw-bold mb-0">
                      {selectedMembership.client_prenom} {selectedMembership.client_nom}
                    </p>
                    <p className="text-muted small">{selectedMembership.client_email}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Type d'Abonnement</label>
                    <p className="mb-0">
                      <span className={`badge bg-${getMembershipBadgeColor(selectedMembership.membership_nom)} px-3 py-2`}>
                        {selectedMembership.membership_nom}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Date de début</label>
                    <p className="fw-bold mb-0">
                      {new Date(selectedMembership.date_debut).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Date de fin</label>
                    <p className="fw-bold mb-0">
                      {new Date(selectedMembership.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Services Total</label>
                    <p className="fw-bold mb-0">{selectedMembership.services_total}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Services Utilisés</label>
                    <p className="fw-bold mb-0 text-danger">{selectedMembership.services_utilises}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Services Restants</label>
                    <p className="fw-bold mb-0 text-success">{selectedMembership.services_restants}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Montant Payé</label>
                    <p className="fw-bold mb-0">{selectedMembership.montant_paye} DT</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Mode de Paiement</label>
                    <p className="fw-bold mb-0 text-capitalize">{selectedMembership.mode_paiement}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Durée d'Engagement</label>
                    <p className="fw-bold mb-0">{selectedMembership.duree_engagement} mois</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Statut</label>
                    <p className="mb-0">
                      {getStatusBadge(selectedMembership.statut)}
                    </p>
                  </div>
                  {selectedMembership.notes && (
                    <div className="col-12">
                      <label className="text-muted small">Notes</label>
                      <p className="mb-0">{selectedMembership.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top p-4">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Fermer
                </button>
                {selectedMembership.statut === 'active' && (
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      handleCancelMembership(selectedMembership.id);
                      setShowDetailsModal(false);
                    }}
                  >
                    <FaTimes className="me-2" />
                    Annuler l'abonnement
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Change Modal */}
      <AnimatePresence>
        {showStatusModal && selectedMembership && (
          <motion.div
            className="modal fade show d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-dialog modal-dialog-centered"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaInfoCircle className="text-primary me-2" />
                    Modifier le statut
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowStatusModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Client</label>
                    <p className="mb-2">{selectedMembership.client_nom} {selectedMembership.client_prenom}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Abonnement</label>
                    <p className="mb-2">{selectedMembership.membership_nom}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Statut actuel</label>
                    <div className="mb-2">
                      {getStatusBadge(selectedMembership.statut)}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nouveau statut</label>
                    <select
                      className="form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="active">Actif</option>
                      <option value="expired">Expiré</option>
                      <option value="cancelled">Annulé</option>
                      <option value="pending">En attente</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowStatusModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStatusChange}
                    disabled={newStatus === selectedMembership.statut}
                  >
                    <FaSave className="me-2" />
                    Mettre à jour
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMemberships;
