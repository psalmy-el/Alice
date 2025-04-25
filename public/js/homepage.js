// Navigation Toggle - Enhanced for mobile
const navToggle = document.querySelector('.nav-toggle');
const closeNav = document.querySelector('.close-nav');
const mainNav = document.querySelector('.main-nav');

// Function to close the navigation menu properly
function closeNavMenu() {
    mainNav.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    navToggle.style.display = 'block'; // Show the toggle button again
    closeNav.style.display = 'none'; // Hide the close button
}

// Open menu
navToggle.addEventListener('click', function() {
    mainNav.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    closeNav.style.display = 'block'; // Show the close button
    this.style.display = 'none'; // Hide the toggle button when menu is open
});

// Close menu button
closeNav.addEventListener('click', function() {
    closeNavMenu();
});

// Close menu when clicking on a link (for mobile)
const navLinks = document.querySelectorAll('.main-nav a:not(.dropdown-toggle)');
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        // Don't close menu if it's a dropdown toggle
        if (!this.classList.contains('dropdown-toggle')) {
            closeNavMenu();
        }
    });
});


// Handle video grid and modal
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.querySelector('.video-grid');
    const videoGridItems = document.querySelectorAll('.grid-item-inner[data-video-src]'); // Only select video items
    const videoModal = document.querySelector('.video-modal');
    const modalVideo = document.querySelector('.modal-video');
    const closeModal = document.querySelector('.close-modal');
    
    
    // Remove controls from all grid videos but keep them on modal video
    document.querySelectorAll('.grid-item video').forEach(video => {
        // Remove controls from grid videos
        video.removeAttribute('controls');
        
        // Ensure poster image is set properly
        if (video.hasAttribute('poster')) {
            const posterUrl = video.getAttribute('poster');
            video.style.background = `url(${posterUrl}) no-repeat center center`;
            video.style.backgroundSize = 'cover';
            video.setAttribute('data-poster', posterUrl);
        }
        
        // Reset video when it ends
        video.addEventListener('ended', function() {
            this.currentTime = 0;
            this.pause();
            this.load(); // This ensures poster shows up again
        });
    });
    
    // Make sure modal video has controls
    if (modalVideo) {
        modalVideo.setAttribute('controls', '');
    }

    // Better video loading optimization
    const optimizeVideoLoading = () => {
        const gridVideos = document.querySelectorAll('.grid-item video');
        
        gridVideos.forEach(video => {
            // Set to metadata preload mode to improve initial loading speed
            video.setAttribute('preload', 'metadata');
            
            // Create and use IntersectionObserver to detect when videos are visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // When video is in view, set to auto preload
                        video.setAttribute('preload', 'auto');
                        observer.unobserve(video);
                    }
                });
            }, {
                rootMargin: '200px 0px',
                threshold: 0.01
            });
            
            observer.observe(video);
        });
        
        // Special handling for intro video
        const introVideo = document.querySelector('.intro-background-video');
        if (introVideo) {
            introVideo.setAttribute('preload', 'auto');
            introVideo.load();
            introVideo.play().catch(error => {
                console.log('Intro video autoplay prevented:', error);
            });
        }
    };
    
    // Run optimization
    optimizeVideoLoading();

    // Initialize masonry layout after images are loaded
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

   // Handle clicks on the grid items - ONLY FOR VIDEO ITEMS
   videoGridItems.forEach(item => {
    const video = item.querySelector('video');
    
    // Only apply video-specific behavior to items that have videos
    if (video) {
        // Video-specific event listeners
        video.muted = true;
        
        // Video hover behaviors
        item.addEventListener('mouseenter', function() {
            const playButton = this.querySelector('.play-button');
            if (playButton) {
                playButton.style.opacity = '0';
                playButton.style.visibility = 'hidden';
            }
            
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Autoplay was prevented:', error);
                    if (playButton) {
                        playButton.style.opacity = '0.8';
                        playButton.style.visibility = 'visible';
                    }
                });
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (video) {
                video.pause();
                video.currentTime = 0;
                
                if (video.hasAttribute('poster')) {
                    video.load();
                }
                
                const playButton = this.querySelector('.play-button');
                if (playButton) {
                    playButton.style.opacity = '0.8';
                    playButton.style.visibility = 'visible';
                }
            }
        });
        
        // Video click behavior - open modal
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            let videoSrc;
            if (this.hasAttribute('data-video-src')) {
                videoSrc = this.getAttribute('data-video-src');
            } else if (video && video.querySelector('source')) {
                videoSrc = video.querySelector('source').getAttribute('src');
            }
            
            if (videoSrc) {
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
                
                const modalSource = modalVideo.querySelector('source');
                modalSource.setAttribute('src', videoSrc);
                
                modalVideo.load();
                videoModal.style.display = 'flex';
                
                modalVideo.muted = false;
                modalVideo.play().catch(error => {
                    console.log('Modal video play was prevented:', error);
                    modalVideo.muted = true;
                    modalVideo.play().catch(e => {
                        console.log('Even muted autoplay failed:', e);
                    });
                });
            }
        });
        
        // Prevent default video click behavior
        video.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            item.dispatchEvent(clickEvent);
        });
    }
   });

    // Close modal handlers
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
                
                // Apply filtering logic (simplified, adapt to your existing code)
                const gridItems = document.querySelectorAll('.grid-item');
                gridItems.forEach(item => {
                    const itemCategory = item.getAttribute('data-category');
                    
                    if (selectedCategory === 'all' || selectedCategory === itemCategory) {
                        item.classList.remove('hidden-item');
                        item.style.display = '';
                    } else {
                        item.classList.add('hidden-item');
                        item.style.display = 'none';
                    }
                });
                
                // Close the dropdown menu
                dropdownMenu.style.display = 'none';
            
            // Important: Close the navigation menu properly
            closeNavMenu();
            });
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
                const itemCategory = item.getAttribute('data-category');
                
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

    // Make sure to close the navigation menu properly on mobile
    if (window.innerWidth <= 768) {
        closeNavMenu();
    }
});

