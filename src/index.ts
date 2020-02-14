import { Eth } from 'web3-eth';
import { Environment, Version } from '@melonproject/melonjs';
import { HttpProvider } from 'web3-providers';
import BigNumber from 'bignumber.js';
import * as fs from 'fs';

const confFile = './rinkeby_conf.json'
const addrsFile = './rinkeby_addresses.json';
const keystoreFile = './private/keystore.json';
const passwordFile = './private/password.txt';
const TESTING = false;

const main = async () => {
  const conf = JSON.parse(fs.readFileSync(confFile, 'utf8'));
  const deployment = JSON.parse(fs.readFileSync(addrsFile, 'utf8'));
  const oneEth = '1000000000000000000';

  const defaultOpts = { gas: 8000000 };
  const amguOpts = { ...defaultOpts, amgu: oneEth };

  const provider = new HttpProvider(conf.Endpoint);
  const ethereum = new Eth(provider, undefined, {
    transactionConfirmationBlocks: 1,
  });

  const sender = conf.Sender;
  const manager = conf.Manager;

  if (TESTING) {
    const keys = [
      // sample addresses and private keys:
      // 0xc0c82081f2ad248391cd1483ae211d56c280887a,
      // 0x697d686207b035afef108f39d6ab2fe0a5528c81
      "d3fdff38aaf7be159fc1c12c66982fea997df08ca5b91b399e437370d3681721",
      "9cc70449981c6df178133db4c075c408876e8be3b147fa11f8ee947faa0b0011"
    ];
    keys.forEach(k => {
      const wallet = ethereum.accounts.privateKeyToAccount(k);
      ethereum.accounts.wallet.add(wallet);
    });
  } else {
    const wallet = ethereum.accounts.decrypt(
      JSON.parse(fs.readFileSync(keystoreFile, 'utf8')),
      fs.readFileSync(passwordFile, 'utf8').trim()
    );
    ethereum.accounts.wallet.add(wallet);
  }
  const environment = new Environment(ethereum);

  const version = new Version(environment, deployment.melon.addr.Version);

  const denominationAssetAddress = deployment.tokens.addr[conf.QuoteToken];
  const defaultAssets = conf.AllowedTokens.map(t => deployment.tokens.addr[t]);

  /////// This part (parsing and beginSetup) to be called from DAO /////////////
  const managementFeeRate = new BigNumber(conf.ManagementFee).times(oneEth);
  const performanceFeeRate = new BigNumber(conf.PerformanceFee).times(oneEth);

  let exchanges = [];
  let adapters = [];
  if (conf.Exchanges.includes('OasisDex')) {
    exchanges.push(deployment.oasis.addr.OasisDexExchange);
    adapters.push(deployment.melon.addr.OasisDexAdapter);
  }
  if (conf.Exchanges.includes('KyberNetwork')) {
    exchanges.push(deployment.kyber.addr.KyberNetworkProxy);
    adapters.push(deployment.melon.addr.KyberAdapter);
  }
  if (conf.Exchanges.includes('ZeroExV2')) {
    exchanges.push(deployment.zeroExV2.addr.ZeroExV2Exchange);
    adapters.push(deployment.melon.addr.ZeroExV2Adapter);
  }
  if (conf.Exchanges.includes('ZeroExV3')) {
    exchanges.push(deployment.zeroExV3.addr.ZeroExV3Exchange);
    adapters.push(deployment.melon.addr.ZeroExV3Adapter);
  }
  if (conf.Exchanges.includes('MelonEngine')) {
    exchanges.push(deployment.melon.addr.Engine);
    adapters.push(deployment.melon.addr.EngineAdapter);
  }

  let tx;

  console.log('Beginning setup');
  tx = version.beginSetup(manager, {
    name: conf.FundName,
    fees: [deployment.melon.addr.ManagementFee, deployment.melon.addr.PerformanceFee],
    feeRates: [managementFeeRate, performanceFeeRate],
    feePeriods: [new BigNumber(0), new BigNumber(90 * 60 * 60 * 24)],
    exchanges: exchanges,
    adapters: adapters,
    denominationAsset: denominationAssetAddress,
    defaultAssets: defaultAssets,
  });
  await tx.send(defaultOpts);
  //////////////////////////////////////////////////////////////////////////////

  console.log('Creating accounting component');
  tx = version.createAccountingFor(sender, manager);
  await tx.send(amguOpts);
  console.log('Creating fee manager component');
  tx = version.createFeeManagerFor(sender, manager);
  await tx.send(amguOpts);
  console.log('Creating participation component');
  tx = version.createParticipationFor(sender, manager);
  await tx.send(amguOpts);
  console.log('Creating policy manager component');
  tx = version.createPolicyManagerFor(sender, manager);
  await tx.send(amguOpts);
  console.log('Creating shares component');
  tx = version.createSharesFor(sender, manager);
  await tx.send(amguOpts);
  console.log('Creating trading component');
  tx = version.createTradingFor(sender, manager);
  await tx.send(amguOpts);
  console.log('Creating vault component');
  tx = version.createVaultFor(sender, manager);
  await tx.send(amguOpts);
}

main().then(() => console.log('Script finished.')).catch(e => console.error(e));
