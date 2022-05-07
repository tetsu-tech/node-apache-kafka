run-producer:
	npx ts-node src/producer.ts --config nodejs.config -t test1

run-consumer:
	npx ts-node src/consumer.ts --config nodejs.config -t test1
