// Array of image paths from the database
const images = [];

// Populate images array from the data attributes
document.querySelectorAll('.thumbnail').forEach(thumbnail => {
    const imgSrc = thumbnail.querySelector('img').src;
    images.push(imgSrc);
});

let currentIndex = 0;
let isAnimating = false;
const thumbnails = document.querySelectorAll('.thumbnail');
const slideContainer = document.getElementById('slide-container');
const mainPrev = document.getElementById('main-prev');
const mainNext = document.getElementById('main-next');

// Create slides for all images
function createSlides() {
    // Clear container first
    slideContainer.innerHTML = '';
    
    // Create slide for the first image (active)
    const firstSlide = document.createElement('div');
    firstSlide.className = 'slide active';
    firstSlide.setAttribute('data-index', '0');
    
    const firstImg = document.createElement('img');
    firstImg.src = images[0];
    firstImg.alt = 'Image 1';
    
    firstSlide.appendChild(firstImg);
    slideContainer.appendChild(firstSlide);
    
    // Adjust initial container height based on first image
    adjustContainerHeight(firstImg);

     // Make sure to highlight the first thumbnail immediately
     updateActiveThumbnail(0);
}

// Adjust container height based on image
function adjustContainerHeight(imageElement) {
    const img = new Image();
    img.src = imageElement.src;
    
    img.onload = function() {
        const container = document.querySelector('.main-image-container');
        
        // Set min-height to ensure visibility while loading
        container.style.minHeight = '300px';
        
        // Adjust slide container height if needed
        if (this.height > 300 && this.height < window.innerHeight * 0.7) {
            slideContainer.style.height = `${this.height}px`;
        } else if (this.height >= window.innerHeight * 0.7) {
            slideContainer.style.height = `${window.innerHeight * 0.7}px`;
        }
    };
}

// Function to handle slide transitions
function goToSlide(index, direction) {
    if (isAnimating) return;
    isAnimating = true;
    
    // Normalize index
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    
    // Get current active slide
    const currentSlide = document.querySelector('.slide.active');
    
    // Create new slide
    const newSlide = document.createElement('div');
    newSlide.className = direction === 'left' ? 'slide prev' : 'slide next';
    newSlide.setAttribute('data-index', index);
    
    const newImg = document.createElement('img');
    newImg.src = images[index];
    newImg.alt = `Image ${index + 1}`;
    
    newSlide.appendChild(newImg);
    slideContainer.appendChild(newSlide);
    
    // Force a reflow to ensure transition works
    void newSlide.offsetWidth;
    
    // Start transition
    if (direction === 'left') {
        currentSlide.className = 'slide next';
        newSlide.className = 'slide active';
    } else {
        currentSlide.className = 'slide prev';
        newSlide.className = 'slide active';
    }
    
    // Update active thumbnail with expansion effect
    updateActiveThumbnail(index);
    
    // After transition completes
    setTimeout(() => {
        // Remove old slide
        if (currentSlide.parentNode) {
            currentSlide.remove();
        }
        
        // Update current index
        currentIndex = index;
        isAnimating = false;
        
        // Adjust container height for new image
        adjustContainerHeight(newImg);
    }, 600); // Match transition duration
}

// Update the active thumbnail with expansion effect
function updateActiveThumbnail(index) {
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnails[index].classList.add('active');
    
    // Smooth scroll to active thumbnail if needed
    const thumbnailContainer = document.querySelector('.thumbnail-scroll');
    if (thumbnailContainer) {
        const activeThumb = thumbnails[index];
        const containerRect = thumbnailContainer.getBoundingClientRect();
        const activeRect = activeThumb.getBoundingClientRect();
        
        // If thumbnail is not fully visible, scroll to it
        if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
}

// Add click events to thumbnails
thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        if (index === currentIndex) return;
        
        const direction = index > currentIndex ? 'right' : 'left';
        goToSlide(index, direction);
    });
});

// Main image navigation arrows
if (mainPrev && mainNext) {
    mainPrev.addEventListener('click', function() {
        goToSlide(currentIndex - 1, 'left');
    });
    
    mainNext.addEventListener('click', function() {
        goToSlide(currentIndex + 1, 'right');
    });
}

// Auto slide every 3 seconds if there are multiple images
function startAutoSlide() {
    if (images.length > 1) {
        return setInterval(() => {
            if (!isAnimating) {
                goToSlide(currentIndex + 1, 'right');
            }
        }, 3000);
    }
    return null;
}

// Initialize slides
window.addEventListener('load', function() {
    console.log("Window loaded, images array:", images);
    if (images.length > 0) {
        // Make sure all thumbnails are initially reset (not active)
        thumbnails.forEach(thumb => {
            thumb.classList.remove('active');
        });
        
        createSlides();
        
        // Double-check that the first thumbnail is active
        setTimeout(() => {
            updateActiveThumbnail(0);
        }, 100);
        
        // Start auto sliding
        let slideInterval = startAutoSlide();
        
        // Stop auto-sliding when user interacts with gallery
        document.querySelector('.gallery-container').addEventListener('click', function() {
            if (slideInterval) {
                clearInterval(slideInterval);
                slideInterval = null;
            }
        });
    } else {
        console.error("No images found in the images array");
    }
});