import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPhone, FaArrowLeft, FaClock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const PhoneContactPage = () => {
    const { t } = useTranslation();

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 }
    };

    const pageTransition = {
        type: "tween",
        ease: "anticipate",
        duration: 0.5
    };

    return (
        <div className="py-5 bg-light" style={{ minHeight: '80vh' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                            className="card shadow-lg border-0"
                        >
                            <div className="card-body p-5">
                                <div className="text-center mb-4">
                                    <div className="mb-3">
                                        <FaPhone className="text-pink" size={60} />
                                    </div>
                                    <h2 className="text-pink mb-3">{t('phoneContact.title')}</h2>
                                    <p className="text-muted">
                                        {t('phoneContact.description')}
                                    </p>
                                </div>

                                <div className="bg-light p-4 rounded mb-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <FaClock className="text-muted me-2" />
                                        <strong>{t('phoneContact.contactHours')}:</strong>
                                    </div>
                                    <ul className="list-unstyled mb-0">
                                        <li>• {t('phoneContact.mondayFriday')}</li>
                                        <li>• {t('phoneContact.saturday')}</li>
                                        <li>• {t('phoneContact.sunday')}</li>
                                    </ul>
                                </div>

                                <div className="alert alert-info" role="alert">
                                    <strong>{t('phoneContact.howItWorks')}:</strong><br />
                                    {t('phoneContact.howItWorksDesc')}
                                </div>

                                <div className="d-grid gap-2 mb-3">
                                    <Link to="/client/login" className="btn btn-pink">
                                        <FaArrowLeft className="me-2" />
                                        {t('phoneContact.backToLogin')}
                                    </Link>
                                </div>

                                <div className="text-center">
                                    <p className="text-muted small mb-2">
                                        {t('phoneContact.emailAccessRecovered')}
                                    </p>
                                    <Link to="/client/forgot-password" className="text-pink text-decoration-none">
                                        {t('phoneContact.tryEmailReset')}
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhoneContactPage;
