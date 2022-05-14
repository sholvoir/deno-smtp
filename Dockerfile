FROM denoland/deno:distroless
COPY dest/server.js /
CMD ["run", "-A", "/server.js"]