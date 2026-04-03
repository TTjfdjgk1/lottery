# 淘宝闪购粉丝福利抽奖转盘

## 快速部署到 Railway

### 步骤 1: Fork 或上传到 GitHub

### 步骤 2: 连接 Railway
1. 访问 https://railway.app
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的仓库
5. 点击 "Deploy Now"

### 步骤 3: 获取链接
Railway 会自动生成一个公网链接，如：
- https://your-app.up.railway.app

### 测试链接
- 抽奖页面：https://your-app.up.railway.app/api/test/login
- 管理后台：https://your-app.up.railway.app/admin.html

## 配置微信公众号

修改 server.js 中的 WECHAT_CONFIG：
```javascript
const WECHAT_CONFIG = {
    appId: '你的AppID',
    appSecret: '你的AppSecret',
    token: '你的Token',
    redirectUri: 'https://your-app.up.railway.app/api/wechat/callback'
};
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/test/login | GET | 测试入口（无需微信授权） |
| /api/wechat/auth | GET | 微信授权入口 |
| /api/lottery/check | GET | 检查抽奖状态 |
| /api/lottery/draw | POST | 执行抽奖 |
| /api/lottery/stats | GET | 获取统计数据 |
