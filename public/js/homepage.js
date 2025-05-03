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

// Animation section
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const videoGrid = document.querySelector('.video-grid');
    const gridItems = document.querySelectorAll('.grid-item');
    const categoryLinks = document.querySelectorAll('[data-category]');
    let currentCategory = 'all';
    
    // Initial setup variables
    let msnry;
    const transitionDuration = 600; // Transition duration in ms
    
    // Configure all videos
    setupVideos();
    
    // Add position tracking index to each item for better position tracking
    gridItems.forEach((item, index) => {
        item.setAttribute('data-index', index);
    });
    
    // Initialize masonry with visible tracking
    initMasonry();
    
    // Add event listeners for category selection
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get selected category
            const category = this.getAttribute('data-category');
            if (category === currentCategory) return;
            
            // Update active status on links
            categoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Update current category
            currentCategory = category;
            
            // Filter with visible sliding animation
            filterWithSlideAnimation(category);
            
            // Scroll to grid section with offset for header
            const videoGridSection = document.querySelector('.video-grid-section');
            if (videoGridSection) {
                const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                const sectionPosition = videoGridSection.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = sectionPosition - headerHeight - 20;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Setup hover effects for grid items
    setupHoverEffects();
    
    /**
     * Initialize Masonry layout
     */
    function initMasonry() {
        if (typeof Masonry !== 'undefined' && typeof imagesLoaded !== 'undefined') {
            imagesLoaded(videoGrid, function() {
                // Create new masonry instance
                msnry = new Masonry(videoGrid, {
                    itemSelector: '.grid-item:not(.hidden-item)',
                    columnWidth: '.grid-item:not(.hidden-item)',
                    percentPosition: true,
                    gutter: 20,
                    transitionDuration: 0, // No transition initially
                    stagger: 0
                });
            });
        }
    }
    
    /**
     * Filter items with sliding animation ensuring ALL items slide
     * rather than fade/disappear
     */
    function filterWithSlideAnimation(category) {
        // Prevent interaction during animation
        videoGrid.classList.add('filtering');
        
        // STEP 1: Capture current positions of ALL items (visible and hidden)
        const currentPositions = {};
        gridItems.forEach(item => {
            // Get current display state
            const wasHidden = item.classList.contains('hidden-item');
            
            // Temporarily make all items visible to get their real positions
            if (wasHidden) {
                item.classList.remove('hidden-item');
                item.style.display = '';
                item.style.opacity = '0'; // Keep invisible but measurable
            }
            
            // Get current position
            const rect = item.getBoundingClientRect();
            const key = item.getAttribute('data-index');
            currentPositions[key] = {
                left: rect.left,
                top: rect.top,
                wasHidden: wasHidden
            };
            
            // Restore hidden state if needed
            if (wasHidden) {
                item.classList.add('hidden-item');
                item.style.display = 'none';
            }
        });
        
        // STEP 2: Determine which items should be visible in new category
        gridItems.forEach(item => {
            if (category === 'all' || item.getAttribute('data-category') === category) {
                // This item will be visible
                item.classList.remove('hidden-item');
                item.style.display = '';
                item.style.opacity = '1';
            } else {
                // This item will be hidden after animation
                item.classList.add('will-hide');
                // But keep it visible during calculation
                item.classList.remove('hidden-item');
                item.style.display = '';
                item.style.opacity = '1';
            }
        });
        
        // Disable transitions for initial positioning
        videoGrid.classList.add('no-transition');
        
        // Force reflow
        void videoGrid.offsetWidth;
        
        // STEP 3: Recalculate layout with Masonry
        if (msnry) {
            msnry.options.transitionDuration = 0;
            msnry.layout();
        }
        
        // Force reflow
        void videoGrid.offsetWidth;
        
        // STEP 4: Capture new positions
        const newPositions = {};
        gridItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            const key = item.getAttribute('data-index');
            newPositions[key] = {
                left: rect.left,
                top: rect.top
            };
        });
        
        // STEP 5: Apply FLIP animation technique
        gridItems.forEach(item => {
            const key = item.getAttribute('data-index');
            const currentPos = currentPositions[key];
            const newPos = newPositions[key];
            
            // Apply transform to create illusion items are still in old position
            if (currentPos && newPos) {
                const deltaX = currentPos.left - newPos.left;
                const deltaY = currentPos.top - newPos.top;
                
                // If item was previously hidden, position it at its final position
                // but make it invisible (will fade in during animation)
                if (currentPos.wasHidden) {
                    item.style.transform = 'translate(0, 0)';
                    item.style.opacity = '0';
                } else {
                    // Apply transform to offset new position
                    item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    item.style.opacity = '1';
                }
                
                // Items that are moving get higher z-index
                item.style.zIndex = '2';
            }
        });
        
        // Force reflow
        void videoGrid.offsetWidth;
        
        // STEP 6: Start animation
        videoGrid.classList.remove('no-transition');
        
        // Animate to final positions
        gridItems.forEach(item => {
            const key = item.getAttribute('data-index');
            const currentPos = currentPositions[key];
            
            // Animate all items to their final position with transform
            item.style.transform = 'translate(0, 0)';
            
            // If item was previously hidden, fade it in
            if (currentPos.wasHidden && !item.classList.contains('will-hide')) {
                item.style.opacity = '1';
            }
            
            // If item will be hidden, fade it out
            if (item.classList.contains('will-hide')) {
                item.style.opacity = '0';
            }
        });
        
        // STEP 7: Clean up after animation
        setTimeout(() => {
            if (msnry) {
                msnry.options.transitionDuration = '0.4s';
            }
            
            // Hide items that should be hidden
            gridItems.forEach(item => {
                if (item.classList.contains('will-hide')) {
                    item.classList.add('hidden-item');
                    item.style.display = 'none';
                    item.classList.remove('will-hide');
                }
                
                // Reset styles
                item.style.transform = '';
                item.style.zIndex = '';
            });
            
            // Update layout one final time
            if (msnry) {
                msnry.layout();
            }
            
            // Re-enable interaction
            videoGrid.classList.remove('filtering');
        }, transitionDuration);
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
    
    /**
     * Setup hover effects for grid items
     */
    function setupHoverEffects() {
        gridItems.forEach(item => {
            const gridInner = item.querySelector('.grid-item-inner');
            const overlay = item.querySelector('.grid-item-overlay');
            const media = item.querySelector('img, video');
            
            if (gridInner && overlay) {
                overlay.classList.add('bottom-title');
                
                gridInner.addEventListener('mouseenter', function() {
                    overlay.style.transform = 'translateY(0)';
                    if (media) {
                        media.style.transform = 'scale(1.03)';
                    }
                });
                
                gridInner.addEventListener('mouseleave', function() {
                    overlay.style.transform = 'translateY(100%)';
                    if (media) {
                        media.style.transform = 'scale(1)';
                    }
                });
            }
        });
    }
    
    // Enhanced Modal functionality
    const videoModal = document.querySelector('.video-modal');
    const modalContent = videoModal?.querySelector('.modal-content');
    const modalVideo = document.querySelector('.modal-video');
    const closeModal = document.querySelector('.close-modal');
    
    // Add click event to all video grid items
    document.querySelectorAll('.grid-item-inner[data-video-src]').forEach(item => {
        item.addEventListener('click', function() {
            const videoSrc = this.getAttribute('data-video-src');
            
            if (videoSrc && modalVideo) {
                // Set the video source
                const videoSource = modalVideo.querySelector('source') || document.createElement('source');
                videoSource.setAttribute('src', videoSrc);
                videoSource.setAttribute('type', 'video/mp4');
                
                if (!modalVideo.querySelector('source')) {
                    modalVideo.appendChild(videoSource);
                }
                
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
                
                // Play the video after modal animation
                setTimeout(() => {
                    modalVideo.play().catch(e => {
                        console.log('Modal video play error:', e);
                    });
                }, 300);
            }
        });
    });
    
    // Close modal functions
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
        }, 500);
    }
    
    // Add required CSS
    addRequiredCSS();
    
    function addRequiredCSS() {
        if (!document.querySelector('#smooth-slide-styles')) {
            const style = document.createElement('style');
            style.id = 'smooth-slide-styles';
            style.textContent = `
                /* Smooth sliding styles */
                .grid-item {
                    transform: translate(0, 0);
                    transition: transform ${transitionDuration/1000}s cubic-bezier(0.25, 0.1, 0.25, 1), 
                                opacity ${transitionDuration/1000}s cubic-bezier(0.25, 0.1, 0.25, 1);
                    will-change: transform, opacity;
                }
                
                .video-grid.no-transition * {
                    transition: none !important;
                }
                
                .video-grid.filtering {
                    pointer-events: none;
                }
                
                /* Modal transitions */
                .video-modal {
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
                
                .video-modal .modal-content {
                    transform: translateY(20px);
                    transition: transform 0.5s ease;
                }
                
                .video-modal.active .modal-content {
                    transform: translateY(0);
                }
                
                /* FLIP Animation Support */
                .grid-item.moving {
                    z-index: 2;
                }
                
                /* Additional helper class */
                .will-hide {
                    /* Used for items that will be hidden after animation */
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

// cursor change 
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
        if (isMobileView()) {
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
            e.stopPropagation();
            
            // Handle differently based on mobile vs desktop
            if (isMobileView()) {
                // On mobile, close the mobile nav when opening About modal
                closeNavMenu();
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