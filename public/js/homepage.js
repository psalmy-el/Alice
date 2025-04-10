// Navigation Toggle - Enhanced for mobile
const navToggle = document.querySelector('.nav-toggle');
const closeNav = document.querySelector('.close-nav');
const mainNav = document.querySelector('.main-nav');


navToggle.addEventListener('click', function() {
    mainNav.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
});

closeNav.addEventListener('click', function() {
    mainNav.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
});

// Close menu when clicking on a link (for mobile)
const navLinks = document.querySelectorAll('.main-nav a');
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        mainNav.classList.remove('active');
        document.body.style.overflow = '';
    });
});


// Handle video grid and modal
document.addEventListener('DOMContentLoaded', function() {
const grid = document.querySelector('.video-grid');
const gridItems = document.querySelectorAll('.grid-item-inner');
const videoModal = document.querySelector('.video-modal');
const modalVideo = document.querySelector('.modal-video');
const closeModal = document.querySelector('.close-modal');

// Ensure poster images are used properly
document.querySelectorAll('.grid-item video').forEach(video => {
    // Force poster to be used
    if (video.hasAttribute('poster')) {
        const posterUrl = video.getAttribute('poster');
        video.style.background = `url(${posterUrl}) no-repeat center center`;
        video.style.backgroundSize = 'cover';
        
        // Store the poster URL for future reference
        video.setAttribute('data-poster', posterUrl);
        
        // Ensure video is reset when it ends
        video.addEventListener('ended', function() {
            this.currentTime = 0;
            this.pause();
        });
    }
});


 // Optimize video loading - high priority
    const optimizeVideoLoading = () => {
        const gridVideos = document.querySelectorAll('.grid-item video');
        
        // Function to lazy load videos
        const lazyLoadVideo = (video) => {
            // Get the original source
            const sources = video.querySelectorAll('source');
            const originalSrcs = [];
            
            // Store original sources and remove them temporarily
            sources.forEach(source => {
                originalSrcs.push(source.getAttribute('src'));
                source.removeAttribute('src');
            });
            
            // Forced reload to clear any buffered data
            video.load();
            
            // Create and use IntersectionObserver to load videos only when in viewport
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // When video is in view, restore sources
                        sources.forEach((source, index) => {
                            source.setAttribute('src', originalSrcs[index]);
                        });
                        
                        // Load video
                        video.load();
                        
                        // Stop observing once loaded
                        observer.unobserve(video);
                    }
                });
            }, {
                rootMargin: '200px 0px', // Load videos when they're within 200px of viewport
                threshold: 0.01
            });
            
            // Start observing
            observer.observe(video);
        };
        
        // Apply to all grid videos except the intro video
        gridVideos.forEach(lazyLoadVideo);
        
        // Load intro video immediately but with low quality at first
        const introVideo = document.querySelector('.intro-background-video');
        if (introVideo) {
            // Force load the intro video immediately
            introVideo.setAttribute('preload', 'auto');
            introVideo.load();
        }
    };
    
    // Run optimization
    optimizeVideoLoading();


// Initialize masonry layout
if (typeof Masonry !== 'undefined' && typeof imagesLoaded !== 'undefined') {
    imagesLoaded(grid, function() {
        new Masonry(grid, {
            itemSelector: '.grid-item',
            columnWidth: '.grid-item',
            percentPosition: true,
            gutter: 15
        });
    });
}

// Handle hover to play videos and click to open modal
gridItems.forEach(item => {
    const video = item.querySelector('video');
    
    if (video) {
        // Make sure video is paused initially
        video.pause();
        
        // Play on hover
        item.addEventListener('mouseenter', function() {
            // Make sure video is muted to bypass autoplay restrictions
            video.muted = true;
            
            // Hide play button immediately on hover
            const playButton = this.querySelector('.play-button');
            if (playButton) {
                playButton.style.opacity = 0;
                playButton.style.visibility = 'hidden';
            }
            
            // Play the video when cursor enters
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Autoplay was prevented:', error);
                });
            }
        });
        
        // And modify your mouseleave event handler
        item.addEventListener('mouseleave', function() {
            const playButton = this.querySelector('.play-button');
            
            // Pause the video
            video.pause();
            
            // Reset to beginning
            video.currentTime = 0;
            
            // Show play button again
            if (playButton) {
                playButton.style.opacity = 0.8;
                playButton.style.visibility = 'visible';
            }
        });

        
        // Open in modal when clicked
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the actual video source from the current video if data-video-src isn't set
            const videoSrc = this.getAttribute('data-video-src') || 
                            video.querySelector('source').getAttribute('src');
            
            // Update modal video source
            const modalSource = modalVideo.querySelector('source');
            modalSource.setAttribute('src', videoSrc);
            
            // Reset modal video and load the new source
            modalVideo.load();
            
            // Show modal
            videoModal.style.display = 'flex';
            
            // Try playing with sound in the modal
            modalVideo.muted = false;
            const modalPlayPromise = modalVideo.play();
            
            if (modalPlayPromise !== undefined) {
                modalPlayPromise.catch(error => {
                    console.log('Modal video play was prevented:', error);
                    // If autoplay with sound fails, try muted
                    modalVideo.muted = true;
                    modalVideo.play().catch(e => {
                        console.log('Even muted autoplay failed:', e);
                    });
                });
            }
        });
    }
});

