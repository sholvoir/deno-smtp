FROM denoland/deno:distroless
EXPOSE 80
COPY server.js /
CMD ["run", "-A", "/server.js"]