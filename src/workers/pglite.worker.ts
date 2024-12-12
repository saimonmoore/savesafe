import { PGlite } from '@electric-sql/pglite'
import { worker } from '@electric-sql/pglite/worker'
import { vector } from '@electric-sql/pglite/vector'
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';

worker({
  async init(options) {
    const meta = options.meta
    console.log('PGlite worker initialized');
    // Do something with additional metadata.
    // or even run your own code in the leader along side the PGlite
    const pg = new PGlite({
      dataDir: options.dataDir,
      extensions: {
        vector,
        uuid_ossp,
      },
    })
    return pg;
  },
})
