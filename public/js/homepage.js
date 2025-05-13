// Navigation Toggle - Enhanced for mobile
const navToggle = document.querySelector('.nav-toggle');
const closeNav = document.querySelector('.close-nav');
const mainNav = document.querySelector('.main-nav');

function isMobileView() {
    return window.innerWidth <= 768; // Uses the same breakpoint as your CSS
}

// Function to close the navigation menu properly
function closeNavMenu() {
    // Only activate mobile menu behavior in mobile view
    if (isMobileView()) {
        mainNav.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        navToggle.style.display = 'block'; // Show the toggle button again
        closeNav.style.display = 'none'; // Hide the close button
    }
}

// Open menu
navToggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Only activate mobile menu in mobile view
    if (isMobileView()) {
        mainNav.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        closeNav.style.display = 'block'; // Show the close button
        this.style.display = 'none'; // Hide the toggle button when menu is open
    }
});

// Close menu button
closeNav.addEventListener('click', function(e) {
    e.preventDefault(); 
    e.stopPropagation();
    closeNavMenu();
});

// Close menu when clicking on a link (for mobile)
const navLinks = document.querySelectorAll('.main-nav a:not(.dropdown-toggle)');
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        // Don't close menu if it's a dropdown toggle
        if (!this.classList.contains('dropdown-toggle') && isMobileView()) {
            closeNavMenu();
        }
    });
});

