function closeNotification() {
  const notificationModal = document.getElementById('notificationModal');
  if (notificationModal) {
    notificationModal.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const uploadArea = document.getElementById('uploadArea');
  const mediaFilesInput = document.getElementById('mediaFiles');
  const newFilePreviewsContainer = document.getElementById('newFilePreviews');
  const editForm = document.getElementById('editForm');
  const posterImageGroup = document.getElementById('posterImageGroup');
  const posterImageInput = document.getElementById('posterImage');
  const posterPreviewContainer = document.getElementById('posterPreview');
  const posterUploadArea = document.querySelector('.poster-upload-area');
  
  // Track new files 
  let newFiles = [];
  let posterFile = null;
  
  // Create and add progress bars
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
  
  if (newFilePreviewsContainer) {
    newFilePreviewsContainer.after(fileLoadingProgressContainer);
  }
  
  // Add main progress container
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
  
  if (newFilePreviewsContainer) {
    newFilePreviewsContainer.after(progressContainer);
  }
  
  // Add popup loading container for edit page
  const uploadPopupContainer = document.createElement('div');
  uploadPopupContainer.className = 'upload-popup';
  uploadPopupContainer.style.display = 'none';
  uploadPopupContainer.innerHTML = `
    <div class="upload-popup-content">
      <h4>Updating</h4>
      <div class="progress mt-3 mb-3">
        <div class="popup-progress-bar progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
      </div>
    </div>
  `;
  document.body.appendChild(uploadPopupContainer);
  
  // Show poster image section if this is a video
  if (document.querySelector('video') || newFiles.some(file => file.type.startsWith('video/'))) {
    if (posterImageGroup) {
      posterImageGroup.style.display = 'block';
    }
  }
  
  // Setup poster drag and drop
  if (posterUploadArea) {
    posterUploadArea.addEventListener('click', () => {
      posterImageInput.click();
    });
    
    // Handle poster image selection
    posterImageInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        posterFile = e.target.files[0];
        displayPosterPreview(posterFile);
      }
    });
    
    // Setup poster image drag and drop
    posterUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      posterUploadArea.style.borderColor = '#007bff';
    });
    
    posterUploadArea.addEventListener('dragleave', () => {
      posterUploadArea.style.borderColor = '#ccc';
    });
    
    posterUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      posterUploadArea.style.borderColor = '#ccc';
      if (e.dataTransfer.files.length) {
        posterFile = e.dataTransfer.files[0];
        displayPosterPreview(posterFile);
      }
    });
  }
  
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
  
  // Handle form submission to properly replace files
  if (editForm) {
    editForm.addEventListener('submit', function(originalSubmitEvent) {
      originalSubmitEvent.preventDefault();
      
      // Create form data from the form
      const formData = new FormData(editForm);
      
      // Always add replace_files flag to indicate we want to replace existing files
      formData.append('replace_files', 'true');
      
      // Add all new files with the same field name
      if (newFiles.length > 0) {
        newFiles.forEach((file) => {
          formData.append('files', file);
        });
      }
      
      // Add poster image if it exists
      if (posterFile) {
        formData.append('posterImage', posterFile);
      }
      
      // Show regular progress bar
      progressContainer.style.display = 'block';
      progressBar.style.width = '0%';
      progressBar.textContent = '0%';
      
      // Show popup progress
      uploadPopupContainer.style.display = 'flex';
      const popupProgressBar = document.querySelector('.popup-progress-bar');
      popupProgressBar.style.width = '0%';
      popupProgressBar.textContent = '0%';
      
      // Submit using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      const mediaId = window.location.pathname.split('/').pop();
      xhr.open('POST', '/edit/' + mediaId, true);
      
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
        }
      };
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              showNotification(true, 'Success', 'Your media has been updated successfully!');
            } else {
              showNotification(false, 'Error', data.message || 'Update failed. Please try again.');
            }
          } catch (error) {
            showNotification(false, 'Error', 'Error processing server response.');
          }
        } else {
          showNotification(false, 'Error', 'Server responded with an error status: ' + xhr.status);
        }
        
        // Hide progress bars and popup
        progressContainer.style.display = 'none';
        uploadPopupContainer.style.display = 'none';
      };
      
      xhr.onerror = function() {
        console.error('Update error:', xhr.statusText);
        showNotification(false, 'Error', 'Error updating media: ' + xhr.statusText);
        progressContainer.style.display = 'none';
        uploadPopupContainer.style.display = 'none';
      };
      
      xhr.send(formData);
    });
  }
  
  // Add click event listener to upload area
  if (uploadArea) {
    uploadArea.addEventListener('click', () => {
      mediaFilesInput.click();
    });
    
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
  }
  
  if (mediaFilesInput) {
    mediaFilesInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        handleFiles(e.target.files);
      }
    });
  }
  
  // Handle files function properly handles videos and images
  function handleFiles(filesList) {
    let newImagesCount = 0;
    let newVideoCount = 0;
    let existingVideoCount = 0;
    let hasAddedVideo = false;
    
    // Count existing files by type in newFiles
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        newImagesCount++;
      } else if (file.type.startsWith('video/')) {
        existingVideoCount++;
      }
    });
    
    // Count existing videos in the DOM
    document.querySelectorAll('#currentFiles video').forEach(() => {
      existingVideoCount++;
    });
    
    // Clear new files array if we're replacing
    newFiles = [];
    
    // Check new files
    for (let i = 0; i < filesList.length; i++) {
      if (filesList[i].type.startsWith('image/')) {
        newFiles.push(filesList[i]);
        newImagesCount++;
      } else if (filesList[i].type.startsWith('video/') && !hasAddedVideo) {
        // Replace existing video or add if none exists
        newFiles.push(filesList[i]);
        newVideoCount++;
        hasAddedVideo = true;
        
        // Show poster section as we have a video
        if (posterImageGroup) {
          posterImageGroup.style.display = 'block';
        }
      }
    }
    
    // Show alert if multiple videos were attempted
    if (Array.from(filesList).filter(f => f.type.startsWith('video/')).length > 1) {
      showNotification(false, 'Upload Limit', 'Only one video file is allowed per upload.');
    }
    
    // Clear previews and recreate them
    if (newFilePreviewsContainer) {
      newFilePreviewsContainer.innerHTML = '';
      
      // Create previews for all files
      newFiles.forEach((file, index) => {
        createPreview(file, index);
      });
    }
    
    // Show loading progress for video files
    if (newFiles.some(file => file.type.startsWith('video/'))) {
      fileLoadingProgressContainer.style.display = 'block';
    }
  }
  
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
        removeNewFile(index);
      });
      previewItem.appendChild(removeBtn);
      
      newFilePreviewsContainer.appendChild(previewItem);
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
  
  // Remove file function
  function removeNewFile(index) {
    // Get the preview item that needs to be removed
    const previewItem = document.querySelector(`.preview-item[data-index="${index}"]`);
    
    if (previewItem) {
      // Remove the element from the DOM directly
      previewItem.remove();
      
      // Remove the file from the array
      newFiles.splice(index, 1);
      
      // Update the data-index attributes of all remaining preview items
      const remainingPreviews = document.querySelectorAll('#newFilePreviews .preview-item');
      remainingPreviews.forEach((item, i) => {
        item.dataset.index = i;
        
        // Update click event to use the new index
        const removeBtn = item.querySelector('.remove-preview');
        if (removeBtn) {
          // Clear existing event listeners
          const newRemoveBtn = removeBtn.cloneNode(true);
          removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
          
          // Add new event listener with updated index
          newRemoveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeNewFile(i);
          });
        }
      });
      
      // Update poster image section visibility
      if (!document.querySelector('video') && !newFiles.some(file => file.type.startsWith('video/'))) {
        if (posterImageGroup) {
          posterImageGroup.style.display = 'none';
        }
      }
    }
  }
  
  // Function to show notification
  function showNotification(isSuccess, title, message) {
    const notificationModal = document.getElementById('notificationModal');
    const successIcon = document.getElementById('successIcon');
    const errorIcon = document.getElementById('errorIcon');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (notificationModal && successIcon && errorIcon && notificationTitle && notificationMessage) {
      successIcon.style.display = isSuccess ? 'block' : 'none';
      errorIcon.style.display = isSuccess ? 'none' : 'block';
      notificationTitle.textContent = title;
      notificationMessage.textContent = message;
      notificationModal.style.display = 'flex';
      
      // If it's a success, redirect to dashboard after a delay
      if (isSuccess) {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } else {
      // Fallback to alert if notification modal elements don't exist
      alert((isSuccess ? 'Success: ' : 'Error: ') + message);
    }
  }
});