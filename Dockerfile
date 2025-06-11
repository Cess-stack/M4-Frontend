# Dockerfile for React app served with nginx
FROM node:18 as build

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# ---- NGINX ----
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

