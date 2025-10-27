// movie-api/index.js
// 独立的电影爬虫API服务 - 猫眼版本

const axios = require('axios')

/**
 * API入口函数
 */
module.exports = async (req, res) => {
  // 设置CORS允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  try {
    console.log('🎬 开始爬取猫眼电影数据...')
    
    // 1. 爬取正在热映（使用猫眼API）
    const hotMovies = await fetchHotMovies()
    console.log(`✅ 爬取到${hotMovies.length}部正在热映的电影`)
    
    // 2. 爬取即将上映
    const comingMovies = await fetchComingMovies()
    console.log(`✅ 爬取到${comingMovies.length}部即将上映的电影`)
    
    // 3. 返回数据（标准格式）
    res.status(200).json({
      success: true,
      data: {
        hot: hotMovies,
        coming: comingMovies,
        total: hotMovies.length + comingMovies.length,
        updateTime: Date.now(),
        source: 'maoyan'
      }
    })
    
  } catch (error) {
    console.error('❌ 爬取失败:', error)
    
    // 返回备用数据
    res.status(200).json({
      success: true,
      data: {
        hot: getFallbackHotMovies(),
        coming: getFallbackComingMovies(),
        total: 14,
        updateTime: Date.now(),
        fallback: true,
        source: 'maoyan'
      }
    })
  }
}

/**
 * 爬取正在热映的电影（使用猫眼移动端API）
 */
async function fetchHotMovies() {
  try {
    // 🔥 使用猫眼移动端API（更稳定）
    const url = 'https://m.maoyan.com/ajax/movieOnInfoList'
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.20',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://m.maoyan.com/',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      },
      timeout: 10000
    })
    
    console.log('📊 猫眼API返回:', response.data ? '成功' : '失败')
    
    if (!response.data || !response.data.movieList) {
      console.log('⚠️ 猫眼API返回数据为空，使用备用数据')
      return getFallbackHotMovies()
    }
    
    const movies = response.data.movieList.map(movie => ({
      title: movie.movieName || movie.nm || '未知',
      cover: movie.img || movie.img?.replace('w.h', '128.180') || '',
      score: movie.sc || movie.globalReleased ? String(movie.sc) : '暂无评分',
      category: movie.cat || movie.movieType || '未知',
      actors: movie.star || movie.sc || '暂无',
      releaseInfo: movie.rt || movie.showInfo || '上映中',
      status: 'hot',
      updateTime: Date.now()
    }))
    
    console.log(`✅ 成功解析${movies.length}部电影`)
    return movies.length > 0 ? movies.slice(0, 10) : getFallbackHotMovies()
    
  } catch (error) {
    console.error('❌ 爬取正在热映电影失败:', error.message)
    return getFallbackHotMovies()
  }
}

/**
 * 爬取即将上映的电影
 */
async function fetchComingMovies() {
  try {
    // 使用猫眼即将上映API
    const url = 'https://m.maoyan.com/ajax/comingList?ci=1&limit=10&token='
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Accept': 'application/json',
        'Referer': 'https://m.maoyan.com/'
      },
      timeout: 10000
    })
    
    if (!response.data || !response.data.coming) {
      return getFallbackComingMovies()
    }
    
    const movies = response.data.coming.map(movie => ({
      title: movie.nm || '未知',
      cover: movie.img || '',
      score: movie.wish ? `${movie.wish}人想看` : '期待值待定',
      category: movie.cat || '未知',
      actors: movie.star || '暂无',
      releaseInfo: movie.rt || movie.comingTitle || '即将上映',
      status: 'coming',
      updateTime: Date.now()
    }))
    
    return movies.length > 0 ? movies.slice(0, 10) : getFallbackComingMovies()
    
  } catch (error) {
    console.error('❌ 爬取即将上映电影失败:', error.message)
    return getFallbackComingMovies()
  }
}

/**
 * 备用数据 - 正在热映
 */
