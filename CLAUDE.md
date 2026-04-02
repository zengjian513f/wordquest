# WordQuest - 默单词应用

## 项目结构

- `server.py` — FastAPI 后端，提供词库列表和单词数据 API，托管静态文件
- `frontend/` — React + TypeScript + Ant Design 前端（Vite 构建）
- `static/` — 前端构建产物（由 `npm run build` 生成，不要手动编辑）
- `words/` — 单词文件目录，Tab 分隔格式：`english\t中文`，`#` 开头为注释

## 常用命令

```bash
# 安装后端依赖
pip install -r requirements.txt

# 安装前端依赖
cd frontend && npm install

# 前端构建（输出到 static/）
cd frontend && npm run build

# 启动服务（监听 0.0.0.0:5000，开发模式自动 reload）
python server.py

# 前端开发模式（自动代理 /api 到 localhost:5000）
cd frontend && npm run dev
```

## 核心逻辑

- 答错：留在当前词，保留输入内容让用户修改，立即插入 3 个复习副本到队列第 3、7、15 位
- 答对：出队进入下一词
- 提示（按住看答案）：标记为 hinted，松开后清空输入框；按住期间回车无效
- 复习去重：每次答错时先清除该词的所有旧副本再重新插入，避免同一词连续出现
- 进度条：动态计算 `已答 / (已答 + 剩余队列)`
- 状态持久化：答题状态存入 localStorage，刷新页面自动恢复
- 退出：进度条右侧退出按钮，带 Popconfirm 二次确认，清除 localStorage 后回到选词页

## 技术栈

- 后端：Python FastAPI + Uvicorn
- 前端：React 19 + TypeScript + Ant Design + Vite
