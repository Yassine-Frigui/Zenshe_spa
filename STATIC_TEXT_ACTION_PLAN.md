# Static Text Issues - Action Plan

## 🚨 CRITICAL ISSUES IDENTIFIED

### 1. Language Persistence Issue ✅ FIXED
- **Problem**: Page refresh resets language to French
- **Root Cause**: `lng: 'fr'` was hardcoded in i18n.js, overriding localStorage
- **Solution**: Removed `lng: 'fr'` line to let LanguageDetector handle it from localStorage
- **Status**: FIXED - language should now persist across page refreshes

### 2. Missing Cart Navigation Link ❌ TO DO
- **Problem**: No cart link in navigation
- **Location**: Need to add to Navbar component
- **Solution**: Add cart icon with item count badge linking to `/boutique/panier`

### 3. Product Translations in Database ❌ TO DO
- **Problem**: Products stored in single language in database
- **Current**: Products table has single `name` and `description` columns
- **Needed**: Multi-language support for products
- **Solution Options**:
  1. Add columns: `name_en`, `name_fr`, `name_ar`, `description_en`, etc.
  2. Create separate `product_translations` table (better for scalability)
  3. Store JSON in current columns (not recommended)
- **Recommended**: Option 2 (translations table)

## 📄 PAGES WITH STATIC TEXT

### Contact Page (frontend/src/pages/client/ContactPage.jsx)
**Status**: Has `useTranslation` imported ✓
**Hardcoded French Text Found**:
- Line 60: `title: "Adresse"` → needs `t('contact.address')`
- Line 68: `title: "Téléphone"` → needs `t('contact.phone')`
- Line 76: `title: "Email"` → needs `t('contact.email')`
- Line 84: `title: "Horaires"` → needs `t('contact.hours')`
- Line 87: `"Mon - Sat: 9h00 - 19h00"` → needs `t('contact.schedule')`
- Line 105: FAQ questions and answers (4 items) → needs `contact.faq` array
- Line 143: `"Contactez-nous"` → needs `t('contact.title')`
- Line 146: Description text → needs `t('contact.description')`
- Form labels and validation messages → needs translation keys

**Estimated Keys**: ~25-30

### Footer Component
**Status**: NO FOOTER COMPONENT FOUND ❓
**Action**: Verify if footer exists or if it's embedded in layout/pages

### Services Page (frontend/src/pages/client/ServicesPage.jsx)
**Status**: Has `useTranslation` imported ✓
**Hardcoded Text**:
- Line 299: `"View Details"` → needs `t('services.viewDetails')`

**Estimated Keys**: 1

### Booking Page (frontend/src/pages/client/BookingPage.jsx)
**Hardcoded Text Found**:
- Line 973: `"Support disponible"` → needs `t('booking.supportAvailable')`
- Waiver section → needs translation
- Three characteristics cards → needs translation

**Estimated Keys**: ~15-20

### About Us Page
**Hardcoded Text**:
- "Our mission" section with mixed text
- "Nos valeurs" section
- "Témoignages clientes" section
- "Nous contacter" section

**Estimated Keys**: ~20-30

## 🛠️ IMPLEMENTATION PLAN

### Phase 1: Quick Wins (HIGH PRIORITY)
1. ✅ Fix language persistence (DONE)
2. Add cart navigation link
3. Fix "View Details" in ServicesPage
4. Fix "Support disponible" in BookingPage

### Phase 2: Contact Page (HIGH PRIORITY)
- Update contactInfo array with translation keys
- Update FAQ items with translation keys
- Update form labels
- Add all keys to en/fr/ar translation files

### Phase 3: About Us Page (MEDIUM PRIORITY)
- Identify all static text sections
- Replace with translation keys
- Update all translation files

### Phase 4: Booking Page Full (MEDIUM PRIORITY)
- Waiver section translation
- Characteristics cards translation
- Form labels if any remaining

### Phase 5: Product Translations (IMPORTANT)
- Design database schema for multi-language products
- Create migration script
- Update backend API to return localized products
- Update frontend to display correct language

