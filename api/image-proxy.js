/**
 * 图片代理服务
 * 解决微信小程序图片防盗链和域名白名单问题
 */

const https = require('https');
const http = require('http');

/**
 * 代理图片请求
 * 使用方式：/api/image-proxy?url=https://p0.pipi.cn/xxx.jpg
 */
module.exports = async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 获取图片URL参数
  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  const imageUrl = urlParams.searchParams.get('url');
  
  if (!imageUrl) {
    return res.status(400).json({ error: '缺少url参数' });
  }
  
  console.log(`📸 代理图片请求: ${imageUrl}`);
  
  try {
    // 解析目标URL
    const targetUrl = new URL(imageUrl);
    const protocol = targetUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: targetUrl.hostname,
      path: targetUrl.pathname + targetUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://m.maoyan.com/',
        'Origin': 'https://m.maoyan.com'
      }
    };
    
    protocol.get(options, (imageRes) => {
      // 转发响应头
      res.setHeader('Content-Type', imageRes.headers['content-type'] || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存24小时
      
      // 如果有内容长度，也转发
      if (imageRes.headers['content-length']) {
        res.setHeader('Content-Length', imageRes.headers['content-length']);
      }
      
      // 流式传输图片
      imageRes.pipe(res);
      
    }).on('error', (err) => {
      console.error('❌ 获取图片失败:', err.message);
      res.status(500).json({ error: '获取图片失败', message: err.message });
    });
    
  } catch (err) {
    console.error('❌ 解析URL失败:', err.message);
    res.status(400).json({ error: 'URL格式错误', message: err.message });
  }
};

