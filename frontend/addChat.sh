#!/bin/bash

# Create global chat
echo "Creating global chat"
curl -X POST http://localhost:3000/chat

# Suscribe each users to global chat
for i in {1..10..1}
do
  url="http://localhost:3000/chat/suscribeGlobal/$i"
  echo $url
  curl -X POST http://localhost:3000/chat/suscribeGlobal/$i > /dev/null
  echo $?
  sleep 1
done