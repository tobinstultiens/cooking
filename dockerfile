FROM nginx:latest
ADD images /usr/share/nginx/html/images
COPY cooking.html /usr/share/nginx/html/index.html
