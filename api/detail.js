// Vercel Serverless Function - 电影详情API
// 获取单个电影的完整详情信息（真实剧情简介）

const https = require('https');
const cheerio = require('cheerio');

// TMDb配置
const TMDB_API_KEY = '38980626fa1917ab5bb56f08350320b2';
const TMDB_BASE_URL = 'api.themoviedb.org';

/**
 * 主处理函数
 */
module.exports = async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 获取电影ID参数
  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  const movieId = urlParams.searchParams.get('id');
  
  if (!movieId) {
    return res.status(400).json({
      success: false,
      error: '缺少电影ID参数'
    });
  }
  
  console.log(`📡 请求电影详情: ${movieId}`);
  
  try {
    // 获取电影详情
    const detail = await fetchMovieDetail(movieId);
    
    console.log(`✅ 成功获取电影详情: ${detail.title}`);
    
    return res.status(200).json({
      success: true,
      data: detail
    });
    
  } catch (error) {
    console.error('❌ 获取电影详情失败:', error.message);
    
    return res.status(200).json({
      success: false,
      error: error.message || '获取电影详情失败'
    });
  }
};

/**
 * 获取电影详情（优先使用TMDb，备用猫眼）
 */
async function fetchMovieDetail(movieId) {
  // 🌟 方法0: 尝试TMDb（最优先，最稳定）
  try {
    console.log('🔄 尝试方法0: TMDb API（官方）');
    const tmdbDetail = await fetchFromTMDb(movieId);
    if (tmdbDetail && tmdbDetail.title !== '未知电影') {
      console.log('✅ TMDb API成功');
      return tmdbDetail;
    }
  } catch (err) {
    console.log('⚠️ TMDb失败:', err.message);
  }
  
  // 方法1: 尝试移动端API
  try {
    console.log('🔄 尝试方法1: 猫眼移动端API');
    const apiDetail = await fetchFromMobileAPI(movieId);
    if (apiDetail && apiDetail.title !== '未知电影') {
      console.log('✅ 移动端API成功');
      return apiDetail;
    }
  } catch (err) {
    console.log('⚠️ 移动端API失败:', err.message);
  }
  
  // 方法2: 尝试移动端网页
  try {
    console.log('🔄 尝试方法2: 猫眼移动端网页');
    const mobileDetail = await fetchFromMobileWeb(movieId);
    if (mobileDetail && mobileDetail.title !== '未知电影') {
      console.log('✅ 移动端网页成功');
      return mobileDetail;
    }
  } catch (err) {
    console.log('⚠️ 移动端网页失败:', err.message);
  }
  
  // 方法3: PC网页（最后尝试）
  try {
    console.log('🔄 尝试方法3: 猫眼PC网页');
    return await fetchFromPCWeb(movieId);
  } catch (err) {
    console.log('⚠️ PC网页失败:', err.message);
    throw new Error('所有获取方法都失败了');
  }
}

/**
 * 🌟 方法0: 从TMDb获取（最稳定、最优先）
 */
async function fetchFromTMDb(maoyanId) {
  // 第一步：从猫眼API获取电影名称（用于TMDb搜索）
  let movieTitle = null;
  try {
    const maoyanData = await fetchFromMobileAPI(maoyanId);
    movieTitle = maoyanData.title;
    console.log('📝 从猫眼获取电影名:', movieTitle);
  } catch (err) {
    console.log('⚠️ 无法从猫眼获取电影名，使用ID搜索');
  }
  
  // 第二步：在TMDb搜索电影
  const tmdbId = await searchTMDb(movieTitle || maoyanId);
  if (!tmdbId) {
    throw new Error('TMDb搜索无结果');
  }
  
  // 第三步：获取TMDb详情
  return await getTMDbDetail(tmdbId, maoyanId);
}

/**
 * 在TMDb搜索电影
 */
