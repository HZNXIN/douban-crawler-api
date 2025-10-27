# 电影API - Vercel部署

## 快速部署

```bash
# 1. 确保在 movie-api 目录
cd movie-api

# 2. 重新部署到 Vercel
vercel --prod
```

## 访问测试

部署完成后，在浏览器中访问：
```
https://your-deployment-url.vercel.app
```

应该返回JSON格式的电影数据。

## CORS 配置

已在 `vercel.json` 中配置CORS，允许所有来源访问：
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`

## 故障排除

### 如果返回 401 Unauthorized

1. 检查 Vercel 项目设置：
   - Settings → Deployment Protection → 关闭
   - Settings → Password Protection → 关闭

2. 重新部署：
   ```bash
   vercel --prod
   ```

3. 清除缓存：
   - Vercel Dashboard → Deployments → 最新部署 → Redeploy

### 如果小程序无法访问

1. 确保小程序已配置 request 合法域名
2. 检查 CORS 配置是否生效
3. 查看小程序控制台的错误信息
