
docker run -it -v `pwd`:/hoge test-kafka /bin/bash
npx ts-node index.ts --config nodejs.config -t test1
node producer.js --config nodejs.config -t test1

npx ts-node src/producer.ts --config src/nodejs.config -t test1
