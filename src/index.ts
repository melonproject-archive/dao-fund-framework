import { appendDecimals, toBI } from '@melonproject/token-math';
import {
  randomString, beginSetup, completeSetupFor, createAccountingFor,
  createFeeManagerFor, createParticipationFor, createPolicyManagerFor,
  createSharesFor, createTradingFor, createVaultFor, getRoutes,
  Environment, getTokenBySymbol, constructEnvironment, managersToHubs,
} from '@melonproject/protocol';
const { withKeystoreSigner } = require('@melonproject/protocol/lib/utils/environment/withKeystoreSigner');
import { Tracks } from '@melonproject/protocol/lib/utils/environment/Environment';
import { withDeployment } from '@melonproject/protocol/lib/utils/environment/withDeployment';
import * as fs from 'fs';
import * as path from 'path';

const track = Tracks.KYBER_PRICE;
const packageRoot = path.resolve(`${path.dirname(require.main.filename)}/..`);
const configPath = `${packageRoot}/private/conf.json`;
const passwordPath = `${packageRoot}/private/password.txt`;
const keystorePath = `${packageRoot}/private/keystore.json`;

const getEnvironment = async (conf) => {
  const keystore = JSON.parse(fs.readFileSync(keystorePath, 'utf8'));
  const password = fs.readFileSync(passwordPath, 'utf8').trim();
  let environment = constructEnvironment({
    endpoint: conf.Endpoint,
    options: { gasPrice: '10000000000', gasLimit: '9000000' },
    track,
  });
  environment = await withKeystoreSigner(environment, { keystore, password });
  return withDeployment(environment);
}

const setupFund = async (environment: Environment, conf) => {
  const manager = conf.Manager;
  const { exchangeConfigs, melonContracts } = environment.deployment;
  const exchanges = {};
  conf.Exchanges.forEach(e => exchanges[e] = exchangeConfigs[e]);

  const weth = getTokenBySymbol(environment, 'WETH');
  const defaultTokens = conf.AllowedTokens.map(sym => getTokenBySymbol(environment, sym));

  const quoteToken = getTokenBySymbol(environment, conf.QuoteToken);

  const fees = [
    {
      feeAddress: melonContracts.fees.managementFee.toLowerCase(),
      feePeriod: toBI(0),
      feeRate: appendDecimals(quoteToken, conf.ManagementFee),
    }, {
      feeAddress: melonContracts.fees.performanceFee.toLowerCase(),
      feePeriod: toBI(60 * 60 * 24 * 90), // performance fee redeemable every quarter
      feeRate: appendDecimals(quoteToken, conf.PerformanceFee),
    },
  ];

  await beginSetup(environment, melonContracts.version, {
    defaultTokens,
    exchangeConfigs: exchanges,
    fees,
    fundName: conf.FundName,
    quoteToken,
  });
  console.log('Fund setup started');
  await createAccountingFor(environment, melonContracts.version, {manager});
  console.log('Accouting created');
  await createFeeManagerFor(environment, melonContracts.version, {manager});
  console.log('FeeManager created');
  await createParticipationFor(environment, melonContracts.version, {manager});
  console.log('Participation created');
  await createPolicyManagerFor(environment, melonContracts.version, {manager});
  console.log('PolicyManager created');
  await createSharesFor(environment, melonContracts.version, {manager});
  console.log('Shares created');
  await createTradingFor(environment, melonContracts.version, {manager});
  console.log('Trading created');
  await createVaultFor(environment, melonContracts.version, {manager});
  console.log('Vault created');
  await completeSetupFor(environment, melonContracts.version, {manager});
  console.log('Fund setup complete');
  const hubAddress = await managersToHubs(environment, melonContracts.version, conf.Manager);
  const routes = await getRoutes(environment, hubAddress);
  return { hubAddress, ...routes }
};

const main = async () => {
  const conf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const env = await getEnvironment(conf);
  console.log('Got environment');
  const fundInfo = await setupFund(env, conf);
  console.log(JSON.stringify(fundInfo, null, 2));
}

main().then(() => console.log('Script finished.')).catch(e => console.error(e));
