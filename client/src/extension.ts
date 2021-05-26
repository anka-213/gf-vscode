/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as os from 'os';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import {
	workspace,
	ExtensionContext,
	WorkspaceFolder,
	Uri,
	window
} from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	// The server is implemented in haskell
	// const serverExe = '/Users/anka/.cabal/bin/gf-lsp';

	let serverExecutable;
	try {
		// Try and find local installations first
		serverExecutable = findManualExecutable() ?? findLocalServer(context);
		if (serverExecutable === null) {
			// If not, then try to download gf-language-server binaries if it's selected
			// serverExecutable = await downloadGfLanguageServer(context);
			if (!serverExecutable) {
				return;
			}
		}
	} catch (e) {
		if (e instanceof Error) {
			window.showErrorMessage(e.message);
		}
		return;
	}

	// DONE: Make server location configurable
	// TODO: Make gf flags configurable

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { command: serverExecutable, args: ['-lsp'] },
		debug: { command: serverExecutable, args: ['-lsp'] }
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'gf' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
			// configurationSection: 'gf-lsp'
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'gfLsp',
		'GF LSP client',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

function findManualExecutable(folder?: WorkspaceFolder): string | null {
	let exePath = workspace.getConfiguration('gf-lsp').serverExecutablePath;
	if (exePath === '') {
		return null;
	}

	// Substitute path variables with their corresponding locations.
	exePath = exePath
		.replace('${HOME}', os.homedir)
		.replace('${home}', os.homedir)
		.replace(/^~/, os.homedir);
	if (folder) {
		exePath = exePath
			.replace('${workspaceFolder}', folder.uri.path)
			.replace('${workspaceRoot}', folder.uri.path);
	}

	if (!executableExists(exePath)) {
		throw new Error(
			`serverExecutablePath is set to ${exePath} but it doesn't exist and is not on the PATH`
		);
	}
	return exePath;
}

/** Searches the PATH for whatever is set in serverVariant */
function findLocalServer(context: ExtensionContext): string | null {
	const exes: string[] = [
		'gf-lsp',
		os.homedir + '/.cabal/bin/gf-lsp',
		os.homedir + '/.local/bin/gf-lsp'
	];

	for (const exe of exes) {
		if (executableExists(exe)) {
			return exe;
		}
	}

	return null;
}

/*
 * Checks if the executable is on the PATH
 */
export function executableExists(exe: string): boolean {
	const isWindows = process.platform === 'win32';
	const cmd: string = isWindows ? 'where' : 'which';
	const out = child_process.spawnSync(cmd, [exe]);
	return out.status === 0 || (isWindows && fs.existsSync(exe));
}