## 📊 DATABASE SCHEMA FOR PRODUCT TRANSLATIONS

### Option 1: Additional Columns (Simple, less flexible)
```sql
ALTER TABLE products 
ADD COLUMN name_en VARCHAR(255),
ADD COLUMN name_fr VARCHAR(255),
ADD COLUMN name_ar VARCHAR(255),
ADD COLUMN description_en TEXT,
ADD COLUMN description_fr TEXT,
ADD COLUMN description_ar TEXT;
```

### Option 2: Translations Table (Recommended)
```sql
CREATE TABLE product_translations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_language (product_id, language_code)
);
```

**Backend API Changes Needed**:
```javascript
// In Product model or route
getProduct: async (id, language = 'fr') => {
    const query = `
        SELECT p.*, 
               COALESCE(pt.name, p.name) as name,
               COALESCE(pt.description, p.description) as description,
               COALESCE(pt.ingredients, p.ingredients) as ingredients
        FROM products p
        LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = ?
        WHERE p.id = ?
    `;
    const [rows] = await db.query(query, [language, id]);
    return rows[0];
}
```

**Frontend API Call Changes**:
```javascript
// In api.js
getProduct: (id) => {
    const language = i18n.language || 'fr';
    return axios.get(`${API_URL}/products/${id}?lang=${language}`);
}
```

## 🔑 TRANSLATION KEYS TO ADD

### Contact Page Keys
```json
{
  "contact": {
    "title": "Contact Us",
    "description": "We're here to answer all your questions...",
    "address": "Address",
    "phone": "Phone",
    "email": "Email",
    "hours": "Hours",
    "schedule": "Mon - Sat: 9:00 AM - 7:00 PM",
    "form": {
      "name": "Name",
      "email": "Email",
      "subject": "Subject",
      "message": "Message",
      "send": "Send Message",
      "sending": "Sending...",
      "success": "Message sent successfully!",
      "error": "An error occurred. Please try again."
    },
    "faq": {
      "title": "Frequently Asked Questions",
      "q1": {
        "question": "How to book an appointment?",
        "answer": "You can book online via our booking page..."
      },
      "q2": {
        "question": "Can I modify or cancel my reservation?",
        "answer": "Yes, you can modify or cancel up to 4 hours before..."
      },
      "q3": {
        "question": "What payment methods do you accept?",
        "answer": "We accept cash, credit cards, and contactless payments."
      },
      "q4": {
        "question": "Do you offer packages or loyalty cards?",
        "answer": "Yes, we have several advantageous packages..."
      }
    },
    "social": {
      "title": "Follow Us",
      "instagram": "Instagram"
    }
  }
}
```

### Services Page Keys
```json
{
  "services": {
    "viewDetails": "View Details"
  }
}
```

### Booking Page Keys
```json
{
  "booking": {
    "supportAvailable": "Support Available",
    "feature1": {
      "title": "24/7 Support",
      "description": "Our team is available..."
    },
    "feature2": {
      "title": "Easy Booking",
      "description": "Book in just a few clicks..."
    },
    "feature3": {
      "title": "Secure Payment",
      "description": "Your payments are secure..."
    },
    "waiver": {
      "title": "Waiver Form",
      "description": "Please read and sign..."
    }
  }
}
```

## ✅ COMPLETION CHECKLIST

- [x] Fix language persistence issue
- [ ] Add cart navigation link
- [ ] Fix ServicesPage "View Details"
- [ ] Fix BookingPage "Support disponible"
- [ ] Internationalize Contact Page
- [ ] Internationalize About Us Page
- [ ] Internationalize remaining Booking Page text
- [ ] Design product translations database schema
- [ ] Implement product translations backend
- [ ] Update frontend for product translations
- [ ] Add all translation keys to en/fr/ar files
- [ ] Test all pages in all 3 languages

## 📝 NOTES

- All translation keys should follow the pattern: `section.subsection.key`
- Arabic translations need special attention for RTL layout
- Product translations will require backend API changes
- Consider creating admin interface for managing translations
