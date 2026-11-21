FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# install all deps (tsx and vite are needed to build and run)
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

ENV PORT=8080
EXPOSE 8080
CMD ["npx", "tsx", "server/index.ts"]
