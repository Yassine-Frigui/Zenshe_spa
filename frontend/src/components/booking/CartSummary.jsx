import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaShoppingCart, FaTimes, FaClock, FaTag } from 'react-icons/fa';
import '../../styles/CartSummary.css';

const CartSummary = ({ selectedServices = [], onRemoveService, totalPrice, totalDuration }) => {
  const { t } = useTranslation();

  // Calculate counts
  const mainServicesCount = selectedServices.filter(s => s.item_type === 'main').length;
  const addonServicesCount = selectedServices.filter(s => s.item_type === 'addon').length;

  if (selectedServices.length === 0) {
    return (
      <motion.div 
        className="cart-summary empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FaShoppingCart className="empty-cart-icon" />
        <p className="empty-cart-text">
          {t('booking.cart.empty', 'Aucun service sélectionné')}
        </p>
        <p className="empty-cart-subtext">
          {t('booking.cart.emptyHint', 'Sélectionnez un ou plusieurs services pour commencer')}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="cart-summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="cart-header">
        <h5 className="cart-title">
          <FaShoppingCart className="me-2" />
          {t('booking.cart.title', 'Votre Panier')}
        </h5>
        <span className="cart-count badge bg-green">
          {selectedServices.length}
        </span>
      </div>

      <div className="cart-body">
        <AnimatePresence>
          {selectedServices.map((service, index) => (
            <motion.div
              key={`${service.id}-${index}`}
              className="cart-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="cart-item-content">
                <div className="cart-item-header">
                  <h6 className="cart-item-name">{service.nom}</h6>
                  {service.item_type && (
                    <span className={`badge badge-${service.item_type === 'main' ? 'primary' : 'secondary'}`}>
                      <FaTag className="me-1" size={10} />
                      {service.item_type === 'main' 
                        ? t('booking.cart.mainService', 'Principal') 
                        : t('booking.cart.addon', 'Addon')}
                    </span>
                  )}
                </div>
                
                <div className="cart-item-details">
                  <span className="cart-item-duration">
                    <FaClock className="me-1" size={12} />
                    {service.duree} {t('booking.form.duration', 'min')}
                  </span>
                  <span className="cart-item-price fw-bold text-green">
                    {service.prix} DT
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                className="cart-item-remove"
                onClick={() => onRemoveService(service.id)}
                title={t('booking.cart.remove', 'Retirer')}
              >
                <FaTimes size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="cart-footer">
        <div className="cart-summary-row">
          <span className="cart-summary-label">
            {t('booking.cart.mainServices', 'Services principaux')}:
          </span>
          <span className="cart-summary-value">{mainServicesCount}</span>
        </div>
        
        {addonServicesCount > 0 && (
          <div className="cart-summary-row">
            <span className="cart-summary-label">
              {t('booking.cart.addons', 'Addons')}:
            </span>
            <span className="cart-summary-value">{addonServicesCount}</span>
          </div>
        )}

        <div className="cart-summary-row">
          <span className="cart-summary-label">
            <FaClock className="me-1" />
            {t('booking.cart.totalDuration', 'Durée totale')}:
          </span>
          <span className="cart-summary-value">{totalDuration} {t('booking.form.duration', 'min')}</span>
        </div>

        <div className="cart-total">
          <span className="cart-total-label">
            {t('booking.cart.total', 'Total')}:
          </span>
          <span className="cart-total-value">
            {totalPrice.toFixed(2)} DT
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CartSummary;