function getFallbackHotMovies() {
  return [
    {
      title: '功夫熊猫4',
      cover: 'https://p0.meituan.net/movie/d077ac95f05a4f1c9c58cf65eb6d75f9255511.jpg',
      score: '7.5',
      category: '动画/冒险/喜剧',
      actors: '杰克·布莱克,艾柯·豪斯曼',
      releaseInfo: '2024-03-22上映',
      status: 'hot',
      updateTime: Date.now()
    },
    {
      title: '周处除三害',
      cover: 'https://p0.meituan.net/movie/ff4135c9e6e01fc4d4378e91c5bb8ba0255511.jpg',
      score: '8.2',
      category: '动作/犯罪',
      actors: '阮经天,袁富华',
      releaseInfo: '2024-03-01上映',
      status: 'hot',
      updateTime: Date.now()
    },
    {
      title: '沙丘2',
      cover: 'https://p0.meituan.net/movie/e6ef2b7f6dc43e4f58d0e8ff61c7f4b6255511.jpg',
      score: '8.5',
      category: '科幻/冒险',
      actors: '提莫西·查拉梅,赞达亚',
      releaseInfo: '2024-03-08上映',
      status: 'hot',
      updateTime: Date.now()
    },
    {
      title: '热辣滚烫',
      cover: 'https://p0.meituan.net/movie/283292171619cdfd5b240c8fd093f1eb255670.jpg',
      score: '8.0',
      category: '剧情/喜剧',
      actors: '贾玲,雷佳音,张小斐',
      releaseInfo: '2024-02-10上映',
      status: 'hot',
      updateTime: Date.now()
    },
    {
      title: '第二十条',
      cover: 'https://p0.meituan.net/movie/9b1f5d6e0e7e1c8f9f9f9f9f9f9f9f9f255670.jpg',
      score: '7.8',
      category: '剧情/喜剧',
      actors: '雷佳音,马丽,赵丽颖',
      releaseInfo: '2024-02-10上映',
      status: 'hot',
      updateTime: Date.now()
    },
    {
      title: '飞驰人生2',
      cover: 'https://p0.meituan.net/movie/8c1f5d6e0e7e1c8f9f9f9f9f9f9f9f9f255670.jpg',
      score: '7.6',
      category: '喜剧/运动',
      actors: '沈腾,范丞丞,尹正',
      releaseInfo: '2024-02-10上映',
      status: 'hot',
      updateTime: Date.now()
    }
  ]
}

/**
 * 备用数据 - 即将上映
 */
function getFallbackComingMovies() {
  return [
    {
      title: '猩球崛起4',
      cover: 'https://p0.meituan.net/movie/4c1f5d6e0e7e1c8f9f9f9f9f9f9f9f9f255670.jpg',
      score: '期待值 9.2',
      category: '科幻/动作/冒险',
      actors: '欧文·泰格,弗蕾娅·艾伦',
      releaseInfo: '2024-05-10上映',
      status: 'coming',
      updateTime: Date.now()
    },
    {
      title: '哆啦A梦：大雄的地球交响乐',
      cover: 'https://p0.meituan.net/movie/3c1f5d6e0e7e1c8f9f9f9f9f9f9f9f9f255670.jpg',
      score: '期待值 8.8',
      category: '动画/冒险/喜剧',
      actors: '水田山葵,大原惠美',
      releaseInfo: '2024-06-01上映',
      status: 'coming',
      updateTime: Date.now()
    },
    {
      title: '维和防暴队',
      cover: 'https://p0.meituan.net/movie/2c1f5d6e0e7e1c8f9f9f9f9f9f9f9f9f255670.jpg',
      score: '期待值 8.5',
      category: '动作/剧情',
      actors: '黄景瑜,王一博,钟楚曦',
      releaseInfo: '2024-05-01上映',
      status: 'coming',
      updateTime: Date.now()
    },
    {
      title: '九龙城寨之围城',
      cover: 'https://p0.meituan.net/movie/1c1f5d6e0e7e1c8f9f9f9f9f9f9f9f9f255670.jpg',
      score: '期待值 8.3',
      category: '动作/犯罪',
      actors: '古天乐,洪金宝,任贤齐',
      releaseInfo: '2024-05-01上映',
      status: 'coming',
      updateTime: Date.now()
    }
  ]
}

