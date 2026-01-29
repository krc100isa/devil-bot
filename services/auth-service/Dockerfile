FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared ./shared
COPY services/$svc ./services/$svc
RUN npm install --workspaces --include-workspace-root
WORKDIR /app/services/$svc
RUN npm run build
CMD ["node", "dist/index.js"]
