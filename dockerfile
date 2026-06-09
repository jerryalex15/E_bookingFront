# Étape 1 : build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Étape 2 : serve avec Nginx / il faut specifier la version alpine
FROM nginx:1.31.1-alpine
COPY --from=builder /app/dist/ebooking_front/browser /usr/share/nginx/html
EXPOSE 80