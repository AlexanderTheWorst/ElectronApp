const { exec } = require('child_process');
const { EventEmitter } = require('events');

const Monitors = [];
const recordedProcesses = {};

/**
 * @class Monitor
 * @extends EventEmitter
 */
class Monitor extends EventEmitter {
    constructor() {
        super();
        Monitors.push(this);
    }

    /**
     * @param pid
     */
    pidOpen(pid) {
        return recordedProcesses[pid]; // Directly check recordedProcesses object
    }

    /**
     * @param name
     */
    exeOpen(name) {
        return Object.values(recordedProcesses).find((process) => process.name === name);
    }
}

function getProcesses() {
    return new Promise((resolve, reject) => {
        exec('tasklist', (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }

            let processes = [];
            let lines = stdout.split('\n');

            // Skip the header and last line
            for (let i = 3; i < lines.length - 1; i++) {
                let line = lines[i].trim();
                let columns = line.split(/\s+/);
                if (columns.length >= 2) {
                    let processName = columns[0];
                    let pid = columns[1];
                    processes.push({ name: processName, pid: pid });
                }
            }
            resolve(processes);
        });
    });
}

setInterval(async () => {
    let processes = await getProcesses();

    // Check for processes that have started or closed
    processes.forEach((process) => {
        // Record new processes
        if (!recordedProcesses[process.pid]) {
            recordedProcesses[process.pid] = process;
            Monitors.forEach((monitor) => {
                monitor.emit('processStarted', process); // Emit event for new process
            });
        }
    });

    // Check for processes that have closed
    Object.keys(recordedProcesses).forEach((pid) => {
        let existingProcess = recordedProcesses[pid];
        if (!processes.find((p) => p.pid === pid)) {
            delete recordedProcesses[pid];
            Monitors.forEach((monitor) => {
                monitor.emit('processClosed', existingProcess); // Emit event for closed process
            });
        }
    });
}, 1000);

module.exports = Monitor;
