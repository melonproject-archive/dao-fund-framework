## Setup

`yarn && yarn build && mkdir private`

Then create 3 files:

```
private/keystore.json # keystore for account you want to setup from
private/password.txt  # plaintext password for account
private/conf.json     # copy from template below
```

## Config

See `sampleconf.json` for an example config to copy and modify.

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

After this, use `meloncli` to execute the remaining setup transactions:

```
meloncli continue-setup-on-behalf $MANAGER \
    --deployment ./rinkeby_addresses.json --endpoint $RINKEBY_ENDPOINT
    --key-store $MY_KEYSTORE --key-store-password $PASS
```
