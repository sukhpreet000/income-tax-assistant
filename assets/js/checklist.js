/**
 * Income Tax Filing Assistant - Document Checklist Module
 * Vanilla JavaScript (No frameworks)
 */

let currentChecklist = [];

async function loadChecklist() {
  const fy = getSelectedFY();
  const listContainer = document.getElementById('checklist-items-container');
  const progressBar = document.getElementById('checklist-progress-bar');
  const progressText = document.getElementById('checklist-progress-text');

  listContainer.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="spinner spinner-primary"></div>
      <div style="margin-top: 0.5rem; color: var(--gray-500);">Loading document checklist...</div>
    </div>
  `;

  try {
    const res = await apiRequest(`checklist.php?fy=${encodeURIComponent(fy)}`);
    currentChecklist = res.data || [];

    const total = currentChecklist.length;
    const completed = currentChecklist.filter(d => d.status === 'uploaded' || d.status === 'verified').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${completed} of ${total} Documents Ready (${pct}%)`;

    if (total === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">No Checklist Items Configured</div>
          <button class="btn btn-primary btn-sm" onclick="seedDefaultChecklist()">Initialize Default Checklist</button>
        </div>
      `;
      return;
    }

    let html = '';
    currentChecklist.forEach(item => {
      const isReady = item.status === 'uploaded' || item.status === 'verified';
      const statusBadges = {
        'pending': '<span class="badge badge-warning">Pending</span>',
        'uploaded': '<span class="badge badge-info">Document In Hand</span>',
        'verified': '<span class="badge badge-success">Verified</span>',
        'na': '<span class="badge badge-neutral">Not Applicable</span>'
      };

      html += `
        <div style="background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: flex-start; gap: 1rem; max-width: 65%;">
            <input type="checkbox" ${isReady ? 'checked' : ''} onchange="toggleItemStatus(${item.id}, this.checked)" style="width: 20px; height: 20px; margin-top: 3px; cursor: pointer;">
            <div>
              <div style="font-size: 1rem; font-weight: 700; color: var(--gray-900); display: flex; align-items: center; gap: 0.5rem;">
                <span style="${isReady ? 'text-decoration: line-through; color: var(--gray-500);' : ''}">${escapeHtml(item.doc_name)}</span>
                ${statusBadges[item.status] || ''}
              </div>
              <div style="font-size: 0.85rem; color: var(--gray-500); margin-top: 0.2rem;">${escapeHtml(item.notes || 'Required for statutory income / deduction reconciliation')}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <select class="form-select form-select-sm" style="width: 140px; padding: 0.35rem 0.6rem; font-size: 0.8rem;" onchange="updateItemStatus(${item.id}, this.value)">
              <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="uploaded" ${item.status === 'uploaded' ? 'selected' : ''}>In Hand</option>
              <option value="verified" ${item.status === 'verified' ? 'selected' : ''}>Verified</option>
              <option value="na" ${item.status === 'na' ? 'selected' : ''}>Not Applicable</option>
            </select>
            <button class="btn btn-secondary btn-sm" onclick="editDocNotes(${item.id})" title="Add/Edit Note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteDocItem(${item.id})" title="Remove Item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  } catch (err) {
    listContainer.innerHTML = `<div class="text-danger" style="padding: 2rem; text-align: center;">Error: ${err.message}</div>`;
    showToast(err.message || 'Error loading checklist', 'danger');
  }
}

// Quick toggle checkbox
async function toggleItemStatus(id, checked) {
  const newStatus = checked ? 'verified' : 'pending';
  await updateItemStatus(id, newStatus);
}

// Update status dropdown
async function updateItemStatus(id, status) {
  try {
    await apiRequest('checklist.php?action=update_status', {
      method: 'POST',
      body: { id, status }
    });
    showToast('Document status updated', 'success');
    loadChecklist();
  } catch (err) {
    showToast(err.message || 'Failed to update status', 'danger');
  }
}

// Edit note modal
let editingDocId = null;

function editDocNotes(id) {
  const item = currentChecklist.find(x => x.id == id);
  if (!item) return;

  editingDocId = id;
  document.getElementById('doc-note-title').textContent = `Note for: ${item.doc_name}`;
  document.getElementById('doc-note-text').value = item.notes || '';
  openModal('doc-note-modal');
}

async function saveDocNote() {
  if (!editingDocId) return;
  const notes = document.getElementById('doc-note-text').value.trim();

  try {
    await apiRequest('checklist.php?action=update_note', {
      method: 'POST',
      body: { id: editingDocId, notes }
    });
    showToast('Note saved successfully', 'success');
    closeModal('doc-note-modal');
    loadChecklist();
  } catch (err) {
    showToast(err.message || 'Failed to update note', 'danger');
  }
}

// Add Custom Document
function openAddCustomDocModal() {
  document.getElementById('custom-doc-form').reset();
  openModal('custom-doc-modal');
}

async function handleAddCustomDoc(e) {
  e.preventDefault();
  const doc_name = document.getElementById('custom-doc-name').value.trim();
  const notes = document.getElementById('custom-doc-notes').value.trim();
  const fy = getSelectedFY();

  if (!doc_name) {
    showToast('Please enter a document name.', 'warning');
    return;
  }

  try {
    await apiRequest('checklist.php?action=create', {
      method: 'POST',
      body: {
        doc_name,
        notes,
        financial_year: fy,
        status: 'pending'
      }
    });
    showToast('Checklist item added!', 'success');
    closeModal('custom-doc-modal');
    loadChecklist();
  } catch (err) {
    showToast(err.message || 'Failed to add item', 'danger');
  }
}

// Delete item
async function deleteDocItem(id) {
  if (!confirm('Remove this document from your checklist?')) return;

  try {
    await apiRequest(`checklist.php?id=${id}`, {
      method: 'DELETE'
    });
    showToast('Document removed', 'success');
    loadChecklist();
  } catch (err) {
    showToast(err.message || 'Failed to delete item', 'danger');
  }
}

// Reset/Initialize Default Checklist
async function seedDefaultChecklist() {
  try {
    await apiRequest('checklist.php?action=seed_defaults', {
      method: 'POST',
      body: { financial_year: getSelectedFY() }
    });
    showToast('Standard tax documents populated!', 'success');
    loadChecklist();
  } catch (err) {
    showToast(err.message || 'Error populating defaults', 'danger');
  }
}

// FY changes
window.addEventListener('fy-changed', () => {
  loadChecklist();
});

document.addEventListener('DOMContentLoaded', () => {
  loadChecklist();
});
