FROM node:24-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache netcat-openbsd

COPY package*.json ./

RUN yarn add global @nestjs/cli

RUN yarn install --frozen-lockfile

COPY . .

COPY scripts/docker-entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT [ "docker-entrypoint.sh" ]

EXPOSE 3000
EXPOSE 9229

CMD [ "yarn", "start:dev" ]
