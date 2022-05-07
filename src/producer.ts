import * as Kafka from 'node-rdkafka'
import { Config, configFromCli } from './config';

const ERR_TOPIC_ALREADY_EXISTS = 36;

const ensureTopicExists = (config: Config): Promise<void> => {
  const adminClient = Kafka.AdminClient.create({
    'bootstrap.servers': config['bootstrap.servers'],
    'sasl.username': config['sasl.username'],
    'sasl.password': config['sasl.password'],
    'security.protocol': config['security.protocol'],
    'sasl.mechanisms': config['sasl.mechanisms']
  });

  console.log('adminClient', adminClient);

  return new Promise<void>((resolve, reject) => {
    adminClient.createTopic({
      topic: config.topic,
      num_partitions: 1,
      replication_factor: 3
    }, (err) => {
      if (!err) {
        console.log(`Created topic ${config.topic}`);
        return resolve();
      }

      if (err.code === ERR_TOPIC_ALREADY_EXISTS) {
        return resolve();
      }

      return reject(err);
    });
  });
}

type ReportFunc = (error: Kafka.LibrdKafkaError, report: Kafka.DeliveryReport) => void;

const createProducer = (config: any, onDeliveryReport: ReportFunc): Promise<Kafka.Producer> => {
  const producer = new Kafka.Producer({
    'bootstrap.servers': config['bootstrap.servers'],
    'sasl.username': config['sasl.username'],
    'sasl.password': config['sasl.password'],
    'security.protocol': config['security.protocol'],
    'sasl.mechanisms': config['sasl.mechanisms'],
    'dr_msg_cb': true
  });

  return new Promise((resolve, reject) => {
    producer
      .on('ready', () => resolve(producer))
      .on('delivery-report', onDeliveryReport)
      .on('event.error', (err) => {
        console.warn('event.error', err);
        reject(err);
      });
    producer.connect();
  });
}

const producerExample = async () => {
  const config = await configFromCli();
  console.log('config======', config);

  if (config.usage) {
    return console.log(config.usage);
  }

  await ensureTopicExists(config);

  const producer = await createProducer(config, (err, report) => {
    if (err) {
      console.warn('Error producing', err)
    } else {
      const {topic, partition, value} = report;
      console.log(`Successfully produced record to topic "${topic}" partition ${partition} ${value}`);
    }
  });

  for (let idx = 0; idx < 10; ++idx) {
    const key = 'alice';
    const value = Buffer.from(JSON.stringify({ count: idx }));

    console.log(`Producing record ${key}\t${value}`);

    producer.produce(config.topic, -1, value, key);
  }

  producer.flush(10000000, () => {
    producer.disconnect();
  });
}

producerExample();
