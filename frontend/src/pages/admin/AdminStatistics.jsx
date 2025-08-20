import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine,
  FaCalendarAlt,
  FaUsers,
  FaCut,
  FaEuroSign,
  FaPercent,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const AdminStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState({
    overview: {
      totalReservations: 0,
      totalClients: 0,
      totalRevenue: 0,
      averageTicket: 0
    },
    reservations: {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0
    },
    services: {
      mostPopular: [],
      revenue: []
    },
    trends: {
      reservationsGrowth: 0,
      revenueGrowth: 0,
      clientsGrowth: 0
    }
  });

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStatistics(dateRange);
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <motion.div
      className="card border-0 shadow-sm h-100"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h6 className="text-muted mb-1">{title}</h6>
            <h3 className="fw-bold mb-0">{value}</h3>
            {trend && (
              <div className={`small mt-1 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                {trend === 'up' ? <p className="me-1" /> : <p className="me-1" />}
                {trendValue}%
              </div>
            )}
          </div>
          <div className={`rounded-circle p-3 ${color}`}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="admin-statistics">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-statistics">
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
              <FaChartLine className="text-primary me-2" />
              Statistiques
            </h1>
            <p className="text-muted mb-0">
              Analysez les performances de votre spa
            </p>
          </div>
          <div className="col-auto">
            <select 
              className="form-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        className="row mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="col-md-3 mb-3">
          <StatCard
            title="Réservations"
            value={stats.overview.totalReservations}
            icon={FaCalendarAlt}
            color="bg-primary"
            trend={stats.trends.reservationsGrowth > 0 ? 'up' : 'down'}
            trendValue={Math.abs(stats.trends.reservationsGrowth)}
          />
        </div>
        <div className="col-md-3 mb-3">
          <StatCard
            title="Clients"
            value={stats.overview.totalClients}
            icon={FaUsers}
            color="bg-success"
            trend={stats.trends.clientsGrowth > 0 ? 'up' : 'down'}
            trendValue={Math.abs(stats.trends.clientsGrowth)}
          />
        </div>
        <div className="col-md-3 mb-3">
          <StatCard
            title="Chiffre d'affaires"
            value={`${stats.overview.totalRevenue}€`}
            icon={FaEuroSign}
            color="bg-warning"
            trend={stats.trends.revenueGrowth > 0 ? 'up' : 'down'}
            trendValue={Math.abs(stats.trends.revenueGrowth)}
          />
        </div>
        <div className="col-md-3 mb-3">
          <StatCard
            title="Ticket moyen"
            value={`${stats.overview.averageTicket}€`}
            icon={FaPercent}
            color="bg-info"
          />
        </div>
      </motion.div>

      <div className="row">
        {/* Reservations Status */}
        <div className="col-md-6 mb-4">
          <motion.div
            className="card border-0 shadow-sm h-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaCalendarAlt className="text-primary me-2" />
                Statut des Réservations
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6 mb-3">
                  <div className="d-flex align-items-center">
                    <FaCheckCircle className="text-success me-2" />
                    <div>
                      <div className="small text-muted">Confirmées</div>
                      <div className="fw-bold">{stats.reservations.confirmed}</div>
                    </div>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="d-flex align-items-center">
                    <FaClock className="text-warning me-2" />
                    <div>
                      <div className="small text-muted">En attente</div>
                      <div className="fw-bold">{stats.reservations.pending}</div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center">
                    <FaTimesCircle className="text-danger me-2" />
                    <div>
                      <div className="small text-muted">Annulées</div>
                      <div className="fw-bold">{stats.reservations.cancelled}</div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center">
                    <FaCheckCircle className="text-primary me-2" />
                    <div>
                      <div className="small text-muted">Terminées</div>
                      <div className="fw-bold">{stats.reservations.completed}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Popular Services */}
        <div className="col-md-6 mb-4">
          <motion.div
            className="card border-0 shadow-sm h-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaCut className="text-primary me-2" />
                Services Populaires
              </h5>
            </div>
            <div className="card-body">
              {stats.services.mostPopular.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <FaCut size={48} className="mb-3 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {stats.services.mostPopular.slice(0, 5).map((service, index) => (
                    <div key={service.id} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{service.nom}</div>
                          <div className="small text-muted">{service.reservations} réservations</div>
                        </div>
                        <div className="text-primary fw-bold">#{index + 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Additional Stats */}
      <motion.div
        className="row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaEuroSign className="text-primary me-2" />
                Revenus par Service
              </h5>
            </div>
            <div className="card-body">
              {stats.services.revenue.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <FaEuroSign size={48} className="mb-3 opacity-50" />
                  <p>Aucune donnée de revenus disponible</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Réservations</th>
                        <th>Revenus</th>
                        <th>Prix moyen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.services.revenue.map((service) => (
                        <tr key={service.id}>
                          <td className="fw-bold">{service.nom}</td>
                          <td>{service.reservations}</td>
                          <td className="text-success fw-bold">{service.revenue}€</td>
                          <td>{service.averagePrice}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminStatistics;
