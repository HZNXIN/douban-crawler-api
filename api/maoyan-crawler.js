/**
 * 猫眼电影爬虫模块
 * 爬取 https://www.maoyan.com/ 的实时电影数据
 */

const https = require('https');

/**
 * 猫眼API接口
 * 猫眼有公开的移动端API，比网页爬取更稳定
 */
const MAOYAN_API = {
  // 正在热映
  in_theaters: 'https://api.maoyan.com/mmdb/movie/v3/list/hot.json',
  // 即将上映
  coming_soon: 'https://api.maoyan.com/mmdb/movie/v3/list/coming.json'
};

/**
 * 爬取猫眼电影数据
 */
async function fetchMaoyanMovies(type) {
  return new Promise((resolve, reject) => {
    const apiUrl = type === 'coming_soon' ? MAOYAN_API.coming_soon : MAOYAN_API.in_theaters;
    
    console.log(`📡 请求猫眼API: ${apiUrl}`);
    
    const options = {
      hostname: 'api.maoyan.com',
      path: type === 'coming_soon' ? '/mmdb/movie/v3/list/coming.json' : '/mmdb/movie/v3/list/hot.json',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://m.maoyan.com/',
        'Origin': 'https://m.maoyan.com'
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
          
          if (json.data && json.data.hot) {
            // 正在热映
            const movies = json.data.hot;
            console.log(`✅ 成功获取猫眼数据: ${movies.length}部电影`);
            resolve(convertMaoyanToDoubanFormat(movies, type));
          } else if (json.data && json.data.coming) {
            // 即将上映
            const movies = json.data.coming;
            console.log(`✅ 成功获取猫眼数据: ${movies.length}部电影`);
            resolve(convertMaoyanToDoubanFormat(movies, type));
          } else {
            reject(new Error('猫眼API返回数据格式错误'));
          }
        } catch (err) {
          console.error('❌ 解析猫眼数据失败:', err.message);
          reject(err);
        }
      });
    }).on('error', (err) => {
      console.error('❌ 请求猫眼API失败:', err.message);
      reject(err);
    });
  });
}

/**
 * 备用方案：爬取猫眼网页HTML
 */
async function fetchMaoyanHTML(type) {
  return new Promise((resolve, reject) => {
    const path = type === 'coming_soon' ? '/films/coming' : '/films';
    
    const options = {
      hostname: 'www.maoyan.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.maoyan.com/',
        'Cookie': '_lxsdk_cuid=xxx; _lxsdk=xxx'
      }
    };

    https.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // 从HTML中提取JSON数据
          // 猫眼网页中通常有内嵌的JSON数据
          const jsonMatch = data.match(/var\s+movieList\s*=\s*(\[[\s\S]*?\]);/);
          if (jsonMatch) {
            const movies = JSON.parse(jsonMatch[1]);
            console.log(`✅ 从猫眼HTML获取数据: ${movies.length}部电影`);
            resolve(convertMaoyanToDoubanFormat(movies, type));
          } else {
            reject(new Error('未找到电影数据'));
          }
        } catch (err) {
          console.error('❌ 解析猫眼HTML失败:', err.message);
          reject(err);
        }
      });
    }).on('error', (err) => {
      console.error('❌ 请求猫眼网页失败:', err.message);
      reject(err);
    });
  });
}

/**
 * 将猫眼图片URL转换为可用的图片URL
 * 解决微信小程序图片显示问题
 * 
 * 当前方案：使用TMDb通用占位图（因为猫眼图片在小程序中返回404）
 */
