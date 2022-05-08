# node-apache-kafka

参考
- https://developer.confluent.io/get-started/nodejs/#prerequisites


実行

```sh
docker build -t test-kafka .
docker run -it test-kafka /bin/bash

# in container
make run-consumer
make run-producer
```
