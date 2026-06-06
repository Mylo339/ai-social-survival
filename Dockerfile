FROM node:22-alpine

WORKDIR /app
COPY . .

ENV HOST=0.0.0.0
ENV PORT=4177
EXPOSE 4177

CMD ["node", "local-server.mjs"]
