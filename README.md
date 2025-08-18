# VSCode extension for Grammatical Framework

This provides syntax highlighting and a client for the [Grammatical Framework](https://www.grammaticalframework.org/) language server: [gf-lsp](https://github.com/anka-213/gf-lsp).

## Installation

### Linux, Windows and MacOS

The extension will automatically download and install the latest release for you.

## Updating

If you installed using nix, you can use this command to update the server to the latest version
```
NIX_CONFIG="tarball-ttl = 0" nix-env -iA exe -f https://github.com/anka-213/gf-lsp/archive/master.tar.gz
```

The tarball-ttl flag forces it to refetch the tarball so you can be sure you have the latest version

## Manual installation

### Linux or intel mac

Follow the instructions in the [latest release](https://github.com/anka-213/gf-lsp/releases) of the GF Language server.

### Nix: Mac or Linux
In order to build the server you first need to install [nix](https://nixos.org/) by running:
```
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
```
When the installation is completed, you can install the lsp-server by running in a new terminal:
```
# Optional (Use prebuilt cache)
nix-env -iA cachix -f https://cachix.org/api/v1/install            # Install cachix for faster installation
# Optional (Use prebuilt cache)
sudo cachix use anka-213                                           # Use my binary cache which contains pre-built versions of the lsp-server
# Optional (see what will be downloaded before downloading)
nix-env -iA exe -f https://github.com/anka-213/gf-lsp/archive/main.tar.gz --dry-run # Download the GF Language Server and check what will be installed
nix-env -iA exe -f https://github.com/anka-213/gf-lsp/archive/main.tar.gz # Download and build the GF Language Server
```

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

### Making new releases

- Test that it works using the above instructions
- Update changelog
- Bump the version number in package.json
- Tag the commit with a version number
- `node_modules/.bin/vsce package && node_modules/.bin/vsce publish`
