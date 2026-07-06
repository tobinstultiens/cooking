FROM floryn90/hugo:0.163.3-onbuild AS hugo

FROM nginx
COPY --from=hugo /target /usr/share/nginx/html
