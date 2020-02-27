import { newDao, getInstalledApps, encodeActCall, exec, EXECUTE_FUNCTION_NAME } from '@aragon/toolkit'

const beginSetupSignature = 'beginSetup(string,address[],uint256[],uint256[],address[],address[],address,address[])'

const voteSignature = 'vote(uint256,bool,bool)'

export const setupAragonDao = async (config, beginSetupCallArgs, fundFactory, network) => {
  // Create a membership DAO.
  console.log(`Creating DAO...`)
  const daoAddress = await newDao(
    'membership-template',
    [
      'FundToken',
      'FUND',
      config.FundName + Math.floor(Math.random() * 1000000),
      config.Managers,
      ['500000000000000000', '50000000000000000', '604800'],
      '1296000',
      true,
    ],
    'newTokenAndInstance',
    'DeployDao',
    'latest',
    network
  )
  console.log('Membership dao:', daoAddress)

  // Get proxy addresses
  const apps = await getInstalledApps(daoAddress, network)
  const { proxyAddress: agentProxy } = apps.find(app => app.name === 'Agent')
  console.log('Agent app:', agentProxy)
  const { proxyAddress: votingProxy } = apps.find(app => app.name === 'Voting')
  console.log('Voting app:', votingProxy)

  // Begin Setup
  console.log('Use Agent to begin fund setup...')
  const encodedCallData = encodeActCall(beginSetupSignature, beginSetupCallArgs)
  await exec(daoAddress, agentProxy, EXECUTE_FUNCTION_NAME, [
    fundFactory, // sender
    0,  // eth sent
    encodedCallData
  ],() => {}, network)

  console.log('Voting YES to begin setup...')
  await exec(daoAddress, votingProxy, voteSignature, [0, true, true],() => {}, network)

  return {
    daoAddress,
    agentProxy,
  }
}
