## Setup

`yarn && yarn build && mkdir private`

Then create 3 files:

```
private/keystore.json # keystore for account you want to setup from
private/password.txt  # plaintext password for account
private/conf.json     # copy from template below
```

## Config

An example config:

```
{
  "Endpoint": "https://kovan.infura.io/v3/something",
  "FundName": "ExampleCapital",
  "Manager": "0x0000000000111111111111222222222222233333",
  "Exchanges": [ "MatchingMarket", "KyberNetwork", "ZeroEx", "Ethfinex", "MelonEngine" ],
  "AllowedTokens": [ "BAT", "DGX", "REP", "ZRX", "WETH", "MLN", "MKR", "DAI", "KNC" ],
  "QuoteToken": "WETH",
  "ManagementFee": 0.02,
  "PerformanceFee": 0.20
}
```

- Manager is the address that sets up and manage the Fund (in that case, it would be an aragon dao agent).
- Exchanges can be some subset of the listed exchanges
- AllowedToken can be some subset of the listed tokens
- QuoteToken must appear in AllowedTokens
- Fees are a percentage (i.e. ManagementFee of 0.02 is a 2% yearly fee)

## Usage

For `beginSetup` params, check out [the solidity function](https://github.com/melonproject/protocol/blob/setup-on-behalf/src/contracts/factory/FundFactory.sol#L90-L99).

These parameters would be derived from the config mentioned above.
