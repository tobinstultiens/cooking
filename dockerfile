FROM klakegg/hugo:0.101.0-onbuild AS hugo
FROM nginx:latest
ADD images /usr/share/nginx/html/images
ADD pdf /usr/share/nginx/html/pdf
COPY --from=hugo /target /usr/share/nginx/html

#COPY html/cooking.html /usr/share/nginx/html/index.html
#COPY html/articles /usr/share/nginx/html/articles
