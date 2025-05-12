document.addEventListener('DOMContentLoaded', function() {
  // Replace all delete forms with delete buttons
  document.querySelectorAll('form[action^="/delete/"]').forEach(form => {
    const mediaId = form.action.split('/').pop().split('?')[0];
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-danger delete-btn';
    deleteButton.setAttribute('data-id', mediaId);
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    form.parentNode.replaceChild(deleteButton, form);
  });

  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileNavMenu = document.querySelector('.mobile-nav-menu');
    
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function(e) {
      e.stopPropagation(); // Stop event propagation
      mobileNavMenu.classList.toggle('show');
    });
  }
    
  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.mobile-menu-toggle') && 
        !event.target.closest('.mobile-nav-menu') && 
        mobileNavMenu.classList.contains('show')) {
      mobileNavMenu.classList.remove('show');
    }
  });
  
  // Add event listeners to all delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function() {
      const mediaId = this.getAttribute('data-id');
      const mediaCard = this.closest('.col');
      
      // Show custom modal instead of browser confirm
      showConfirmModal('Confirm Deletion', 'Are you sure you want to delete this item?', function() {
        // Send AJAX request to delete
        fetch(`/delete/${mediaId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Show success message
            showAlertModal('Success', 'Media deleted successfully');
            
            // Remove the media card from the DOM
            mediaCard.remove();
            
            // If no media left, show the "no media found" message
            const mediaCards = document.querySelectorAll('.media-card');
            if (mediaCards.length === 0) {
              const mediaContainer = document.querySelector('.row-cols-1');
              if (mediaContainer) {
                const containerDiv = document.querySelector('.container');
                mediaContainer.remove();
                
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-info';
                alertDiv.innerHTML = 'No media found. <a href="/upload">Upload some</a>!';
                containerDiv.appendChild(alertDiv);
              }
            }
          } else {
            showAlertModal('Error', data.message || 'Failed to delete media');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showAlertModal('Error', 'Failed to delete media');
        });
      });
    });
  });
  
  // Handle clicks on video elements to prevent event propagation
  document.querySelectorAll('.media-card video').forEach(video => {
    video.addEventListener('click', function(e) {
      e.stopPropagation(); // Stop propagation to prevent opening the media viewer
      // Toggle play/pause
      if (this.paused) {
        this.play();
      } else {
        this.pause();
      }
    });
  });
  
  // Media Viewer Modal Functionality
  const mediaModal = document.getElementById('mediaViewerModal');
  const mediaViewerContent = mediaModal.querySelector('.media-viewer-content');
  const closeBtn = mediaModal.querySelector('.media-viewer-close');
  const prevBtn = mediaModal.querySelector('.media-viewer-prev');
  const nextBtn = mediaModal.querySelector('.media-viewer-next');
  const counter = mediaModal.querySelector('.media-viewer-counter');
  
  let currentMediaIndex = 0;
  let mediaFiles = [];
  
// Function to collect similar media files based on pattern and current card
  function collectSimilarMediaFiles(currentCard) {
    // Get all media cards
    const allCards = document.querySelectorAll('.media-card');
    const currentMediaId = currentCard.getAttribute('data-media-id');
    
    // First add the current card's media
    const files = [];
    
    // Helper function to extract media path and type
    function extractMediaInfo(card) {
      let mediaPath = '';
      let mediaType = 'image';
      
      // Check if the card has a video
      const videoElement = card.querySelector('video');
      if (videoElement) {
        mediaType = 'video';
        const source = videoElement.querySelector('source');
        if (source) {
          mediaPath = source.src;
        } else if (videoElement.src) {
          mediaPath = videoElement.src;
        }
      } else {
        // It must be an image
        const imgElement = card.querySelector('img');
        if (imgElement) {
          mediaPath = imgElement.src;
          mediaType = 'image';
        }
      }
      
      return { mediaPath, mediaType };
    }
    
    // Process all cards that match the media ID
    allCards.forEach(card => {
      const cardMediaId = card.getAttribute('data-media-id');
      if (cardMediaId === currentMediaId) {
        const { mediaPath, mediaType } = extractMediaInfo(card);
        
        if (mediaPath) {
          // Check if this file is already in our collection
          const exists = files.some(file => file.file_path === mediaPath);
          if (!exists) {
            files.push({
              file_path: mediaPath,
              type: mediaType
            });
          }
        }
      }
    });
    
    // If no files found, fall back to the current card's media
    if (files.length === 0) {
      const { mediaPath, mediaType } = extractMediaInfo(currentCard);
      if (mediaPath) {
        files.push({
          file_path: mediaPath,
          type: mediaType
        });
      }
    }
    
    // Look for alternative collection methods
    const mediaPath = getCurrentCardMainMediaPath(currentCard);
    if (mediaPath && mediaPath.includes('cloudinary.com')) {
      const cloudinaryUrlBase = extractCloudinaryUrlBase(mediaPath);
      
      if (cloudinaryUrlBase) {
        // Search for files with similar cloudinary URL base across all cards
        allCards.forEach(card => {
          const { mediaPath: cardMediaPath, mediaType } = extractMediaInfo(card);
          
          if (cardMediaPath && cardMediaPath.includes(cloudinaryUrlBase)) {
            // Check if this file is already in our collection
            const exists = files.some(file => file.file_path === cardMediaPath);
            if (!exists) {
              files.push({
                file_path: cardMediaPath,
                type: mediaType
              });
            }
          }
        });
      }
    }
    
    // Look for additional files through data attributes
    const relatedFilesAttr = currentCard.getAttribute('data-related-files');
    if (relatedFilesAttr) {
      try {
        const relatedFiles = JSON.parse(relatedFilesAttr);
        if (Array.isArray(relatedFiles)) {
          relatedFiles.forEach(file => {
            // Determine type if not specified
            const fileType = file.type || 
              (file.path.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 
               file.path.match(/\.(jpg|jpeg|png|gif|bmp)$/i) ? 'image' : 'unknown');
            
            // Add if not already in collection
            const exists = files.some(existingFile => existingFile.file_path === file.path);
            if (!exists) {
              files.push({
                file_path: file.path,
                type: fileType
              });
            }
          });
        }
      } catch (e) {
        console.warn('Failed to parse related files attribute:', e);
      }
    }
        
    return files;
  }

  // Helper function to get current card's media path
  function getCurrentCardMainMediaPath(card) {
    let mediaPath = '';
    // Try to get video source first
    const videoElement = card.querySelector('video');
    if (videoElement) {
      const source = videoElement.querySelector('source');
      if (source) {
        mediaPath = source.src;
      } else if (videoElement.src) {
        mediaPath = videoElement.src;
      }
    } else {
      // Try to get image source
      const imgElement = card.querySelector('img');
      if (imgElement) {
        mediaPath = imgElement.src;
      }
    }
    return mediaPath;
  }

  // Helper function to extract Cloudinary URL base
  function extractCloudinaryUrlBase(url) {
    // Extract the base part of the Cloudinary URL without the version and specific transformation
    if (!url.includes('cloudinary.com')) return null;
    
    try {
      // Example URL: https://res.cloudinary.com/dawxl838a/image/upload/v1746869871/uploads/xyz123
      // Try to extract: uploads/xyz
      const parts = url.split('/');
      const uploadsIndex = parts.findIndex(part => part === 'uploads');
      
      if (uploadsIndex !== -1) {
        // Get the uploads folder and the base of the file name (without extension)
        const uploadsPath = parts[uploadsIndex];
        const fileNameBase = parts[uploadsIndex + 1].split('.')[0]; // Get the ID part before any extension
        
        // Return a pattern to match similar files
        return `${uploadsPath}/${fileNameBase}`;
      }
      
      // Alternative pattern if "uploads" folder is not found
      const uploadIndex = parts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
        // Look for the version number and skip it
        const versionPart = parts[uploadIndex + 1];
        if (versionPart.startsWith('v')) {
          // Return the folder part
          return parts[uploadIndex + 2];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting Cloudinary URL base:', error);
      return null;
    }
  }
  
  // Add click event to all media cards
  document.querySelectorAll('.media-card').forEach(card => {
    card.addEventListener('click', function() {
      const mediaId = this.getAttribute('data-media-id');
      
      // Try to get all related files using the mediaId
      // First, try the API approach
      fetch(`/media/${mediaId}/files`)
        .then(response => {
          if (!response.ok) {
            throw new Error('API response was not ok');
          }
          return response.json();
        })
        .then(data => {
          if (data.success && data.files && data.files.length > 0) {
            // Use the API response
            mediaFiles = data.files;
            currentMediaIndex = 0;
            openMediaViewer();
          } else {
            // API returned empty result, use the alternative method
            throw new Error('No files in API response');
          }
        })
        .catch(error => {
          console.warn('Error fetching media files from API, using alternative method:', error);
          
          // Use our alternative method to find related files
          mediaFiles = collectSimilarMediaFiles(this);
          currentMediaIndex = 0;
          
          if (mediaFiles.length > 0) {
            openMediaViewer();
          } else {
            showAlertModal('Error', 'Could not find media to display');
          }
        });
    });
  });
  
  function openMediaViewer() {
    if (mediaFiles.length === 0) {
      showAlertModal('Error', 'No media files available to display');
      return;
    }
    
    // Clear previous content
    mediaViewerContent.innerHTML = '';
    
    // Create the media element based on file type
    const file = mediaFiles[currentMediaIndex];
    const mediaElement = createMediaElement(file);
    
    // Add to the viewer
    mediaViewerContent.appendChild(mediaElement);
    
    // Update counter
    counter.textContent = `${currentMediaIndex + 1} / ${mediaFiles.length}`;
    
    // Show modal
    mediaModal.style.display = 'block';
    
    // Show/hide navigation buttons based on number of files
    if (mediaFiles.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  }
  
  function createMediaElement(file) {
    if (!file || !file.file_path) {
      console.error('Invalid file data:', file);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'media-viewer-error';
      errorDiv.textContent = 'Error: Media file data is invalid';
      return errorDiv;
    }
    
    const isVideo = file.file_path.match(/\.(mp4|webm|ogg)$/i) || file.type === 'video';
    const container = document.createElement('div');
    container.className = 'media-viewer-item';
    
    if (isVideo) {
      // Create a container for the video
      const videoContainer = document.createElement('div');
      videoContainer.className = 'video-container';
      
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.controlsList = "nodownload"; // Prevent download option
      video.playsInline = true; // Better mobile experience
      video.preload = "metadata";
      
      const source = document.createElement('source');
      source.src = file.file_path;
      
      // Try to determine video type from file extension
      const extension = file.file_path.split('.').pop().toLowerCase();
      if (extension.match(/mp4/i)) {
        source.type = 'video/mp4';
      } else if (extension.match(/webm/i)) {
        source.type = 'video/webm';
      } else if (extension.match(/ogg/i)) {
        source.type = 'video/ogg';
      } else {
        // Default to mp4 if we can't determine
        source.type = 'video/mp4';
      }
      
      video.appendChild(source);
      videoContainer.appendChild(video);
      
      // Always show mobile controls regardless of screen size
      const mobileControls = document.createElement('div');
      mobileControls.className = 'mobile-video-controls';
      
      // Play/Pause button
      const playPauseBtn = document.createElement('button');
      playPauseBtn.className = 'video-control-btn play-pause-btn';
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; // Start with pause since video autoplay is true
      playPauseBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        if (video.paused) {
          video.play();
          this.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
          video.pause();
          this.innerHTML = '<i class="fas fa-play"></i>';
        }
      });
      
      // Fullscreen button
      const fullscreenBtn = document.createElement('button');
      fullscreenBtn.className = 'video-control-btn fullscreen-btn';
      fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
      fullscreenBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        if (video.requestFullscreen) {
          video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) { /* Safari */
          video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) { /* IE11 */
          video.msRequestFullscreen();
        }
      });
      
      // Mute button
      const muteBtn = document.createElement('button');
      muteBtn.className = 'video-control-btn mute-btn';
      muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      muteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        if (video.muted) {
          video.muted = false;
          this.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
          video.muted = true;
          this.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
      });
      
      // Add buttons to mobile controls
      mobileControls.appendChild(playPauseBtn);
      mobileControls.appendChild(muteBtn);
      mobileControls.appendChild(fullscreenBtn);
      
      // Add mobile controls to container
      videoContainer.appendChild(mobileControls);
      
      // Add event listeners to update play/pause button state
      video.addEventListener('play', function() {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      });
      
      video.addEventListener('pause', function() {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      });
      
      // Add click event to video element to toggle play/pause
      video.addEventListener('click', function(e) {
        e.stopPropagation(); // Stop propagation
        if (this.paused) {
          this.play();
        } else {
          this.pause();
        }
      });
      
      // Handle video loading errors
      video.addEventListener('error', function() {
        console.error('Error loading video:', file.file_path);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'media-error-message';
        errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Video could not be loaded';
        videoContainer.appendChild(errorMsg);
      });
      
      container.appendChild(videoContainer);
    } else {
      const img = document.createElement('img');
      img.src = file.file_path;
      img.alt = 'Media Preview';
      
      // Handle image loading errors
      img.addEventListener('error', function() {
        console.error('Error loading image:', file.file_path);
        this.src = '/img/placeholder.jpg'; // Replace with your placeholder image path
        this.alt = 'Image could not be loaded';
        this.classList.add('error-image');
      });
      
      container.appendChild(img);
    }
    
    return container;
  }
  
  // Close viewer
  closeBtn.addEventListener('click', function() {
    mediaModal.style.display = 'none';
    mediaViewerContent.innerHTML = '';
  });
  
  // Navigate to previous media
  prevBtn.addEventListener('click', function() {
    currentMediaIndex = (currentMediaIndex - 1 + mediaFiles.length) % mediaFiles.length;
    openMediaViewer();
  });
  
  // Navigate to next media
  nextBtn.addEventListener('click', function() {
    currentMediaIndex = (currentMediaIndex + 1) % mediaFiles.length;
    openMediaViewer();
  });
  
  // Allow keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (mediaModal.style.display === 'block') {
      if (e.key === 'Escape') {
        mediaModal.style.display = 'none';
      } else if (e.key === 'ArrowLeft' && mediaFiles.length > 1) {
        currentMediaIndex = (currentMediaIndex - 1 + mediaFiles.length) % mediaFiles.length;
        openMediaViewer();
      } else if (e.key === 'ArrowRight' && mediaFiles.length > 1) {
        currentMediaIndex = (currentMediaIndex + 1) % mediaFiles.length;
        openMediaViewer();
      }
    }
  });
  
  // Function to show confirmation modal
  function showConfirmModal(title, message, confirmCallback) {
    // Remove any existing modals
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal HTML
    const modalHTML = `
      <div class="modal fade" id="confirmModal" tabindex="-1" aria-labelledby="confirmModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="confirmModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              ${message}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal element
    const modalElement = document.getElementById('confirmModal');
    
    // Initialize Bootstrap modal
    const modal = new bootstrap.Modal(modalElement);
    
    // Add event listener to confirm button
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
      modal.hide();
      confirmCallback();
    });
    
    // Show modal
    modal.show();
  }
  
  // Function to show alert modal
  function showAlertModal(title, message) {
    // Remove any existing alert modals
    const existingModal = document.getElementById('alertModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal HTML
    const modalHTML = `
      <div class="modal fade" id="alertModal" tabindex="-1" aria-labelledby="alertModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="alertModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              ${message}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal element
    const modalElement = document.getElementById('alertModal');
    
    // Initialize Bootstrap modal
    const modal = new bootstrap.Modal(modalElement);
    
    // Show modal
    modal.show();
  }
});