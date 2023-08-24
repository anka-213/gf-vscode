/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as os from 'os';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
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
	Logger,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { downloadGFLanguageServer } from './gfLSPBinaries';
import { ExtensionLogger, expandHomeDir } from './utils';
import * as utils from './utils';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
	// The server is implemented in haskell
	// const serverExe = '/Users/anka/.cabal/bin/gf-lsp';

	let serverExecutable;
	try {
		// Try and find local installations first
		serverExecutable = findManualExecutable() ?? findLocalServer(context);
		// // eslint-disable-next-line no-constant-condition
		if (serverExecutable === null) {
			console.log('Found no executable');
			// If not, then try to download gf-language-server binaries if it's selected
			serverExecutable = await askToDownloadGfLanguageServer(context);
			if (!serverExecutable) {
				const RELOAD_WINDOW = 'Reload window';
				const answer = await window.showWarningMessage(
					'No gf-lsp server found. Reload the window after you have installed it',
					RELOAD_WINDOW
				);
				switch (answer) {
					case RELOAD_WINDOW:
						vscode.commands.executeCommand(
							'workbench.action.reloadWindow'
						);
						break;

					default:
						break;
				}
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
	// TODO: Figure out how to avoid reconfiguring main: in package.json

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
			`config serverExecutablePath is set to ${exePath} but there is no such executable and I can't find it in PATH`
		);
	}
	return exePath;
}

/** Searches the PATH for whatever is set in serverVariant */
function findLocalServer(context: ExtensionContext): string | null {
	const exes: string[] = [
		'gf-lsp',
		os.homedir + '/.cabal/bin/gf-lsp',
		os.homedir + '/.local/bin/gf-lsp',
		os.homedir + '/.nix-profile/bin/gf-lsp'
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

async function askToDownloadGfLanguageServer(context: ExtensionContext) {
	if (process.platform === 'win32') {
		throw new Error('Unfortunately Windows is not yet supported');
	}

	const archName = `${process.platform}-${process.arch}`;
	if (archName === 'darwin-x64' || archName == 'linux-x64') {
		// const logLevel = workspace.getConfiguration('gf-lsp').trace.server;
		const clientLogLevel =
			workspace.getConfiguration('gf-lsp').trace.client ?? 'debug';
		const logFile: string = workspace.getConfiguration('gf-lsp').logFile;

		const outputChannel: vscode.OutputChannel =
			window.createOutputChannel('GF Language');

		// ? path.resolve(currentWorkingDir, expandHomeDir(logFile))
		const logFilePath =
			logFile && logFile !== '' ? expandHomeDir(logFile) : undefined;
		const logger: Logger = new ExtensionLogger(
			'client',
			clientLogLevel,
			outputChannel,
			logFilePath
		);
		return await downloadGFLanguageServer(context, logger);
	}

	const ToWebsite = 'Go to Manual install instructions';
	const DownAuto = 'Download automatically';
	const DownAutoNix = 'Install using nix';

	// Apple silicon or some other strange platform
	const isArm = process.arch === 'arm64';

	const opts = [DownAuto, ToWebsite];
	if (executableExists('nix-env') || isArm) {
		opts.unshift(DownAutoNix);
	}
	const answer = await window.showWarningMessage(
		`No prebuilt executable is available for ${archName}.
		I can build it for you using nix, it will take ~5G disk space and around 5-15 minutes.`,
		...opts
		// DownAuto
	);
	switch (answer) {
		case ToWebsite:
			vscode.env.openExternal(
				vscode.Uri.parse('https://github.com/anka-213/gf-lsp/README.md')
			);
			break;

		// case DownAuto:
		// 	return await downloadGFLanguageServer(context, logger);
		// break;
		case DownAutoNix:
			return await downloadUsingNix(context);

		case undefined:
			console.log('Got undef');
			break;

		default:
			console.log('Got default');
			break;
	}
	return;
}

// async function downloadGfLanguageServer(context: ExtensionContext) {
// 	return;
// }

async function downloadUsingNix(context: vscode.ExtensionContext) {
	if (!executableExists('nix-env')) {
		const terminal = vscode.window.createTerminal({
			name: `Installing the Nix tool`,
			shellPath: 'sh',
			shellArgs: [
				'-c',
				`
			curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
			curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install ||
			{
			status=$?;
			sleep 5;
			exit $status
			}`
			]

			// isTransient: true
		});
		terminal.show();
		const result = await getExitStatus(terminal);
		if (result.code !== 0) {
			await showErrorReportMsg(
				`Failed to install nix.
			Please try again or open an issue or contact me (Anka) on the GF discord`
			);
			return null;
		}
	}
	const terminal = vscode.window.createTerminal({
		name: `Installing the GF Language server`,
		shellPath: 'sh',
		shellArgs: [
			'-c',
			`
			if [ -e '/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh' ]; then
              . '/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh'
            fi
			echo nix-env -iA exe -f https://github.com/anka-213/gf-lsp/archive/main.tar.gz;
			nix-env -iA exe -f https://github.com/anka-213/gf-lsp/archive/main.tar.gz ||
			{
			status=$?;
			sleep 5;
			exit $status
			}`
		]
		// shellPath: 'nix-env',
		// shellArgs: [
		// 	'-iA',
		// 	'exe',
		// 	'-f',
		// 	'https://github.com/anka-213/gf-lsp/archive/main.tar.gz'
		// ]

		// isTransient: true
	});
	terminal.show();
	// terminal.sendText(
	// 	'nix-env -iA exe -f https://github.com/anka-213/gf-lsp/archive/main.tar.gz',
	// 	false
	// );
	// terminal.sendText('; exit');
	const result = await getExitStatus(terminal);
	if (result.code !== 0) {
		await showErrorReportMsg(
			`Failed to install the GF language server using nix.
			Please try again or open an issue or contact me (Anka) on the GF discord`
		);
		return null;
		// throw new Error(
		// 	// `Failed to install using nix: Got error code ${result.code}`
		// 	`Failed to install using nix. Please try again or open an issue or contact me on the GF discord`
		// );
	}
	// await window.showInformationMessage(
	// 	`Got answer: ${JSON.stringify(result)}`
	// );
	return os.homedir + '/.nix-profile/bin/gf-lsp';
}

async function showErrorReportMsg(msg: string) {
	const ISSUE = 'Open issue';
	const DISCORD = 'Go to GF discord';
	const answer = await window.showErrorMessage(msg, ISSUE, DISCORD);
	switch (answer) {
		case ISSUE:
			vscode.env.openExternal(
				vscode.Uri.parse(
					'https://github.com/anka-213/gf-vscode/issues/new'
				)
			);
			break;
		case DISCORD:
			vscode.env.openExternal(
				vscode.Uri.parse('https://discord.gg/EvfUsjzmaz')
			);
			break;

		default:
			break;
	}
}

// Get the exit status of a terminal
async function getExitStatus(terminal: vscode.Terminal) {
	return await new Promise<vscode.TerminalExitStatus>((resolve, reject) => {
		const disposeToken = vscode.window.onDidCloseTerminal(
			async (closedTerminal) => {
				if (closedTerminal === terminal) {
					disposeToken.dispose();
					if (terminal.exitStatus !== undefined) {
						resolve(terminal.exitStatus);
					} else {
						reject('Terminal exited with undefined status');
					}
				}
			}
		);
	});
}
