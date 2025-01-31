const { spawn, exec } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const vdfParser = require('@node-steam/vdf');
const acfParser = require('steam-acf2json');

function getSteamInstallDir() {
    return new Promise((resolve, reject) => {
        exec('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath', (error, stdout, stderr) => {
            if (error) {
                return reject(`exec error: ${error}`);
            }
            if (stderr) {
                return reject(`stderr: ${stderr}`);
            }

            const regex = /InstallPath\s+REG_SZ\s+(.*)/;
            const match = stdout.match(regex);

            if (match) {
                const installPath = match[1].trim();  // Extracted path
                resolve(installPath);
            } else {
                reject('Could not find Steam InstallPath.');
            }
        });
    });
}

async function windows__getInstalledSteamGames() {
    try {
        const steamInstallPath = await getSteamInstallDir();
        const games = [];

        const vdfContent = vdfParser.parse(
            await fs.promises.readFile(path.join(steamInstallPath, 'steamapps', 'libraryfolders.vdf'), { encoding: 'utf-8' })
        ).libraryfolders;

        // Collecting all promises to wait for in Promise.all
        const promises = Object.entries(vdfContent).map(([index, library]) => {
            if (!library.path) return; // Skip if no valid path

            const steamapps = path.join(library.path, 'steamapps');

            return new Promise((resolve, reject) => {
                exec(
                    `powershell.exe -Command "Get-ChildItem -Path '${steamapps}' -Filter '*.acf' -File | Select-Object -ExpandProperty Name"`,
                    async (error, stdout, stderr) => {
                        if (error) {
                            return reject(`Error executing PowerShell: ${error.message}`);
                        }
                        if (stderr) {
                            return reject(`PowerShell stderr: ${stderr}`);
                        }

                        const manifests = stdout.trim().split('\r\n');

                        try {
                            for (const file of manifests) {
                                const filePath = path.join(steamapps, file);
                                const appstateData = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
                                const appstate = acfParser.decode(appstateData).AppState;
                                const { name, appid, installdir } = appstate;
                                const gamePath = path.join(steamapps, 'common', installdir);
                                games.push({ name, appid, installdir: gamePath });
                            }
                        } catch (parseError) {
                            console.error(`Failed to parse file ${file}:`, parseError);
                        }
                        resolve(); // Resolve once done
                    }
                );
            });
        });

        await Promise.all(promises);
        console.log(games); // Output the collected games
        return games; // Resolve the games array

    } catch (error) {
        console.error('Error fetching installed Steam games:', error);
        throw error;
    }
}

module.exports = {
    windows__getInstalledSteamGames,
    getSteamInstallDir
};