function searchTMDb(query) {
  return new Promise((resolve, reject) => {
    const path = `/3/search/movie?api_key=${TMDB_API_KEY}&language=zh-CN&query=${encodeURIComponent(query)}&page=1`;
    
    const options = {
      hostname: TMDB_BASE_URL,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            console.log(`🎬 TMDb找到${json.results.length}个结果，使用第一个`);
            resolve(json.results[0].id);
          } else {
            reject(new Error('TMDb无搜索结果'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 获取TMDb电影详情
 */
function getTMDbDetail(tmdbId, maoyanId) {
  return new Promise((resolve, reject) => {
    const path = `/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`;
    
    const options = {
      hostname: TMDB_BASE_URL,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            id: maoyanId,
            title: json.title || json.original_title || '未知电影',
            summary: json.overview || '暂无剧情简介',
            category: json.genres ? json.genres.map(g => g.name).join('/') : '未知',
            country: json.production_countries ? json.production_countries.map(c => c.name).join('/') : '未知',
            duration: json.runtime ? `${json.runtime}分钟` : '未知',
            releaseDate: json.release_date || '未知',
            director: '未知', // TMDb需要额外请求credits
            actors: '暂无', // TMDb需要额外请求credits
            score: json.vote_average ? String(json.vote_average.toFixed(1)) : '暂无评分',
            ratingCount: json.vote_count ? String(json.vote_count) : '0'
          });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 方法1: 从移动端API获取（最稳定）
 */
function fetchFromMobileAPI(movieId) {
  return new Promise((resolve, reject) => {
    // 使用更完整的移动端请求头
    const options = {
      hostname: 'api.maoyan.com',
      path: `/mmdb/movie/v5/detail/${movieId}.json`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.38(0x18002631) NetType/WIFI Language/zh_CN',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://m.maoyan.com/',
        'Origin': 'https://m.maoyan.com',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          console.log('📊 API响应前100字符:', data.substring(0, 100));
          const json = JSON.parse(data);
          if (json.data && json.data.basic) {
            resolve(parseMobileAPIData(json.data, movieId));
          } else {
            reject(new Error('API返回数据格式错误'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 方法2: 从移动端网页获取
 */
function fetchFromMobileWeb(movieId) {
  return new Promise((resolve, reject) => {
    // 完整模拟移动端浏览器
    const options = {
      hostname: 'm.maoyan.com',
      path: `/movie/${movieId}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://m.maoyan.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Cache-Control': 'max-age=0'
      }
    };

    https.get(options, (res) => {
      // 跟随重定向
      if (res.statusCode === 301 || res.statusCode === 302) {
        console.log('🔄 检测到重定向，跳过');
        reject(new Error('被重定向'));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          console.log('📱 移动端HTML长度:', data.length);
          console.log('📱 HTML前200字符:', data.substring(0, 200));
          if (data.length < 1000) {
            reject(new Error('HTML内容过短'));
            return;
          }
          resolve(parseMovieDetailHTML(data, movieId));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 方法3: 从PC网页获取
 */
function fetchFromPCWeb(movieId) {
  return new Promise((resolve, reject) => {
    // 完整模拟Chrome浏览器
    const options = {
      hostname: 'www.maoyan.com',
      path: `/films/${movieId}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.maoyan.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Cookie': '__mta=87539764.1234567890.1234567890.1234567890.1; uuid_n_v=v1; uuid=ABCD1234; _lxsdk_cuid=abc123; _lxsdk=abc123; _csrf=xyz789'
      }
    };

    https.get(options, (res) => {
      // 跟随重定向
      if (res.statusCode === 301 || res.statusCode === 302) {
        console.log('🔄 检测到重定向');
        reject(new Error('被重定向'));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          console.log('💻 PC端HTML长度:', data.length);
          console.log('💻 PC端状态码:', res.statusCode);
          console.log('💻 HTML前200字符:', data.substring(0, 200));
          
          if (data.length < 1000) {
            reject(new Error('HTML内容过短，可能被拦截'));
            return;
          }
          resolve(parseMovieDetailHTML(data, movieId));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 解析移动端API返回的数据
 */
function parseMobileAPIData(data, movieId) {
  const basic = data.basic || {};
  const story = data.story || {};
  
  return {
    id: movieId,
    title: basic.name || basic.nm || '未知电影',
    summary: story.brief || story.summary || basic.story || '暂无剧情简介',
    category: basic.type || basic.cat || '未知',
    country: basic.releaseArea || basic.src || '未知',
    duration: basic.mins ? `${basic.mins}分钟` : '未知',
    releaseDate: basic.releaseDate || basic.rt || '未知',
    director: basic.director?.name || basic.dir || '未知',
    actors: basic.actors?.map(a => a.name).join(' / ') || basic.star || '暂无',
    score: basic.overallRating ? String(basic.overallRating) : basic.sc || '暂无评分',
    ratingCount: basic.personCount || basic.wish || '0'
  };
}

/**
 * 解析电影详情HTML
 */
function parseMovieDetailHTML(html, movieId) {
  const $ = cheerio.load(html);
  
  console.log('🔍 开始解析 HTML，长度:', html.length);
  
  // ========== 方法1: 尝试从内嵌的 JSON 数据中提取 ==========
  try {
    // 猫眼通常在页面中嵌入 JSON 数据
    const scriptMatch = html.match(/<script[^>]*>\s*var\s+__INITIAL_STATE__\s*=\s*({.*?})\s*<\/script>/s);
    if (scriptMatch) {
      const jsonData = JSON.parse(scriptMatch[1]);
      console.log('✅ 找到内嵌 JSON 数据');
      
      // 从 JSON 中提取信息
      if (jsonData.movieDetailModel || jsonData.detailMovie) {
        const movie = jsonData.movieDetailModel || jsonData.detailMovie;
        return extractFromJSON(movie, movieId);
      }
    }
  } catch (err) {
    console.log('⚠️ JSON 解析失败，尝试 HTML 解析');
  }
  
  // ========== 方法2: HTML CSS 选择器解析（多种选择器） ==========
  
  // 提取标题（多种选择器）
  const title = $('.movie-brief-container .name').text().trim() || 
                $('h1.name').text().trim() ||
                $('.movie-brief h1').text().trim() ||
                $('h3.name').text().trim() ||
                $('.film-name').text().trim() ||
                '未知电影';
  
  console.log('📝 标题:', title);
  
  // 提取剧情简介（多种选择器）
  let summary = $('.mod-content .dra').text().trim() || 
                $('.movie-brief-container .dra').text().trim() ||
                $('.dra').text().trim() ||
                $('[class*="synopsis"]').text().trim() ||
                $('[class*="summary"]').text().trim() ||
                $('.desc').text().trim() ||
                '';
  
  // 移除多余的空白和特殊字符
  summary = summary.replace(/\s+/g, ' ').trim();
  
  // 如果简介被截断，尝试获取完整的
  if (summary && summary.includes('...')) {
    const fullSummary = $('.dra').attr('title') || 
                       $('[class*="synopsis"]').attr('title') || 
                       summary;
    summary = fullSummary;
  }
  
  console.log('📖 简介长度:', summary.length);
  
  // 提取类型（多种方式）
  let category = $('li.ellipsis').first().text().replace(/类型[:：]/g, '').trim() ||
                 $('.info-category').text().trim() ||
                 $('[class*="type"]').text().trim() ||
                 '未知';
  
  // 提取制片国家/地区
  let country = $('li.ellipsis').eq(1).text().replace(/制片国家\/地区[:：]/g, '').trim() ||
                $('.info-origin').text().trim() ||
                '未知';
  
  // 提取时长
  let duration = $('li.ellipsis').eq(2).text().replace(/片长[:：]/g, '').trim() ||
                 $('.info-duration').text().trim() ||
                 '未知';
  
  // 提取上映日期
  let releaseDate = $('li.ellipsis').eq(3).text().replace(/上映时间[:：]/g, '').trim() ||
                    $('.info-release').text().trim() ||
                    '未知';
  
  // 提取导演
  let director = $('.celebrity-container .celebrity-group').first().find('.name').text().trim() ||
                 $('.director .name').text().trim() ||
                 $('[class*="director"]').text().trim() ||
                 '未知';
  
  // 提取演员列表（前5位，多种选择器）
  const actors = [];
  $('.celebrity-container .celebrity-group').eq(1).find('.celebrity').each((i, elem) => {
    if (i < 5) {
      const actorName = $(elem).find('.name').text().trim();
      if (actorName) {
        actors.push(actorName);
      }
    }
  });
  
  // 如果第一种方法没找到演员，尝试其他选择器
  if (actors.length === 0) {
    $('.actor .name, [class*="actor"] .name, [class*="cast"] .name').each((i, elem) => {
      if (i < 5) {
        const actorName = $(elem).text().trim();
        if (actorName) {
          actors.push(actorName);
        }
      }
    });
  }
  
  // 提取评分
  const scoreText = $('.score-num').text().trim() ||
                   $('[class*="score"]').first().text().trim() ||
                   $('.rating-num').text().trim();
  const score = scoreText || '暂无评分';
  
  // 提取评分人数
  const ratingCount = $('.score-panel .total-people span').text().trim() ||
                     $('.rating-count').text().trim() ||
                     '0';
  
  console.log('✅ HTML 解析完成');
  
  return {
    id: movieId,
    title: title,
    summary: summary || '暂无剧情简介',
    category: category,
    country: country,
    duration: duration,
    releaseDate: releaseDate,
    director: director,
    actors: actors.join(' / ') || '暂无',
    score: score,
    ratingCount: ratingCount
  };
}

/**
 * 从 JSON 数据中提取电影信息
 */
function extractFromJSON(movie, movieId) {
  console.log('📊 从 JSON 提取数据');
  
  return {
    id: movieId,
    title: movie.nm || movie.name || movie.title || '未知电影',
    summary: movie.dra || movie.synopsis || movie.summary || '暂无剧情简介',
    category: movie.cat || movie.type || movie.genres?.join('/') || '未知',
    country: movie.src || movie.country || '未知',
    duration: movie.dur ? `${movie.dur}分钟` : '未知',
    releaseDate: movie.rt || movie.pubDate || movie.releaseDate || '未知',
    director: movie.dir || movie.director || '未知',
    actors: movie.star || movie.actors || '暂无',
    score: movie.sc ? String(movie.sc) : '暂无评分',
    ratingCount: movie.wish || movie.wishCount || '0'
  };
}

