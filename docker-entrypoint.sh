#!/bin/sh
set -e

# Fly mounts the volume owned by root, and it replaces whatever the image had at
# this path — so any chown done at build time is gone by the time we run. Without
# this the app starts fine and then fails on the first booking, when it tries to
# write bookings.json and cannot.
if [ -d "$DATA_DIR" ]; then
  chown -R clinic:clinic "$DATA_DIR"
fi

# Drop root before running the app.
exec su-exec clinic "$@"
