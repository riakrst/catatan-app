# 1. Image dasar: Node 20 versi Alpine (~50 MB, bukan ~1 GB)
FROM node:20-alpine
 
# 2. Semua perintah berikutnya berjalan di folder ini
WORKDIR /app
 
# 3. Salin manifest DULU, sendirian. Ini bukan kebetulan —
#    lihat slide berikutnya soal layer caching.
COPY package*.json ./
RUN npm install --omit=dev
 
# 4. Baru salin sisa kodenya
COPY . .
 
# 5. Dokumentasi port (tidak membuka apa pun sendiri)
EXPOSE 3000
 
# 6. Perintah yang jalan saat container start
CMD ["node", "app.js"]
