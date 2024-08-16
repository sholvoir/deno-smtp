#!/bin/sh
set -euo pipefail

version=$(deno run -A jsr:@sholvoir/generic@0.0.8/update-version)

deno bundle src/server.ts server.js

podman build -t localhost/sholvoir/mail:$version .
podman push localhost/sholvoir/mail:$version docker://docker.io/sholvoir/mail:$version
podman push localhost/sholvoir/mail:$version docker://docker.io/sholvoir/mail:latest

rm ./server.js
echo done!
