# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ninieddu <ninieddu@student.42lyon.fr>      +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2022/05/10 11:17:21 by ninieddu          #+#    #+#              #
#    Updated: 2022/05/10 11:17:22 by ninieddu         ###   ########lyon.fr    #
#                                                                              #
# **************************************************************************** #

all:
	docker-compose up --build

stop:
	docker-compose -f ./docker-compose.yml stop

down:
	docker-compose -f ./docker-compose.yml down

clean:	down
	docker system prune -a --force

del_useless:
	rm -rf ./backend/dist
	rm -rf ./backend/node_modules
	rm -rf ./database/database-data
	rm -rf ./frontend/node_modules

fclean:	clean del_useless

re:	
	clean all