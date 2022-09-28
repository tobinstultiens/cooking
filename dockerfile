FROM klakegg/hugo:onbuild AS hugo
FROM nginx:latest
ADD static /usr/share/nginx/html/images
ADD pdf /usr/share/nginx/html/pdf
COPY --from=hugo /target /usr/share/nginx/html

#COPY html/cooking.html /usr/share/nginx/html/index.html
#COPY html/articles /usr/share/nginx/html/articles
