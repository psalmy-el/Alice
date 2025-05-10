const uploadArea = document.getElementById('uploadArea');
const mediaFilesInput = document.getElementById('mediaFiles');
const previewsContainer = document.getElementById('previews');
const uploadForm = document.getElementById('uploadForm');
const removeAllBtn = document.createElement('button');

removeAllBtn.className = 'btn btn-outline-danger mb-3 mt-2';
removeAllBtn.innerHTML = '<i class="fas fa-trash"></i> Remove All Images';
removeAllBtn.style.display = 'none';
removeAllBtn.addEventListener('click', removeAllFiles);
previewsContainer.after(removeAllBtn);


const fileLoadingProgressContainer = document.createElement('div');
fileLoadingProgressContainer.className = 'progress mt-3 mb-3';
fileLoadingProgressContainer.style.display = 'none';
const fileLoadingProgressBar = document.createElement('div');
fileLoadingProgressBar.className = 'progress-bar bg-info';
fileLoadingProgressBar.style.width = '0%';
fileLoadingProgressBar.textContent = '0%';
fileLoadingProgressBar.setAttribute('role', 'progressbar');
fileLoadingProgressBar.setAttribute('aria-valuenow', '0');
fileLoadingProgressBar.setAttribute('aria-valuemin', '0');
fileLoadingProgressBar.setAttribute('aria-valuemax', '100');
fileLoadingProgressContainer.appendChild(fileLoadingProgressBar);
previewsContainer.after(fileLoadingProgressContainer);

// Add popup loading container
const uploadPopupContainer = document.createElement('div');
uploadPopupContainer.className = 'upload-popup';
uploadPopupContainer.style.display = 'none';
uploadPopupContainer.innerHTML = `
  <div class="upload-popup-content">
    <h4>Uploading</h4>
    <div class="progress mt-3 mb-3">
      <div class="popup-progress-bar progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
    </div>
  </div>
`;
document.body.appendChild(uploadPopupContainer);

// Track files 
let files = [];

// Handle click on upload area
uploadArea.addEventListener('click', () => {
  mediaFilesInput.click();
});

// Show intro checkbox field only when video is selected
function updateFormForFileTypes() {
  const hasVideo = files.some(file => file.type.startsWith('video/'));
   
  // Show/hide intro video checkbox when video is selected
  const introCheckboxGroup = document.getElementById('introCheckboxGroup');
  introCheckboxGroup.style.display = hasVideo ? 'block' : 'none';
}

const introCheckboxGroup = document.getElementById('is_intro').closest('.mb-3');
introCheckboxGroup.id = 'introCheckboxGroup';
introCheckboxGroup.style.display = 'none';

// Add warning message when intro checkbox is checked
const introCheckbox = document.getElementById('is_intro');
const warningMessage = document.createElement('div');
warningMessage.className = 'alert alert-danger mt-2';
warningMessage.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Warning: This will replace the current intro video.';
warningMessage.style.display = 'none';
introCheckboxGroup.appendChild(warningMessage);

introCheckbox.addEventListener('change', function() {
  warningMessage.style.display = this.checked ? 'block' : 'none';
});

