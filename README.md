# VSCode extension for Grammatical Framework

This provides syntax highlighting and a client for the [Grammatical Framework](https://www.grammaticalframework.org/) language server: [gf-lsp](https://github.com/anka-213/gf-lsp).

## Installation

You can install the server by first installing [nix](https://nixos.org/) and then running:
```
nix-env -iA cachix -f https://cachix.org/api/v1/install            # Install cachix for faster installation
cachix use anka-213                                                # Use my binary cache
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
