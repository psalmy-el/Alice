// controllers/pageController.js
const Media = require('../models/mediaModel');
const Category = require('../models/categoryModel');

// Homepage/landing page controller
exports.getHomepage = async (req, res) => {
  try {
    console.log('Homepage route accessed');
    
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
      
      console.log('Database fetch successful');
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
    
    // Get company information (you might want to store this in a database later)
    const companyInfo = {
      name: 'Engdahls & Co Creative Studios',
      description: 'Engdahls & Co Creative Studios is an innovative and versatile production company offering high-quality commercial films, beautiful pictures and video productions. We create engaging and visually striking stories that help our clients reach their target audiences through creative and tailored solutions.',
      logoPath: '/uploads/images/WhatsApp Image 2025-03-30 at 19.48.20_926fb74f.jpg',
      introHeading: 'Movie Productions'
    };

    // Footer content
    const footerContent = {
      socialLinks: [
        { name: 'Instagram', url: '#', icon: 'fab fa-instagram' }
      ],
      quickLinks: [
        { name: 'Home', url: '/' },
        { name: 'About', url: '/about' }
      ],
      services: [
        { name: 'Commercial Production', url: '#video-grid-section' },
        { name: 'Brand Films', url: '#video-grid-section' },
        { name: 'Documentary', url: '#video-grid-section' },
        { name: 'Corporate Videos', url: '#video-grid-section' },
        { name: 'Motion Graphics', url: '#video-grid-section' },
        { name: 'Social Media Content', url: '#video-grid-section' },
        { name: 'Music Videos', url: '#video-grid-section' }
      ],
      contactInfo: [
        { icon: '✉️', text: 'alice@rio.pictures' }
      ]
    };

    // About modal content
    const aboutContent = [
      'Alice Engdahls',
      'Producer at Rio Pictures',
      'send me an email',
      'Our passionate team of directors, cinematographers, and editors work collaboratively to bring your vision to life with stunning visuals and compelling narratives.'
    ];

    console.log('Rendering homepage template');
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
  console.log('About page route accessed');
  
  // If it's an AJAX request, return just the modal status
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.json({ 
      success: true
    });
  }
  
  // Otherwise, render the full about page (as fallback)
  res.render('about', {
    title: 'About - Alice Engdahl',
    logoPath: '/uploads/images/WhatsApp Image 2025-03-30 at 19.48.20_926fb74f.jpg'
  });
};

// Contact page controller
exports.getContactPage = (req, res) => {
  console.log('Contact page route accessed');
  res.render('contact', {
    title: 'Contact Us - Engdahls & Co Creative Studios',
    logoPath: '/uploads/images/WhatsApp Image 2025-03-30 at 19.48.20_926fb74f.jpg'
  });
};

// Dashboard page controller
exports.getDashboard = async (req, res) => {
  console.log('Dashboard route accessed');
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
  console.log('Upload page route accessed');
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
  console.log('Edit page route accessed');
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
  console.log('Gallery page route accessed');
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
