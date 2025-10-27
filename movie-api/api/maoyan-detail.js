/**
 * 猫眼电影详情爬虫模块
 * 爬取单个电影的完整详情信息
 */

const https = require('https');
const cheerio = require('cheerio');

/**
 * 获取电影详情（使用猫眼电影ID）
 * @param {string} movieId - 猫眼电影ID
 * @returns {Promise<Object>} 电影详情
 */
async function fetchMovieDetail(movieId) {
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
          console.log(`✅ 成功获取电影详情: ${detail.title}`);
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
 * @param {string} html - HTML内容
 * @param {string} movieId - 电影ID
 * @returns {Object} 解析后的电影详情
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

/**
 * 批量获取电影详情
 * @param {Array} movieIds - 电影ID列表
 * @returns {Promise<Array>} 电影详情列表
 */
async function batchFetchMovieDetails(movieIds) {
  const results = [];
  
  for (const id of movieIds) {
    try {
      const detail = await fetchMovieDetail(id);
      results.push(detail);
      
      // 避免请求过快，延迟500ms
      await sleep(500);
    } catch (err) {
      console.error(`获取电影${id}详情失败:`, err.message);
      results.push({
        id: id,
        error: '获取失败'
      });
    }
  }
  
  return results;
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  fetchMovieDetail,
  batchFetchMovieDetails
};

