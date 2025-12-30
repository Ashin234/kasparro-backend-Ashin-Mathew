up:
	docker-compose up -d

down:
	docker-compose down

test:
	docker exec -it backend_api npm test