//setAsPrimary function 
function setAsPrimary(index) {
  // Skip if already primary
  if (index === 0) return;
  
  // Move the selected file to the first position
  const file = files[index];
  files.splice(index, 1);
  files.unshift(file);
  
  // Regenerate all previews
  previewsContainer.innerHTML = '';
  files.forEach((file, i) => {
    createPreview(file, i);
  });
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
  let imagesCount = 0;
  let videoCount = 0;
  let hasAddedVideo = false;
  
  // Count existing files by type
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      imagesCount++;
    } else if (file.type.startsWith('video/')) {
      videoCount++;
    }
  });
  
  // Check new files
  for (let i = 0; i < filesList.length; i++) {
    if (filesList[i].type.startsWith('image/')) {
      files.push(filesList[i]);
      imagesCount++;
    } else if (filesList[i].type.startsWith('video/') && videoCount === 0 && !hasAddedVideo) {
      // Only add one video if there's no video already
      files.push(filesList[i]);
      videoCount++;
      hasAddedVideo = true;
    }
  }
  
  // Show alert if multiple videos were attempted
  if (Array.from(filesList).filter(f => f.type.startsWith('video/')).length > 1 || 
      (hasAddedVideo && videoCount > 1)) {
    showNotification(false, 'Upload Limit', 'Only one video file is allowed per upload.');
  }
  
  // Clear previews and recreate them
  previewsContainer.innerHTML = '';
  
  // Create previews for all files
  files.forEach((file, index) => {
    createPreview(file, index);
  });

  // Show/hide Remove All button based on image count
  removeAllBtn.style.display = imagesCount > 1 ? 'block' : 'none';
  
  updateFormForFileTypes();
}

// Add function to remove all files
function removeAllFiles() {
  // Keep only video files
  files = files.filter(file => file.type.startsWith('video/'));
  
  // Regenerate all previews
  previewsContainer.innerHTML = '';
  files.forEach((file, i) => {
    createPreview(file, i);
  });
  
  // Hide the Remove All button
  removeAllBtn.style.display = 'none';
}

