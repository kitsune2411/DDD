# 1. Gunakan Node.js versi LTS (Alpine version untuk ukuran kecil)
FROM node:18-alpine

# 2. Install Tini (Wajib di Container agar Ctrl+C / Shutdown berjalan mulus)
RUN apk add --no-cache tini

# 3. Set Environment Variable ke Production
ENV NODE_ENV=production

# 4. Buat direktori kerja di dalam container
WORKDIR /usr/src/app

# 5. Ubah permission folder ke user 'node' (Security: Jangan jalan sebagai Root!)
RUN chown -R node:node /usr/src/app

# 6. Pindah ke user 'node'
USER node

# 7. Copy package.json dan package-lock.json (Untuk caching layer Docker)
COPY --chown=node:node package*.json ./

# 8. Install dependencies (Hanya production, devDependencies diabaikan)
# 'npm ci' lebih cepat dan stabil daripada 'npm install'
RUN npm ci --only=production && npm cache clean --force

# 9. Copy Source Code Aplikasi
COPY --chown=node:node src ./src
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node server.js .
COPY --chown=node:node knexfile.js .
COPY --chown=node:node jsconfig.json .

# 10. Buka Port 3000
EXPOSE 3000

# 11. Gunakan Tini sebagai Entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# 12. Jalankan Server
CMD ["node", "server.js"]