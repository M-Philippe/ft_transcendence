#!/bin/bash

name_container="frontend_container"
red=$(tput setaf 1)
green=$(tput setaf 2)
blue=$(tput setaf 4)
white=$(tput setaf 7)

echo "Kill, remove and launch a new instance of ${name_container}"

docker kill ${name_container} > /dev/null 2>&1
docker rm ${name_container} > /dev/null 2>&1

docker build -t frontend_image .
if [ $? != 0 ];
  then
    echo "${red}Can't build frontend_image"
    exit 1
fi
echo "${green}Image successfully build${white}"

#docker run -tid --name ${name_container} frontend_image

docker run -tid -p 3005:3005 --name ${name_container} \
--mount type=bind,source="$(pwd)"/srcs/public,target=/frontend/public \
--mount type=bind,source="$(pwd)"/srcs/src,target=/frontend/src \
--mount type=bind,source="$(pwd)"/srcs/package-lock.json,target=/frontend/package-lock.json \
--mount type=bind,source="$(pwd)"/srcs/package.json,target=/frontend/package.json \
--mount type=bind,source="$(pwd)"/srcs/tsconfig.json,target=/frontend/tsconfig.json \
frontend_image
if [ $? != 0 ];
  then
    echo "${red}Can't launch ${name_container}"
    exit 1
fi
echo "${green}Container successfully launched"

echo "run 'docker exec -ti ${name_container} /bin/sh' to get inside container"
exit 0