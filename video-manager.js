const { pool } = require('./config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function listVideos() {
  try {
    const [videos] = await pool.query(`
      SELECT v.id, v.title, v.description, v.file_path, c.name as category
      FROM videos v
      LEFT JOIN categories c ON v.category_id = c.id
    `);
    
    console.log('\n=== Videos in Database ===');
    if (videos.length === 0) {
      console.log('No videos found');
    } else {
      videos.forEach(video => {
        console.log(`ID: ${video.id} | Title: ${video.title} | Category: ${video.category}`);
      });
    }
  } catch (error) {
    console.error('Error listing videos:', error);
  }
}

async function addVideo() {
  try {
    // Get categories for selection
    const [categories] = await pool.query('SELECT id, name FROM categories');
    
    console.log('\n=== Available Categories ===');
    categories.forEach(cat => {
      console.log(`${cat.id}: ${cat.name}`);
    });
    
    rl.question('\nEnter video title: ', (title) => {
      rl.question('Enter video description: ', (description) => {
        rl.question('Enter file path (e.g., /uploads/video1.mp4): ', (filePath) => {
          rl.question('Enter poster image path (optional): ', (posterImage) => {
            rl.question('Enter category ID: ', async (categoryId) => {
              try {
                await pool.query(`
                  INSERT INTO videos (title, description, file_path, poster_image, category_id)
                  VALUES (?, ?, ?, ?, ?)
                `, [title, description, filePath, posterImage || null, categoryId]);
                
                console.log('Video added successfully!');
                showMenu();
              } catch (error) {
                console.error('Error adding video:', error);
                showMenu();
              }
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in addVideo:', error);
    showMenu();
  }
}

async function deleteVideo() {
  try {
    await listVideos();
    
    rl.question('\nEnter the ID of the video to delete: ', async (id) => {
      try {
        const [result] = await pool.query('DELETE FROM videos WHERE id = ?', [id]);
        
        if (result.affectedRows > 0) {
          console.log(`Video with ID ${id} deleted successfully!`);
        } else {
          console.log(`No video found with ID ${id}`);
        }
        showMenu();
      } catch (error) {
        console.error('Error deleting video:', error);
        showMenu();
      }
    });
  } catch (error) {
    console.error('Error in deleteVideo:', error);
    showMenu();
  }
}

function showMenu() {
  console.log('\n=== Video Database Manager ===');
  console.log('1. List all videos');
  console.log('2. Add a new video');
  console.log('3. Delete a video');
  console.log('4. Exit');
  
  rl.question('\nSelect an option (1-4): ', (option) => {
    switch (option) {
      case '1':
        listVideos().then(() => showMenu());
        break;
      case '2':
        addVideo();
        break;
      case '3':
        deleteVideo();
        break;
      case '4':
        console.log('Exiting...');
        rl.close();
        pool.end();
        break;
      default:
        console.log('Invalid option. Please try again.');
        showMenu();
    }
  });
}

// Start the application
showMenu();