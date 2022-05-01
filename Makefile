# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ninieddu <ninieddu@student.42lyon.fr>      +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2022/05/01 10:06:55 by ninieddu          #+#    #+#              #
#    Updated: 2022/05/01 10:21:50 by ninieddu         ###   ########lyon.fr    #
#                                                                              #
# **************************************************************************** #

all:
	docker compose -f ./docker-compose.yml up -d --build

stop:
	docker compose -f ./docker-compose.yml stop

down:
	docker compose -f ./docker-compose.yml down

clean:	down
	docker system prune -a --force

del_useless:
	sudo rm -rf ./backend/dist
	sudo rm -rf ./backend/node_modules
	sudo rm -rf ./database/database-data
	sudo rm -rf ./frontend/node_modules

re:	
	clean all