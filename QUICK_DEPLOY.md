# 淘宝闪购粉丝福利抽奖转盘

## 🎯 一键部署（3分钟完成）

### 方法 1：Vercel 部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/lottery)

1. 点击上方按钮
2. 登录 Vercel（支持 GitHub、Google、邮箱）
3. 点击 "Create"
4. 等待 1 分钟
5. 获得公网链接

### 方法 2：Railway 部署

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. 点击上方按钮
2. 登录 Railway
3. 选择 "Deploy from GitHub repo"
4. 选择你的仓库
5. 点击 "Deploy Now"

### 方法 3：Render 部署

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. 点击上方按钮
2. 登录 Render
3. 连接 GitHub 仓库
4. 点击 "Apply"

---

## 📱 测试链接

部署成功后，在微信中打开：

```
https://你的域名/api/test/login
```

---

## 📁 文件结构

```
├── server.js          # Node.js 后端
├── package.json       # 依赖配置
├── vercel.json        # Vercel 配置
├── Procfile           # Railway/Heroku 配置
├── render.yaml        # Render 配置
└── public/
    ├── index.html     # 首页
    ├── lottery.html   # 抽奖页面
    └── admin.html     # 管理后台
```

---

## 🎁 奖品配置

| 奖品 | 概率 |
|------|------|
| 1元现金 | 50% |
| 2元现金 | 24.5% |
| 3元现金 | 15% |
| 4元现金 | 7% |
| 5元现金 | 2% |
| 6元现金 | 0.5% |
| 7元现金 | 0.4% |
| 8元现金 | 0.3% |
| 9元现金 | 0.2% |
| 10元现金 | 0.1% |

---

## 🔧 配置微信公众号

修改 `server.js` 第 22-27 行：

```javascript
const WECHAT_CONFIG = {
    appId: '你的AppID',
    appSecret: '你的AppSecret',
    token: '你的Token',
    redirectUri: 'https://你的域名/api/wechat/callback'
};
```

---

## 📞 技术支持

如有问题，请检查：
1. Node.js 版本 >= 14
2. 端口 3000 是否可用
3. 防火墙是否开放

---

## 📄 许可证

MIT License
