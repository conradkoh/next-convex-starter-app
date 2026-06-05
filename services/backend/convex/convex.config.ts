import aggregate from '@convex-dev/aggregate/convex.config.js';
import migrations from '@convex-dev/migrations/convex.config.js';
import persistentTextStreaming from '@convex-dev/persistent-text-streaming/convex.config.js';
import { defineApp } from 'convex/server';

const app = defineApp();
app.use(aggregate);
app.use(migrations);
app.use(persistentTextStreaming);

export default app;
