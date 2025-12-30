up:
	docker compose up --build -d

down:
	docker-compose down

test:
	docker exec -it backend_api npm test
