import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers,
  FaPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaStar,
  FaHeart,
  FaGift,
  FaCode,
  FaTimes,
  FaSave,
  FaUserEdit,
  FaTicketAlt
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientReferrals, setClientReferrals] = useState({});
  const [expandedClient, setExpandedClient] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    date_naissance: '',
    notes: '',
    statut: 'actif',
    langue_preferee: 'fr',
    actif: 1
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getClients();
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telephone.includes(searchTerm)
      );
    }

    setFilteredClients(filtered);
  };

  const getStatutBadge = (statut) => {
    const statusConfig = {
      'vip': { bg: 'warning', text: 'VIP', icon: <FaStar size={12} /> },
      'actif': { bg: 'success', text: 'Actif', icon: <FaHeart size={12} /> },
      'nouveau': { bg: 'info', text: 'Nouveau', icon: <FaGift size={12} /> },
      'inactif': { bg: 'secondary', text: 'Inactif', icon: null }
    };
    
    const config = statusConfig[statut] || { bg: 'secondary', text: 'Inconnu', icon: null };
    return (
      <span className={`badge bg-${config.bg} d-flex align-items-center gap-1`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const calculateAge = (dateNaissance) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const openModal = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await adminAPI.deleteClient(clientId);
        setClients(prev => prev.filter(client => client.id !== clientId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du client');
      }
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse || '',
      date_naissance: client.date_naissance || '',
      notes: client.notes || '',
      statut: client.statut,
      langue_preferee: client.langue_preferee || 'fr',
      actif: client.actif !== undefined ? client.actif : 1
    });
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
      date_naissance: '',
      notes: '',
      statut: 'actif',
      langue_preferee: 'fr',
      actif: 1
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingClient) {
        const response = await adminAPI.updateClient(editingClient.id, formData);
        setClients(prev => prev.map(c => c.id === editingClient.id ? {...c, ...formData} : c));
        setShowEditModal(false);
      } else {
        const response = await adminAPI.createClient(formData);
        const newClient = response.data.client;
        setClients(prev => [...prev, newClient]);
        setShowCreateModal(false);
      }
      setEditingClient(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const fetchClientReferrals = async (clientId) => {
    try {
      const response = await adminAPI.getClientReferrals(clientId);
      // Each client now has only one referral code
      const referralCode = response.data.data && response.data.data[0] ? response.data.data[0] : null;
      setClientReferrals(prev => ({...prev, [clientId]: referralCode}));
    } catch (error) {
      console.error('Erreur lors du chargement du code de parrainage:', error);
      toast.error('Erreur lors du chargement du code de parrainage');
      setClientReferrals(prev => ({...prev, [clientId]: null}));
    }
  };

  const toggleClientExpansion = (clientId) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientId);
      if (clientReferrals[clientId] === undefined) {
        fetchClientReferrals(clientId);
      }
    }
  };

  const generateReferralCode = async (clientId) => {
    try {
      const data = { clientId: clientId };
      
      await adminAPI.createReferralCodeForClient(data);
      toast.success('Code de parrainage récupéré avec succès');
      
      // Refresh the referral code for this client
      fetchClientReferrals(clientId);
    } catch (error) {
      console.error('Erreur lors de la récupération du code:', error);
      toast.error('Erreur lors de la récupération du code de parrainage');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-pink-500 mb-3" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-muted">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-clients">
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
              <FaUsers className="text-primary me-2" />
              Gestion des Clients
            </h1>
            <p className="text-muted mb-0">
              {clients.length} clients enregistrés
            </p>
          </div>
          <div className="col-auto">
            <motion.button
              className="btn btn-pink"
              onClick={handleCreate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus className="me-2" />
              Nouveau client
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="row mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <FaUsers className="text-primary mb-2" size={32} />
              <h4 className="fw-bold">{clients.length}</h4>
              <p className="text-muted mb-0">Total clients</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <FaStar className="text-warning mb-2" size={32} />
              <h4 className="fw-bold">{clients.filter(c => c.statut === 'vip').length}</h4>
              <p className="text-muted mb-0">Clients VIP</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <FaGift className="text-info mb-2" size={32} />
              <h4 className="fw-bold">{clients.filter(c => c.statut === 'nouveau').length}</h4>
              <p className="text-muted mb-0">Nouveaux clients</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <FaHeart className="text-success mb-2" size={32} />
              <h4 className="fw-bold">
                {Math.round(clients.reduce((sum, c) => sum + c.total_depense, 0) / clients.length)}DT
              </h4>
              <p className="text-muted mb-0">Panier moyen</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        className="search-section mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Rechercher par nom, email ou téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select className="form-select">
                  <option value="">Tous les statuts</option>
                  <option value="vip">VIP</option>
                  <option value="actif">Actif</option>
                  <option value="nouveau">Nouveau</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
              <div className="col-md-3">
                <span className="badge bg-light text-dark fs-6 w-100 py-2">
                  {filteredClients.length} résultat(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Clients Table */}
      <motion.div
        className="clients-table"
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
                    <th className="border-0 px-4 py-3">Client</th>
                    <th className="border-0 py-3">Contact</th>
                    <th className="border-0 py-3">Statut</th>
                    <th className="border-0 py-3">Code Parrainage</th>
                    <th className="border-0 py-3">Visites</th>
                    <th className="border-0 py-3">Total dépensé</th>
                    <th className="border-0 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        <FaUsers className="mb-3" size={48} />
                        <p className="mb-0">Aucun client trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client, index) => (
                      <React.Fragment key={client.id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.05, duration: 0.4 }}
                        className="border-bottom"
                      >
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center">
                            <div className="client-avatar bg-pink-100 rounded-circle d-flex align-items-center justify-content-center me-3"
                                 style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                              <span className="text-pink-600 fw-bold">
                                {client.prenom.charAt(0)}{client.nom.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <strong className="text-dark">
                                  {client.prenom} {client.nom}
                                </strong>
                                <motion.button
                                  className="btn btn-outline-primary"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => openModal(client)}
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
                                {calculateAge(client.date_naissance)} ans
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <div className="small mb-1">{client.email}</div>
                            <div className="small text-muted">{client.telephone}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          {getStatutBadge(client.statut)}
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => toggleClientExpansion(client.id)}
                              title="Voir code de parrainage"
                            >
                              <FaTicketAlt size={12} />
                              {clientReferrals[client.id] ? 1 : 0}
                            </button>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="fw-bold">{client.nombre_visites || 0}</span>
                          <div className="small text-muted">visites</div>
                        </td>
                        <td className="py-3">
                          <span className="fw-bold text-success">{client.total_depense || 0}DT</span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex gap-1">
                            <motion.button
                              className="btn btn-sm btn-outline-primary"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openModal(client)}
                              title="Voir détails"
                            >
                              <FaEye size={12} />
                            </motion.button>
                            <motion.button
                              className="btn btn-sm btn-outline-warning"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEdit(client)}
                              title="Modifier"
                            >
                              <FaEdit size={12} />
                            </motion.button>
                            <motion.button
                              className="btn btn-sm btn-outline-danger"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(client.id)}
                              title="Supprimer"
                            >
                              <FaTrash size={12} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                      {expandedClient === client.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-light"
                        >
                          <td colSpan="7" className="p-4">
                            <div className="row">
                              <div className="col-12">
                                <h6 className="fw-bold mb-3">
                                  <FaCode className="text-primary me-2" />
                                  Code de Parrainage de {client.prenom}
                                </h6>
                                {clientReferrals[client.id] ? (
                                  <div className="row justify-content-center">
                                    <div className="col-md-8 mb-3">
                                      <div className="card border-0 shadow-sm">
                                        <div className="card-body p-4 text-center">
                                          <div className="d-flex justify-content-between align-items-start mb-3">
                                            <h4 className="fw-bold text-primary mb-0">{clientReferrals[client.id].code}</h4>
                                            <span className={`badge fs-6 ${clientReferrals[client.id].is_active ? 'bg-success' : 'bg-secondary'}`}>
                                              {clientReferrals[client.id].is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                          </div>
                                          <div className="row text-center">
                                            <div className="col-4">
                                              <div className="fw-bold text-success fs-5">{clientReferrals[client.id].discount_percentage}%</div>
                                              <small className="text-muted">Réduction</small>
                                            </div>
                                            <div className="col-4">
                                              <div className="fw-bold fs-5">{clientReferrals[client.id].current_uses || 0}</div>
                                              <small className="text-muted">Utilisations</small>
                                            </div>
                                            <div className="col-4">
                                              <div className="fw-bold fs-5">{clientReferrals[client.id].max_uses || '∞'}</div>
                                              <small className="text-muted">Max</small>
                                            </div>
                                          </div>
                                          {clientReferrals[client.id].expires_at && (
                                            <div className="mt-3">
                                              <small className="text-muted">
                                                Expire le: {new Date(clientReferrals[client.id].expires_at).toLocaleDateString('fr-FR')}
                                              </small>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-muted py-4">
                                    <FaTicketAlt size={32} className="mb-2 opacity-50" />
                                    <p>Aucun code de parrainage généré</p>
                                    <button 
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => generateReferralCode(client.id)}
                                    >
                                      <FaPlus className="me-1" />
                                      Générer le code
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de détails client */}
      {showModal && selectedClient && (
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
                  <FaUsers className="text-primary me-2" />
                  Profil de {selectedClient.prenom} {selectedClient.nom}
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
                    <h6 className="fw-bold text-primary mb-3">Informations personnelles</h6>
                    <div className="mb-2">
                      <strong>Nom complet:</strong> {selectedClient.prenom} {selectedClient.nom}
                    </div>
                    <div className="mb-2">
                      <strong>Âge:</strong> {calculateAge(selectedClient.date_naissance)} ans
                    </div>
                    <div className="mb-2">
                      <strong>Email:</strong> {selectedClient.email}
                    </div>
                    <div className="mb-2">
                      <strong>Téléphone:</strong> {selectedClient.telephone}
                    </div>
                    <div className="mb-3">
                      <strong>Adresse:</strong> {selectedClient.adresse}
                    </div>
                    
                    <h6 className="fw-bold text-primary mb-3">Statut</h6>
                    {getStatutBadge(selectedClient.statut)}
                  </div>
                  
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">Historique</h6>
                    <div className="mb-2">
                      <strong>Client depuis:</strong> {new Date(selectedClient.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="mb-2">
                      <strong>Nombre de visites:</strong> {selectedClient.nombre_visites}
                    </div>
                    <div className="mb-2">
                      <strong>Total dépensé:</strong> <span className="text-success fw-bold">{selectedClient.total_depense}DT</span>
                    </div>
                    <div className="mb-3">
                      <strong>Dernière visite:</strong> {new Date(selectedClient.derniere_visite).toLocaleDateString('fr-FR')}
                    </div>
                    
                    {selectedClient.notes && (
                      <>
                        <h6 className="fw-bold text-primary mb-3">Notes</h6>
                        <div className="bg-light p-3 rounded">
                          {selectedClient.notes}
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
                  <button className="btn btn-outline-warning">
                    <FaCalendarAlt className="me-2" />
                    Réserver
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

      {/* Modal de création/édition client */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <motion.div
                className="modal-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">
                    <FaUserEdit className="text-primary me-2" />
                    {editingClient ? 'Modifier Client' : 'Nouveau Client'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowEditModal(false);
                      setShowCreateModal(false);
                      setEditingClient(null);
                    }}
                  />
                </div>
                <div className="modal-body">
                  <form>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Prénom*</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.prenom}
                          onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Nom*</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.nom}
                          onChange={(e) => setFormData({...formData, nom: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Email*</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Téléphone*</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={formData.telephone}
                          onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Date de naissance</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.date_naissance}
                          onChange={(e) => setFormData({...formData, date_naissance: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Statut</label>
                        <select
                          className="form-select"
                          value={formData.statut}
                          onChange={(e) => setFormData({...formData, statut: e.target.value})}
                        >
                          <option value="actif">Actif</option>
                          <option value="inactif">Inactif</option>
                        </select>
                        <div className="form-text">Statut du compte client</div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Langue préférée</label>
                        <select
                          className="form-select"
                          value={formData.langue_preferee}
                          onChange={(e) => setFormData({...formData, langue_preferee: e.target.value})}
                        >
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                          <option value="ar">العربية</option>
                        </select>
                        <div className="form-text">Langue de communication préférée</div>
                      </div>
                      <div className="col-12 mb-3">
                        <label className="form-label fw-bold">Adresse</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={formData.adresse}
                          onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                          placeholder="Adresse complète du client..."
                        />
                      </div>
                      <div className="col-12 mb-3">
                        <label className="form-label fw-bold">Notes</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder="Notes privées sur le client (préférences, allergies, etc.)..."
                        />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer border-0">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setShowCreateModal(false);
                      setEditingClient(null);
                    }}
                  >
                    <FaTimes className="me-2" />
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                  >
                    <FaSave className="me-2" />
                    {editingClient ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminClients;
