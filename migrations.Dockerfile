FROM node:24-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /usr/app

COPY ./package*.json ./
COPY .husky/ .husky/

RUN npm install

COPY . .

ENTRYPOINT ["node", "--require", "ts-node/register", "--require", "tsconfig-paths/register", "./node_modules/typeorm/cli.js", "-d", "./dataSource.ts"]
CMD ["migration:run"]
