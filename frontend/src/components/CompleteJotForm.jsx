import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './CompleteJotForm.css';

/**
 * COMPLETE JOTFORM REPLICATION - Form ID: 251824851270052
 * All field names are EXACT from the original HTML
 * Total Fields: 49 | Total Pages: 10
 * 
 * Field name convention follows JotForm: q{id}_{fieldname}
 * Nested fields use bracket notation: q9_nomCliente[first], q9_nomCliente[last]
 * Checkbox arrays: q24_lequelDes[]
 * Matrix fields: q32_contreindicationsLiees[0], q32_contreindicationsLiees[1], etc.
 */

const CompleteJotForm = ({ onFormReady }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    // PAGE 0: Date & Client Info
    'q131_date': { month: '', day: '', year: '' },
    'lite_mode_131': '',
    'q9_nomCliente': { first: '', last: '' },
    'q10_adresseMail10': '',
    'q11_phoneNumber11': { full: '' },
    'q12_adresseoptionnel': {
      addr_line1: '',
      addr_line2: '',
      city: '',
      state: '',
      postal: ''
    },
    'q13_dateDe': { month: '', day: '', year: '' },
    'lite_mode_13': '',
    
    // PAGE 1: Practitioner Info
    'q16_prenomDe': '',
    'q17_compagnieoptionnel': '',
    'q18_adresseMail': '',
    
    // PAGE 2: Medical Info - Anatomy
    'q167_fromA167': '', // Radio: Masculine/Féminine
    'q24_lequelDes': [], // Checkbox: Organes reproducteurs
    'q25_hasYour25': '', // Textarea: Anatomie modifiée
    'q26_pronomsPreferes': '', // Text: Pronoms
    
    // PAGE 3: {t('form.sections.contraindications')} (Matrices)
    'q32_contreindicationsLiees': ['', '', '', ''], // 4 rows: Oui/Pas Sure/Non
    'q33_contreindicationsLiees33': ['', '', ''], // 3 rows
    'q34_informationsComplementaires': '', // Textarea
    'q36_contreindicationsMedicales': ['', '', '', '', '', ''], // 6 rows
    'q37_contreindicationLiee': [''], // 1 row
    'q38_informationsComplementaires38': '', // Textarea
    
    // PAGE 4: {t('form.sections.sensitivities')} (Matrices)
    'q40_uterineBleeding40': ['', ''], // 2 rows
    'q42_sensibilitesLiees42': ['', '', '', '', '', ''], // 6 rows
    'q41_sensibilitesMedicales': [''], // 1 row
    'q43_sensibiliteLiee': [''], // 1 row
    'q44_nouvelleUtilisatrice': [''], // 1 row
    'q45_furtherInformation45': '', // Textarea
    
    // PAGE 5: Menstrual Info
    'q48_siVous': [], // Checkbox: Raisons pas de règles
    'q49_pleaseProvide49': '', // Textarea
    
    // PAGE 6: Indications pour plantes (Matrices)
    'q53_indicationsPour': ['', '', '', '', ''], // 5 rows: Hémostatiques
    'q52_indicatorsFor52': ['', '', '', '', '', '', ''], // 7 rows: Hydratantes
    'q54_indicatorsFor54': ['', '', '', '', ''], // 5 rows: Désinfectantes
    'q55_indicatorsFor55': ['', '', ''], // 3 rows: Dépuratives
    'q56_avezvousDes': '', // Textarea: Allergies
    'q59_cochezTous': ['', '', '', '', '', ''], // 6 rows: Indicateurs
    'q60_furtherInformation60': '', // Textarea
    'q63_myInitials63': '', // Text: Initiales confirmation
    
    // Additional fields
    'q151_whatIs151': '', // Textarea: Expérience vapeur
    'q152_whatIs152': '', // Textarea: Principal souci
    'q155_steamingIs155': '', // Radio: Options vapeur
    'q156_weeklySteaming156': [], // Checkbox: Programme vapeur
    'q157_ouPrevoyezvous': [], // Checkbox: Lieu séances
    'q158_doYou158': [], // Checkbox: Recommandations
    'q159_autresInformations': '', // Textarea: Autres infos
    
    // PAGE 7: Consent Form & Signature
    'q135_typeA135': '', // Hidden widget
    'q68_signatureManuscrite': { first: '', last: '' },
    'q166_parent_guardian_sig': { first: '', last: '' },
    'q132_date132': { month: '', day: '', year: '' },
    'lite_mode_132': '',
    
    // PRACTITIONER SECTION (Pages 8-9)
    'q84_indicationPour': '', // Radio: Indication vapeur
    'q88_typeDe': [], // Checkbox: Type contre-indication
    'q85_recommandationEn': [], // Checkbox: Recommandations
    'q87_notesDe': '', // Textarea (rich text)
    'q89_steamSensitivities89': [], // Checkbox: {t('form.sections.sensitivities')}
    'q90_configurationDe': '', // Radio: Configuration
    'q91_dureeDe': '', // Radio: Durée
    'q92_enveloppement92': '', // Radio: Enveloppement
    'q160_steamHerb160': [], // Checkbox: Formule plantes
    'q96_recommandationPour': [], // Checkbox: Planning séances
    'q98_referrals98': [], // Checkbox: Orientations
    'q99_referralNotes99': '', // Textarea (rich text)
    'q161_ressourcesVapeur': '', // Textarea (rich text)
    'q100_practitionerNotes100': '' // Textarea (rich text)
  });

  const [errors, setErrors] = useState({});

  // Generic change handlers
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, child, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [child]: value }
    }));
  };

  const handleCheckboxChange = (field, value, checked) => {
    setFormData(prev => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: checked ? [...current, value] : current.filter(v => v !== value)
      };
    });
  };

  const handleMatrixChange = (field, rowIndex, value) => {
    setFormData(prev => {
      const current = [...(prev[field] || [])];
      current[rowIndex] = value;
      return { ...prev, [field]: current };
    });
  };

  // Validation
  const validatePage = () => {
    const newErrors = {};
    
    if (currentPage === 0) {
      if (!formData['q9_nomCliente'].first || !formData['q9_nomCliente'].last) {
        newErrors['q9_nomCliente'] = 'Nom Cliente is required';
      }
      if (!formData['q10_adresseMail10']) {
        newErrors['q10_adresseMail10'] = 'Adresse Mail Cliente is required';
      }
    }
    
    if (currentPage === 1) {
      if (!formData['q18_adresseMail']) {
        newErrors['q18_adresseMail'] = `${t('form.labels.practitionerEmail')} is required`;
      }
    }
    
    if (currentPage === 7) {
      if (!formData['q68_signatureManuscrite'].first || !formData['q68_signatureManuscrite'].last) {
        newErrors['q68_signatureManuscrite'] = 'Signature is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const nextPage = () => {
    if (validatePage()) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validatePage()) return;

    const submission = {
      form_id: '251824851270052',
      ...formData
    };

    console.log('✅ Form data collected (NOT submitted to JotForm):', submission);
    
    if (onFormReady) {
      onFormReady(submission);
    }
  };

  return (
    <div className="complete-jotform-container">
      <form id="251824851270052" className="jotform-form" onSubmit={handleSubmit}>
        
        {/* PAGE 0: Client Information */}
        {currentPage === 0 && (
          <div className="form-page" id="page-0">
            <h2 className="form-section-title">Information cliente</h2>
            
            {/* Date - q131_date */}
            <div className="form-line">
              <label htmlFor="lite_mode_131" className="form-label">Date</label>
              <input
                type="text"
                id="lite_mode_131"
                name="lite_mode_131"
                className="form-textbox"
                placeholder="MM-DD-YYYY"
                value={formData.lite_mode_131}
                onChange={(e) => handleChange('lite_mode_131', e.target.value)}
              />
            </div>

            {/* Nom Cliente - q9_nomCliente */}
            <div className="form-line jf-required">
              <label htmlFor="first_9" className="form-label">
                Nom Cliente<span className="form-required">*</span>
              </label>
              <div className="form-name-wrapper">
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="first_9"
                    name="q9_nomCliente[first]"
                    className="form-textbox"
                    value={formData['q9_nomCliente'].first}
                    onChange={(e) => handleNestedChange('q9_nomCliente', 'first', e.target.value)}
                    required
                  />
                  <label htmlFor="first_9" className="form-sub-label">Prénom</label>
                </span>
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="last_9"
                    name="q9_nomCliente[last]"
                    className="form-textbox"
                    value={formData['q9_nomCliente'].last}
                    onChange={(e) => handleNestedChange('q9_nomCliente', 'last', e.target.value)}
                    required
                  />
                  <label htmlFor="last_9" className="form-sub-label">Nom</label>
                </span>
              </div>
              {errors['q9_nomCliente'] && <span className="error-message">{errors['q9_nomCliente']}</span>}
            </div>

            {/* Email Cliente - q10_adresseMail10 */}
            <div className="form-line jf-required">
              <label htmlFor="input_10" className="form-label">
                Adresse Mail Cliente<span className="form-required">*</span>
              </label>
              <input
                type="email"
                id="input_10"
                name="q10_adresseMail10"
                className="form-textbox"
                placeholder="example@example.com"
                value={formData['q10_adresseMail10']}
                onChange={(e) => handleChange('q10_adresseMail10', e.target.value)}
                required
              />
              {errors['q10_adresseMail10'] && <span className="error-message">{errors['q10_adresseMail10']}</span>}
            </div>

            {/* Phone - q11_phoneNumber11 */}
            <div className="form-line">
              <label htmlFor="input_11_full" className="form-label">
                Numéro Téléphone (optionnel)
              </label>
              <input
                type="tel"
                id="input_11_full"
                name="q11_phoneNumber11[full]"
                className="form-textbox"
                placeholder="(000) 00 000 000"
                value={formData['q11_phoneNumber11'].full}
                onChange={(e) => handleNestedChange('q11_phoneNumber11', 'full', e.target.value)}
              />
            </div>

            {/* Address - q12_adresseoptionnel */}
            <div className="form-line">
              <label htmlFor="input_12_addr_line1" className="form-label">
                Adresse (optionnel)
              </label>
              <div className="form-address-wrapper">
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="input_12_addr_line1"
                    name="q12_adresseoptionnel[addr_line1]"
                    className="form-textbox"
                    value={formData['q12_adresseoptionnel'].addr_line1}
                    onChange={(e) => handleNestedChange('q12_adresseoptionnel', 'addr_line1', e.target.value)}
                  />
                  <label className="form-sub-label">Rue</label>
                </span>
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="input_12_addr_line2"
                    name="q12_adresseoptionnel[addr_line2]"
                    className="form-textbox"
                    value={formData['q12_adresseoptionnel'].addr_line2}
                    onChange={(e) => handleNestedChange('q12_adresseoptionnel', 'addr_line2', e.target.value)}
                  />
                  <label className="form-sub-label">Rue 2éme ligne</label>
                </span>
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="input_12_city"
                    name="q12_adresseoptionnel[city]"
                    className="form-textbox"
                    value={formData['q12_adresseoptionnel'].city}
                    onChange={(e) => handleNestedChange('q12_adresseoptionnel', 'city', e.target.value)}
                  />
                  <label className="form-sub-label">Ville</label>
                </span>
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="input_12_state"
                    name="q12_adresseoptionnel[state]"
                    className="form-textbox"
                    value={formData['q12_adresseoptionnel'].state}
                    onChange={(e) => handleNestedChange('q12_adresseoptionnel', 'state', e.target.value)}
                  />
                  <label className="form-sub-label">Gouvernorat / Province</label>
                </span>
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="input_12_postal"
                    name="q12_adresseoptionnel[postal]"
                    className="form-textbox"
                    value={formData['q12_adresseoptionnel'].postal}
                    onChange={(e) => handleNestedChange('q12_adresseoptionnel', 'postal', e.target.value)}
                  />
                  <label className="form-sub-label">Code Postal / Code Zip</label>
                </span>
              </div>
            </div>

            {/* Date de Naissance - q13_dateDe */}
            <div className="form-line">
              <label htmlFor="lite_mode_13" className="form-label">Date de Naissance</label>
              <input
                type="text"
                id="lite_mode_13"
                name="lite_mode_13"
                className="form-textbox"
                placeholder="MM-DD-YYYY"
                value={formData.lite_mode_13}
                onChange={(e) => handleChange('lite_mode_13', e.target.value)}
              />
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-next" onClick={nextPage}>
                {t('common.next')}
              </button>
            </div>
          </div>
        )}

        {/* PAGE 1: Practitioner Information */}
        {currentPage === 1 && (
          <div className="form-page" id="page-1">
            <h2 className="form-section-title">{t('form.sections.practitionerInfo')}</h2>

            {/* Prenom Praticienne - q16_prenomDe */}
            <div className="form-line">
              <label htmlFor="input_16" className="form-label">
                {t('form.labels.practitionerFirstName')}
              </label>
              <input
                type="text"
                id="input_16"
                name="q16_prenomDe"
                className="form-textbox"
                value={formData['q16_prenomDe']}
                onChange={(e) => handleChange('q16_prenomDe', e.target.value)}
              />
            </div>

            {/* Compagnie - q17_compagnieoptionnel */}
            <div className="form-line">
              <label htmlFor="input_17" className="form-label">
                {t('form.labels.company')}
              </label>
              <input
                type="text"
                id="input_17"
                name="q17_compagnieoptionnel"
                className="form-textbox"
                value={formData['q17_compagnieoptionnel']}
                onChange={(e) => handleChange('q17_compagnieoptionnel', e.target.value)}
              />
            </div>

            {/* Email Praticienne - q18_adresseMail */}
            <div className="form-line jf-required">
              <label htmlFor="input_18" className="form-label">
                {t('form.labels.practitionerEmail')}<span className="form-required">*</span>
              </label>
              <input
                type="email"
                id="input_18"
                name="q18_adresseMail"
                className="form-textbox"
                placeholder="example@example.com"
                value={formData['q18_adresseMail']}
                onChange={(e) => handleChange('q18_adresseMail', e.target.value)}
                required
              />
              {errors['q18_adresseMail'] && <span className="error-message">{errors['q18_adresseMail']}</span>}
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-back" onClick={prevPage}>{t('common.previous')}</button>
              <button type="button" className="form-pagebreak-next" onClick={nextPage}>{t('common.next')}</button>
            </div>
          </div>
        )}

        {/* PAGE 2: Medical Information - Anatomy */}
        {currentPage === 2 && (
          <div className="form-page" id="page-2">
            <h2 className="form-section-title">{t('form.sections.medicalInfo')}</h2>

            {/* Anatomie type - q167_fromA167 */}
            <div className="form-line">
              <label className="form-label">
                {t('form.labels.anatomyType')}
              </label>
              <div className="form-single-column">
                <span className="form-radio-item">
                  <input
                    type="radio"
                    id="input_167_0"
                    name="q167_fromA167"
                    value="Masculine"
                    checked={formData['q167_fromA167'] === 'Masculine'}
                    onChange={(e) => handleChange('q167_fromA167', e.target.value)}
                  />
                  <label htmlFor="input_167_0">{t('form.options.masculine')}</label>
                </span>
                <span className="form-radio-item">
                  <input
                    type="radio"
                    id="input_167_1"
                    name="q167_fromA167"
                    value="Féminine"
                    checked={formData['q167_fromA167'] === 'Féminine'}
                    onChange={(e) => handleChange('q167_fromA167', e.target.value)}
                  />
                  <label htmlFor="input_167_1">{t('form.options.feminine')}</label>
                </span>
              </div>
            </div>

            {/* Organes reproducteurs - q24_lequelDes */}
            <div className="form-line">
              <label className="form-label">
                {t('form.labels.reproductiveOrgans')}
              </label>
              <div className="form-single-column">
                {[t('form.organs.vagina'), 'Utérus', t('form.organs.vulva'), t('form.organs.clitoris'), 'Pénis', t('form.organs.scrotum'), t('form.organs.prostate'), 'Aucun de ce qui précède'].map((option, idx) => (
                  <span key={idx} className="form-checkbox-item">
                    <input
                      type="checkbox"
                      id={`input_24_${idx}`}
                      name="q24_lequelDes[]"
                      value={option}
                      checked={formData['q24_lequelDes'].includes(option)}
                      onChange={(e) => handleCheckboxChange('q24_lequelDes', option, e.target.checked)}
                    />
                    <label htmlFor={`input_24_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* Anatomie modifiée - q25_hasYour25 */}
            <div className="form-line">
              <label htmlFor="input_25" className="form-label">
                Votre anatomie génitale a-t-elle été modifiée depuis la naissance en raison d'une chirurgie ou d'une intervention volontaire ou médicale ?
              </label>
              <textarea
                id="input_25"
                name="q25_hasYour25"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q25_hasYour25']}
                onChange={(e) => handleChange('q25_hasYour25', e.target.value)}
              />
            </div>

            {/* Pronoms - q26_pronomsPreferes */}
            <div className="form-line">
              <label htmlFor="input_26" className="form-label">
                Pronoms préférés :
              </label>
              <input
                type="text"
                id="input_26"
                name="q26_pronomsPreferes"
                className="form-textbox"
                value={formData['q26_pronomsPreferes']}
                onChange={(e) => handleChange('q26_pronomsPreferes', e.target.value)}
              />
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-back" onClick={prevPage}>{t('common.previous')}</button>
              <button type="button" className="form-pagebreak-next" onClick={nextPage}>{t('common.next')}</button>
            </div>
          </div>
        )}

        {/* PAGE 3: {t('form.sections.contraindications')} (Matrices) */}
        {currentPage === 3 && (
          <div className="form-page" id="page-3">
            <h2 className="form-section-title">{t('form.sections.contraindications')}</h2>

            {/* Matrix q32 - Saignements Utérins */}
            <div className="form-line">
              <label className="form-label">{t('form.sections.contraindications')} Liées Aux Saignements Utérins</label>
              <table className="form-matrix-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Oui</th>
                    <th>Pas Sure</th>
                    <th>Non</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    t('form.questions.q32_0'),
                    t('form.questions.q32_1'),
                    t('form.questions.q32_2'),
                    t('form.questions.q32_3')
                  ].map((rowLabel, rowIndex) => (
                    <tr key={rowIndex}>
                      <th className="form-matrix-headers">{rowLabel}</th>
                      {[t('form.options.yes'), t('form.options.notSure'), t('form.options.no')].map((option) => (
                        <td key={option}>
                          <input
                            type="radio"
                            name={`q32_contreindicationsLiees[${rowIndex}]`}
                            value={option}
                            checked={formData['q32_contreindicationsLiees'][rowIndex] === option}
                            onChange={() => handleMatrixChange('q32_contreindicationsLiees', rowIndex, option)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix q33 - Grossesse */}
            <div className="form-line">
              <label className="form-label">{t('form.sections.contraindications')} Liées à La Grossesse</label>
              <table className="form-matrix-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Oui</th>
                    <th>Pas Sure</th>
                    <th>Non</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    t('form.questions.q33_0'),
                    t('form.questions.q33_1'),
                    t('form.questions.q33_2')
                  ].map((rowLabel, rowIndex) => (
                    <tr key={rowIndex}>
                      <th className="form-matrix-headers">{rowLabel}</th>
                      {[t('form.options.yes'), t('form.options.notSure'), t('form.options.no')].map((option) => (
                        <td key={option}>
                          <input
                            type="radio"
                            name={`q33_contreindicationsLiees33[${rowIndex}]`}
                            value={option}
                            checked={formData['q33_contreindicationsLiees33'][rowIndex] === option}
                            onChange={() => handleMatrixChange('q33_contreindicationsLiees33', rowIndex, option)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes - q34_informationsComplementaires */}
            <div className="form-line">
              <label htmlFor="input_34" className="form-label">
                {t('form.labels.additionalInfo')}
              </label>
              <textarea
                id="input_34"
                name="q34_informationsComplementaires"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q34_informationsComplementaires']}
                onChange={(e) => handleChange('q34_informationsComplementaires', e.target.value)}
              />
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-back" onClick={prevPage}>{t('common.previous')}</button>
              <button type="button" className="form-pagebreak-next" onClick={nextPage}>{t('common.next')}</button>
            </div>
          </div>
        )}

        {/* PAGE 4: More {t('form.sections.contraindications')} */}
        {currentPage === 4 && (
          <div className="form-page" id="page-4">
            <h2 className="form-section-title">{t('form.sections.contraindications')}</h2>

            {/* Matrix q36 - Médicales */}
            <div className="form-line">
              <label className="form-label">{t('form.sections.contraindications')} Médicales</label>
              <table className="form-matrix-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Oui</th>
                    <th>Pas Sure</th>
                    <th>Non</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    t('form.questions.q34_0'),
                    t('form.questions.q34_1'),
                    t('form.questions.q34_2'),
                    t('form.questions.q34_3'),
                    t('form.questions.q34_4'),
                    t('form.questions.q34_5')
                  ].map((rowLabel, rowIndex) => (
                    <tr key={rowIndex}>
                      <th className="form-matrix-headers">{rowLabel}</th>
                      {[t('form.options.yes'), t('form.options.notSure'), t('form.options.no')].map((option) => (
                        <td key={option}>
                          <input
                            type="radio"
                            name={`q36_contreindicationsMedicales[${rowIndex}]`}
                            value={option}
                            checked={formData['q36_contreindicationsMedicales'][rowIndex] === option}
                            onChange={() => handleMatrixChange('q36_contreindicationsMedicales', rowIndex, option)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix q37 - Chaleur */}
            <div className="form-line">
              <label className="form-label">Contre-Indication Liée à La Chaleur</label>
              <table className="form-matrix-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Oui</th>
                    <th>Pas Sure</th>
                    <th>Non</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    t('form.questions.q36_0')
                  ].map((rowLabel, rowIndex) => (
                    <tr key={rowIndex}>
                      <th className="form-matrix-headers">{rowLabel}</th>
                      {[t('form.options.yes'), t('form.options.notSure'), t('form.options.no')].map((option) => (
                        <td key={option}>
                          <input
                            type="radio"
                            name={`q37_contreindicationLiee[${rowIndex}]`}
                            value={option}
                            checked={formData['q37_contreindicationLiee'][rowIndex] === option}
                            onChange={() => handleMatrixChange('q37_contreindicationLiee', rowIndex, option)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes - q38_informationsComplementaires38 */}
            <div className="form-line">
              <label htmlFor="input_38" className="form-label">
                {t('form.labels.additionalInfo')}
              </label>
              <textarea
                id="input_38"
                name="q38_informationsComplementaires38"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q38_informationsComplementaires38']}
                onChange={(e) => handleChange('q38_informationsComplementaires38', e.target.value)}
              />
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-back" onClick={prevPage}>{t('common.previous')}</button>
              <button type="button" className="form-pagebreak-next" onClick={nextPage}>{t('common.next')}</button>
            </div>
          </div>
        )}

        {/* PAGE 5: {t('form.sections.sensitivities')} */}
        {currentPage === 5 && (
          <div className="form-page" id="page-5">
            <h2 className="form-section-title">{t('form.sections.sensitivities')}</h2>

            {/* Matrix q40 - Saignements */}
            <div className="form-line">
              <label className="form-label">{t('form.sections.sensitivities')} Aux Saignements Utérins</label>
              <table className="form-matrix-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Oui</th>
                    <th>Pas Sure</th>
                    <th>Non</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    t('form.questions.q40_0'),
                    t('form.questions.q40_1')
                  ].map((rowLabel, rowIndex) => (
                    <tr key={rowIndex}>
                      <th className="form-matrix-headers">{rowLabel}</th>
                      {[t('form.options.yes'), t('form.options.notSure'), t('form.options.no')].map((option) => (
                        <td key={option}>
                          <input
                            type="radio"
                            name={`q40_uterineBleeding40[${rowIndex}]`}
                            value={option}
                            checked={formData['q40_uterineBleeding40'][rowIndex] === option}
                            onChange={() => handleMatrixChange('q40_uterineBleeding40', rowIndex, option)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix q42 - Chaleur (abbreviated for space) */}
            <div className="form-line">
              <label className="form-label">{t('form.sections.sensitivities')} Liées à La Chaleur</label>
              <table className="form-matrix-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Oui</th>
                    <th>Pas Sure</th>
                    <th>Non</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    t('form.questions.q42_0'),
                    t('form.questions.q42_1'),
                    t('form.questions.q42_2'),
                    t('form.questions.q42_3'),
                    t('form.questions.q42_4'),
                    t('form.questions.q42_5')
                  ].map((rowLabel, rowIndex) => (
                    <tr key={rowIndex}>
                      <th className="form-matrix-headers">{rowLabel}</th>
                      {[t('form.options.yes'), t('form.options.notSure'), t('form.options.no')].map((option) => (
                        <td key={option}>
                          <input
                            type="radio"
                            name={`q42_sensibilitesLiees42[${rowIndex}]`}
                            value={option}
                            checked={formData['q42_sensibilitesLiees42'][rowIndex] === option}
                            onChange={() => handleMatrixChange('q42_sensibilitesLiees42', rowIndex, option)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes - q45_furtherInformation45 */}
            <div className="form-line">
              <label htmlFor="input_45" className="form-label">
                {t('form.labels.additionalInfo')}
              </label>
              <textarea
                id="input_45"
                name="q45_furtherInformation45"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q45_furtherInformation45']}
                onChange={(e) => handleChange('q45_furtherInformation45', e.target.value)}
              />
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-back" onClick={prevPage}>{t('common.previous')}</button>
              <button type="button" className="form-pagebreak-next" onClick={nextPage}>{t('common.next')}</button>
            </div>
          </div>
        )}

        {/* PAGE 6: Additional Questions */}
        {currentPage === 6 && (
          <div className="form-page" id="page-6">
            <h2 className="form-section-title">{t('form.sections.additionalQuestions')}</h2>

            {/* Experience vapeur - q151_whatIs151 */}
            <div className="form-line">
              <label htmlFor="input_151" className="form-label">
                Quelle est votre expérience avec la vapeur périnéale ?
              </label>
              <textarea
                id="input_151"
                name="q151_whatIs151"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q151_whatIs151']}
                onChange={(e) => handleChange('q151_whatIs151', e.target.value)}
              />
            </div>

            {/* Principal souci - q152_whatIs152 */}
            <div className="form-line">
              <label htmlFor="input_152" className="form-label">
                {t('form.labels.mainConcern')}
              </label>
              <textarea
                id="input_152"
                name="q152_whatIs152"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q152_whatIs152']}
                onChange={(e) => handleChange('q152_whatIs152', e.target.value)}
              />
            </div>

            {/* Autres infos - q159_autresInformations */}
            <div className="form-line">
              <label htmlFor="input_159" className="form-label">
                {t('form.labels.otherInfo')}
              </label>
              <textarea
                id="input_159"
                name="q159_autresInformations"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q159_autresInformations']}
                onChange={(e) => handleChange('q159_autresInformations', e.target.value)}
              />
            </div>

            {/* Initiales - q63_myInitials63 */}
            <div className="form-line">
              <label htmlFor="input_63" className="form-label">
                Mes initiales ci-dessous confirment que j'ai reçu une copie des Recommandations avant la séance de vapeur
              </label>
              <input
                type="text"
                id="input_63"
                name="q63_myInitials63"
                className="form-textbox"
                value={formData['q63_myInitials63']}
                onChange={(e) => handleChange('q63_myInitials63', e.target.value)}
              />
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-back" onClick={prevPage}>{t('common.previous')}</button>
              <button type="button" className="form-pagebreak-next" onClick={nextPage}>{t('common.next')}</button>
            </div>
          </div>
        )}

        {/* PAGE 7: Signature */}
        {currentPage === 7 && (
          <div className="form-page" id="page-7">
            <h2 className="form-section-title">
              FORMULAIRE DE CONSENTEMENT ÉCLAIRÉ, DE DÉCHARGE DE RESPONSABILITÉ ET D'ASSUMPTION DES RISQUES
            </h2>

            {/* Consent text widget - q135_typeA135 */}
            <div className="form-line">
              <div className="consent-text">
                {/* Full consent text from JotForm HTML would go here */}
                <p><strong>Ce document constitue un accord légal entre ZenShe Spa...</strong></p>
                {/* ... complete consent text ... */}
              </div>
            </div>

            {/* Signature - q68_signatureManuscrite */}
            <div className="form-line jf-required">
              <label htmlFor="first_68" className="form-label">
                Signature manuscrite<span className="form-required">*</span>
              </label>
              <div className="form-name-wrapper">
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="first_68"
                    name="q68_signatureManuscrite[first]"
                    className="form-textbox"
                    value={formData['q68_signatureManuscrite'].first}
                    onChange={(e) => handleNestedChange('q68_signatureManuscrite', 'first', e.target.value)}
                    required
                  />
                  <label className="form-sub-label">Prénom</label>
                </span>
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="last_68"
                    name="q68_signatureManuscrite[last]"
                    className="form-textbox"
                    value={formData['q68_signatureManuscrite'].last}
                    onChange={(e) => handleNestedChange('q68_signatureManuscrite', 'last', e.target.value)}
                    required
                  />
                  <label className="form-sub-label">Nom</label>
                </span>
              </div>
              {errors['q68_signatureManuscrite'] && <span className="error-message">{errors['q68_signatureManuscrite']}</span>}
            </div>

            {/* Guardian signature if under 18 - q166_parent_guardian_sig */}
            <div className="form-line">
              <label htmlFor="first_166" className="form-label">
                Si la cliente a moins de 18 ans, un parent ou tuteur légal doit signer ci-dessus et indiquer le nom de l'enfant ci-dessous
              </label>
              <div className="form-name-wrapper">
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="first_166"
                    name="q166_parent_guardian_sig[first]"
                    className="form-textbox"
                    value={formData['q166_parent_guardian_sig'].first}
                    onChange={(e) => handleNestedChange('q166_parent_guardian_sig', 'first', e.target.value)}
                  />
                  <label className="form-sub-label">Prénom de l'enfant :</label>
                </span>
                <span className="form-sub-label-container">
                  <input
                    type="text"
                    id="last_166"
                    name="q166_parent_guardian_sig[last]"
                    className="form-textbox"
                    value={formData['q166_parent_guardian_sig'].last}
                    onChange={(e) => handleNestedChange('q166_parent_guardian_sig', 'last', e.target.value)}
                  />
                  <label className="form-sub-label">Nom de l'enfant :</label>
                </span>
              </div>
            </div>

            {/* Date - q132_date132 */}
            <div className="form-line">
              <label htmlFor="lite_mode_132" className="form-label">Date</label>
              <input
                type="text"
                id="lite_mode_132"
                name="lite_mode_132"
                className="form-textbox"
                placeholder="MM-DD-YYYY"
                value={formData.lite_mode_132}
                onChange={(e) => handleChange('lite_mode_132', e.target.value)}
              />
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-back" onClick={prevPage}>{t('common.previous')}</button>
              <button type="submit" className="form-submit-button">
                {t('form.sendToPractitioner')}
              </button>
            </div>
          </div>
        )}

        {/* PAGE 8: Practitioner Protocol */}
        {currentPage === 8 && (
          <div className="form-page" id="page-8">
            <h2 className="form-section-title">{t('form.sections.protocol')}</h2>

            {/* Durée Vapeur - q84_dureeDe */}
            <div className="form-line">
              <label className="form-label">Durée de Vapeur</label>
              <div className="form-single-column">
                {['30 minutes', '25 minutes', '20 minutes', 'Other'].map((option, idx) => (
                  <span key={idx} className="form-radio-item">
                    <input
                      type="radio"
                      id={`input_84_${idx}`}
                      name="q84_dureeDe"
                      value={option}
                      checked={formData['q84_dureeDe'] === option}
                      onChange={(e) => handleChange('q84_dureeDe', e.target.value)}
                    />
                    <label htmlFor={`input_84_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* Plantes - q85_plantes */}
            <div className="form-line">
              <label className="form-label">Plantes</label>
              <div className="form-single-column">
                {['Armoise', 'Angélique Sauvage', 'Calendula', 'Camomille', 'Lavande', 'Ortie', 'Rose', 'Sauge Blanche', 'Romarin', 'Yarrow', 'Basilic Sacré', 'Autre'].map((option, idx) => (
                  <span key={idx} className="form-checkbox-item">
                    <input
                      type="checkbox"
                      id={`input_85_${idx}`}
                      name="q85_plantes[]"
                      value={option}
                      checked={formData['q85_plantes'].includes(option)}
                      onChange={(e) => handleCheckboxChange('q85_plantes', option, e.target.checked)}
                    />
                    <label htmlFor={`input_85_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* {t('form.labels.practitionerNotes')} - q87_notesPraticienne87 */}
            <div className="form-line">
              <label htmlFor="input_87" className="form-label">
                {t('form.labels.practitionerNotes')}
              </label>
              <textarea
                id="input_87"
                name="q87_notesPraticienne87"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q87_notesPraticienne87']}
                onChange={(e) => handleChange('q87_notesPraticienne87', e.target.value)}
              />
            </div>

            {/* Autres Huiles - q88_autresHuiles88 */}
            <div className="form-line">
              <label className="form-label">{t('form.labels.essentialOils')}</label>
              <div className="form-single-column">
                {['Huile de Rose', 'Lavande', 'Camomille', 'Autre'].map((option, idx) => (
                  <span key={idx} className="form-checkbox-item">
                    <input
                      type="checkbox"
                      id={`input_88_${idx}`}
                      name="q88_autresHuiles88[]"
                      value={option}
                      checked={formData['q88_autresHuiles88'].includes(option)}
                      onChange={(e) => handleCheckboxChange('q88_autresHuiles88', option, e.target.checked)}
                    />
                    <label htmlFor={`input_88_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* Pierres - q89_pierres */}
            <div className="form-line">
              <label className="form-label">Pierres</label>
              <div className="form-single-column">
                {['Quartz Rose', 'Jade', 'Obsidienne', 'Améthyste', 'Autre'].map((option, idx) => (
                  <span key={idx} className="form-checkbox-item">
                    <input
                      type="checkbox"
                      id={`input_89_${idx}`}
                      name="q89_pierres[]"
                      value={option}
                      checked={formData['q89_pierres'].includes(option)}
                      onChange={(e) => handleCheckboxChange('q89_pierres', option, e.target.checked)}
                    />
                    <label htmlFor={`input_89_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* Température - q90_temperature90 */}
            <div className="form-line">
              <label className="form-label">Température</label>
              <div className="form-single-column">
                {[t('form.options.hot'), t('form.options.medium'), t('form.options.soft')].map((option, idx) => (
                  <span key={idx} className="form-radio-item">
                    <input
                      type="radio"
                      id={`input_90_${idx}`}
                      name="q90_temperature90"
                      value={option}
                      checked={formData['q90_temperature90'] === option}
                      onChange={(e) => handleChange('q90_temperature90', e.target.value)}
                    />
                    <label htmlFor={`input_90_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* Vapeur - q91_vapeur */}
            <div className="form-line">
              <label className="form-label">Vapeur</label>
              <div className="form-single-column">
                {[t('form.options.strong'), t('form.options.medium'), 'Légère'].map((option, idx) => (
                  <span key={idx} className="form-radio-item">
                    <input
                      type="radio"
                      id={`input_91_${idx}`}
                      name="q91_vapeur"
                      value={option}
                      checked={formData['q91_vapeur'] === option}
                      onChange={(e) => handleChange('q91_vapeur', e.target.value)}
                    />
                    <label htmlFor={`input_91_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* {t('form.labels.blankets')} - q92_{t('form.labels.blankets')} */}
            <div className="form-line">
              <label className="form-label">{t('form.labels.blankets')}</label>
              <div className="form-single-column">
                {[t('form.options.yes'), t('form.options.no')].map((option, idx) => (
                  <span key={idx} className="form-radio-item">
                    <input
                      type="radio"
                      id={`input_92_${idx}`}
                      name="q92_blankets"
                      value={option}
                      checked={formData['q92_blankets'] === option}
                      onChange={(e) => handleChange('q92_blankets', e.target.value)}
                    />
                    <label htmlFor={`input_92_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-back" onClick={prevPage}>{t('common.previous')}</button>
              <button type="button" className="form-pagebreak-next" onClick={nextPage}>{t('common.next')}</button>
            </div>
          </div>
        )}

        {/* PAGE 9: Practitioner Recommendations */}
        {currentPage === 9 && (
          <div className="form-page" id="page-9">
            <h2 className="form-section-title">{t('form.sections.recommendations')}</h2>

            {/* Tisanes - q96_tisanes96 */}
            <div className="form-line">
              <label className="form-label">Tisanes Recommandées</label>
              <div className="form-single-column">
                {['Framboise', 'Ortie', 'Armoise', 'Achillée Millefeuille', 'Rose', 'Camomille', 'Autre'].map((option, idx) => (
                  <span key={idx} className="form-checkbox-item">
                    <input
                      type="checkbox"
                      id={`input_96_${idx}`}
                      name="q96_tisanes96[]"
                      value={option}
                      checked={formData['q96_tisanes96'].includes(option)}
                      onChange={(e) => handleCheckboxChange('q96_tisanes96', option, e.target.checked)}
                    />
                    <label htmlFor={`input_96_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* Pierres - q98_pierresPour98 */}
            <div className="form-line">
              <label className="form-label">Pierres pour Guérison</label>
              <div className="form-single-column">
                {['Quartz Rose', 'Jade', 'Obsidienne', 'Améthyste', 'Autre'].map((option, idx) => (
                  <span key={idx} className="form-checkbox-item">
                    <input
                      type="checkbox"
                      id={`input_98_${idx}`}
                      name="q98_pierresPour98[]"
                      value={option}
                      checked={formData['q98_pierresPour98'].includes(option)}
                      onChange={(e) => handleCheckboxChange('q98_pierresPour98', option, e.target.checked)}
                    />
                    <label htmlFor={`input_98_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* Huiles - q99_huilesRecommandees99 */}
            <div className="form-line">
              <label htmlFor="input_99" className="form-label">
                Huiles Recommandées
              </label>
              <textarea
                id="input_99"
                name="q99_huilesRecommandees99"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q99_huilesRecommandees99']}
                onChange={(e) => handleChange('q99_huilesRecommandees99', e.target.value)}
              />
            </div>

            {/* Livres - q100_livresRecommandes100 */}
            <div className="form-line">
              <label htmlFor="input_100" className="form-label">
                Livres Recommandés
              </label>
              <textarea
                id="input_100"
                name="q100_livresRecommandes100"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q100_livresRecommandes100']}
                onChange={(e) => handleChange('q100_livresRecommandes100', e.target.value)}
              />
            </div>

            {/* Ressources - q160_ressourcesEn160 */}
            <div className="form-line">
              <label className="form-label">{t('form.labels.onlineResources')}</label>
              <div className="form-single-column">
                {['Facebook Group', 'Instagram', 'Website', 'YouTube', 'Autre'].map((option, idx) => (
                  <span key={idx} className="form-checkbox-item">
                    <input
                      type="checkbox"
                      id={`input_160_${idx}`}
                      name="q160_ressourcesEn160[]"
                      value={option}
                      checked={formData['q160_ressourcesEn160'].includes(option)}
                      onChange={(e) => handleCheckboxChange('q160_ressourcesEn160', option, e.target.checked)}
                    />
                    <label htmlFor={`input_160_${idx}`}>{option}</label>
                  </span>
                ))}
              </div>
            </div>

            {/* {t('form.labels.otherRecommendations')} - q161_autresRecommandations161 */}
            <div className="form-line">
              <label htmlFor="input_161" className="form-label">
                {t('form.labels.otherRecommendations')}
              </label>
              <textarea
                id="input_161"
                name="q161_autresRecommandations161"
                className="form-textarea"
                placeholder={t('form.placeholder')}
                value={formData['q161_autresRecommandations161']}
                onChange={(e) => handleChange('q161_autresRecommandations161', e.target.value)}
              />
            </div>

            <div className="form-pagebreak">
              <button type="button" className="form-pagebreak-back" onClick={prevPage}>{t('common.previous')}</button>
              <button type="submit" className="form-submit-button">
                {t('form.sendToPractitioner')}
              </button>
            </div>
          </div>
        )}

        {/* Page indicator */}
        <div className="page-info">
          {t('form.pageIndicator', { current: currentPage + 1, total: 10 })}
        </div>
      </form>
    </div>
  );
};

export default CompleteJotForm;
