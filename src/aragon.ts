import {
  resolveDaoAddressOrEnsDomain,
  newDao,
  getInstalledApps,
  encodeActCall,
  execAppMethod,
  EXECUTE_FUNCTION_NAME,
} from "@aragon/toolkit";

import { stringToBytes } from "@melonproject/melonjs/utils/stringToBytes";

const beginSetupSignature =
  "beginSetup(string,address[],uint256[],uint256[],address[],address[],address,address[])";
const voteSignature = "vote(uint256,bool,bool)";

export const setupAragonDao = async (
  config,
  beginSetupCallArgs,
  fundFactory,
  network
) => {
  let daoAddress;
  try {
    console.log("Check if DAO already exists ...");
    daoAddress = await resolveDaoAddressOrEnsDomain(config.FundName, network);
    console.log("Yes!");
  } catch (e) {
    console.log("Creating DAO...");
    daoAddress = await newDao("membership-template", {
      newInstanceArgs: [
        stringToBytes(config.DaoTokenName, 32),
        config.DaoTokenSymbol,
        config.FundName,
        config.DaoMembers,
        config.DaoVotingAppSettings,
        config.DaoFinanceAppPeriod,
        true, // Agent as default
      ],
      newInstanceMethod: "newTokenAndInstance",
      environment: network,
    });
  }
  console.log("Membership dao: ", daoAddress);

  // Get proxy addresses
  const apps = await getInstalledApps(daoAddress, network);
  const agentApp = apps.find((app) => app.name === "Agent");
  const agentProxy = agentApp.proxyAddress;
  console.log("Agent app: ", agentProxy);

  const { proxyAddress: votingProxy } = apps.find(
    (app) => app.name === "Voting"
  );
  console.log("Voting app: ", votingProxy);

  // Begin Setup
  console.log("Use Agent to begin fund setup...");
  const encodedCallData = encodeActCall(
    beginSetupSignature,
    beginSetupCallArgs
  );
  await execAppMethod(
    daoAddress,
    agentProxy,
    EXECUTE_FUNCTION_NAME,
    [fundFactory, 0, encodedCallData],
    network
  );

  // TODO: remove. Consider removing if token holder have
  // to decided the vote
  console.log("Voting YES to begin setup...");
  await execAppMethod(
    daoAddress,
    votingProxy,
    voteSignature,
    [0, true, true],
    network
  );

  return {
    daoAddress,
    agentProxy,
  };
};
