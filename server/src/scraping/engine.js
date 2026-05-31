const { chromium } = require('playwright');
const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');
const { Movie, Series, Episode, Genre, Actor } = require('../models');

const SCRAPE_QUEUE = [];
let isScraping = false;
let browser;

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  });
  return browser;
}

function randomDelay(min = 1000, max = 3000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createStealthPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
    geolocation: { latitude: 24.7136, longitude: 46.6753 },
    permissions: ['geolocation'],
  });

  const page = await context.newPage();
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ar,en;q=0.9',
  });

  return { context, page };
}

async function scrapeMoviePage(url) {
  const browser = await getBrowser();
  const { context, page } = await createStealthPage(browser);

  try {
    logger.info(`Scraping: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(randomDelay());

    const movieData = await page.evaluate(() => {
      const getText = (selector) => document.querySelector(selector)?.textContent?.trim() || '';
      const getAttr = (selector, attr) => document.querySelector(selector)?.getAttribute(attr) || '';

      return {
        title: getText('h1') || getText('[class*="title"]'),
        titleAr: getText('[class*="arabic"]') || getText('h1'),
        description: getText('[class*="description"]') || getText('[class*="story"]') || getText('p'),
        poster: getAttr('[class*="poster"] img, [class*="cover"] img', 'src') || getAttr('img[class*="poster"]', 'src'),
        rating: parseFloat(getText('[class*="rating"]')) || 0,
        year: parseInt(getText('[class*="year"]')) || new Date().getFullYear(),
        duration: getText('[class*="duration"]'),
        quality: getText('[class*="quality"]'),
        genreTexts: Array.from(document.querySelectorAll('[class*="genre"] a, [class*="genres"] a, [class*="category"] a'))
          .map(el => el.textContent.trim()),
        embedLinks: Array.from(document.querySelectorAll('iframe[src*="embed"], iframe[src*="stream"]'))
          .map(el => el.src),
        thumbnail: getAttr('[class*="thumbnail"] img, [class*="thumb"] img', 'src'),
        trailer: getAttr('[class*="trailer"] iframe, [class*="trailer"] video', 'src'),
        actors: Array.from(document.querySelectorAll('[class*="actors"] a, [class*="cast"] a, [class*="stars"] a'))
          .map(el => ({
            name: el.textContent.trim(),
            image: el.querySelector('img')?.getAttribute('src') || '',
          })),
      };
    });

    movieData.sourceUrl = url;
    return movieData;
  } catch (error) {
    logger.error(`Scraping failed for ${url}: ${error.message}`);
    throw error;
  } finally {
    await context.close();
  }
}

async function scrapeSeriesPage(url) {
  const browser = await getBrowser();
  const { context, page } = await createStealthPage(browser);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(randomDelay());

    const seriesData = await page.evaluate(() => {
      const getText = (selector) => document.querySelector(selector)?.textContent?.trim() || '';
      const getAttr = (selector, attr) => document.querySelector(selector)?.getAttribute(attr) || '';

      const seasonEpisodes = [];
      document.querySelectorAll('[class*="season"]').forEach(seasonEl => {
        const seasonNum = parseInt(seasonEl.querySelector('[class*="season-title"], h2')?.textContent?.match(/\d+/)?.[0]) || 1;
        const episodes = Array.from(seasonEl.querySelectorAll('[class*="episode"] a, a[class*="episode"]')).map((ep, i) => ({
          title: ep.textContent.trim(),
          href: ep.href,
          season: seasonNum,
          episode: i + 1,
        }));
        seasonEpisodes.push(...episodes);
      });

      return {
        title: getText('h1'),
        titleAr: getText('[class*="arabic"]') || getText('h1'),
        description: getText('[class*="description"]') || getText('[class*="story"]'),
        poster: getAttr('[class*="poster"] img, [class*="cover"] img', 'src'),
        rating: parseFloat(getText('[class*="rating"]')) || 0,
        year: parseInt(getText('[class*="year"]')) || new Date().getFullYear(),
        seasons: seasonEpisodes.length > 0 ? Math.max(...seasonEpisodes.map(e => e.season)) : 1,
        episodes: seasonEpisodes,
        genreTexts: Array.from(document.querySelectorAll('[class*="genre"] a, [class*="genres"] a'))
          .map(el => el.textContent.trim()),
        actors: Array.from(document.querySelectorAll('[class*="actors"] a, [class*="cast"] a'))
          .map(el => ({
            name: el.textContent.trim(),
            image: el.querySelector('img')?.getAttribute('src') || '',
          })),
      };
    });

    seriesData.sourceUrl = url;
    return seriesData;
  } catch (error) {
    logger.error(`Series scraping failed for ${url}: ${error.message}`);
    throw error;
  } finally {
    await context.close();
  }
}

async function scrapeSearchResults(query) {
  const browser = await getBrowser();
  const { context, page } = await createStealthPage(browser);

  try {
    const searchUrl = `${config.scrapingSource}/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[class*="result"] a, [class*="item"] a, [class*="card"] a'))
        .slice(0, 20)
        .map(el => ({
          title: el.textContent.trim(),
          url: el.href,
          image: el.querySelector('img')?.getAttribute('src') || '',
        }));
    });

    return results;
  } finally {
    await context.close();
  }
}

