// We will enforce a 10-digit phone number. If the cleaned phone number isn't exactly 10 digits, 
// we won't proceed with create or update. We'll display an error message in the console for now.
// When displaying the phone number in the table, if it's 10 digits, we'll format it as XXX-XXX-XXXX.

// Get references to form and inputs
const form = document.querySelector('form');
const fullNameInput = document.getElementById('full-name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const submitButton = form.querySelector('button[type="submit"]');

// Stats elements
const totalContactEl = document.getElementById('total_contact');
const originalContactEl = document.getElementById('original_contact');
const newContactEl = document.getElementById('new_contact');
const modifiedContactEl = document.getElementById('modified_contact');
const removedContactEl = document.getElementById('removed_contact');

// Sort icon
const sortIcon = document.getElementById('sort_icon');

// Notification container
const notificationContainer = document.querySelector('[aria-live="assertive"]');

let currentContactId = null;
let originalCount = 0;
let newCount = 0;
let modifiedCount = 0;
let removedCount = 0;

let fetchedContacts = []; // Store contacts fetched from backend
let sortState = 0; // 0: original order, 1: ascending, 2: descending

// Show notification
function showSuccessNotification() {
  notificationContainer.style.display = 'flex';
  // Hide after a few seconds
  setTimeout(() => {
    notificationContainer.style.display = 'none';
  }, 3000);
}

// Fetch and render contacts from SheetDB
async function fetchAndRenderContacts() {
  try {
    const response = await fetch('https://sheetdb.io/api/v1/btgepnrddolpq');
    if (!response.ok) {
      console.error('Error fetching contacts:', response.statusText);
      return;
    }
    fetchedContacts = await response.json(); // returns an array of contacts
    renderContacts(fetchedContacts);
    updateStats(fetchedContacts);
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Function to format phone number for display
function formatPhone(phone) {
  // phone should be a string of 10 digits
  if (phone.length === 10) {
    return phone.slice(0, 3) + '-' + phone.slice(3, 6) + '-' + phone.slice(6);
  }
  return phone; // if it's not 10 digits, return as is (shouldn't happen if we enforce length)
}

// Render contacts to the table
function renderContacts(contacts) {
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = ''; // Clear existing rows

  contacts.forEach(contact => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.className = "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0";
    nameCell.textContent = contact.fullName || '';
    row.appendChild(nameCell);

    const phoneCell = document.createElement('td');
    phoneCell.className = "whitespace-nowrap px-3 py-4 text-sm text-gray-500";
    // Format the phone for display
    phoneCell.textContent = contact.phone ? formatPhone(contact.phone) : '';
    row.appendChild(phoneCell);

    const emailCell = document.createElement('td');
    emailCell.className = "whitespace-nowrap px-3 py-4 text-sm text-gray-500";
    emailCell.textContent = contact.email || '';
    row.appendChild(emailCell);

    const actionCell = document.createElement('td');
    actionCell.className = "whitespace-nowrap px-3 py-4 text-sm text-gray-500";

    const editLink = document.createElement('a');
    editLink.href = "#";
    editLink.className = "rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 mr-2";
    editLink.textContent = "Edit";
    editLink.addEventListener('click', (e) => {
      e.preventDefault();
      populateForm(contact);
    });

    const deleteLink = document.createElement('a');
    deleteLink.href = "#";
    deleteLink.className = "rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20";
    deleteLink.textContent = "Delete";
    deleteLink.addEventListener('click', (e) => {
      e.preventDefault();
      deleteContact(contact.id);
    });

    actionCell.appendChild(editLink);
    actionCell.appendChild(deleteLink);
    row.appendChild(actionCell);

    tbody.appendChild(row);
  });
}

// Populate form fields for editing
function populateForm(contact) {
  fullNameInput.value = contact.fullName || '';
  emailInput.value = contact.email || '';
  phoneInput.value = contact.phone || '';
  currentContactId = contact.id;
  submitButton.textContent = "Update Contact";
  document.getElementById('form_header').textContent = "Edit Contact";
}

// Validate and clean the phone number to be exactly 10 digits
function getCleanedPhone() {
  const cleaned = phoneInput.value.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    console.error('Phone number must be exactly 10 digits.');
    return null;
  }
  return cleaned;
}

// Create contact
async function createContact() {
  const cleanedPhone = getCleanedPhone();
  if (!cleanedPhone) return; // invalid phone, do not proceed

  // Determine new ID
  let newId = 0;
  if (fetchedContacts.length > 0) {
    const numericIds = fetchedContacts.map(c => parseInt(c.id, 10)).filter(num => !isNaN(num));
    if (numericIds.length > 0) {
      newId = Math.max(...numericIds) + 1;
    }
  }

  const contactData = {
    id: newId.toString(),
    fullName: fullNameInput.value,
    email: emailInput.value,
    phone: cleanedPhone
  };

  try {
    const response = await fetch('https://sheetdb.io/api/v1/btgepnrddolpq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [contactData] })
    });
    if (!response.ok) {
      console.error('Error creating contact:', response.statusText);
    } else {
      console.log('Contact created successfully!');
      newCount++; // increment new contacts count
      form.reset();
      fetchAndRenderContacts();
      // No notification on create as requested
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Update contact
async function updateContact(id) {
  const cleanedPhone = getCleanedPhone();
  if (!cleanedPhone) return; // invalid phone, do not proceed

  const contactData = {
    id: id,
    fullName: fullNameInput.value,
    email: emailInput.value,
    phone: cleanedPhone
  };

  try {
    const response = await fetch(`https://sheetdb.io/api/v1/btgepnrddolpq/id/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({data:[contactData]})
    });
    if (!response.ok) {
      console.error('Error updating contact:', response.statusText);
    } else {
      console.log('Contact updated successfully!');
      modifiedCount++; // increment modified contacts count
      currentContactId = null;
      submitButton.textContent = "Add Contact";
      form.reset();
      document.getElementById('form_header').textContent="Add a Contact";
      fetchAndRenderContacts();
      showSuccessNotification(); // Show on update
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Delete contact
async function deleteContact(id) {
  try {
    const response = await fetch(`https://sheetdb.io/api/v1/btgepnrddolpq/id/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      console.error('Error deleting contact:', response.statusText);
    } else {
      console.log('Contact deleted successfully!');
      removedCount++; // increment removed contacts count
      fetchAndRenderContacts();
      showSuccessNotification(); // Show on deletion
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Update the stats
function updateStats(contacts) {
  const total = contacts.length;
  if (originalCount === 0) {
    originalCount = total;
  }

  totalContactEl.textContent = total;
  originalContactEl.textContent = originalCount;
  newContactEl.textContent = newCount;
  modifiedContactEl.textContent = modifiedCount;
  removedContactEl.textContent = removedCount;
}

// Sort functionality
sortIcon.addEventListener('click', () => {
  sortState = (sortState + 1) % 3;
  let contactsToRender = [...fetchedContacts]; // copy original array

  if (sortState === 1) {
    // Ascending
    contactsToRender.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  } else if (sortState === 2) {
    // Descending
    contactsToRender.sort((a, b) => (b.fullName || '').localeCompare(a.fullName || ''));
  }
  // If sortState === 0, it's the original order, so we don't sort.

  renderContacts(contactsToRender);
});

// Handle form submission
form.addEventListener('submit', function(event) {
  event.preventDefault();
  if (currentContactId !== null) {
    updateContact(currentContactId);
  } else {
    createContact();
  }
});

// Initial fetch and render
fetchAndRenderContacts();

// Hide notification on initial load
notificationContainer.style.display = 'none';