//cursor change 
document.addEventListener('DOMContentLoaded', function() {
    // Create a custom cursor element
    const customCursor = document.createElement('div');
    customCursor.className = 'custom-cursor';
    document.body.appendChild(customCursor);
    
    // Get all clickable elements
    const clickableElements = document.querySelectorAll(
        '.grid-item-inner, .social-link, ' +
        '.play-button'
    );
    
    // Add event listeners to show custom cursor on hover
    clickableElements.forEach(element => {
        // Force cursor: none !important to override any other styles
        element.style.setProperty('cursor', 'none', 'important');
        
        element.addEventListener('mouseenter', () => {
            customCursor.classList.add('active');
        });
        
        element.addEventListener('mouseleave', () => {
            customCursor.classList.remove('active');
        });
    });
    
    // Move the custom cursor with the mouse
    document.addEventListener('mousemove', (e) => {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
    });
});

// About modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const aboutModal = document.getElementById('aboutModal');
    const aboutLinks = document.querySelectorAll('.about-link, a[href="/about"]');
    const closeButtons = document.querySelectorAll('[data-bs-dismiss="modal"], .btn-close, .modal .btn-secondary');
    
    if (!aboutModal) {
        console.error('About modal not found in the document');
        return;
    }
    
    // Function to open modal
    function openModal() {
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade';
        document.body.appendChild(backdrop);
        
        // Show modal with animation
        aboutModal.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Trigger reflow for animations
        void backdrop.offsetWidth;
        void aboutModal.offsetWidth;
        
        // Add show classes for animation
        backdrop.classList.add('show');
        aboutModal.classList.add('show');
        
        // Make sure we close the navigation menu properly when opening the modal
        if (window.innerWidth <= 768) {
            closeNavMenu();
        }
    }
    
    // Function to close modal
    function closeModal() {
        // Remove show class first (for animation)
        aboutModal.classList.remove('show');
        
        // Find and remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.classList.remove('show');
            
            // Wait for animation to complete
            setTimeout(function() {
                aboutModal.style.display = 'none';
                document.body.classList.remove('modal-open');
                if (backdrop) {
                    backdrop.remove();
                }
            }, 150); // Match the CSS transition time
        } else {
            // No backdrop found, just hide the modal
            aboutModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }
    
    // Add click event for About links
    aboutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    });
    
    // Add click event for close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    });
    
    // Close modal when clicking outside of modal content
    window.addEventListener('click', function(e) {
        if (e.target === aboutModal) {
            closeModal();
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && aboutModal.classList.contains('show')) {
            closeModal();
        }
    });
});
