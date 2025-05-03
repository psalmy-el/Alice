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
  
  // Add click event to all media cards
  document.querySelectorAll('.media-card').forEach(card => {
    card.addEventListener('click', function() {
      const mediaId = this.getAttribute('data-media-id');
      
      // Fetch all files for this media
      fetch(`/api/media/${mediaId}/files`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.files && data.files.length > 0) {
            mediaFiles = data.files;
            currentMediaIndex = 0;
            
            openMediaViewer();
          } else {
            showAlertModal('Error', 'No files found for this media');
          }
        })
        .catch(error => {
          console.error('Error fetching media files:', error);
          showAlertModal('Error', 'Failed to load media files');
        });
    });
  });
  
  function openMediaViewer() {
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
    const isVideo = file.file_path.match(/\.(mp4|webm|ogg)$/i);
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
      source.type = `video/${file.file_path.split('.').pop().toLowerCase()}`;
      
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
      
      container.appendChild(videoContainer);
    } else {
      const img = document.createElement('img');
      img.src = file.file_path;
      img.alt = 'Media Preview';
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