// Close modal handlers (keep your existing code)
closeModal.addEventListener('click', function() {
    modalVideo.pause();
    videoModal.style.display = 'none';
});

videoModal.addEventListener('click', function(e) {
    if (e.target === videoModal) {
        modalVideo.pause();
        videoModal.style.display = 'none';
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && videoModal.style.display === 'flex') {
        modalVideo.pause();
        videoModal.style.display = 'none';
    }
});
});

// Grid filtering based on categories
document.addEventListener('DOMContentLoaded', function() {
    const categoryLinks = document.querySelectorAll('.dropdown-menu a');
    const gridItems = document.querySelectorAll('.grid-item');
    const videoGridSection = document.querySelector('.video-grid-section');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    let msnry; // Masonry instance variable
    
    // Function to initialize masonry
    function initMasonry() {
        const grid = document.querySelector('.video-grid');
        
        // First destroy existing instance if it exists
        if (msnry) {
            msnry.destroy();
            msnry = null;
        }
        
        // Then create new instance
        if (typeof Masonry !== 'undefined' && typeof imagesLoaded !== 'undefined') {
            // Use imagesLoaded to ensure all images are loaded first
            imagesLoaded(grid, function() {
                msnry = new Masonry(grid, {
                    itemSelector: '.grid-item:not(.hidden-item)',
                    columnWidth: '.grid-item:not(.hidden-item)',
                    percentPosition: true,
                    gutter: 15,
                    transitionDuration: '0.4s' // Add transition for smoother updates
                });
            });
        }
    }
    
    // Initialize on page load
    initMasonry();

    // Dropdown toggle functionality
    dropdownMenu.style.display = 'none';
    
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            dropdownMenu.style.display = 'none';
        }
    });

    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Close the dropdown menu immediately
            dropdownMenu.style.display = 'none';
            
            // Remove active class from all links
            categoryLinks.forEach(item => item.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get selected category
            const selectedCategory = this.getAttribute('data-category');
            
            // First, temporarily hide the entire grid to prevent flickering
            const grid = document.querySelector('.video-grid');
            grid.style.visibility = 'hidden';
            
            // Filter grid items
            gridItems.forEach(item => {
                const itemCategory = item.querySelector('.grid-item-category').textContent;
                
                if (selectedCategory === 'all' || selectedCategory === itemCategory) {
                    item.classList.remove('hidden-item');
                    item.style.display = '';
                } else {
                    item.classList.add('hidden-item');
                    item.style.display = 'none';
                }
            });
            
            // Scroll to the video grid section first
            videoGridSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Use a proper sequence of events with appropriate timing
            setTimeout(function() {
                // Destroy the existing masonry instance
                if (msnry) {
                    msnry.destroy();
                    msnry = null;
                }
                
                // Give some time for the DOM to update
                setTimeout(function() {
                    // Now reinitialize masonry
                    initMasonry();
                    
                    // Show the grid again after masonry is initialized
                    setTimeout(function() {
                        grid.style.visibility = 'visible';
                    }, 200);
                }, 150);
            }, 100);
        });
    });
    
    // Additional fix: Re-layout masonry on window resize
    window.addEventListener('resize', function() {
        if (msnry) {
            msnry.layout();
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // About modal functionality
    const aboutLinks = document.querySelectorAll('a[href="/about"]');
    const aboutModal = document.querySelector('.about-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    
    // Open about modal when About link is clicked
    aboutLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent navigation to /about route
        aboutModal.classList.add('active');
        document.body.classList.add('modal-open');
      });
    });
    
    // Close modal when close button is clicked
    closeModalButtons.forEach(button => {
      button.addEventListener('click', function() {
        aboutModal.classList.remove('active');
        document.body.classList.remove('modal-open');
      });
    });
    
    // Close modal when clicking outside the content
    aboutModal.addEventListener('click', function(e) {
      if (e.target === aboutModal) {
        aboutModal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    });
    
  });