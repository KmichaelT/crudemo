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

const sortIcon = document.getElementById('sort_icon');

const notificationContainer = document.querySelector('[aria-live="assertive"]');

let currentContactId = null;
let originalCount = 0;
let newCount = 0;
let modifiedCount = 0;
let removedCount = 0;

let fetchedContacts = []; 
let sortState = 0;

function showSuccessNotification() {
  notificationContainer.style.display = 'flex';
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
    fetchedContacts = await response.json(); 
    renderContacts(fetchedContacts);
    updateStats(fetchedContacts);
  } catch (error) {
    console.error('Network error:', error);
  }
}

function formatPhone(phone) {
  if (phone.length === 10) {
    return phone.slice(0, 3) + '-' + phone.slice(3, 6) + '-' + phone.slice(6);
  }
  return phone;
}

function renderContacts(contacts) {
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = ''; 

  contacts.forEach(contact => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.className = "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0";
    nameCell.textContent = contact.fullName || '';
    row.appendChild(nameCell);

    const phoneCell = document.createElement('td');
    phoneCell.className = "whitespace-nowrap px-3 py-4 text-sm text-gray-500";

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

function populateForm(contact) {
  fullNameInput.value = contact.fullName || '';
  emailInput.value = contact.email || '';
  phoneInput.value = contact.phone || '';
  currentContactId = contact.id;
  submitButton.textContent = "Update Contact";
  document.getElementById('form_header').textContent = "Edit Contact";
}


function getCleanedPhone() {
  const cleaned = phoneInput.value.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    console.error('Phone number must be exactly 10 digits.');
    return null;
  }
  return cleaned;
}

async function createContact() {
  const cleanedPhone = getCleanedPhone();
  if (!cleanedPhone) return; 

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
      newCount++; 
      form.reset();
      fetchAndRenderContacts();
     
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

async function updateContact(id) {
  const cleanedPhone = getCleanedPhone();
  if (!cleanedPhone) return; 

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
      modifiedCount++; 
      currentContactId = null;
      submitButton.textContent = "Add Contact";
      form.reset();
      document.getElementById('form_header').textContent="Add a Contact";
      fetchAndRenderContacts();
      showSuccessNotification(); 
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

async function deleteContact(id) {
  try {
    const response = await fetch(`https://sheetdb.io/api/v1/btgepnrddolpq/id/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      console.error('Error deleting contact:', response.statusText);
    } else {
      console.log('Contact deleted successfully!');
      removedCount++; 
      fetchAndRenderContacts();
      showSuccessNotification(); 
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

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

sortIcon.addEventListener('click', () => {
  sortState = (sortState + 1) % 3;
  let contactsToRender = [...fetchedContacts]; 

  if (sortState === 1) {
    contactsToRender.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  } else if (sortState === 2) {
    contactsToRender.sort((a, b) => (b.fullName || '').localeCompare(a.fullName || ''));
  }


  renderContacts(contactsToRender);
});

form.addEventListener('submit', function(event) {
  event.preventDefault();
  if (currentContactId !== null) {
    updateContact(currentContactId);
  } else {
    createContact();
  }
});

fetchAndRenderContacts();

notificationContainer.style.display = 'none';