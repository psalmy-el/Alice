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

    // Handle click on upload area
    uploadArea.addEventListener('click', () => {
      mediaFilesInput.click();
    });
    
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
          newFiles.push(filesList[i]);
        }
      }
      
      // Clear previews and recreate them
      newFilePreviewsContainer.innerHTML = '';
      
      // Create previews for all files
      newFiles.forEach((file, index) => {
        createPreview(file, index);
      });
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
          removeNewFile(index);
        });
        previewItem.appendChild(removeBtn);
        
        newFilePreviewsContainer.appendChild(previewItem);
      };
      
      reader.readAsDataURL(file);
    }
    
    // Remove a new file
    function removeNewFile(index) {
      newFiles.splice(index, 1);
      
      // Regenerate all previews to keep index alignment
      newFilePreviewsContainer.innerHTML = '';
      newFiles.forEach((file, i) => {
        createPreview(file, i);
      });
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
      // Redirect to dashboard if it was a successful update
      if (document.getElementById('successIcon').style.display === 'block') {
        window.location.href = '/dashboard';
      }
    }

    // Show poster image section if this is a video
if ('<%= media.type %>' === 'video') {
  posterImageGroup.style.display = 'block';
}

// Handle click on poster upload area
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
    
    // Handle form submission
    editForm.addEventListener('submit', function(originalSubmitEvent) {
  // Add poster image to form data if it exists
  if (posterFile) {
    const originalFormData = new FormData(editForm);
    originalSubmitEvent.preventDefault();
    
    // Create new FormData and append all original form data
    const formData = new FormData();
    for (let pair of originalFormData.entries()) {
      formData.append(pair[0], pair[1]);
    }
    
    // Add all new files with the same field name
    newFiles.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add poster image
    formData.append('posterImage', posterFile);
    
    // Submit using fetch API
    fetch('/edit/<%= media.id %>', {
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
        showNotification(true, 'Success', 'Your media has been updated successfully!');
      } else {
        showNotification(false, 'Error', data.message || 'Update failed. Please try again.');
      }
    })
    .catch(error => {
      console.error('Update error:', error);
      showNotification(false, 'Error', 'Error updating media: ' + error.message);
    });
  }
});
    
    // Handle delete file button clicks
    document.querySelectorAll('.delete-file-btn').forEach(button => {
      button.addEventListener('click', function() {
        const fileId = this.getAttribute('data-file-id');
        const previewItem = this.closest('.preview-item');
        
        if (confirm('Are you sure you want to delete this file?')) {
          fetch(`/delete-file/${fileId}`, {
            method: 'POST'
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              previewItem.remove();
            } else {
              alert(data.message || 'Failed to delete file');
            }
          })
          .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete file');
          });
        }
      });
    });
    
    // Handle set primary button clicks
    document.querySelectorAll('.set-primary-btn').forEach(button => {
      button.addEventListener('click', function() {
        const fileId = this.getAttribute('data-file-id');
        const mediaId = this.getAttribute('data-media-id');
        
        fetch(`/set-primary/${mediaId}/${fileId}`, {
          method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Refresh the page to show updated primary status
            window.location.reload();
          } else {
            alert(data.message || 'Failed to set primary file');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Failed to set primary file');
        });
      });
    });