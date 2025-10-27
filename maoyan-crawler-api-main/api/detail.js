// Vercel Serverless Function - 电影详情API
// 获取单个电影的完整详情信息（真实剧情简介）

const https = require('https');
const cheerio = require('cheerio');

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
 * 获取电影详情（使用猫眼电影ID）
 */
function fetchMovieDetail(movieId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.maoyan.com',
      path: `/films/${movieId}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://www.maoyan.com/',
        'Connection': 'keep-alive'
      }
    };

    https.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const detail = parseMovieDetailHTML(data, movieId);
          console.log(`✅ 成功解析电影详情: ${detail.title}`);
          resolve(detail);
        } catch (err) {
          console.error('❌ 解析电影详情失败:', err.message);
          reject(err);
        }
      });
    }).on('error', (err) => {
      console.error('❌ 请求电影详情失败:', err.message);
      reject(err);
    });
  });
}

/**
 * 解析电影详情HTML
 */
function parseMovieDetailHTML(html, movieId) {
  const $ = cheerio.load(html);
  
  // 提取标题
  const title = $('.movie-brief-container .name').text().trim() || 
                $('h1.name').text().trim() || 
                '未知电影';
  
  // 提取剧情简介
  let summary = $('.mod-content .dra').text().trim() || 
                $('.movie-brief-container .dra').text().trim() ||
                '';
  
  // 如果简介被"展开"功能截断，尝试获取完整的
  if (summary && summary.includes('...')) {
    const fullSummary = $('.dra').attr('title') || summary;
    summary = fullSummary;
  }
  
  // 提取类型
  const category = $('li.ellipsis').first().text().replace('类型:', '').trim() || '未知';
  
  // 提取制片国家/地区
  const country = $('li.ellipsis').eq(1).text().replace('制片国家/地区:', '').trim() || '未知';
  
  // 提取时长
  const durationText = $('li.ellipsis').eq(2).text().replace('片长:', '').trim();
  const duration = durationText || '未知';
  
  // 提取上映日期
  const releaseDate = $('li.ellipsis').eq(3).text().replace('上映时间:', '').trim() || '未知';
  
  // 提取导演
  const director = $('.celebrity-container .celebrity-group').first().find('.name').text().trim() || '未知';
  
  // 提取演员列表（前5位）
  const actors = [];
  $('.celebrity-container .celebrity-group').eq(1).find('.celebrity').each((i, elem) => {
    if (i < 5) {
      const actorName = $(elem).find('.name').text().trim();
      if (actorName) {
        actors.push(actorName);
      }
    }
  });
  
  // 提取评分
  const scoreText = $('.score-num').text().trim();
  const score = scoreText || '暂无评分';
  
  // 提取评分人数
  const ratingCount = $('.score-panel .total-people span').text().trim() || '0';
  
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

