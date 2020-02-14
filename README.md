## Setup

`yarn && yarn build && mkdir private`

Then create 2 files:

```
private/keystore.json # keystore for account you want to setup from
private/password.txt  # plaintext password for account
```

## Config

See `rinkeby_conf.json` for an example config to copy and modify.

In that file:

- Manager is the address that sets up and manage the Fund (in that case, it would be an aragon dao agent).
- Exchanges can be some subset of the listed exchanges
- AllowedToken can be some subset of the listed tokens
- QuoteToken must appear in AllowedTokens
- Fees are a percentage (i.e. ManagementFee of 0.02 is a 2% yearly fee)

## Usage

_Aragon script will call `beginSetup`_

For `beginSetup` params, check out [the solidity function](https://github.com/melonproject/protocol/blob/develop/src/factory/FundFactory.sol#L93-L100).

These parameters would be derived from the config mentioned above.

After this, just run `yarn start` and the script will run.
