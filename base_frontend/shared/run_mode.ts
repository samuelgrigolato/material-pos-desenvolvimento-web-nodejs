
type RunMode =
    'dockerized' |
    'other';

const runMode: RunMode = process.env.API_RUN_MODE == 'dockerized' ? 'dockerized' : 'other';

export default runMode;
