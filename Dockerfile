FROM denoland/deno:distroless
EXPOSE 80
COPY dest/server.js /
CMD ["run", "-A", "/server.js"]