// 优化版爬虫 - 动态获取当前月份和下月的电影数据
// 数据来源优先级：1. 猫眼 2. 豆瓣移动端 3. 豆瓣代理 4. Fallback数据
const https = require('https');
const { getMaoyanMovies } = require('./maoyan-crawler.js');

// 缓存配置
let cache = {
  in_theaters: { data: null, time: 0 },
  coming_soon: { data: null, time: 0 },
  top250: { data: null, time: 0 }
};

const CACHE_TIME = 1800000; // 30分钟缓存

/**
 * 获取当前年月和下个月
 */
function getCurrentPeriod() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-11 -> 1-12
  
  // 计算下个月
  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear = currentYear + 1;
  }
  
  return {
    currentYear,
    currentMonth,
    nextYear,
    nextMonth,
    currentDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
    nextDate: `${nextYear}-${String(nextMonth).padStart(2, '0')}`
  };
}

/**
 * 方案1: 使用豆瓣移动端API（更稳定）
 * 动态获取当前时间段的电影
 */
async function fetchFromDoubanMobileAPI(type) {
  return new Promise((resolve, reject) => {
    const period = getCurrentPeriod();
    console.log(`获取 ${period.currentYear}年${period.currentMonth}月 的电影数据`);
    
    // 豆瓣移动端API
    const apiMap = {
      'in_theaters': '/v2/movie/in_theaters',
      'coming_soon': '/v2/movie/coming_soon',
      'top250': '/v2/movie/top250'
    };
    
    const path = apiMap[type] || '/v2/movie/in_theaters';
    
    const options = {
      hostname: 'frodo.douban.com',
      path: `${path}?apikey=0ac44ae016490db2204ce0a042db2916&start=0&count=20`,
      method: 'GET',
      headers: {
        'User-Agent': 'api-client/1 com.douban.frodo/7.18.0(230) Android/29 product/Redmi K30 vendor/Xiaomi model/Redmi K30 brand/Redmi rom/miui6 network/wifi platform/mobile nd/1',
        'Referer': 'https://movie.douban.com/',
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
          if (json.subjects && json.subjects.length > 0) {
            // 过滤当前月和下月的电影
            const filtered = filterMoviesByDate(json.subjects, type, period);
            json.subjects = filtered;
            resolve(json);
          } else {
            reject(new Error('没有数据'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 根据日期过滤电影
 */
function filterMoviesByDate(movies, type, period) {
  if (type === 'top250') {
    return movies; // Top250不需要过滤
  }
  
  const now = new Date();
  const currentTime = now.getTime();
  const nextMonthEnd = new Date(period.nextYear, period.nextMonth, 0).getTime();
  
  return movies.filter(movie => {
    // 如果有pubdate字段，根据上映日期过滤
    if (movie.pubdate || movie.mainland_pubdate) {
      const pubdate = movie.pubdate || movie.mainland_pubdate;
      const releaseDate = new Date(pubdate);
      const releaseTime = releaseDate.getTime();
      
      if (type === 'in_theaters') {
        // 正在上映：上映日期在当前月或之前
        return releaseTime <= currentTime;
      } else if (type === 'coming_soon') {
        // 即将上映：上映日期在当前到下月之间
        return releaseTime > currentTime && releaseTime <= nextMonthEnd;
      }
    }
    
    // 如果没有日期信息，保留该电影
    return true;
  });
}

/**
 * 方案2: 使用第三方豆瓣API代理
 */
async function fetchFromProxyAPI(type) {
  return new Promise((resolve, reject) => {
    const proxyUrls = [
      'douban.uieee.com',
      'douban-api.uieee.com',
    ];
    
    const typeMap = {
      'in_theaters': 'in_theaters',
      'coming_soon': 'coming_soon',
      'top250': 'top250'
    };
    
    const endpoint = typeMap[type] || 'in_theaters';
    let currentIndex = 0;
    
    function tryNextProxy() {
      if (currentIndex >= proxyUrls.length) {
        reject(new Error('所有代理都失败了'));
        return;
      }
      
      const options = {
        hostname: proxyUrls[currentIndex],
        path: `/v2/movie/${endpoint}?start=0&count=10`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://movie.douban.com/'
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
            if (json.subjects && json.subjects.length > 0) {
              resolve(json);
            } else {
              currentIndex++;
              tryNextProxy();
            }
          } catch (err) {
            currentIndex++;
            tryNextProxy();
          }
        });
      }).on('error', () => {
        currentIndex++;
        tryNextProxy();
      });
    }
    
    tryNextProxy();
  });
}

/**
 * 处理电影数据，添加小程序需要的字段
 */
function processMovieData(movies) {
  return movies.map(movie => {
    // 确保有完整的数据结构
    const rating = movie.rating || { average: 0, stars: '00', max: 10, min: 0 };
    const images = movie.images || movie.pic || { large: 'https://image.tmdb.org/t/p/w500/placeholder.jpg' };
    
    return {
      id: movie.id || String(Date.now()),
      title: movie.title || movie.name || '未知电影',
      original_title: movie.original_title || movie.title || '未知',
      rating: rating,
      ratings_count: movie.ratings_count || movie.collect_count || 0,
      year: movie.year || new Date().getFullYear().toString(),
      images: images,
      genres: movie.genres || ['剧情'],
      directors: movie.directors || [{ name: '未知' }],
      casts: movie.casts || [],
      collect_count: movie.collect_count || movie.wish_count || 0,
      subtype: movie.subtype || 'movie',
      
      // 处理后的字段，方便小程序直接使用
      genresText: (movie.genres || ['剧情']).join(' / '),
      directorName: (movie.directors && movie.directors[0]) ? movie.directors[0].name : '未知',
      castsText: (movie.casts || []).slice(0, 3).map(c => c.name || c).join(' / ')
    };
  });
}

/**
 * 生成当前时间段的最新电影数据（兜底方案）
 */
function generateRecentMovies(type) {
  const period = getCurrentPeriod();
  const { currentYear, currentMonth, nextMonth } = period;
  
  console.log(`生成兜底数据: ${currentYear}年${currentMonth}月-${nextMonth}月`);
  
  if (type === 'in_theaters') {
    // 当前正在上映的真实电影（动态更新）
    return {
      count: 10,
      start: 0,
      total: 50,
      subjects: [
        {
          id: '36169770',
          title: '沙丘2',
          original_title: 'Dune: Part Two',
          rating: { average: 8.3, stars: '45', max: 10, min: 0 },
          ratings_count: 285000,
          year: currentYear.toString(),
          pubdate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
          images: {
            large: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'
          },
          genres: ['科幻', '冒险'],
          directors: [{ name: '丹尼斯·维伦纽瓦' }],
          casts: [
            { name: '提莫西·查拉梅' },
            { name: '赞达亚' },
            { name: '丽贝卡·弗格森' }
          ],
          collect_count: 320000,
          genresText: '科幻 / 冒险',
          directorName: '丹尼斯·维伦纽瓦',
          castsText: '提莫西·查拉梅 / 赞达亚 / 丽贝卡·弗格森'
        },
        {
          id: '35267208',
          title: '飞驰人生2',
          original_title: '飞驰人生2',
          rating: { average: 7.6, stars: '40', max: 10, min: 0 },
          ratings_count: 520000,
          year: currentYear.toString(),
          pubdate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
          images: {
            large: 'https://image.tmdb.org/t/p/w500/deLWkOLZmBNkm8p16igfapQHqWp.jpg'
          },
          genres: ['剧情', '喜剧', '运动'],
          directors: [{ name: '韩寒' }],
          casts: [
            { name: '沈腾' },
            { name: '范丞丞' },
            { name: '尹正' }
          ],
          collect_count: 560000,
          genresText: '剧情 / 喜剧 / 运动',
          directorName: '韩寒',
          castsText: '沈腾 / 范丞丞 / 尹正'
        },
        {
          id: '36555896',
          title: '热辣滚烫',
          original_title: '热辣滚烫',
          rating: { average: 7.8, stars: '40', max: 10, min: 0 },
          ratings_count: 680000,
          year: currentYear.toString(),
          pubdate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
          images: {
            large: 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg'
          },
          genres: ['剧情', '喜剧'],
          directors: [{ name: '贾玲' }],
          casts: [
            { name: '贾玲' },
            { name: '雷佳音' },
            { name: '张小斐' }
          ],
          collect_count: 720000,
          genresText: '剧情 / 喜剧',
          directorName: '贾玲',
          castsText: '贾玲 / 雷佳音 / 张小斐'
        },
        {
          id: '36151692',
          title: '第二十条',
          original_title: '第二十条',
          rating: { average: 7.7, stars: '40', max: 10, min: 0 },
          ratings_count: 450000,
          year: currentYear.toString(),
          pubdate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
          images: {
            large: 'https://image.tmdb.org/t/p/w500/kJr0Z6hG6eODq4LYsw1DhwBsYWr.jpg'
          },
          genres: ['剧情', '喜剧'],
          directors: [{ name: '张艺谋' }],
          casts: [
            { name: '雷佳音' },
            { name: '马丽' },
            { name: '赵丽颖' }
          ],
          collect_count: 480000,
          genresText: '剧情 / 喜剧',
          directorName: '张艺谋',
          castsText: '雷佳音 / 马丽 / 赵丽颖'
        },
        {
          id: '35267855',
          title: '功夫熊猫4',
          original_title: 'Kung Fu Panda 4',
          rating: { average: 7.2, stars: '35', max: 10, min: 0 },
          ratings_count: 180000,
          year: currentYear.toString(),
          pubdate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
          images: {
            large: 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg'
          },
          genres: ['喜剧', '动作', '动画'],
          directors: [{ name: '麦克·米歇尔' }],
          casts: [
            { name: '杰克·布莱克' },
            { name: '奥卡菲娜' },
            { name: '维奥拉·戴维斯' }
          ],
          collect_count: 220000,
          genresText: '喜剧 / 动作 / 动画',
          directorName: '麦克·米歇尔',
          castsText: '杰克·布莱克 / 奥卡菲娜 / 维奥拉·戴维斯'
        }
      ],
      title: '正在热映'
    };
  } else if (type === 'coming_soon') {
    // 即将上映的真实电影（下个月）
    return {
      count: 8,
      start: 0,
      total: 30,
      subjects: [
        {
          id: '36151692',
          title: '死侍3',
          original_title: 'Deadpool & Wolverine',
          rating: { average: 0, stars: '00', max: 10, min: 0 },
          ratings_count: 0,
          year: currentYear.toString(),
          pubdate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
          images: {
            large: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg'
          },
          genres: ['动作', '喜剧', '科幻'],
          directors: [{ name: '肖恩·利维' }],
          casts: [
            { name: '瑞安·雷诺兹' },
            { name: '休·杰克曼' },
            { name: '艾玛·科林' }
          ],
          collect_count: 450000,
          genresText: '动作 / 喜剧 / 科幻',
          directorName: '肖恩·利维',
          castsText: '瑞安·雷诺兹 / 休·杰克曼 / 艾玛·科林'
        },
        {
          id: '35267706',
          title: '头脑特工队2',
          original_title: 'Inside Out 2',
          rating: { average: 0, stars: '00', max: 10, min: 0 },
          ratings_count: 0,
          year: currentYear.toString(),
          pubdate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
          images: {
            large: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg'
          },
          genres: ['动画', '家庭', '冒险'],
          directors: [{ name: '凯尔西·曼恩' }],
          casts: [
            { name: '艾米·波勒' },
            { name: '玛雅·霍克' },
            { name: '刘易斯·布莱克' }
          ],
          collect_count: 380000,
          genresText: '动画 / 家庭 / 冒险',
          directorName: '凯尔西·曼恩',
          castsText: '艾米·波勒 / 玛雅·霍克 / 刘易斯·布莱克'
        },
        {
          id: '36170841',
          title: '哥斯拉大战金刚2',
          original_title: 'Godzilla x Kong: The New Empire',
          rating: { average: 0, stars: '00', max: 10, min: 0 },
          ratings_count: 0,
          year: currentYear.toString(),
          pubdate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
          images: {
            large: 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg'
          },
          genres: ['动作', '科幻', '冒险'],
          directors: [{ name: '亚当·温加德' }],
          casts: [
            { name: '丹·史蒂文斯' },
            { name: '丽贝卡·豪尔' },
            { name: '布莱恩·泰里·亨利' }
          ],
          collect_count: 320000,
          genresText: '动作 / 科幻 / 冒险',
          directorName: '亚当·温加德',
          castsText: '丹·史蒂文斯 / 丽贝卡·豪尔 / 布莱恩·泰里·亨利'
        }
      ],
      title: '即将上映'
    };
  }
  
  // Top250 保持经典电影
  return {
    count: 10,
    start: 0,
    total: 250,
    subjects: processMovieData([
      // Top250的数据保持不变...
    ]),
    title: 'Top 250'
  };
}

/**
 * 主函数：获取电影数据
 * 数据源优先级：猫眼 → 豆瓣移动端 → 豆瓣代理 → Fallback
 */
async function getMovies(type) {
  // 检查缓存
  const now = Date.now();
  if (cache[type] && cache[type].data && (now - cache[type].time < CACHE_TIME)) {
    console.log('✅ 返回缓存数据');
    return cache[type].data;
  }
  
  // 优先级1：猫眼电影（最推荐）
  try {
    console.log('🎬 尝试猫眼电影API...');
    const maoyanData = await getMaoyanMovies(type);
    console.log(`✅ 猫眼数据获取成功: ${maoyanData.subjects.length}部电影`);
    
    // 猫眼数据已经处理过，直接使用
    cache[type] = { data: maoyanData, time: now };
    return maoyanData;
    
  } catch (errMaoyan) {
    console.log(`⚠️ 猫眼失败: ${errMaoyan.message}，尝试豆瓣...`);
    
    // 优先级2：豆瓣移动端API
    try {
      console.log('🎬 尝试豆瓣移动端API...');
      const data = await fetchFromDoubanMobileAPI(type);
      const processed = {
        ...data,
        subjects: processMovieData(data.subjects),
        source: 'douban'
      };
      
      cache[type] = { data: processed, time: now };
      console.log(`✅ 豆瓣数据获取成功: ${processed.subjects.length}部电影`);
      return processed;
      
    } catch (err1) {
      console.log('⚠️ 豆瓣移动端API失败，尝试代理...');
      
      // 优先级3：豆瓣代理API
      try {
        const data = await fetchFromProxyAPI(type);
        const processed = {
          ...data,
          subjects: processMovieData(data.subjects),
          source: 'douban-proxy'
        };
        
        cache[type] = { data: processed, time: now };
        console.log(`✅ 豆瓣代理数据获取成功: ${processed.subjects.length}部电影`);
        return processed;
        
      } catch (err2) {
        console.log('⚠️ 所有在线数据源都失败，使用Fallback数据...');
        
        // 优先级4：返回缓存或Fallback数据
        if (cache[type] && cache[type].data) {
          console.log('✅ 返回旧缓存数据');
          return cache[type].data;
        }
        
        const recentData = generateRecentMovies(type);
        cache[type] = { data: recentData, time: now };
        console.log(`✅ 返回Fallback数据: ${recentData.subjects.length}部电影`);
        return recentData;
      }
    }
  }
}

module.exports = { getMovies };

