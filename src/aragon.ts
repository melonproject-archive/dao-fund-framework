import {
  newDao,
  getInstalledApps,
  encodeActCall,
  exec,
  EXECUTE_FUNCTION_NAME
} from '@aragon/toolkit';

const beginSetupSignature = 'beginSetup(string,address[],uint256[],uint256[],address[],address[],address,address[])';
const voteSignature = 'vote(uint256,bool,bool)';

export const setupAragonDao = async (
  config,
  beginSetupCallArgs,
  fundFactory,
  network
) => {
  let daoAddress;
  // TODO: Been able to load existing orgs
  // try { 
  //   daoAddress = resolveDaoAddressOrEnsDomain(config.FundName, network)
  // } catch (e) {
  console.log('Creating DAO...');
  // TODO: remove; using a random name to test
  const fundName = config.FundName + new Date().getTime();
  daoAddress = await newDao(
    'membership-template',
    [
      config.DaoTokenName,
      config.DaoTokenSymbol,
      fundName,
      config.Managers,
      config.DaoVotingAppSettings,
      config.DaoFinanceAppPeriod,
      true, // Agent as default
    ],
    'newTokenAndInstance',
    'DeployDao',
    'latest',
    network
  );
  console.log('Membership dao: ', daoAddress);

  // Get proxy addresses
  const apps = await getInstalledApps(daoAddress, network);
  const agentApp = apps.find(app => app.name === 'Agent');
  const agentProxy = agentApp.proxyAddress;
  console.log('Agent app: ', agentProxy);

  const {
    proxyAddress: votingProxy
  } = apps.find(app => app.name === 'Voting');
  console.log('Voting app: ', votingProxy);

  // Begin Setup
  console.log('Use Agent to begin fund setup...');
  const encodedCallData = encodeActCall(
    beginSetupSignature, beginSetupCallArgs
  );
  await exec(
    daoAddress,
    agentProxy,
    EXECUTE_FUNCTION_NAME,
    [ fundFactory, 0, encodedCallData ],
    () => {},
    network
  );

  // TODO: remove. We do it on the script to test
  console.log('Voting YES to begin setup...');
  await exec(
    daoAddress,
    votingProxy,
    voteSignature,
    [0, true, true],
    () => {},
    network
  );

  return {
    daoAddress,
    agentProxy
  }
}