//Grid Animation section
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const videoGrid = document.querySelector('.video-grid');
    const gridItems = document.querySelectorAll('.grid-item');
    const categoryLinks = document.querySelectorAll('[data-category]');
    let currentCategory = 'all';
    let isProcessingCategoryClick = false; // Flag to prevent interference between category clicks and item clicks
    
    // Initial setup variables
    let msnry;
    const transitionDuration = 1200; // Animation duration
    
    // Configure all videos
    setupVideos();
    
    // Add position tracking index to each item
    gridItems.forEach((item, index) => {
        item.setAttribute('data-index', index);
    });
    
    // Initialize masonry
    initMasonry();
    
    // Add event listeners for category selection
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Prevent multiple clicks from happening
            if (isProcessingCategoryClick) return;
            isProcessingCategoryClick = true;
            
            // Get selected category
            const category = this.getAttribute('data-category');
            if (category === currentCategory) {
                isProcessingCategoryClick = false;
                return;
            }
            
            // Update active status on links
            categoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Update current category
            currentCategory = category;
            
            // Filter with sliding animation
            filterItems(category);
            
            // Scroll behavior - FURTHER REDUCED SCROLL OFFSET
            const videoGridSection = document.querySelector('.video-grid-section');
            if (videoGridSection) {
                const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                // Only scroll a very small amount to maintain proximity to header
                const sectionPosition = videoGridSection.offsetTop;
                const offsetPosition = sectionPosition - headerHeight - 10; // Even smaller offset (reduced from 30 to 10)
                
                setTimeout(() => {
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 50);
            }
            
            // Reset processing flag after animation completes
            setTimeout(() => {
                isProcessingCategoryClick = false;
            }, transitionDuration + 200);
        });
    });
    
    // Initialize Masonry layout
    function initMasonry() {
        if (typeof Masonry !== 'undefined' && typeof imagesLoaded !== 'undefined') {
            imagesLoaded(videoGrid, function() {
                // Create new masonry instance with zero transition duration initially
                msnry = new Masonry(videoGrid, {
                    itemSelector: '.grid-item:not(.hidden-item)',
                    columnWidth: '.grid-item:not(.hidden-item)',
                    percentPosition: true,
                    gutter: 20,
                    transitionDuration: 0, // No transition initially
                    stagger: 0
                });
                
                // Run layout again to ensure proper positioning
                setTimeout(() => {
                    msnry.layout();
                }, 100);
            });
        }
    }
    
    /**
     * Simplified and fixed filter function - Only for category filtering
     */
    function filterItems(category) {
        // Prevent interaction during animation
        videoGrid.classList.add('filtering');
        console.log(`Filtering to category: ${category}`);
        
        // STEP 1: Mark items for show/hide but don't change visibility yet
        gridItems.forEach(item => {
            // Store original positions before any changes
            const rect = item.getBoundingClientRect();
            item.dataset.originalLeft = rect.left;
            item.dataset.originalTop = rect.top;
            
            if (category === 'all' || item.getAttribute('data-category') === category) {
                item.classList.add('will-show');
                item.classList.remove('will-hide');
            } else {
                item.classList.add('will-hide');
                item.classList.remove('will-show');
            }
        });
        
        // STEP 2: Make all items that should be visible actually visible
        gridItems.forEach(item => {
            if (item.classList.contains('will-show')) {
                if (item.classList.contains('hidden-item')) {
                    item.classList.remove('hidden-item');
                    item.style.display = '';
                    // Initially invisible if it was hidden
                    item.style.opacity = '0';
                }
            }
        });
        
        // STEP 3: Disable transitions and update layout
        videoGrid.classList.add('no-transition');
        if (msnry) {
            msnry.options.transitionDuration = 0;
            msnry.layout();
        }
        
        // Force reflow to ensure layout is updated
        void videoGrid.offsetWidth;
        
        // STEP 4: Calculate transforms directly from original positions to final positions
        gridItems.forEach(item => {
            if (!item.classList.contains('hidden-item')) {
                const originalLeft = parseFloat(item.dataset.originalLeft);
                const originalTop = parseFloat(item.dataset.originalTop);
                
                const rect = item.getBoundingClientRect();
                const currentLeft = rect.left;
                const currentTop = rect.top;
                
                // Direct path calculation - from original to final position
                const dx = originalLeft - currentLeft;
                const dy = originalTop - currentTop;
                
                if (item.classList.contains('will-show') && !item.style.opacity) {
                    // New items should start at final position
                    item.style.transform = '';
                } else {
                    // Position items at their original position
                    item.style.transform = `translate(${dx}px, ${dy}px)`;
                }
            }
        });
        
        // Force reflow to ensure transforms are applied
        void videoGrid.offsetWidth;
        
        // STEP 5: Enable transitions and animate to final positions in a straight line
        videoGrid.classList.remove('no-transition');
        
        // Set all items to animate directly to their final positions
        gridItems.forEach(item => {
            if (item.classList.contains('will-show')) {
                item.style.opacity = '1';
                item.style.transform = 'translate(0, 0)'; // Direct path to final position
            } else if (item.classList.contains('will-hide')) {
                item.style.opacity = '0';
                item.style.transform = 'translate(0, 0)'; // Fade out in place
            }
        });
        
        // Clean up after animation completes
        setTimeout(() => {
            // Final cleanup
            gridItems.forEach(item => {
                // Remove temporary classes and data attributes
                item.classList.remove('will-show');
                item.classList.remove('will-hide');
                delete item.dataset.originalLeft;
                delete item.dataset.originalTop;
                
                // Hide items that should be hidden
                if (category !== 'all' && item.getAttribute('data-category') !== category) {
                    item.classList.add('hidden-item');
                    item.style.display = 'none';
                }
                
                // Reset all applied styles
                item.style.transform = '';
                item.style.opacity = '';
            });
            
            // Re-enable masonry transitions for future updates
            if (msnry) {
                msnry.options.transitionDuration = '1.2s';
                msnry.layout();
            }
            
            // Re-enable interaction
            videoGrid.classList.remove('filtering');
            console.log('Animation complete');
        }, transitionDuration + 100);
    }
    
    // Configure all videos
    function setupVideos() {
        const videos = document.querySelectorAll('.grid-item video');
        
        videos.forEach(video => {
            // Remove controls for grid view
            video.controls = false;
            
            // Performance optimizations
            video.preload = "metadata";
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            
            // Lazy loading - only start playing when in viewport
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        video.play().catch(e => {
                            console.log('Video play error:', e);
                        });
                    } else {
                        video.pause();
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: 0.1
            });
            
            observer.observe(video);
        });
    }
    
    // Set up modal and grid item functionality
    setupGridItemsAndModal();
    
    function setupGridItemsAndModal() {
        const videoModal = document.querySelector('.video-modal');
        const modalContent = videoModal?.querySelector('.modal-content');
        const modalVideo = document.querySelector('.modal-video');
        const closeModal = document.querySelector('.close-modal');
        
        // 1. Handle IMAGE grid items - should navigate to gallery page
        document.querySelectorAll('.grid-item a.grid-item-inner').forEach(item => {
            // For image links, we need to ensure they navigate properly
            const overlay = item.querySelector('.grid-item-overlay');
            const media = item.querySelector('img');
            
            if (overlay && media) {
                overlay.classList.add('bottom-title');
                
                // Hover effect - show overlay and fade image
                item.addEventListener('mouseenter', function() {
                    overlay.style.transform = 'translateY(0)';
                    media.style.opacity = '0.1'; // Make image almost transparent
                    media.style.transform = 'scale(1.03)';
                });
                
                item.addEventListener('mouseleave', function() {
                    overlay.style.transform = 'translateY(100%)';
                    media.style.opacity = '1'; // Restore opacity
                    media.style.transform = 'scale(1)';
                });
                
                // Ensure link navigation works by blocking event propagation to grid filtering
                item.addEventListener('click', function(e) {
                    // Don't stop propagation or prevent default - let the link work naturally
                    e.stopPropagation(); // This prevents the click from bubbling to parent grid items
                });
            }
        });
        
        // 2. Handle VIDEO grid items - should open modal and play video
        document.querySelectorAll('.grid-item-inner[data-video-src]').forEach(item => {
            const overlay = item.querySelector('.grid-item-overlay');
            const media = item.querySelector('video');
            
            // Add hover effects - show overlay and fade video
            if (overlay && media) {
                overlay.classList.add('bottom-title');
                
                item.addEventListener('mouseenter', function() {
                    overlay.style.transform = 'translateY(0)';
                    media.style.opacity = '0.1'; // Make video almost transparent
                    media.style.transform = 'scale(1.03)';
                });
                
                item.addEventListener('mouseleave', function() {
                    overlay.style.transform = 'translateY(100%)';
                    media.style.opacity = '1'; // Restore opacity
                    media.style.transform = 'scale(1)';
                });
            }
            
            // Add click handler for modal opening
            item.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent any default navigation
                e.stopPropagation(); // Stop event bubbling
                
                const videoSrc = this.getAttribute('data-video-src');
                
                if (videoSrc && modalVideo && videoModal) {
                    // Set the video source - ensure we have a source element
                    let videoSource = modalVideo.querySelector('source');
                    if (!videoSource) {
                        videoSource = document.createElement('source');
                        modalVideo.appendChild(videoSource);
                    }
                    
                    videoSource.setAttribute('src', videoSrc);
                    videoSource.setAttribute('type', 'video/mp4');
                    
                    // Reset and reload the video
                    modalVideo.load();
                    
                    // Show modal
                    videoModal.style.display = 'flex';
                    
                    // Force reflow for smooth animation
                    void videoModal.offsetWidth;
                    
                    // Fade in effect
                    videoModal.style.opacity = '1';
                    videoModal.classList.add('active');
                    
                    if (modalContent) {
                        modalContent.style.transform = 'translateY(0)';
                    }
                    
                    // Play the video after modal animation - ENSURE IT PLAYS
                    setTimeout(() => {
                        // Make sure controls are enabled in modal
                        modalVideo.controls = true;
                        
                        modalVideo.play().then(() => {
                            console.log('Modal video playing successfully');
                        }).catch(e => {
                            console.error('Modal video play error:', e);
                            // Try again after a brief delay
                            setTimeout(() => {
                                modalVideo.play().catch(e2 => {
                                    console.error('Second attempt failed:', e2);
                                });
                            }, 200);
                        });
                    }, 500);
                }
            });
        });
        
        // Handle modal closing
        if (closeModal) {
            closeModal.addEventListener('click', function(e) {
                e.preventDefault();
                closeVideoModal();
            });
        }
        
        if (videoModal) {
            videoModal.addEventListener('click', function(e) {
                if (e.target === videoModal) {
                    closeVideoModal();
                }
            });
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && videoModal && videoModal.style.opacity === '1') {
                closeVideoModal();
            }
        });
        
        function closeVideoModal() {
            if (!videoModal) return;
            
            if (modalVideo) {
                modalVideo.pause();
            }
            
            videoModal.style.opacity = '0';
            videoModal.classList.remove('active');
            
            if (modalContent) {
                modalContent.style.transform = 'translateY(20px)';
            }
            
            setTimeout(() => {
                videoModal.style.display = 'none';
                
                // Clear the video source to fully stop it
                if (modalVideo) {
                    const videoSource = modalVideo.querySelector('source');
                    if (videoSource) {
                        videoSource.removeAttribute('src');
                        modalVideo.load();
                    }
                }
            }, 800);
        }
    }
    
    // Add required CSS
    addRequiredCSS();
    
    function addRequiredCSS() {
        if (!document.querySelector('#fixed-slide-styles')) {
            const style = document.createElement('style');
            style.id = 'fixed-slide-styles';
            style.textContent = `
                /* Core transition styles */
                .grid-item {
                    transform: translate(0, 0);
                    transition: transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1),
                                opacity 1.2s cubic-bezier(0.25, 0.1, 0.25, 1);
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                }
                
                .video-grid.no-transition * {
                    transition: none !important;
                }
                
                .video-grid.filtering {
                    pointer-events: none;
                }
                
                /* Helper classes */
                .will-show, .will-hide {
                    /* Used for transition marking */
                }
                
                /* Modal transitions */
                .video-modal {
                    opacity: 0;
                    transition: opacity 0.8s ease;
                }
                
                .video-modal .modal-content {
                    transform: translateY(20px);
                    transition: transform 0.8s ease;
                }
                
                .video-modal.active .modal-content {
                    transform: translateY(0);
                }
                
                /* Fix video modal controls */
                .modal-video::-webkit-media-controls {
                    display: inline !important;
                }
                
                /* Adjust spacing between header and grid */
                .video-grid-section {
                    padding-top: 5px; /* Further reduced from 40px */
                    padding-bottom: 100px;
                    scroll-margin-top: 10px; /* Further reduced from 40px */
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Set initial active state for "All" category
    const allCategoryLink = document.querySelector('[data-category="all"]');
    if (allCategoryLink) {
        allCategoryLink.classList.add('active');
    }
});

// vertical category section
document.addEventListener('DOMContentLoaded', function() {
    // Create vertical categories list container - for desktop only
    const verticalCategoriesContainer = document.createElement('div');
    verticalCategoriesContainer.className = 'vertical-categories-container';
    document.body.appendChild(verticalCategoriesContainer);
    
    // Create vertical categories list
    const verticalCategoriesList = document.createElement('ul');
    verticalCategoriesList.className = 'vertical-categories-list';
    
    // Get original categories
    const originalItems = document.querySelectorAll('.dropdown-menu:not(.vertical) li');
    
    // If no original items found, we can get them from the vertical menu if it exists
    if (originalItems.length === 0) {
        const verticalMenuItems = document.querySelectorAll('.dropdown-menu.vertical li');
        verticalMenuItems.forEach(item => {
            const clone = item.cloneNode(true);
            verticalCategoriesList.appendChild(clone);
        });
    } else {
        // Clone original dropdown items to the vertical list
        originalItems.forEach(item => {
            const clone = item.cloneNode(true);
            verticalCategoriesList.appendChild(clone);
        });
    }
    
    // Add the vertical list to the container
    verticalCategoriesContainer.appendChild(verticalCategoriesList);
    
    // Get all category links in the vertical list
    const verticalCategoryLinks = verticalCategoriesList.querySelectorAll('a[data-category]');
    
    // Add category filtering functionality to vertical list items
    verticalCategoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all category links
            document.querySelectorAll('.vertical-categories-list a').forEach(item => 
                item.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get selected category
            const selectedCategory = this.getAttribute('data-category');
            
            // Find the main DOM document-level category handler to reuse its methods
            const mainCategoryHandler = document.querySelector('[data-category="' + selectedCategory + '"]:not(.vertical-categories-list a)');
            if (mainCategoryHandler) {
                // Trigger a click on the main category handler to reuse its event handler
                mainCategoryHandler.click();
            } else {
                // As a fallback, manually apply animation effect
                if (typeof applyAnimationEffect === 'function') {
                    applyAnimationEffect(selectedCategory);
                } else {
                    // Access the function through the global scope as defined in the DOMContentLoaded event
                    const videoGrid = document.querySelector('.video-grid');
                    const gridItems = document.querySelectorAll('.grid-item');
                    
                    if (videoGrid) {
                        // Similar to the applyAnimationEffect function but simplified
                        videoGrid.classList.add('recalculating');
                        videoGrid.classList.add('animation-fade');
                        videoGrid.classList.add('animation-active');
                        
                        setTimeout(() => {
                            // Filter grid items
                            gridItems.forEach(item => {
                                if (selectedCategory === 'all' || item.getAttribute('data-category') === selectedCategory) {
                                    item.classList.remove('hidden-item');
                                    item.style.display = '';
                                } else {
                                    item.classList.add('hidden-item');
                                    item.style.display = 'none';
                                }
                            });
                            
                            // Reinitialize masonry if available
                            if (typeof Masonry !== 'undefined' && typeof imagesLoaded !== 'undefined') {
                                if (window.msnry) {
                                    window.msnry.destroy();
                                }
                                
                                imagesLoaded(videoGrid, function() {
                                    window.msnry = new Masonry(videoGrid, {
                                        itemSelector: '.grid-item:not(.hidden-item)',
                                        columnWidth: '.grid-item:not(.hidden-item)',
                                        percentPosition: true,
                                        gutter: 15,
                                        transitionDuration: '0.4s'
                                    });
                                });
                            }
                            
                            // Remove animation classes after some time
                            setTimeout(() => {
                                videoGrid.classList.remove('animation-active', 'recalculating');
                            }, 600);
                        }, 300);
                    }
                }
            }
            
            // Get reference to the video grid section
            const videoGridSection = document.querySelector('.video-grid-section');
            
            // Scroll to the video grid section if it exists
            if (videoGridSection) {
                videoGridSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        });
    });
    
    // Create Mobile Categories Menu
    const createMobileCategoriesMenu = function() {
        // Only create if we're in mobile view
        if (isMobileView()) {
            // Check if mobile categories menu already exists
            if (!document.querySelector('.mobile-categories-menu')) {
                // Create container
                const mobileCategoriesMenu = document.createElement('div');
                mobileCategoriesMenu.className = 'mobile-categories-menu';
                
                // Create dropdown toggle
                const dropdownToggle = document.createElement('button');
                dropdownToggle.className = 'dropdown-toggle';
                dropdownToggle.textContent = 'Categories';
                dropdownToggle.setAttribute('data-bs-toggle', 'dropdown');
                dropdownToggle.setAttribute('aria-expanded', 'false');
                
                // Create dropdown menu
                const dropdownMenu = document.createElement('ul');
                dropdownMenu.className = 'dropdown-menu';
                dropdownMenu.style.display = 'none'; // Initially hidden
                
                // Get categories from vertical list
                const verticalCategoryLinks = document.querySelectorAll('.vertical-categories-list a[data-category]');
                
                // Add "All" category first if it doesn't exist
                const allItem = document.createElement('li');
                const allLink = document.createElement('a');
                allLink.href = '#';
                allLink.textContent = 'All Categories';
                allLink.setAttribute('data-category', 'all');
                allItem.appendChild(allLink);
                dropdownMenu.appendChild(allItem);
                
                // Clone other categories
                verticalCategoryLinks.forEach(link => {
                    if (link.getAttribute('data-category') !== 'all') {
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        a.href = '#';
                        a.textContent = link.textContent;
                        a.setAttribute('data-category', link.getAttribute('data-category'));
                        li.appendChild(a);
                        dropdownMenu.appendChild(li);
                    }
                });
                
                // Add event listeners to category links
                const categoryLinks = dropdownMenu.querySelectorAll('a[data-category]');
                categoryLinks.forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // Remove active class from all links
                        categoryLinks.forEach(item => item.classList.remove('active'));
                        
                        // Add active class to clicked link
                        this.classList.add('active');
                        
                        // Get selected category
                        const selectedCategory = this.getAttribute('data-category');
                        
                        // Find the main DOM document-level category handler to reuse its methods
                        const mainCategoryHandler = document.querySelector('[data-category="' + selectedCategory + '"]:not(.mobile-categories-menu a)');
                        if (mainCategoryHandler) {
                            // Trigger a click on the main category handler to reuse its event handler
                            mainCategoryHandler.click();
                        } else {
                            // As a fallback, manually apply animation effect through the global scope
                            const videoGrid = document.querySelector('.video-grid');
                            const gridItems = document.querySelectorAll('.grid-item');
                            
                            if (videoGrid) {
                                // Similar to the applyAnimationEffect function but simplified
                                videoGrid.classList.add('recalculating');
                                videoGrid.classList.add('animation-fade');
                                videoGrid.classList.add('animation-active');
                                
                                setTimeout(() => {
                                    // Filter grid items
                                    gridItems.forEach(item => {
                                        if (selectedCategory === 'all' || item.getAttribute('data-category') === selectedCategory) {
                                            item.classList.remove('hidden-item');
                                            item.style.display = '';
                                        } else {
                                            item.classList.add('hidden-item');
                                            item.style.display = 'none';
                                        }
                                    });
                                    
                                    // Reinitialize masonry if available
                                    if (typeof Masonry !== 'undefined' && typeof imagesLoaded !== 'undefined') {
                                        if (window.msnry) {
                                            window.msnry.destroy();
                                        }
                                        
                                        imagesLoaded(videoGrid, function() {
                                            window.msnry = new Masonry(videoGrid, {
                                                itemSelector: '.grid-item:not(.hidden-item)',
                                                columnWidth: '.grid-item:not(.hidden-item)',
                                                percentPosition: true,
                                                gutter: 15,
                                                transitionDuration: '0.4s'
                                            });
                                        });
                                    }
                                    
                                    // Remove animation classes after some time
                                    setTimeout(() => {
                                        videoGrid.classList.remove('animation-active', 'recalculating');
                                    }, 600);
                                }, 300);
                            }
                        }
                        
                        // Close dropdown and nav menu
                        dropdownMenu.style.display = 'none';
                        dropdownToggle.setAttribute('aria-expanded', 'false');
                        closeNavMenu();
                    });
                });
                
                // Append elements
                mobileCategoriesMenu.appendChild(dropdownToggle);
                mobileCategoriesMenu.appendChild(dropdownMenu);
                
                // Add to main navigation
                const mainNav = document.querySelector('.main-nav ul');
                if (mainNav) {
                    const menuItem = document.createElement('li');
                    menuItem.className = 'mobile-only';
                    menuItem.appendChild(mobileCategoriesMenu);
                    mainNav.appendChild(menuItem);
                    
                    // Toggle dropdown functionality
                    dropdownToggle.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const expanded = this.getAttribute('aria-expanded') === 'true';
                        this.setAttribute('aria-expanded', !expanded);
                        
                        if (expanded) {
                            dropdownMenu.style.display = 'none';
                        } else {
                            dropdownMenu.style.display = 'block';
                        }
                    });
                }
            }
        }
    };
    
    // Call function on load
    createMobileCategoriesMenu();
    
    // Update on resize
    window.addEventListener('resize', function() {
        createMobileCategoriesMenu();
    });
    
    // Hide any existing dropdown menus that aren't supposed to be shown
    const originalDropdown = document.querySelector('.dropdown.mobile-only');
    if (originalDropdown) {
        originalDropdown.style.display = 'none';
    }
    
    const verticalToggle = document.querySelector('.dropdown-toggle.vertical-toggle');
    if (verticalToggle) {
        verticalToggle.style.display = 'none';
    }
    
    const verticalMenu = document.querySelector('.dropdown-menu.vertical');
    if (verticalMenu) {
        verticalMenu.style.display = 'none';
    }
});

// cursor change and header animation
document.addEventListener('DOMContentLoaded', function() {
    // Get the logo element
    const logo = document.querySelector('.logo');
    const logoImg = document.querySelector('.logo-img');
    const mainNav = document.querySelector('.main-nav');
    const headerInner = document.querySelector('.header-inner');
    
    // Variables to track scroll position, rotation and position
    let lastScrollY = 0;
    let originalLogoPosition = null;
    let animationFrameId = null;
    
    // Animation state variables
    let currentRotation = 0;
    let targetRotation = 0;
    let currentLeft = 0;
    let targetLeft = 0;
    
    // Save original logo position once DOM is loaded
    if (logo) {
        const rect = logo.getBoundingClientRect();
        originalLogoPosition = {
            left: rect.left,
            top: rect.top
        };
        currentLeft = rect.left;
    }
    
    // Create a wrapper for the logo to handle the rotation
    const logoWrapper = document.createElement('div');
    logoWrapper.className = 'logo-wrapper';
    
    // Move the logo img inside the wrapper
    if (logo && logoImg) {
        logo.insertBefore(logoWrapper, logoImg);
        logoWrapper.appendChild(logoImg);
    }
    
    // Clone logo image for cursor
    const cursorLogoImg = logoImg.cloneNode(true);
    
    // Function to handle scroll
    function handleScroll() {
        const currentScrollY = window.scrollY;
        const header = document.querySelector('header');
        const headerRect = header.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        
        // MODIFIED: Use a shorter scroll distance for quicker rotation (1500px instead of 3000px)
        const scrollProgress = Math.min(currentScrollY / 1500, 1); // Normalize between 0 and 1
        
        // Calculate target rotation based on scroll progress (more aggressive)
        // Multiple rotations as we scroll (up to 3 full rotations)
        const maxRotation = 1080; // 3 full rotations (3 * 360 degrees)
        targetRotation = scrollProgress * maxRotation;
        
        // Calculate target position based on scroll progress
        const startLeft = originalLogoPosition ? originalLogoPosition.left : 0;
        
        // MODIFIED: Different behavior based on screen size
        // For mobile screens (less than 768px wide), only rotate, don't move
        if (windowWidth < 768) {
            // Keep logo in original position for small screens
            targetLeft = startLeft;
        } else {
            // For larger screens, allow movement but reduce it
            // Only move 40% of what we were doing before (prioritize rotation over movement)
            const endLeftPercentage = 0.4; // Reduced movement (40% of window width)
            
            // Make sure the logo never goes off-screen by limiting the maximum position
            const maxPosition = windowWidth - (logo.offsetWidth + 20); // 20px buffer from edge
            const calculatedEndLeft = Math.min(windowWidth * endLeftPercentage, maxPosition);
            targetLeft = startLeft + (scrollProgress * (calculatedEndLeft - startLeft));
            
            // ADDED: Check if we've scrolled past the endpoint, then reverse the animation
            const reversePoint = 2000; // Start reversing after 2000px of scroll
            if (currentScrollY > reversePoint) {
                // Calculate how far past the reverse point we are
                const reverseProgress = Math.min((currentScrollY - reversePoint) / 1000, 1);
                
                // Gradually move back toward the left
                targetLeft = calculatedEndLeft - (reverseProgress * (calculatedEndLeft - startLeft));
            }
        }
        
        // Add scrolled class to header when scrolling down
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
            
            // Move logo to right side gradually with scroll
            logo.classList.add('logo-scrolled');
            
            // Adjust the header layout for scrolled state
            header.classList.add('layout-changed');
            
            // Start the animation if it's not already running
            if (!animationFrameId) {
                animateLogoMovement();
            }
            
            // Adjust main nav position
            if (mainNav) {
                mainNav.style.marginTop = '40px'; // Create space below the logo
            }
            
        } else {
            // At top of page - reset everything
            header.classList.remove('scrolled');
            header.classList.remove('layout-changed');
            logo.classList.remove('logo-scrolled');
            
            // Set targets to original values
            targetRotation = 0;
            targetLeft = originalLogoPosition ? originalLogoPosition.left : 0;
            
            // Start animation if not already running
            if (!animationFrameId) {
                animateLogoMovement();
            }
            
            // Reset main nav position
            if (mainNav) {
                mainNav.style.marginTop = '';
            }
        }
        
        lastScrollY = currentScrollY;
    }
    
    // Function to smoothly animate both rotation and position
    function animateLogoMovement() {
        // MODIFIED: Increased rotation speed while keeping position movement slow
        const rotationEase = 0.01; // Faster rotation speed
        const positionEase = 0.004; // Keep position movement slow
        
        const dr = targetRotation - currentRotation;
        const dx = targetLeft - currentLeft;
        
        // If we're close enough to both targets, stop the animation
        if (Math.abs(dr) < 0.5 && Math.abs(dx) < 0.5) {
            currentRotation = targetRotation;
            currentLeft = targetLeft;
            
            logoWrapper.style.transform = `rotate(${currentRotation}deg)`;
            logo.style.left = `${currentLeft}px`;
            
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            return;
        }
        
        // Update rotation with easing
        currentRotation += dr * rotationEase;
        logoWrapper.style.transform = `rotate(${currentRotation}deg)`;
        
        // Update position with easing
        currentLeft += dx * positionEase;
        logo.style.left = `${currentLeft}px`;
        
        // Continue the animation
        animationFrameId = requestAnimationFrame(animateLogoMovement);
    }
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Re-calculate original position on resize
    window.addEventListener('resize', function() {
        if (logo) {
            const rect = logo.getBoundingClientRect();
            
            // Only update original position when at top
            if (window.scrollY <= 50) {
                originalLogoPosition = {
                    left: rect.left,
                    top: rect.top
                };
                currentLeft = rect.left;
            }
            
            // Recalculate target position based on new window size
            handleScroll();
        }
    });
    
    // ---- Custom Cursor Implementation ----
    
    // Create a custom cursor element
    const customCursor = document.createElement('div');
    customCursor.className = 'custom-cursor';
    document.body.appendChild(customCursor);
    
    // Add the logo to the cursor
    customCursor.appendChild(cursorLogoImg);
    
    // ADDED: Check screen size before showing cursor
    function isMobileDevice() {
        return window.innerWidth < 768; // Common breakpoint for mobile devices
    }
    
    // Move the custom cursor with the mouse
    document.addEventListener('mousemove', (e) => {
        // Only update cursor position if not on mobile
        if (!isMobileDevice()) {
            customCursor.style.left = e.clientX + 'px';
            customCursor.style.top = e.clientY + 'px';
        }
    });
    
    // Show cursor only when hovering over the body, not on interactive elements AND not on mobile
    document.addEventListener('mouseover', (e) => {
        // Check if we're hovering directly on the body or an empty area
        // and not on any interactive elements
        const isInteractiveElement = e.target.closest('a, button, .grid-item-inner, .social-link, .play-button, .nav-toggle, .close-nav, .main-nav, input, textarea, select, .modal');
        
        if (!isInteractiveElement && e.target.tagName !== 'HTML' && !isMobileDevice()) {
            customCursor.classList.add('active');
            document.body.classList.add('custom-cursor-active');
        } else {
            customCursor.classList.remove('active');
            document.body.classList.remove('custom-cursor-active');
        }
    });
    
    // Make sure to hide cursor when leaving the window
    document.addEventListener('mouseleave', () => {
        customCursor.classList.remove('active');
        document.body.classList.remove('custom-cursor-active');
    });
    
    // Check window resize to hide/show cursor based on device
    window.addEventListener('resize', () => {
        if (isMobileDevice()) {
            customCursor.classList.remove('active');
            document.body.classList.remove('custom-cursor-active');
        }
    });
    
    // Run initial screen size check
    if (isMobileDevice()) {
        customCursor.style.display = 'none'; // Completely hide on mobile
    }
    
    // Run initial scroll check in case page loads already scrolled
    handleScroll();
});

// About modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const aboutModal = document.getElementById('aboutModal');
    const aboutLinks = document.querySelectorAll('.about-link, a[href="/about"]');
    const closeButtons = document.querySelectorAll('.btn-close, [data-bs-dismiss="modal"], .modal .btn-secondary');
    
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
        if (typeof isMobileView === 'function' && isMobileView()) {
            if (typeof closeNavMenu === 'function') {
                closeNavMenu();
            }
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
            e.stopPropagation();
            
            // Handle differently based on mobile vs desktop
            if (typeof isMobileView === 'function' && isMobileView()) {
                // On mobile, close the mobile nav when opening About modal
                if (typeof closeNavMenu === 'function') {
                    closeNavMenu();
                }
            }
            
            // Always open the modal
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