const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const logger = require('./utils/logger');
const { Genre, User } = require('./models');

const genres = [
  { name: 'Action', nameAr: 'أكشن', slug: 'action' },
  { name: 'Comedy', nameAr: 'كوميدي', slug: 'comedy' },
  { name: 'Drama', nameAr: 'دراما', slug: 'drama' },
  { name: 'Horror', nameAr: 'رعب', slug: 'horror' },
  { name: 'Romance', nameAr: 'رومانسي', slug: 'romance' },
  { name: 'Sci-Fi', nameAr: 'خيال علمي', slug: 'sci-fi' },
  { name: 'Thriller', nameAr: 'إثارة', slug: 'thriller' },
  { name: 'Adventure', nameAr: 'مغامرة', slug: 'adventure' },
  { name: 'Animation', nameAr: 'أنيميشن', slug: 'animation' },
  { name: 'Crime', nameAr: 'جريمة', slug: 'crime' },
  { name: 'Documentary', nameAr: 'وثائقي', slug: 'documentary' },
  { name: 'Family', nameAr: 'عائلي', slug: 'family' },
  { name: 'Fantasy', nameAr: 'فانتازيا', slug: 'fantasy' },
  { name: 'History', nameAr: 'تاريخي', slug: 'history' },
  { name: 'Music', nameAr: 'موسيقي', slug: 'music' },
  { name: 'Mystery', nameAr: 'غموض', slug: 'mystery' },
  { name: 'War', nameAr: 'حرب', slug: 'war' },
  { name: 'Western', nameAr: 'ويسترن', slug: 'western' },
];

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB');

    const genreCount = await Genre.countDocuments();
    if (genreCount === 0) {
      await Genre.insertMany(genres);
      logger.info(`${genres.length} genres created`);
    } else {
      logger.info(`Genres already exist (${genreCount})`);
    }

    const adminExists = await User.findOne({ email: config.adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: config.adminEmail,
        password: config.adminPassword,
        role: 'admin',
      });
      logger.info(`Admin user created: ${config.adminEmail}`);
    } else {
      logger.info('Admin user already exists');
    }

    logger.info('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
