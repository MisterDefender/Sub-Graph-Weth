# Sub Graph implemetation for Weth contract on Ethereum Mainnet
---

- Weth contract ``WETH9`` deployed at [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2](https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code) on ethereum-mainnnet.
- Subgraph is deployed which monitors events logged by function `deposit()` , `withdraw()`.
- Emits events: `Deposit`, `Withdraw` when function call is invoked.
- Code is modified  in consideration to only show the deposits which were not withdrawn with same amount as deposited.

**Subgraph can be access from [here](https://thegraph.com/hosted-service/subgraph/misterdefender/testing)**

---
