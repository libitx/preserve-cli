[![license](https://img.shields.io/github/license/libitx/preserve-cli.svg)](https://github.com/libitx/preserve-cli/blob/master/license.md)

# Preserve CLI

Deploy HTML pages, static assets and entire websites to the Bitcoin blockchain.

## Getting started

The Preserve CLI can be used to deploy files from any folder on your computer, and works great with any static site generator.

### 1. Install Preserve CLI

Install the *Preserve* CLI on your machine.

```bash
npm install -g preserve-cli
```

### 2. Add Preserve to your project

From the root directory of your web project, initialise *Preserve*.

```bash
preserve init
```

A new Bitcoin address and private key are generated and saved to a hidden `.bit` file in your working directory.
**Remember to add it to your `.gitignore` file**.

You'll need to send a small amount of Bitcoin (SV) to deploy files. Display your wallet information to see your address and balance.

```bash
preserve wallet
```

### 3. View your sitemap

Before deploying any files, view the sitemap to see an overview of the files *Preserve* will deploy.

```bash
preserve status [path]
# eg: get status of assets in the 'public' folder
preserve status public
```

The displayed sitemap shows a list of all the files in your project, along with file size, sha256 hash, and whether the file has already been deployed or not.

### 4. Deploy your files

When ready to deploy the files, and assuming your Bitcoin address has enough funds, *Preserve* will create and send transactions for every file to the Bitcoin (SV) network.

```bash
preserve deploy [path]
# eg: deploy assets in the 'public' folder
preserve deploy public
```

Network rules currently limit a chain of more than 25 unconfirmed transactions. *Preserve* will fail if it hits this limit. If this happens, with for a confirmation, then try again.

### 5. Configure DNS

The final step is to configure the DNS for your domain. *Preserve* will generate two DNS records for you to configure with your DNS provider.

```bash
preserve dns [hostname]
# eg: generate DNS records for 'www.example.com'
preserve dns www.example.com
```

The generated DNS records will look like this.

```text
Host:  www.example.com
Type:  CNAME
Data:  dns.preserve.bitpaste.app

Host:  id._bsv.www.example.com
Type:  TXT
Data:  a=138A7KoTj1hbWEfBRYQQAujRk2EV3cLoRh; s=IC5+Ldu3i0Q6KHItq316ez9Bs5a4dmjtGJUWUrPVBn50SzLWx1jm0I+CCwFvm/3lUFcRHELr6eREDHfJWUHCnRA=
```
The first `CNAME` record points requests to your domain to a [Preserve Agent](https://github.com/libitx/preserve-agent) node to handle the request. `dns.preserve.bitpaste.app` is a public Preserve Agent node. Alternatively you can run the Agent on your own server.

The second `TXT` record contains your Bitcoin address and signature, and is used by the Agent to identify the latest router transaction associated with your domain.