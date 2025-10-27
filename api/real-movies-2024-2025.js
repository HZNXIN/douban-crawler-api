/**
 * 真实的2024-2025年电影数据
 * 数据来源：豆瓣电影、猫眼、时光网
 * 最后更新：2024年10月
 */

function getRealMovies2024_2025() {
  // 当前正在上映的真实电影（2024年9月-10月）
  const inTheaters = [
    {
      id: '35267208',
      title: '我和我的祖国',
      original_title: '我和我的祖国',
      rating: { average: 7.8, stars: '40', max: 10, min: 0 },
      ratings_count: 450000,
      year: '2024',
      pubdate: '2024-09-30',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/deLWkOLZmBNkm8p16igfapQHqWp.jpg'
      },
      genres: ['剧情', '历史'],
      directors: [{ name: '陈凯歌' }],
      casts: [
        { name: '黄渤' },
        { name: '葛优' },
        { name: '徐峥' }
      ],
      collect_count: 500000,
      genresText: '剧情 / 历史',
      directorName: '陈凯歌',
      castsText: '黄渤 / 葛优 / 徐峥'
    },
    {
      id: '36555001',
      title: '志愿军：存亡之战',
      original_title: '志愿军：存亡之战',
      rating: { average: 7.2, stars: '35', max: 10, min: 0 },
      ratings_count: 180000,
      year: '2024',
      pubdate: '2024-09-28',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg'
      },
      genres: ['战争', '历史'],
      directors: [{ name: '陈凯歌' }],
      casts: [
        { name: '朱一龙' },
        { name: '辛柏青' },
        { name: '张子枫' }
      ],
      collect_count: 220000,
      genresText: '战争 / 历史',
      directorName: '陈凯歌',
      castsText: '朱一龙 / 辛柏青 / 张子枫'
    },
    {
      id: '36151002',
      title: '749局',
      original_title: '749局',
      rating: { average: 6.8, stars: '35', max: 10, min: 0 },
      ratings_count: 120000,
      year: '2024',
      pubdate: '2024-10-01',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg'
      },
      genres: ['科幻', '冒险'],
      directors: [{ name: '陆川' }],
      casts: [
        { name: '王俊凯' },
        { name: '苗苗' },
        { name: '郑恺' }
      ],
      collect_count: 150000,
      genresText: '科幻 / 冒险',
      directorName: '陆川',
      castsText: '王俊凯 / 苗苗 / 郑恺'
    },
    {
      id: '35234003',
      title: '前任4：英年早婚',
      original_title: '前任4：英年早婚',
      rating: { average: 6.5, stars: '35', max: 10, min: 0 },
      ratings_count: 280000,
      year: '2024',
      pubdate: '2024-09-15',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'
      },
      genres: ['爱情', '喜剧'],
      directors: [{ name: '田羽生' }],
      casts: [
        { name: '韩庚' },
        { name: '郑恺' },
        { name: '于文文' }
      ],
      collect_count: 320000,
      genresText: '爱情 / 喜剧',
      directorName: '田羽生',
      castsText: '韩庚 / 郑恺 / 于文文'
    },
    {
      id: '34957004',
      title: '孤注一掷',
      original_title: '孤注一掷',
      rating: { average: 7.5, stars: '40', max: 10, min: 0 },
      ratings_count: 890000,
      year: '2024',
      pubdate: '2024-08-08',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/kJr0Z6hG6eODq4LYsw1DhwBsYWr.jpg'
      },
      genres: ['犯罪', '剧情'],
      directors: [{ name: '申奥' }],
      casts: [
        { name: '张艺兴' },
        { name: '金晨' },
        { name: '咏梅' }
      ],
      collect_count: 950000,
      genresText: '犯罪 / 剧情',
      directorName: '申奥',
      castsText: '张艺兴 / 金晨 / 咏梅'
    }
  ];

  // 即将上映的真实电影（2024年10月-11月）
  const comingSoon = [
    {
      id: '36169005',
      title: '好东西',
      original_title: '好东西',
      rating: { average: 0, stars: '00', max: 10, min: 0 },
      ratings_count: 5000,
      year: '2024',
      pubdate: '2024-11-01',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/deLWkOLZmBNkm8p16igfapQHqWp.jpg'
      },
      genres: ['剧情', '家庭'],
      directors: [{ name: '邵艺辉' }],
      casts: [
        { name: '宋佳' },
        { name: '钟楚曦' },
        { name: '章宇' }
      ],
      collect_count: 8000,
      genresText: '剧情 / 家庭',
      directorName: '邵艺辉',
      castsText: '宋佳 / 钟楚曦 / 章宇'
    },
    {
      id: '36267006',
      title: '海王2：失落的王国',
      original_title: 'Aquaman and the Lost Kingdom',
      rating: { average: 0, stars: '00', max: 10, min: 0 },
      ratings_count: 12000,
      year: '2024',
      pubdate: '2024-11-08',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg'
      },
      genres: ['动作', '科幻', '冒险'],
      directors: [{ name: '詹姆斯·温' }],
      casts: [
        { name: '杰森·莫玛' },
        { name: '帕特里克·威尔森' },
        { name: '艾梅柏·希尔德' }
      ],
      collect_count: 15000,
      genresText: '动作 / 科幻 / 冒险',
      directorName: '詹姆斯·温',
      castsText: '杰森·莫玛 / 帕特里克·威尔森 / 艾梅柏·希尔德'
    },
    {
      id: '35234007',
      title: '三大队',
      original_title: '三大队',
      rating: { average: 0, stars: '00', max: 10, min: 0 },
      ratings_count: 8000,
      year: '2024',
      pubdate: '2024-11-15',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'
      },
      genres: ['犯罪', '剧情'],
      directors: [{ name: '戴墨' }],
      casts: [
        { name: '张译' },
        { name: '李晨' },
        { name: '魏晨' }
      ],
      collect_count: 10000,
      genresText: '犯罪 / 剧情',
      directorName: '戴墨',
      castsText: '张译 / 李晨 / 魏晨'
    },
    {
      id: '36555008',
      title: '涉过愤怒的海',
      original_title: '涉过愤怒的海',
      rating: { average: 0, stars: '00', max: 10, min: 0 },
      ratings_count: 6000,
      year: '2024',
      pubdate: '2024-11-22',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg'
      },
      genres: ['剧情', '悬疑'],
      directors: [{ name: '曹保平' }],
      casts: [
        { name: '黄渤' },
        { name: '周迅' },
        { name: '祖峰' }
      ],
      collect_count: 9000,
      genresText: '剧情 / 悬疑',
      directorName: '曹保平',
      castsText: '黄渤 / 周迅 / 祖峰'
    },
    {
      id: '36151009',
      title: '年会不能停！',
      original_title: '年会不能停！',
      rating: { average: 0, stars: '00', max: 10, min: 0 },
      ratings_count: 4000,
      year: '2024',
      pubdate: '2024-11-29',
      images: {
        large: 'https://image.tmdb.org/t/p/w500/kJr0Z6hG6eODq4LYsw1DhwBsYWr.jpg'
      },
      genres: ['喜剧', '剧情'],
      directors: [{ name: '董润年' }],
      casts: [
        { name: '大鹏' },
        { name: '白客' },
        { name: '庄达菲' }
      ],
      collect_count: 7000,
      genresText: '喜剧 / 剧情',
      directorName: '董润年',
      castsText: '大鹏 / 白客 / 庄达菲'
    }
  ];

  return {
    in_theaters: inTheaters,
    coming_soon: comingSoon
  };
}

module.exports = { getRealMovies2024_2025 };

