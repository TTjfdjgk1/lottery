# 淘宝闪购粉丝福利抽奖转盘 - 一键部署指南

## 🚀 方法一：部署到 Render（推荐，最简单）

### 步骤：

1. **打开 Render 官网**
   - 访问：https://dashboard.render.com
   - 使用 GitHub 账号登录（没有的话先注册一个）

2. **创建新服务**
   - 点击右上角 "New +" 按钮
   - 选择 "Web Service"

3. **上传代码（两种方式）**

   **方式 A：连接 GitHub 仓库（推荐）**
   - 先将代码上传到你的 GitHub 仓库
   - 在 Render 中选择 "Connect a repository"
   - 选择你的仓库

   **方式 B：直接粘贴代码（最快）**
   - 在 Render 中选择 "Public Git repository"
   - 输入一个公开的 GitHub 仓库地址

4. **配置服务**
   - Name: `taobao-lottery`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - 选择 "Free" 计划

5. **点击 "Create Web Service"**

6. **等待 2-3 分钟部署完成**

7. **获取链接**
   - Render 会给你一个链接，如：`https://taobao-lottery.onrender.com`

---

## 📱 测试链接

部署成功后，在微信中打开：

- **抽奖页面**：`https://你的域名/api/test/login`
- **管理后台**：`https://你的域名/admin.html`

---

## 🚀 方法二：部署到 Koyeb（更稳定）

1. **访问**：https://app.koyeb.com
2. **登录**（支持 GitHub、Google）
3. **创建应用**
   - 点击 "Create App"
   - 选择 "Build from Git repository"
4. **上传代码到 GitHub 后选择该仓库**
5. **点击 "Deploy"**

---

## 🚀 方法三：部署到 Glitch（最简单，无需任何配置）

1. **访问**：https://glitch.com
2. **点击 "New Project"**
3. **选择 "Import from GitHub"**
4. **粘贴你的 GitHub 仓库地址**
5. **自动部署，立即获得链接**

---

## 📦 需要上传的文件

将以下文件上传到 GitHub：

```
taobao-flash-sale-lottery/
├── server.js          # 后端服务
├── package.json       # 依赖配置
├── Procfile           # 启动命令
├── render.yaml        # Render 配置
├── .gitignore         # Git 忽略文件
├── README.md          # 说明文档
└── public/
    ├── index.html     # 首页
    ├── lottery.html   # 抽奖页面
    └── admin.html     # 管理后台
```

---

## ⚙️ 配置微信公众号

部署成功后，修改 `server.js` 中的配置：

```javascript
const WECHAT_CONFIG = {
    appId: '你的微信公众号AppID',
    appSecret: '你的微信公众号AppSecret',
    token: '你的Token',
    redirectUri: 'https://你的域名/api/wechat/callback'
};
```

---

## 🆘 需要帮助？

如果遇到问题，告诉我具体的错误信息，我会帮你解决！
