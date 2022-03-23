## SuperToken Deployer

This is a single-file Dapp for deploying SuperToken wrappers of existing ERC20 tokens.
Requires a browser with injected web3 provider (e.g. Metamask) and a local webserver.
If you have python installed, you can start a webserver with the document root set to the current directory with
```python
python -m SimpleHTTPServer 1337
```
Then navigate to http://localhost:1337/supertoken-deployer.html .

## Stream Closer

This is a single-file Dapp for closing streams / deleting flows.
The flow parameters _token_, _sender_ and _receiver_ can be set either in the UI or provided as URL parameters.
If you have python installed, you can start a webserver with the document root set to the current directory with
```python
python -m SimpleHTTPServer 1337
```

Then navigate to http://localhost:1337/stream-closer.html .

In order to set the parameter in the URL, use this format:
stream-closer.html?chainId=<chainId>&token=<tokenAddress>&sender=<senderAddress>&receiver=<receiverAddress>
