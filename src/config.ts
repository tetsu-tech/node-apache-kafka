import minimist from "minimist"
import * as fs from 'fs';
import * as readline from 'readline';


const requiredOpts = [
  // ['key', 'pattern', 'descripiton']の順で入っている
  ['config', '--config CONFIG', 'The path to your Confluent Cloud configuration file'], 
  ['topic', '--topic TOPIC', 'The topic name on which to operate']
];

const requiredConfig = [
  ['bootstrap.servers', 'bootstrap.servers=<host1:port1...>', 'Your Confluent Cloud cluster bootstrap server(s). Separate multiple host/port pairs with commas.'],
  ['sasl.username', 'sasl.username=<string>', 'Your Confluent Cloud API key'],
  ['sasl.password', 'sasl.password=<string>', 'Your Confluent Cloud API secret'],
];

// 引数のalias
const alias = {
  t: 'topic',
  f: 'config'
};

export const configFromCli = async (args = process.argv.slice(2)): Promise<Config> => {
  const opts = minimist(args, { alias })
  // -topicなどで入力されると実行時にエラーが出る
  // minimistの戻り値が↓になり意図した値が受け取れない
  // 正しくない
  // {
  //   _: [],
  //   f: 'nodejs.config',
  //   config: 'nodejs.config',
  //   t: true,
  //   topic: true,
  //   o: true,
  //   p: true,
  //   i: true,
  //   c: 'test1'
  // }
  // 正しい
  // {
  //   _: [],
  //   f: 'nodejs.config',
  //   config: 'nodejs.config',
  //   t: 'test1',
  //   topic: 'test1'
  // }
  const missingOpts = requiredOpts.filter(([k]) => !opts.hasOwnProperty(k));

  if (missingOpts.length) {
    return {
      ...opts,
      usage: usage('Some required arguments were not provided:', missingOpts)
    };
  }

  const config = await configFromPath(opts.config as string);
  console.log('configconfig', config)
  const missingConfig = requiredConfig.filter(([k]) => !config.hasOwnProperty(k));

  if (missingConfig.length) {
    return {
      ...opts,
      ...config,
      usage: usage('Some required configuration values were not provided:', missingConfig)
    };
  }

  return { ...opts, ...config };
}

const usage = (heading: string, missing: string[][]): string => {
  const title = "Example Node.js Confluent Cloud client";
  const hints = missing.map(([,pattern,desc]) => `    ${pattern}
    ${desc}`);

      return `${title}

${heading}
${hints.join('\n\n')}
`;
}

export type Config = {
  [key: string]: any;
};

const configFromPath = async (path: string) => {
  const lines = await readAllLines(path);

  return lines
    .filter((line) => !/^\s*?#/.test(line))
    .map((line) => line
      .split('=')
      .map((s) => s.trim()))
    .reduce((config: Config, [k, v]) => {
      config[k] = v;
      return config;
    }, {});
}

const readAllLines = (path: string): Promise<string[]> => {    
  return new Promise((resolve, reject) => {
    // Test file access directly, so that we can fail fast.
    // Otherwise, an ENOENT is thrown in the global scope by the readline internals.
    try {
      fs.accessSync(path, fs.constants.R_OK);
    } catch (err) {
      reject(err);
    }
    
    let lines: string[] = [];
    
    const reader = readline.createInterface({
      input: fs.createReadStream(path),
      crlfDelay: Infinity
    });
    
    reader
      .on('line', (line) => lines.push(line))
      .on('close', () => resolve(lines));
  });
}
