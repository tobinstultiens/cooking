FROM nginx:latest
ADD images /usr/share/nginx/html/images
ADD pdf /usr/share/nginx/html/pdf
COPY html/cooking.html /usr/share/nginx/html/index.html
COPY html/articles/*.html /usr/share/nginx/html/articles/*.html
