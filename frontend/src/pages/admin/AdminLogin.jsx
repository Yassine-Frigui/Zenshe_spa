import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle redirect from client login with pre-filled credentials
  useEffect(() => {
    const autoLogin = async () => {
      if (location.state?.autoSubmit && location.state?.email && location.state?.password) {
        // Clear the state immediately to prevent re-runs
        window.history.replaceState({}, document.title);
        
        setFormData({
          email: location.state.email,
          password: location.state.password
        });
        
        setLoading(true);
        setError('');
        
        try {
          const result = await login(location.state.email, location.state.password);
          
          if (result.success) {
            navigate('/admin', { replace: true });
          } else {
            setError(result.message || 'Identifiants incorrects. Veuillez réessayer.');
          }
        } catch (error) {
          setError('Erreur de connexion. Veuillez vérifier vos identifiants et réessayer.');
        } finally {
          setLoading(false);
        }
      } else if (location.state?.email) {
        setFormData(prev => ({
          ...prev,
          email: location.state.email
        }));
      }
      
      if (location.state?.message) {
        setError(location.state.message);
        setTimeout(() => setError(''), 5000);
      }
    };
    
    autoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Successful login - redirect to admin dashboard
        navigate('/admin');
      } else {
        // Login failed - show error message from backend
        setError(result.message || 'Identifiants incorrects. Veuillez réessayer.');
      }
    } catch (error) {
      // Network or unexpected error
      console.error('Login error:', error);
      setError('Erreur de connexion. Veuillez vérifier vos identifiants et réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.devAdminBypass();
      if (response.data && response.data.admin) {
        // Store the admin data and token similar to normal login
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminData', JSON.stringify(response.data.admin));
        navigate('/admin');
      }
    } catch (error) {
      console.error('Dev bypass error:', error);
      setError('Erreur lors du bypass (dev only disponible en mode développement)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login min-vh-100 d-flex align-items-center" 
         style={{
           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
           position: 'relative'
         }}>
      {/* Background Pattern */}
      <div className="position-absolute w-100 h-100" 
           style={{
             background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             opacity: 0.3
           }} />

      <div className="container position-relative">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="login-card bg-white rounded-4 shadow-lg overflow-hidden"
            >
              {/* Header */}
              <div className="login-header text-center py-4 px-4"
                   style={{
                     background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)'
                   }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className="login-logo mb-3">
                    <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center"
                         style={{ width: '80px', height: '80px' }}>
                      <FaUser className="text-green" size={32} />
                    </div>
                  </div>
                  <h3 className="fw-bold text-green mb-2">Administration</h3>
                  <p className="text-accent-green mb-0">ZenShe Spa</p>
                </motion.div>
              </div>

              {/* Form */}
              <div className="login-body p-4">
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  {/* Email Field */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-gray-700">
                      Email administrateur
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text border-end-0 bg-light">
                        <FaUser className="text-muted" />
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0 ps-0"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="admin@zenshe.ca"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-gray-700">
                      Mot de passe
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text border-end-0 bg-light">
                        <FaLock className="text-muted" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control border-start-0 border-end-0 ps-0"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="input-group-text border-start-0 bg-light cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 
                          <FaEyeSlash className="text-muted" /> : 
                          <FaEye className="text-muted" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      className="alert alert-danger border-0 mb-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <small>{error}</small>
                    </motion.div>
                  )}

                  {/* Remember Me */}
                  <div className="mb-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="rememberMe" />
                      <label className="form-check-label text-muted" htmlFor="rememberMe">
                        Se souvenir de moi
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    className="btn btn-green btn-lg w-100 mb-3"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <FaSignInAlt className="me-2" />
                        Se connecter
                      </>
                    )}
                  </motion.button>

                  {/* Development Bypass Button */}
                  {process.env.NODE_ENV === 'development' && (
                    <motion.button
                      type="button"
                      className="btn btn-outline-warning btn-sm w-100 mb-3"
                      disabled={loading}
                      onClick={handleDevBypass}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🔑 Bypass (Dev Only)
                    </motion.button>
                  )}

                  {/* Demo Credentials */}
                  <div className="text-center">
                    <small className="text-muted">
                      <strong>Demo:</strong> admin@zenshe.ca / admin123
                    </small>
                  </div>
                </motion.form>
              </div>

              {/* Footer */}
              <div className="login-footer bg-light p-3 text-center">
                <motion.a
                  href="/"
                  className="text-decoration-none text-muted d-inline-flex align-items-center"
                  whileHover={{ x: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaArrowLeft className="me-2" size={14} />
                  Retour au site
                </motion.a>
              </div>
            </motion.div>

            {/* Security Notice */}
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <small className="text-white opacity-75">
                <FaLock className="me-1" />
                Connexion sécurisée - Accès réservé aux administrateurs
              </small>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <motion.div
        className="position-absolute"
        style={{ top: '10%', left: '10%' }}
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 10, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="bg-white rounded-circle opacity-10" 
             style={{ width: '60px', height: '60px' }} />
      </motion.div>

      <motion.div
        className="position-absolute"
        style={{ top: '70%', right: '15%' }}
        animate={{ 
          y: [0, 30, 0],
          rotate: [0, -15, 0]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        <div className="bg-white rounded-circle opacity-10" 
             style={{ width: '40px', height: '40px' }} />
      </motion.div>

      <motion.div
        className="position-absolute"
        style={{ bottom: '20%', left: '20%' }}
        animate={{ 
          y: [0, -15, 0],
          x: [0, 10, 0]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        <div className="bg-white rounded-circle opacity-10" 
             style={{ width: '80px', height: '80px' }} />
      </motion.div>
    </div>
  );
};

export default AdminLogin;
