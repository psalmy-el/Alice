const uploadArea = document.getElementById('uploadArea');
const mediaFilesInput = document.getElementById('mediaFiles');
const previewsContainer = document.getElementById('previews');
const uploadForm = document.getElementById('uploadForm');
const posterImageGroup = document.getElementById('posterImageGroup');
const posterImageInput = document.getElementById('posterImage');
const posterPreviewContainer = document.getElementById('posterPreview');

// Track files 
let files = [];
let posterFile = null;

// Handle click on upload area
uploadArea.addEventListener('click', () => {
  mediaFilesInput.click();
});

// Show poster image field only when video is selected
function updateFormForFileTypes() {
  const hasVideo = files.some(file => file.type.startsWith('video/'));
  posterImageGroup.style.display = hasVideo ? 'block' : 'none';
}


// Handle drag and drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#007bff';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = '#ccc';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#ccc';
  if (e.dataTransfer.files.length) {
    handleFiles(e.dataTransfer.files);
  }
});

// Handle file selection
mediaFilesInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handleFiles(e.target.files);
  }
});

 // Process selected files
 function handleFiles(filesList) {
  // Add new files to existing files array
  for (let i = 0; i < filesList.length; i++) {
    if (filesList[i].type.startsWith('image/') || filesList[i].type.startsWith('video/')) {
      files.push(filesList[i]);
    }
  }
  
  // Clear previews and recreate them
  previewsContainer.innerHTML = '';
  
  // Create previews for all files
  files.forEach((file, index) => {
    createPreview(file, index);
  });

  updateFormForFileTypes();
}


// Handle poster image selection
posterImageInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    posterFile = e.target.files[0];
    displayPosterPreview(posterFile);
  }
});

// Setup poster image drag and drop
const posterUploadArea = document.querySelector('.poster-upload-area');
posterUploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  posterUploadArea.style.borderColor = '#007bff';
});

posterUploadArea.addEventListener('dragleave', () => {
  posterUploadArea.style.borderColor = '#ccc';
});

// Handle click on poster upload area
posterUploadArea.addEventListener('click', () => {
  posterImageInput.click();
});

posterUploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  posterUploadArea.style.borderColor = '#ccc';
  if (e.dataTransfer.files.length) {
    posterFile = e.dataTransfer.files[0];
    displayPosterPreview(posterFile);
  }
});

function displayPosterPreview(file) {
  const reader = new FileReader();
  posterPreviewContainer.innerHTML = '';
  
  reader.onload = function(event) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    const img = document.createElement('img');
    img.src = event.target.result;
    previewItem.appendChild(img);
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-preview';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      posterFile = null;
      posterPreviewContainer.innerHTML = '';
    });
    previewItem.appendChild(removeBtn);
    
    posterPreviewContainer.appendChild(previewItem);
  };
  
  reader.readAsDataURL(file);
}

// Create preview for a file
function createPreview(file, index) {
  const reader = new FileReader();
  const previewItem = document.createElement('div');
  previewItem.className = 'preview-item';
  previewItem.dataset.index = index;
  
  reader.onload = function(event) {
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = event.target.result;
      previewItem.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.controls = true;
      const source = document.createElement('source');
      source.src = event.target.result;
      source.type = file.type;
      video.appendChild(source);
      previewItem.appendChild(video);
    }
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-preview';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFile(index);
    });
    previewItem.appendChild(removeBtn);
    
    // Add primary badge for first file
    if (index === 0) {
      const primaryBadge = document.createElement('div');
      primaryBadge.className = 'primary-badge';
      primaryBadge.textContent = 'Primary';
      previewItem.appendChild(primaryBadge);
    }
    
    // Set as primary when clicked
    previewItem.addEventListener('click', () => {
      setAsPrimary(index);
    });
    
    previewsContainer.appendChild(previewItem);
  };
  
  reader.readAsDataURL(file);
}

// Remove a file
function removeFile(index) {
  files.splice(index, 1);
  
  // Regenerate all previews to keep index alignment
  previewsContainer.innerHTML = '';
  files.forEach((file, i) => {
    createPreview(file, i);
  });
}

// Set a file as primary
function setAsPrimary(index) {
  // Move the selected file to the front of the array
  if (index !== 0) {
    const file = files[index];
    files.splice(index, 1);
    files.unshift(file);
    
    // Regenerate previews
    previewsContainer.innerHTML = '';
    files.forEach((file, i) => {
      createPreview(file, i);
    });
  }
}

// Show notification
function showNotification(isSuccess, title, message) {
  document.getElementById('successIcon').style.display = isSuccess ? 'block' : 'none';
  document.getElementById('errorIcon').style.display = isSuccess ? 'none' : 'block';
  document.getElementById('notificationTitle').textContent = title;
  document.getElementById('notificationMessage').textContent = message;
  document.getElementById('notificationModal').style.display = 'flex';
}

// Close notification
function closeNotification() {
  document.getElementById('notificationModal').style.display = 'none';
  // Reset form if it was a successful upload
  if (document.getElementById('successIcon').style.display === 'block') {
    resetForm();
  }
}

// Reset the form
function resetForm() {
  uploadForm.reset();
  files = [];
  previewsContainer.innerHTML = '';
}

  // Handle form submission
  uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Form validation
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const category_id = document.getElementById('category_id').value;
    
    let missingFields = [];
    if (!title) missingFields.push('Title');
    if (!description) missingFields.push('Description');
    if (!category_id || category_id === '-- Select Category --') missingFields.push('Category');
    if (files.length === 0) missingFields.push('Media Files');
    
    if (missingFields.length > 0) {
      showNotification(false, 'Missing Fields', 'Please fill in the following: ' + missingFields.join(', '));
      return;
    }
    
    const formData = new FormData();
    
    // Add form fields
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category_id', category_id);
    formData.append('is_intro', document.getElementById('is_intro').checked);
    
    // Add all files with the same field name
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add poster image if it exists and a video is being uploaded
    if (posterFile && files.some(file => file.type.startsWith('video/'))) {
      formData.append('posterImage', posterFile);
    }
    
    // Log the form data entries to help debug
    for (var pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    // Submit using fetch API
    fetch('/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Server responded with an error status: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        showNotification(true, 'Success', 'Your media has been uploaded successfully!');
      } else {
        showNotification(false, 'Error', data.message || 'Upload failed. Please try again.');
      }
    })
    .catch(error => {
      console.error('Upload error:', error);
      showNotification(false, 'Error', 'Error uploading file: ' + error.message);
    });
  });
