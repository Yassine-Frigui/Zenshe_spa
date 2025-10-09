/**
 * JotForm HTML Parser
 * This script extracts all field definitions from the JotForm HTML file
 * and generates the complete React form component with EXACT field names
 */

const fs = require('fs');
const path = require('path');

// Path to the JotForm HTML file
const htmlFilePath = path.join(__dirname, '../../../frontend/public/jotform_zenshe_form.html');
const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

// Field extraction patterns
const patterns = {
  input: /<input[^>]*id="input_(\d+)"[^>]*name="([^"]+)"[^>]*type="([^"]+)"[^>]*>/gi,
  textarea: /<textarea[^>]*id="input_(\d+)"[^>]*name="([^"]+)"[^>]*>/gi,
  label: /<label[^>]*id="label_(\d+)"[^>]*>([^<]+)</gi,
  matrix: /<input[^>]*id="input_(\d+)_(\d+)_(\d+)"[^>]*name="([^"]+)"[^>]*value="([^"]+)"[^>]*>/gi,
  checkbox: /<input[^>]*type="checkbox"[^>]*id="input_(\d+)_(\d+)"[^>]*name="([^"]+)"[^>]*value="([^"]+)"[^>]*>/gi,
  radio: /<input[^>]*type="radio"[^>]*id="input_(\d+)_(\d+)"[^>]*name="([^"]+)"[^>]*value="([^"]+)"[^>]*>/gi,
  select: /<select[^>]*id="input_(\d+)"[^>]*name="([^"]+)"[^>]*>/gi,
  matrixLabel: /<label[^>]*id="label_(\d+)_row_(\d+)"[^>]*>([^<]+)</gi,
  pageBreak: /<li[^>]*id="cid_(\d+)"[^>]*data-type="control_pagebreak"/gi,
  header: /<h2[^>]*id="header_(\d+)"[^>]*>([^<]+)</gi
};

const fields = [];
const labels = {};
const matrixQuestions = {};
const pages = [];
let currentPage = 0;

// Extract labels
let match;
while ((match = patterns.label.exec(htmlContent)) !== null) {
  labels[match[1]] = match[2].trim();
}

// Extract matrix row labels
patterns.matrixLabel.lastIndex = 0;
while ((match = patterns.matrixLabel.exec(htmlContent)) !== null) {
  const fieldId = match[1];
  const rowIndex = match[2];
  const label = match[3].trim();
  
  if (!matrixQuestions[fieldId]) {
    matrixQuestions[fieldId] = {};
  }
  matrixQuestions[fieldId][rowIndex] = label;
}

// Extract page breaks
patterns.pageBreak.lastIndex = 0;
while ((match = patterns.pageBreak.exec(htmlContent)) !== null) {
  pages.push({
    pageNumber: currentPage++,
    breakId: match[1]
  });
}

// Extract headers
patterns.header.lastIndex = 0;
while ((match = patterns.header.exec(htmlContent)) !== null) {
  const pageIndex = pages.findIndex(p => p.breakId > match[1]);
  if (pageIndex !== -1 && !pages[pageIndex].header) {
    pages[pageIndex].header = match[2].trim();
  }
}

// Extract input fields
patterns.input.lastIndex = 0;
while ((match = patterns.input.exec(htmlContent)) !== null) {
  const fieldId = match[1];
  const fieldName = match[2];
  const fieldType = match[3];
  
  fields.push({
    id: fieldId,
    name: fieldName,
    type: fieldType,
    label: labels[fieldId] || '',
    component: 'input'
  });
}

// Extract textarea fields
patterns.textarea.lastIndex = 0;
while ((match = patterns.textarea.exec(htmlContent)) !== null) {
  const fieldId = match[1];
  const fieldName = match[2];
  
  fields.push({
    id: fieldId,
    name: fieldName,
    type: 'textarea',
    label: labels[fieldId] || '',
    component: 'textarea'
  });
}

