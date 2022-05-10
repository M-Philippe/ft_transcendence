#!/bin/bash
if [ $1 ]
then

	CTNR=$(docker ps -a | grep $1 | cut -d ' ' -f 1)


	if [ $2 ]
	then
		if [ $2 = "-ip" ]
		then
			docker inspect $CTNR | grep IPAddress
			exit
		fi
	fi

	echo $CTNR
	docker exec -it $CTNR sh
	exit
fi

docker ps -a