function removeFile(index) {
  // Get the preview item that needs to be removed
  const previewItem = document.querySelector(`.preview-item[data-index="${index}"]`);
  
  if (previewItem) {
    // Remove the element from the DOM directly
    previewItem.remove();
    
    // Remove the file from the array
    files.splice(index, 1);
    
    // Update the data-index attributes of all remaining preview items
    const remainingPreviews = document.querySelectorAll('.preview-item');
    remainingPreviews.forEach((item, i) => {
      item.dataset.index = i;
      
      // Clear any existing primary badges
      const existingBadge = item.querySelector('.primary-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      // Add primary badge to the first item
      if (i === 0) {
        const primaryBadge = document.createElement('div');
        primaryBadge.className = 'primary-badge';
        primaryBadge.textContent = 'Primary';
        item.appendChild(primaryBadge);
      }
      
      // Update click event to use the new index
      item.onclick = () => {
        setAsPrimary(i);
      };
    });
    
    // Update form display based on file types
    updateFormForFileTypes();
    
    // Update Remove All button visibility
    const imageCount = files.filter(f => f.type.startsWith('image/')).length;
    removeAllBtn.style.display = imageCount > 1 ? 'block' : 'none';
  }
}


//progress indicator
const progressContainer = document.createElement('div');
progressContainer.className = 'progress mt-3 mb-3';
progressContainer.style.display = 'none';
const progressBar = document.createElement('div');
progressBar.className = 'progress-bar';
progressBar.style.width = '0%';
progressBar.textContent = '0%';
progressBar.setAttribute('role', 'progressbar');
progressBar.setAttribute('aria-valuenow', '0');
progressBar.setAttribute('aria-valuemin', '0');
progressBar.setAttribute('aria-valuemax', '100');
progressContainer.appendChild(progressBar);
previewsContainer.after(progressContainer);


// Create preview for a file
function createPreview(file, index) {
  const reader = new FileReader();
  const previewItem = document.createElement('div');
  previewItem.className = 'preview-item';
  previewItem.dataset.index = index;
  
  // Show loading progress for video files
  if (file.type.startsWith('video/')) {
    fileLoadingProgressContainer.style.display = 'block';
    fileLoadingProgressBar.style.width = '0%';
    fileLoadingProgressBar.textContent = '0%';
    fileLoadingProgressBar.setAttribute('aria-valuenow', '0');
  }
  
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
      
      // Hide file loading progress
      fileLoadingProgressContainer.style.display = 'none';
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
    
    // Update Remove All button visibility
    const imageCount = files.filter(f => f.type.startsWith('image/')).length;
    removeAllBtn.style.display = imageCount > 1 ? 'block' : 'none';
  };
  
  // Add progress event for loading files
  reader.onprogress = function(e) {
    if (e.lengthComputable && file.type.startsWith('video/')) {
      const percentComplete = Math.round((e.loaded / e.total) * 100);
      fileLoadingProgressBar.style.width = percentComplete + '%';
      fileLoadingProgressBar.textContent = percentComplete + '%';
      fileLoadingProgressBar.setAttribute('aria-valuenow', percentComplete);
    }
  };
  
  reader.readAsDataURL(file);
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
  removeAllBtn.style.display = 'none';
}

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
   
  // Log what we're sending
  console.log('Submitting form with files:', files.length);
  
  // Show regular progress bar and popup
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';
  
  // Show popup progress
  uploadPopupContainer.style.display = 'flex';
  const popupProgressBar = document.querySelector('.popup-progress-bar');
  popupProgressBar.style.width = '0%';
  popupProgressBar.textContent = '0%';
  
  // Submit using XMLHttpRequest with progress tracking
  const xhr = new XMLHttpRequest();
  
  // CRITICAL FIX: Use the correct endpoint URL - must match your backend route
  xhr.open('POST', '/upload-media', true);
  
  xhr.upload.onprogress = function(e) {
    if (e.lengthComputable) {
      const percentComplete = Math.round((e.loaded / e.total) * 100);
      
      // Update both progress bars
      progressBar.style.width = percentComplete + '%';
      progressBar.textContent = percentComplete + '%';
      progressBar.setAttribute('aria-valuenow', percentComplete);
      
      popupProgressBar.style.width = percentComplete + '%';
      popupProgressBar.textContent = percentComplete + '%';
      popupProgressBar.setAttribute('aria-valuenow', percentComplete);
      
      console.log('Upload progress:', percentComplete + '%');
    }
  };
  
  xhr.onload = function() {
    console.log('Response received:', xhr.status, xhr.responseText);
    
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText);
        console.log('Parsed response:', data);
        
        if (data.success || data.files) {
          showNotification(true, 'Success', 'Your media has been uploaded successfully!');
          
          // Reset form on success
          setTimeout(() => {
            resetForm();
            // Optionally redirect to a listing page
            // window.location.href = '/media/list';
          }, 2000);
        } else {
          showNotification(false, 'Error', data.message || 'Upload failed. Please try again.');
        }
      } catch (error) {
        console.error('Error parsing response:', error, xhr.responseText);
        showNotification(false, 'Error', 'Error processing server response.');
      }
    } else {
      let errorMessage = 'Server responded with an error status: ' + xhr.status;
      
      try {
        const errorData = JSON.parse(xhr.responseText);
        if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch (e) {
        // Use default error message
      }
      
      console.error('Upload error:', errorMessage);
      showNotification(false, 'Error', errorMessage);
    }
    
    // Hide progress bars and popup
    progressContainer.style.display = 'none';
    uploadPopupContainer.style.display = 'none';
  };
  
  xhr.onerror = function() {
    console.error('Network error during upload:', xhr.statusText);
    showNotification(false, 'Connection Error', 'Could not connect to the server. Please check your internet connection and try again.');
    
    // Hide progress bars and popup
    progressContainer.style.display = 'none';
    uploadPopupContainer.style.display = 'none';
  };
  
  xhr.ontimeout = function() {
    console.error('Upload timed out');
    showNotification(false, 'Timeout Error', 'The upload request timed out. Please try with smaller files or check your connection.');
    
    // Hide progress bars and popup
    progressContainer.style.display = 'none';
    uploadPopupContainer.style.display = 'none';
  };
  
  // Set a reasonable timeout for large uploads
  xhr.timeout = 300000; // 5 minutes
  
  // Send the form data
  xhr.send(formData);
  
  console.log('Request sent to server');
});
  
