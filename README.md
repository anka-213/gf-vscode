# VSCode extension for Grammatical Framework

This provides syntax highlighting and a client for the [Grammatical Framework](https://www.grammaticalframework.org/) language server: [gf-lsp](https://github.com/anka-213/gf-lsp).

## Installation

In order to install the server you first need to install [nix](https://nixos.org/) by running:
```
sh <(curl -L https://nixos.org/nix/install) --daemon               # Install nix
```
When the installation is completed, you can install the lsp-server by running in a new terminal:
```
nix-env -iA cachix -f https://cachix.org/api/v1/install            # Install cachix for faster installation
sudo cachix use anka-213                                           # Use my binary cache which contains pre-built versions of the lsp-server
nix-env -iA exe -f https://github.com/anka-213/gf-lsp/archive/main.tar.gz --dry-run # Download the GF Language Server and check what will be installed
nix-env -iA exe -f https://github.com/anka-213/gf-lsp/archive/main.tar.gz # Download and build the GF Language Server
```

## Updating

Use this command to update the server to the latest version
```
NIX_CONFIG="tarball-ttl = 0" nix-env -iA exe -f https://github.com/anka-213/gf-lsp/archive/master.tar.gz
```

The tarball-ttl flag forces it to refetch the tarball so you can be sure you have the latest version

## Developing

- Run `npm install` in this folder. This installs all necessary npm modules in the client folder
- Open VS Code on this folder.
- Press Ctrl+Shift+B to compile the client and server.
- Switch to the Debug viewlet.
- Select `Launch Client` from the drop down.
- Run the launch config.
- If you want to debug the server as well use the launch configuration `Attach to Server`
- In the [Extension Development Host] instance of VSCode, open a document in 'gf' language mode.
  - Cause some error and you should see diagnostics
