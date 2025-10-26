// Vercel Serverless Function - 豆瓣电影爬虫API  
// 优化版：获取真实的当月最新电影数据

const { getMovies } = require('./movies.js');

/**
 * 主处理函数 - 简化版，所有逻辑都在 movies.js 中
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
  
  // 获取路径参数
  const path = req.url || '/';
  const pathParts = path.split('/').filter(p => p);
  const endpoint = pathParts[0] || 'in_theaters';
  
  // 解析查询参数
  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  const start = parseInt(urlParams.searchParams.get('start') || '0');
  const count = parseInt(urlParams.searchParams.get('count') || '10');
  
  console.log(`📡 请求: ${endpoint}, start: ${start}, count: ${count}`);
  
  try {
    // 使用 movies.js 获取当月最新电影数据
    const movieData = await getMovies(endpoint);
    
    console.log(`✅ 成功获取${endpoint}数据，共${movieData.subjects.length}部电影`);
    
    // 如果数据中有电影，打印第一部电影的信息用于调试
    if (movieData.subjects && movieData.subjects.length > 0) {
      const firstMovie = movieData.subjects[0];
      console.log(`📽️ 第一部电影: ${firstMovie.title} (${firstMovie.pubdate || firstMovie.year})`);
    }
    
    return res.status(200).json(movieData);
    
  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    
    // 即使出错也返回200，避免小程序显示网络错误
    // movies.js 中的 getMovies 已经有完善的fallback机制
    return res.status(200).json({
      count: 0,
      start: 0,
      total: 0,
      subjects: [],
      title: endpoint === 'in_theaters' ? '正在热映' : endpoint === 'coming_soon' ? '即将上映' : 'Top 250',
      error: error.message
    });
  }
};