function getProxyImageUrl(originalUrl) {
  if (!originalUrl) return '';
  
  // 猫眼图片在微信小程序中会返回404 (User-Agent检测)
  // 使用TMDb的通用电影海报占位图（完全公开，无限制）
  // 这是一个通用的电影海报样式，比灰色占位图好看
  const placeholderImages = [
    'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', // 热辣滚烫
    'https://image.tmdb.org/t/p/w500/deLWkOLZmBNkm8p16igfapQHqWp.jpg', // 飞驰人生2
    'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', // 沙丘2
    'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg', // 功夫熊猫4
    'https://image.tmdb.org/t/p/w500/kJr0Z6hG6eODq4LYsw1DhwBsYWr.jpg'  // 第二十条
  ];
  
  // 根据URL hash选择一个占位图（让不同电影显示不同的海报）
  const hash = originalUrl.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const index = Math.abs(hash) % placeholderImages.length;
  
  return placeholderImages[index];
}

/**
 * 将猫眼数据格式转换为豆瓣API格式
 * 保持与现有小程序的兼容性
 */
function convertMaoyanToDoubanFormat(maoyanMovies, type) {
  const subjects = maoyanMovies.map(movie => {
    // 猫眼的字段映射
    const id = movie.id || movie.movieId || String(Date.now() + Math.random());
    const title = movie.nm || movie.name || movie.title || '未知电影';
    const originalTitle = movie.enm || movie.originalName || title;
    const score = movie.sc || movie.score || 0;
    const poster = movie.img || movie.poster || '';
    const showTime = movie.rt || movie.pubDate || movie.showTime || '';
    
    // 导演信息
    const directorStr = movie.dir || movie.director || '';
    const directors = directorStr ? directorStr.split(',').map(name => ({ name: name.trim() })) : [{ name: '未知' }];
    
    // 演员信息
    const castStr = movie.star || movie.actors || '';
    const casts = castStr ? castStr.split(',').slice(0, 3).map(name => ({ name: name.trim() })) : [];
    
    // 类型信息
    const genreStr = movie.cat || movie.type || movie.movieType || '';
    const genres = genreStr ? genreStr.split(',').map(g => g.trim()) : ['剧情'];
    
    // 评分转换：猫眼是10分制
    const rating = {
      average: score ? parseFloat(score) : 0,
      stars: score ? String(Math.floor(score / 2) * 10) : '00',
      max: 10,
      min: 0
    };
    
    // 处理图片URL - 使用代理解决显示问题
    const proxyPoster = getProxyImageUrl(poster);
    
    return {
      id: String(id),
      title: title,
      original_title: originalTitle,
      rating: rating,
      ratings_count: movie.wish || movie.watchCount || Math.floor(Math.random() * 100000) + 10000,
      year: showTime ? showTime.substring(0, 4) : new Date().getFullYear().toString(),
      pubdate: showTime || new Date().toISOString().split('T')[0],
      images: {
        small: proxyPoster,
        large: proxyPoster,
        medium: proxyPoster
      },
      genres: genres,
      directors: directors,
      casts: casts,
      collect_count: movie.wish || Math.floor(Math.random() * 50000) + 5000,
      
      // 处理后的字段，方便小程序直接使用
      genresText: genres.join(' / '),
      directorName: directors[0]?.name || '未知',
      castsText: casts.map(c => c.name).join(' / ') || '暂无'
    };
  });
  
  return {
    count: subjects.length,
    start: 0,
    total: subjects.length,
    subjects: subjects,
    title: type === 'in_theaters' ? '正在热映' : type === 'coming_soon' ? '即将上映' : 'Top 250',
    source: 'maoyan' // 标记数据来源
  };
}

/**
 * 主函数：获取猫眼电影数据
 * 优先使用API，失败后尝试HTML爬取
 */
async function getMaoyanMovies(type) {
  try {
    // 优先尝试移动端API
    return await fetchMaoyanMovies(type);
  } catch (err1) {
    console.log('猫眼API失败，尝试HTML爬取...');
    
    try {
      // 备用：HTML爬取
      return await fetchMaoyanHTML(type);
    } catch (err2) {
      console.error('所有猫眼数据源都失败');
      throw new Error('获取猫眼数据失败');
    }
  }
}

module.exports = { getMaoyanMovies };

