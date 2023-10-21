FROM ubuntu:latest


WORKDIR /usr/app
COPY package.json .
COPY ["package.json", "package-lock.json", "tsconfig.json", ".env"]
RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_18.x  | bash -
RUN apt-get -y install nodejs
RUN npm install
RUN apt-get install -y musl-dev
RUN ln -s /usr/lib/x86_64-linux-musl/libc.so /lib/libc.musl-x86_64.so.1

COPY . .
