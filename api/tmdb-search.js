/**
 * TMDb电影搜索模块
 * 根据电影名称自动匹配正确的海报
 */

const https = require('https');

// TMDb配置
const TMDB_CONFIG = {
  apiKey: 'YOUR_TMDB_API_KEY', // 需要替换为你的API Key
  baseUrl: 'api.themoviedb.org',
  imageBaseUrl: 'https://image.tmdb.org/t/p/w500'
};

/**
 * 搜索TMDb电影并返回海报URL
 */
async function searchMoviePoster(movieTitle, year = null) {
  return new Promise((resolve, reject) => {
    // 构建搜索URL
    const searchPath = `/3/search/movie?api_key=${TMDB_CONFIG.apiKey}&language=zh-CN&query=${encodeURIComponent(movieTitle)}${year ? `&year=${year}` : ''}`;
    
    console.log(`🔍 搜索TMDb: ${movieTitle}${year ? ` (${year})` : ''}`);
    
    const options = {
      hostname: TMDB_CONFIG.baseUrl,
      path: searchPath,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (json.results && json.results.length > 0) {
            // 获取第一个结果的海报
            const movie = json.results[0];
            if (movie.poster_path) {
              const posterUrl = `${TMDB_CONFIG.imageBaseUrl}${movie.poster_path}`;
              console.log(`✅ 找到海报: ${movieTitle} → ${posterUrl}`);
              resolve(posterUrl);
            } else {
              console.log(`⚠️ 未找到海报: ${movieTitle}`);
              resolve(null);
            }
          } else {
            console.log(`⚠️ TMDb无搜索结果: ${movieTitle}`);
            resolve(null);
          }
        } catch (err) {
          console.error(`❌ 解析TMDb结果失败: ${err.message}`);
          resolve(null); // 失败时返回null，不影响主流程
        }
      });
    }).on('error', (err) => {
      console.error(`❌ TMDb请求失败: ${err.message}`);
      resolve(null);
    });
  });
}

/**
 * 批量搜索多部电影的海报
 */
async function batchSearchPosters(movies) {
  const promises = movies.map(movie => {
    return searchMoviePoster(movie.title, movie.year);
  });
  
  return Promise.all(promises);
}

/**
 * 为电影添加TMDb海报URL
 */
async function enrichMoviesWithPosters(movies) {
  const results = [];
  
  for (const movie of movies) {
    try {
      const posterUrl = await searchMoviePoster(movie.title, movie.year);
      
      results.push({
        ...movie,
        images: {
          small: posterUrl || movie.images?.small || getDefaultPoster(),
          large: posterUrl || movie.images?.large || getDefaultPoster(),
          medium: posterUrl || movie.images?.medium || getDefaultPoster()
        }
      });
      
      // 避免请求过快被限制，延迟250ms
      await sleep(250);
      
    } catch (err) {
      console.error(`处理电影失败: ${movie.title}`, err);
      results.push(movie);
    }
  }
  
  return results;
}

/**
 * 获取默认海报（当TMDb搜索失败时）
 */
function getDefaultPoster() {
  const defaultPosters = [
    'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg',
    'https://image.tmdb.org/t/p/w500/deLWkOLZmBNkm8p16igfapQHqWp.jpg',
    'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
    'https://image.tmdb.org/t/p/w500/kJr0Z6hG6eODq4LYsw1DhwBsYWr.jpg'
  ];
  
  return defaultPosters[Math.floor(Math.random() * defaultPosters.length)];
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  searchMoviePoster,
  batchSearchPosters,
  enrichMoviesWithPosters,
  TMDB_CONFIG
};

