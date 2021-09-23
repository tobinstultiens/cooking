FROM nginx:latest
ADD images /usr/share/nginx/html/images
ADD pdf /usr/share/nginx/html/pdf
COPY cooking.html /usr/share/nginx/html/index.html
