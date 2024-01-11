#!/bin/sh
VERSION=0.9.4
set -euo pipefail
[ ! -d "dest" ] && mkdir dest
deno bundle server.ts dest/server.js
docker build -t sholvoir/mail:$VERSION .
docker push sholvoir/mail:$VERSION
docker tag sholvoir/mail:$VERSION sholvoir/mail:latest
docker push sholvoir/mail:latest