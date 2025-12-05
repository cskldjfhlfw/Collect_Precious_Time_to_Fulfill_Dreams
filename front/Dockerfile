# Next.js 前端 Dockerfile
FROM node:18-alpine AS base

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# 使用 npm 安装依赖（如果你用 pnpm，可以改成 pnpm install）
RUN npm install

# 拷贝源码
COPY . .

# 构建生产版本
RUN npm run build

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# 生产模式启动
CMD ["npm", "start"]
