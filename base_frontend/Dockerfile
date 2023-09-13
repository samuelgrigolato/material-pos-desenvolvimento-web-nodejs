FROM node:18.17-alpine


WORKDIR /usr/app
COPY package.json .
COPY ["package.json", "package-lock.json", "tsconfig.json", ".env", "./"]
RUN npm install --silent


COPY . .