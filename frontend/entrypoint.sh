npm install && npm run build

# move files in correct dir.

mkdir -p /usr/share/nginx/html
cp -rf /app_frontend/build /usr/share/nginx/html/ft_transcendence

cp /app_frontend/nginx_files/default.conf /etc/nginx/conf.d/default.conf
cp /app_frontend/nginx_files/nginx.conf /etc/nginx/

mkdir -p /etc/ssl/private
cp /app_frontend/nginx_files/nginx.key /etc/ssl/private/nginx.key
cp /app_frontend/nginx_files/nginx.crt /etc/ssl/certs/nginx.crt

mkdir -p /etc/nginx/snippets
cp /app_frontend/nginx_files/self-signed.conf /etc/nginx/snippets/self-signed.conf

nginx -g "daemon off;"
