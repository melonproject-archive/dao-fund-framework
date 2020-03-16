import { resolveAddressOrEnsDomain, newDao, getInstalledApps, encodeActCall, exec, EXECUTE_FUNCTION_NAME  } from '@aragon/toolkit'

// Melon Version signatures
const beginSetupSignature = 'beginSetup(string,address[],uint256[],uint256[],address[],address[],address,address[])'

// Voting app signature
const voteSignature = 'vote(uint256,bool,bool)'

let daoAddress, agentProxy, sender

async function encodeAndExecAgent(signature, callArgs, network) {
  const encodedCallData = encodeActCall(signature, callArgs)

  await exec(daoAddress, agentProxy, EXECUTE_FUNCTION_NAME, [
    sender,
    0,  // eth sent
    encodedCallData
  ],() => {}, network)
}

export const setupAragonDao = async (config, beginSetupCallArgs, fundFactory, network) => {
  // TODO: Been able to load existing orgs
  // try { 
  //   daoAddress = resolveDaoAddressOrEnsDomain(config.FundName, network)
  // } catch (e) {
      // Create a membership DAO.
    console.log(`Creating DAO...`)
    daoAddress = await newDao(
      'membership-template',
      [
        config.DaoTokenName,
        config.DaoTokenSymbol,
        config.FundName + new Date().getTime(), // TODO: remove. Use random id to test
        config.Managers,
        config.DaoVotingAppSettings,
        config.DaoFinanceAppPeriod,
        true, // Agent as default
      ],
      'newTokenAndInstance',
      'DeployDao',
      'latest',
      network
    )
    console.log('Membership dao:', daoAddress)
  // }

  // Get proxy addresses
  const apps = await getInstalledApps(daoAddress, network)
  const agentApp = apps.find(app => app.name === 'Agent')
  agentProxy = agentApp.proxyAddress
  console.log('Agent app:', agentProxy)
  const {proxyAddress: votingProxy} = apps.find(app => app.name === 'Voting')
  console.log('Voting app:', votingProxy)

  // Assign Fund Factory as the sender
  sender = fundFactory

  // Begin Setup
  console.log('Use Agent to begin fund setup...')
  const encodedCallData = encodeActCall(beginSetupSignature, beginSetupCallArgs)
  await exec(daoAddress, agentProxy, EXECUTE_FUNCTION_NAME, [
    fundFactory, // sender
    0,  // eth sent
    encodedCallData
  ],() => {}, network)

  // TODO: remove. We do it on the script to test
  console.log('Voting YES to begin setup...')
  await exec(daoAddress, votingProxy, voteSignature, [0, true, true],() => {}, network)

  return {
    daoAddress,
    agentProxy,
  }
}
