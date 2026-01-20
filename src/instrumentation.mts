import { tracingFactory } from './common/tracing.js';
import { getConfig, initConfig } from './common/config.js';

await initConfig();

const config = getConfig();

const tracingConfig = config.get('telemetry.tracing');
const sharedConfig = config.get('telemetry.shared');

const tracing = tracingFactory({ ...tracingConfig, ...sharedConfig });

tracing.start();
