import { newDao, getInstalledApps, encodeActCall, exec, EXECUTE_FUNCTION_NAME } from '@aragon/toolkit'

export const setupAragonDao = async (config, callArgs, fundFactory, network) => {
  // Create a membership DAO.
  console.log(`Creating DAO...`)
  const daoAddress = await newDao(
    'membership-template',
    [
      'FundToken',
      'FUND',
      config.FundName + Math.floor(Math.random() * 1000000),
      [config.Manager],
      ['500000000000000000', '50000000000000000', '604800'],
      '1296000',
      true,
    ],
    'newTokenAndInstance',
    'DeployDao',
    'latest',
    network
  )
  console.log('Membership dao address:', daoAddress)

  const apps = await getInstalledApps(daoAddress, network)
  const agentApp = apps.find(app => app.name === 'Agent')
  console.log('Agent address:', agentApp.proxyAddress)

  const signature = 'beginSetup(string,address[],uint256[],uint256[],address[],address[],address,address[])'
  const encodedCallData = encodeActCall(signature, callArgs)

  await exec(daoAddress, agentApp.proxyAddress, EXECUTE_FUNCTION_NAME, [
    fundFactory,
    0,  // eth sent
    encodedCallData
  ],() => {},network)
  console.log('Agent created a vote to begin setup')
}