async function getGenreOrCreate(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let genre = await Genre.findOne({ slug });
  if (!genre) {
    genre = await Genre.create({ name, nameAr: name, slug });
  }
  return genre._id;
}

async function getActorOrCreate(name, image = '') {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let actor = await Actor.findOne({ slug });
  if (!actor) {
    actor = await Actor.create({ name, nameAr: name, slug, image });
  }
  return actor._id;
}

async function processScrapedMovie(movieData) {
  try {
    const genreIds = await Promise.all(
      (movieData.genreTexts || []).map(g => getGenreOrCreate(g))
    );
    const actorIds = await Promise.all(
      (movieData.actors || []).map(a => getActorOrCreate(a.name, a.image))
    );

    const slug = movieData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const existing = await Movie.findOne({ title: movieData.title });
    if (existing) {
      Object.assign(existing, {
        ...movieData,
        genres: genreIds,
        actors: actorIds,
      });
      await existing.save();
      logger.info(`Updated movie: ${movieData.title}`);
      return existing;
    }

    const movie = await Movie.create({
      ...movieData,
      slug,
      genres: genreIds,
      actors: actorIds,
      status: 'active',
    });
    logger.info(`Created movie: ${movieData.title}`);
    return movie;
  } catch (error) {
    logger.error(`Error processing movie: ${error.message}`);
  }
}

async function processScrapedSeries(seriesData) {
  try {
    const genreIds = await Promise.all(
      (seriesData.genreTexts || []).map(g => getGenreOrCreate(g))
    );
    const actorIds = await Promise.all(
      (seriesData.actors || []).map(a => getActorOrCreate(a.name, a.image))
    );

    const slug = seriesData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const existing = await Series.findOne({ title: seriesData.title });
    let series;
    if (existing) {
      Object.assign(existing, { ...seriesData, genres: genreIds, actors: actorIds });
      series = await existing.save();
    } else {
      series = await Series.create({ ...seriesData, slug, genres: genreIds, actors: actorIds });
    }

    for (const epData of seriesData.episodes || []) {
      await Episode.findOneAndUpdate(
        { series: series._id, season: epData.season, episode: epData.episode },
        {
          series: series._id,
          title: epData.title,
          season: epData.season,
          episode: epData.episode,
          sourceUrl: epData.href,
        },
        { upsert: true, new: true },
      );
    }

    const episodeCount = await Episode.countDocuments({ series: series._id });
    series.episodes = episodeCount;
    await series.save();

    logger.info(`Processed series: ${seriesData.title} (${seriesData.episodes?.length || 0} episodes)`);
    return series;
  } catch (error) {
    logger.error(`Error processing series: ${error.message}`);
  }
}

async function runScrapingCycle(urls) {
  if (isScraping) {
    logger.info('Scraping already in progress, queuing...');
    SCRAPE_QUEUE.push(...urls);
    return;
  }

  isScraping = true;
  logger.info(`Starting scraping cycle: ${urls.length} URLs`);

  try {
    for (const url of urls) {
      try {
        if (url.includes('series') || url.includes('مسلسل')) {
          const data = await scrapeSeriesPage(url);
          await processScrapedSeries(data);
        } else {
          const data = await scrapeMoviePage(url);
          await processScrapedMovie(data);
        }
      } catch (error) {
        logger.error(`Failed to scrape ${url}: ${error.message}`);
        continue;
      }
    }
  } finally {
    isScraping = false;
    if (SCRAPE_QUEUE.length > 0) {
      const nextUrls = SCRAPE_QUEUE.splice(0, 10);
      runScrapingCycle(nextUrls);
    }
  }
}

async function scrapeHomePage() {
  if (!config.scrapingSource) {
    logger.warn('No scraping source configured');
    return [];
  }

  const browser = await getBrowser();
  const { context, page } = await createStealthPage(browser);

  try {
    await page.goto(config.scrapingSource, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/movie"], a[href*="/series"], a[href*="/film"], a[href*="/مسلسل"], a[href*="/فيلم"]'))
        .map(el => ({
          url: el.href,
          title: el.textContent.trim(),
        }))
        .filter(item => item.url && !item.url.includes('#') && item.title.length > 0);
    });

    const uniqueUrls = [...new Map(links.map(item => [item.url, item])).values()].slice(0, 30);
    return uniqueUrls;
  } finally {
    await context.close();
  }
}

async function startScrapingScheduler() {
  logger.info(`Starting scraping scheduler (every ${config.scrapingInterval} minutes)`);

  const run = async () => {
    try {
      const items = await scrapeHomePage();
      if (items.length > 0) {
        const urls = items.map(i => i.url);
        await runScrapingCycle(urls);
      }
    } catch (error) {
      logger.error(`Scheduled scraping failed: ${error.message}`);
    }
  };

  await run();
  setInterval(run, config.scrapingInterval * 60 * 1000);
}

async function scrapeUrl(url) {
  if (url.includes('series') || url.includes('مسلسل')) {
    const data = await scrapeSeriesPage(url);
    return await processScrapedSeries(data);
  }
  const data = await scrapeMoviePage(url);
  return await processScrapedMovie(data);
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

module.exports = {
  scrapeMoviePage,
  scrapeSeriesPage,
  scrapeSearchResults,
  runScrapingCycle,
  startScrapingScheduler,
  scrapeHomePage,
  scrapeUrl,
  closeBrowser,
  getBrowser,
};
