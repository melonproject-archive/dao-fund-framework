import { newDao, getInstalledApps, encodeActCall, exec, EXECUTE_FUNCTION_NAME } from '@aragon/toolkit'

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
  // Create a membership DAO.
  console.log(`Creating DAO...`)
  daoAddress = await newDao(
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
  console.log('Membership dao:', daoAddress)

  // Get proxy addresses
  const apps = await getInstalledApps(daoAddress, network)
  const agentApp = apps.find(app => app.name === 'Agent')
  agentProxy = agentApp.proxyAddress
  console.log('Agent app:', agentProxy)
  const {proxyAddress: votingProxy} = apps.find(app => app.name === 'Voting')
  console.log('Voting app:', votingProxy)

  // Version contract signatures
  const beginSetupSignature = 'beginSetup(string,address[],uint256[],uint256[],address[],address[],address,address[])'
  const componentsSignatures = [
    'createAccountingFor(address)',
    'createFeeManagerFor(address)',
    'createParticipationFor(address)',
    'createPolicyManagerFor(address)',
    'createSharesFor(address)',
    'createTradingFor(address)',
    'createVaultFor(address)'
  ]
  // Voting signature
  const voteSignature = 'vote(uint256,bool,bool)'

  // Assign Fund Factory as the sender
  sender = fundFactory

  // Begin Setup
  console.log('Use Agent to begin fund setup...')
  await encodeAndExecAgent(beginSetupSignature, beginSetupCallArgs, network)

  console.log('Voting YES to begin setup...')
  await exec(daoAddress, votingProxy, voteSignature, [0, true, true],() => {}, network)

  // Create components
  console.log('Create Agent votes...')
  const callArgs = [agentProxy] // Manager
  for (const signature of componentsSignatures ) {
    await encodeAndExecAgent(signature, callArgs, network)
  }

  console.log('Voting YES to create each component...')
  for (let i = 1; i < 7; i++) {
    await exec(daoAddress, votingProxy, voteSignature, [i, true, true],() => {}, network)
  }
}
