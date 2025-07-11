// controllers/pageController.js
const Media = require('../models/mediaModel');
const Category = require('../models/categoryModel');

// Homepage/landing page controller
exports.getHomepage = async (req, res) => {
  try {
    
    // Get all media items for display on homepage
    let allMedia = [];
    let categories = [];
    let featuredVideo = null;
    
    try {
      // Load all necessary data
      [allMedia, categories, featuredVideo] = await Promise.all([
        Media.getAll(),
        Category.getAll(),
        Media.getFeaturedVideo() // Method to get a featured video
      ]);
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue with empty arrays
    }
    
    // Filter out the intro video from allMedia if it exists
    // This ensures the intro video doesn't appear in the masonry grid
    if (featuredVideo) {
      allMedia = allMedia.filter(item => item.id !== featuredVideo.id);
    }
       
    // Separate images and videos
    const images = allMedia.filter(item => item.type === 'image');
    const videos = allMedia.filter(item => item.type === 'video');
    
    res.render('homepage', { 
      title: companyInfo.name,
      logoPath: companyInfo.logoPath,
      categories,
      // Use the featured video if available, otherwise fall back to a default
      introVideo: featuredVideo ? featuredVideo.file_path : '/uploads/videos/intro-video.mp4',
      introHeading: companyInfo.introHeading,
      introDescription: companyInfo.description,
      images,
      videos,
      allMedia, // This now excludes the intro video
      companyName: companyInfo.name,
      aboutText: aboutContent,
      footerAbout: footerContent.about,
      socialLinks: footerContent.socialLinks,
      quickLinks: footerContent.quickLinks,
      services: footerContent.services,
      contactInfo: footerContent.contactInfo,
      currentYear: new Date().getFullYear()
    });
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.status(500).render('error', { message: 'Failed to load homepage' });
  }
};

// About page controller
exports.getAboutPage = (req, res) => {
  
  // If it's an AJAX request, return just the modal status
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.json({ 
      success: true
    });
  }
  
  // Otherwise, render the full about page (as fallback)
  res.render('about', {
    title: 'About - Alice Engdahl',
    logoPath: 'https://res.cloudinary.com/dawxl838a/image/upload/v1746869871/WhatsApp_Image_2025-03-30_at_19.48.32_d7dd8868_pudffo.jpg'
  });
};

// Contact page controller
exports.getContactPage = (req, res) => {
  res.render('contact', {
    title: 'Contact Us - Engdahls & Co Creative Studios',
    logoPath: 'https://res.cloudinary.com/dawxl838a/image/upload/v1746869871/WhatsApp_Image_2025-03-30_at_19.48.32_d7dd8868_pudffo.jpg'
  });
};

// Dashboard page controller
exports.getDashboard = async (req, res) => {
  try {
    const media = await Media.getAll();
    res.render('dashboard', { 
      title: 'Admin Dashboard',
      media 
    });
  } catch (error) {
    console.error('Error fetching media for dashboard:', error);
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
};

// Upload page controller
exports.getUploadPage = (req, res) => {
  try {
    // Get categories for the dropdown in the upload form
    Category.getAll()
      .then(categories => {
        res.render('upload', { 
          title: 'Upload Media - Admin Dashboard',
          categories 
        });
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        res.render('upload', { 
          title: 'Upload Media - Admin Dashboard',
          categories: [] 
        });
      });
  } catch (error) {
    console.error('Error loading upload page:', error);
    res.status(500).render('error', { message: 'Failed to load upload page' });
  }
};

// Edit page controller
exports.getEditPage = (req, res) => {
  try {
    const mediaId = req.params.id;
    
    // Get media item and categories
    Promise.all([
      Media.getById(mediaId),
      Category.getAll()
    ])
      .then(([media, categories]) => {
        if (!media) {
          return res.status(404).render('error', { message: 'Media not found' });
        }
        
        res.render('edit', { 
          title: 'Edit Media - Admin Dashboard',
          media,
          categories 
        });
      })
      .catch(error => {
        console.error('Error fetching data for edit page:', error);
        res.status(500).render('error', { message: 'Failed to load edit page' });
      });
  } catch (error) {
    console.error('Error loading edit page:', error);
    res.status(500).render('error', { message: 'Failed to load edit page' });
  }
};


// Gallery page controller
exports.getGalleryPage = async (req, res) => {
  try {
    const mediaId = req.params.id;
    
    // Get the media item with all its files
    const media = await Media.getById(mediaId);
    
    if (!media) {
      return res.status(404).render('error', { message: 'Media not found' });
    }
    
    // Make sure this is an image media type
    if (media.type !== 'image') {
      return res.status(400).render('error', { message: 'Gallery view is only available for images' });
    }
    
    // Check if the media has any files
    if (!media.files || media.files.length === 0) {
      return res.status(404).render('error', { message: 'No images found for this media' });
    }
    
    // Get the company logo for the header
    const logoPath = '/uploads/images/WhatsApp Image 2025-03-30 at 19.48.20_926fb74f.jpg';
    
    // Render the gallery template with the media data
    res.render('image-gallery', { 
      title: `${media.title} - Engdahls & Co Creative Studios`,
      media,
      logoPath
    });
  } catch (error) {
    console.error('Error loading gallery page:', error);
    res.status(500).render('error', { message: 'Failed to load gallery page' });
  }
};
