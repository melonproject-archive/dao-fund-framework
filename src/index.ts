import { Eth } from 'web3-eth';
import { Environment, Version } from '@melonproject/melonjs';
import { HttpProvider } from 'web3-providers';
import BigNumber from 'bignumber.js';
import * as fs from 'fs';
import { setupAragonDao } from './aragon'

const confFile = './rinkeby_conf.json'
const addrsFile = './rinkeby_addresses.json';
const keystoreFile = './private/keystore.json';
const passwordFile = './private/password.txt';
const TESTING = true;
const network = 'rinkeby';

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

  if (TESTING) {
    const keys = [
      // sample addresses and private keys:
      // 0xb4124cEB3451635DAcedd11767f004d8a28c6eE7,
      // 0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb
      "a8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563",
      "ce8e3bda3b44269c147747a373646393b1504bfcbb73fc9564f5d753d8116608"
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

  const callArgs = [
    conf.FundName,
    [
      deployment.melon.addr.ManagementFee,
      deployment.melon.addr.PerformanceFee
    ],
    [
      managementFeeRate.toString(),
      performanceFeeRate.toString()
    ],
    [
      new BigNumber(0).toString(),
      new BigNumber(90 * 60 * 60 * 24).toString()
    ],
    exchanges,
    adapters,
    denominationAssetAddress,
    defaultAssets
  ];

  console.log(conf);
  console.log(sender);
  const { agentProxy } = await setupAragonDao(
    conf,
    callArgs,
    deployment.melon.addr.Version,
    network
  );

  //////////////////////////////////////////////////////////////////////////////

  let tx;
  console.log('Creating accounting component');
  tx = version.createAccountingFor(sender, agentProxy);
  await tx.send(amguOpts);
  console.log('Creating fee manager component');
  tx = version.createFeeManagerFor(sender, agentProxy);
  await tx.send(amguOpts);
  console.log('Creating participation component');
  tx = version.createParticipationFor(sender, agentProxy);
  await tx.send(amguOpts);
  console.log('Creating policy manager component');
  tx = version.createPolicyManagerFor(sender, agentProxy);
  await tx.send(amguOpts);
  console.log('Creating shares component');
  tx = version.createSharesFor(sender, agentProxy);
  await tx.send(amguOpts);
  console.log('Creating trading component');
  tx = version.createTradingFor(sender, agentProxy);
  await tx.send(amguOpts);
  console.log('Creating vault component');
  tx = version.createVaultFor(sender, agentProxy);
  await tx.send(amguOpts);
}

main().then(() => {
  console.log('Script finished.')
  process.exit()
}).catch(e => console.error(e));
