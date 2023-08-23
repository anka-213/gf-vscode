# VSCode extension for Grammatical Framework

This provides syntax highlighting and a client for the [Grammatical Framework](https://www.grammaticalframework.org/) language server: [gf-lsp](https://github.com/anka-213/gf-lsp).

## Installation

### Linux

You can either download a binary from the repository or use nix to install it with the instructions in the next section

You can download the latest binary from [here](https://github.com/anka-213/gf-lsp/releases/tag/prerelease).
- Download the `gf-lsp-linux-bundle`
- Rename it to `gf-lsp`
- make it executable using `chmod +x gf-lsp`
- and put it in one of the directories in your `$PATH`

After that reload your vscode window, to make the extension aware of it

### Nix: Mac or Linux
In order to install the server you first need to install [nix](https://nixos.org/) by running:
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

### Windows

There is unfortunately no windows build yet. You can use the linux version in the [Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/install) (WSL)

## Updating

If you installed using nix, you can use this command to update the server to the latest version
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

### Making new releases

- Test that it works using the above instructions
- Update changelog
- Bump the version number in package.json
- Tag the commit with a version number
- `node_modules/.bin/vsce package && node_modules/.bin/vsce publish`