// Extract matrix fields
patterns.matrix.lastIndex = 0;
const matrixFields = {};
while ((match = patterns.matrix.exec(htmlContent)) !== null) {
  const fieldId = match[1];
  const rowIndex = match[2];
  const colIndex = match[3];
  const fieldName = match[4];
  const value = match[5];
  
  if (!matrixFields[fieldId]) {
    matrixFields[fieldId] = {
      id: fieldId,
      name: fieldName.replace(/\[\d+\]/, ''),
      type: 'matrix',
      label: labels[fieldId] || '',
      rows: {},
      component: 'matrix'
    };
  }
  
  if (!matrixFields[fieldId].rows[rowIndex]) {
    matrixFields[fieldId].rows[rowIndex] = {
      label: matrixQuestions[fieldId]?.[rowIndex] || '',
      options: []
    };
  }
  
  matrixFields[fieldId].rows[rowIndex].options.push({
    colIndex,
    value
  });
}

// Add matrix fields to main fields array
Object.values(matrixFields).forEach(field => {
  field.rowCount = Object.keys(field.rows).length;
  fields.push(field);
});

// Extract checkbox fields
patterns.checkbox.lastIndex = 0;
const checkboxFields = {};
while ((match = patterns.checkbox.exec(htmlContent)) !== null) {
  const fieldId = match[1];
  const optionIndex = match[2];
  const fieldName = match[3];
  const value = match[4];
  
  if (!checkboxFields[fieldId]) {
    checkboxFields[fieldId] = {
      id: fieldId,
      name: fieldName.replace('[]', ''),
      type: 'checkbox',
      label: labels[fieldId] || '',
      options: [],
      component: 'checkbox'
    };
  }
  
  checkboxFields[fieldId].options.push({
    index: optionIndex,
    value: value
  });
}

// Add checkbox fields to main fields array
Object.values(checkboxFields).forEach(field => {
  fields.push(field);
});

// Extract radio fields
patterns.radio.lastIndex = 0;
const radioFields = {};
while ((match = patterns.radio.exec(htmlContent)) !== null) {
  const fieldId = match[1];
  const optionIndex = match[2];
  const fieldName = match[3];
  const value = match[4];
  
  if (!radioFields[fieldId]) {
    radioFields[fieldId] = {
      id: fieldId,
      name: fieldName,
      type: 'radio',
      label: labels[fieldId] || '',
      options: [],
      component: 'radio'
    };
  }
  
  radioFields[fieldId].options.push({
    index: optionIndex,
    value: value
  });
}

// Add radio fields to main fields array
Object.values(radioFields).forEach(field => {
  fields.push(field);
});

// Sort fields by ID
fields.sort((a, b) => parseInt(a.id) - parseInt(b.id));

// Generate report
console.log('\n=== JotForm Field Extraction Report ===\n');
console.log(`Total fields found: ${fields.length}`);
console.log(`Total pages: ${pages.length}\n`);

console.log('Field Summary:');
const summary = {};
fields.forEach(field => {
  summary[field.component] = (summary[field.component] || 0) + 1;
});
Object.entries(summary).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Save field definitions to JSON
const outputPath = path.join(__dirname, 'jotform_fields.json');
fs.writeFileSync(outputPath, JSON.stringify({
  fields,
  pages,
  labels,
  matrixQuestions
}, null, 2));

console.log(`\nField definitions saved to: ${outputPath}`);

// Generate initial state code
console.log('\n=== Generated Initial State ===\n');
console.log('const [formData, setFormData] = useState({');

fields.forEach(field => {
  const fieldName = field.name.replace(/\[.*\]/, '');
  
  if (field.component === 'matrix') {
    console.log(`  '${fieldName}': ${JSON.stringify(new Array(field.rowCount).fill(''))}, // ${field.label}`);
  } else if (field.component === 'checkbox') {
    console.log(`  '${fieldName}': [], // ${field.label}`);
  } else if (field.name.includes('[')) {
    // Nested field (name, address, date)
    const parts = field.name.match(/([^\[]+)\[([^\]]+)\]/);
    if (parts) {
      console.log(`  // '${parts[1]}': { '${parts[2]}': '' }, // ${field.label}`);
    }
  } else {
    console.log(`  '${fieldName}': '', // ${field.label}`);
  }
});

console.log('});');

module.exports = { fields, pages, labels, matrixQuestions };
