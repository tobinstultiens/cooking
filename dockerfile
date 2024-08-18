FROM floryn90/hugo:0.133.0-onbuild AS hugo
FROM nginx
COPY --from=hugo /target /usr/share/nginx/html
